"""FastAPI application for Consequence AI."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Any
from datetime import datetime

from ..graph.builders import build_initial_graph
from ..graph.loaders import load_graph_from_database
from ..engine import propagate_with_explanation
from ..explain import explain_cascade
from src.adapters.securities import create_earnings_event

# Initialize app
app = FastAPI(
    title="Consequence AI",
    description="Causal reasoning engine for stock market cascade predictions",
    version="0.1.0",
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global graph (loaded once at startup)
GRAPH = None


@app.on_event("startup")
async def startup_event():
    """Load the causal graph on startup."""
    global GRAPH
    print("Loading causal graph from database...")
    GRAPH = load_graph_from_database()
    print(f"Graph loaded: {GRAPH.num_entities} entities, {GRAPH.num_links} links")


# Request/Response models
class EarningsEventRequest(BaseModel):
    """Request for an earnings event prediction (legacy - use entity_id instead of ticker)."""

    entity_id: str | None = Field(None, description="Entity ID (ticker, ETF, or sector)", example="AAPL")
    ticker: str | None = Field(None, description="Stock ticker symbol (deprecated, use entity_id)", example="AAPL")
    surprise_percent: float = Field(
        ...,
        description="Earnings surprise as percentage (negative for miss)",
        example=-8.0,
    )
    description: str = Field(
        default="",
        description="Optional description of the event",
    )
    horizon_days: int = Field(
        default=14,
        description="Number of days to project effects",
        ge=1,
        le=90,
    )

    def get_entity_id(self) -> str:
        """Get entity ID, supporting both new and legacy fields."""
        if self.entity_id:
            return self.entity_id.upper()
        elif self.ticker:
            return self.ticker.upper()
        else:
            raise ValueError("Either entity_id or ticker must be provided")


class EffectResponse(BaseModel):
    """A predicted effect."""

    entity: str
    magnitude_percent: float
    magnitude_range: list[float]
    day: float
    confidence: float
    order: int
    relationship_type: str
    explanation: str


class CascadeResponse(BaseModel):
    """Response with cascade predictions."""

    trigger: dict
    horizon_days: int
    total_effects: int
    effects_by_order: dict[str, int]
    timeline: dict[str, list[EffectResponse]]


class EntityInfo(BaseModel):
    """Information about an entity."""

    id: str
    type: str
    name: str
    sector: str | None
    connections: int


class GraphStats(BaseModel):
    """Statistics about the causal graph."""

    num_entities: int
    num_links: int
    entity_types: dict[str, int]
    relationship_types: dict[str, int]


# Endpoints
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Consequence AI",
        "status": "healthy",
        "version": "0.1.0",
    }


@app.get("/health")
async def health():
    """Health check endpoint for Railway."""
    return {
        "status": "healthy",
        "graph_loaded": GRAPH is not None,
    }


@app.get("/graph/stats", response_model=GraphStats)
async def get_graph_stats():
    """Get statistics about the causal graph."""
    if GRAPH is None:
        raise HTTPException(status_code=503, detail="Graph not loaded")

    from collections import defaultdict

    entity_types = defaultdict(int)
    relationship_types = defaultdict(int)

    for entity in GRAPH.entities.values():
        entity_types[entity.entity_type] += 1

    for link in GRAPH.iter_links():
        relationship_types[link.relationship_type] += 1

    return GraphStats(
        num_entities=GRAPH.num_entities,
        num_links=GRAPH.num_links,
        entity_types=dict(entity_types),
        relationship_types=dict(relationship_types),
    )


@app.get("/graph/entity/{ticker}", response_model=EntityInfo)
async def get_entity(ticker: str):
    """Get information about a specific entity."""
    if GRAPH is None:
        raise HTTPException(status_code=503, detail="Graph not loaded")

    entity = GRAPH.get_entity(ticker.upper())
    if entity is None:
        raise HTTPException(status_code=404, detail=f"Entity {ticker} not found")

    connections = len(GRAPH.get_outgoing(ticker.upper())) + len(GRAPH.get_incoming(ticker.upper()))

    return EntityInfo(
        id=entity.id,
        type=entity.entity_type,
        name=entity.name,
        sector=entity.attributes.get('sector'),
        connections=connections,
    )


@app.get("/graph/entity/{ticker}/connections")
async def get_entity_connections(ticker: str):
    """Get all connections for an entity."""
    if GRAPH is None:
        raise HTTPException(status_code=503, detail="Graph not loaded")

    ticker = ticker.upper()
    entity = GRAPH.get_entity(ticker)
    if entity is None:
        raise HTTPException(status_code=404, detail=f"Entity {ticker} not found")

    outgoing = [
        {
            "target": link.target,
            "relationship": link.relationship_type,
            "strength": link.strength,
            "delay_days": link.delay_mean,
            "confidence": link.confidence,
        }
        for link in GRAPH.get_outgoing(ticker)
    ]

    incoming = [
        {
            "source": link.source,
            "relationship": link.relationship_type,
            "strength": link.strength,
            "delay_days": link.delay_mean,
            "confidence": link.confidence,
        }
        for link in GRAPH.get_incoming(ticker)
    ]

    return {
        "entity": ticker,
        "outgoing": outgoing,
        "incoming": incoming,
    }


@app.post("/predict/earnings", response_model=CascadeResponse)
async def predict_earnings_cascade(request: EarningsEventRequest):
    """
    Predict cascade effects from an earnings event.

    This is the main prediction endpoint. Supports any entity type (company, ETF, sector).
    """
    if GRAPH is None:
        raise HTTPException(status_code=503, detail="Graph not loaded")

    try:
        entity_id = request.get_entity_id()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Verify entity exists
    if entity_id not in GRAPH.entities:
        raise HTTPException(
            status_code=404,
            detail=f"Entity {entity_id} not found in graph. Available top entities: "
            f"{', '.join(list(GRAPH.entities.keys())[:10])}...",
        )

    # Create event and propagate
    event = create_earnings_event(
        ticker=entity_id,
        surprise_percent=request.surprise_percent,
        description=request.description,
    )

    cascade = propagate_with_explanation(
        event,
        GRAPH,
        horizon_days=request.horizon_days,
    )

    # Convert to response format
    timeline_response = {}
    for period, effects in cascade.get_timeline().items():
        timeline_response[period] = [
            EffectResponse(
                entity=e.entity,
                magnitude_percent=round(e.magnitude * 100, 2),
                magnitude_range=[round(e.magnitude_range[0], 2), round(e.magnitude_range[1], 2)],
                day=round(e.day, 1),
                confidence=round(e.confidence, 3),
                order=e.order,
                relationship_type=e.relationship_type,
                explanation=e.explanation,
            )
            for e in effects
        ]

    return CascadeResponse(
        trigger={
            "entity": event.entity,
            "magnitude_percent": round(event.magnitude * 100, 2),
            "event_type": event.event_type,
            "description": event.description,
        },
        horizon_days=cascade.horizon_days,
        total_effects=len(cascade.effects),
        effects_by_order={
            f"order_{k}": len(v) for k, v in cascade._by_order.items()
        },
        timeline=timeline_response,
    )


@app.post("/explain/cascade")
async def explain_cascade_endpoint(request: EarningsEventRequest):
    """
    Get detailed explanations for a cascade prediction.

    Returns natural language explanations for each predicted effect.
    """
    if GRAPH is None:
        raise HTTPException(status_code=503, detail="Graph not loaded")

    ticker = request.ticker.upper()

    if ticker not in GRAPH.entities:
        raise HTTPException(status_code=404, detail=f"Entity {ticker} not found")

    event = create_earnings_event(
        ticker=ticker,
        surprise_percent=request.surprise_percent,
        description=request.description,
    )

    cascade = propagate_with_explanation(event, GRAPH, horizon_days=request.horizon_days)
    explanations = explain_cascade(cascade, GRAPH, top_n=15)

    return explanations


@app.get("/entities/search")
async def search_entities(q: str, limit: int = 10):
    """Search for entities by ticker or name."""
    if GRAPH is None:
        raise HTTPException(status_code=503, detail="Graph not loaded")

    q = q.upper()
    matches = []

    for entity in GRAPH.entities.values():
        if q in entity.id.upper() or q in entity.name.upper():
            matches.append({
                "id": entity.id,
                "name": entity.name,
                "type": entity.entity_type,
                "sector": entity.attributes.get("sector", "N/A"),
            })
            if len(matches) >= limit:
                break

    return {"query": q, "results": matches}


# Run with: uvicorn src.api.main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
