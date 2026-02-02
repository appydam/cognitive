"""FastAPI application for Consequence AI."""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator
from typing import Any
from datetime import datetime
from sqlalchemy.orm import Session

from ..graph.builders import build_initial_graph
from ..graph.loaders import load_graph_from_database
from ..engine import propagate_with_explanation
from ..explain import explain_cascade
from src.adapters.securities import create_earnings_event
from src.api.websocket import manager
from src.db.database import SessionLocal
from src.db.models import BacktestRun, UserNotificationPreference
from src.validation.batch_backtest import BatchBacktester

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


def get_db():
    """Database dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.on_event("startup")
async def startup_event():
    """Load the causal graph on startup."""
    global GRAPH

    # Try loading from builders with macro domain first (for testing)
    # Fall back to database if builders fail
    try:
        print("Loading causal graph from builders (securities + macro)...")
        from src.graph.builders.registry import BuilderRegistry
        from src.graph.builders.real_data import build_graph_from_real_data
        from src.graph.builders import macro

        # Register builders
        BuilderRegistry.register('securities_real_data', build_graph_from_real_data)

        # Build combined graph
        GRAPH = BuilderRegistry.build(['securities_real_data', 'macro'])
        print(f"Graph loaded from builders: {GRAPH.num_entities} entities, {GRAPH.num_links} links")
    except Exception as e:
        print(f"Failed to load from builders: {e}")
        print("Falling back to database...")
        GRAPH = load_graph_from_database()
        print(f"Graph loaded from database: {GRAPH.num_entities} entities, {GRAPH.num_links} links")


# Request/Response models
class EarningsEventRequest(BaseModel):
    """Request for an earnings event prediction."""

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

    @model_validator(mode='after')
    def validate_entity_or_ticker(self):
        """Ensure either entity_id or ticker is provided."""
        if not self.entity_id and not self.ticker:
            raise ValueError("Either entity_id or ticker must be provided")
        return self

    def get_entity_id(self) -> str:
        """Get entity ID, supporting both new and legacy fields."""
        if self.entity_id:
            return self.entity_id.upper()
        elif self.ticker:
            return self.ticker.upper()
        else:
            raise ValueError("Either entity_id or ticker must be provided")


class GenericEventRequest(BaseModel):
    """Generic event request for any domain (macro, supply chain, etc.)."""

    entity_id: str = Field(..., description="Entity ID where event occurs", example="FED_FUNDS_RATE")
    magnitude: float = Field(
        ...,
        description="Event magnitude as decimal (-1.0 to 1.0)",
        example=0.005,  # 0.5% = 50 basis points for rate hike
        ge=-1.0,
        le=1.0,
    )
    event_type: str = Field(
        default="generic",
        description="Type of event (e.g., 'rate_hike', 'port_disruption', 'commodity_surge')",
        example="rate_hike",
    )
    domain: str = Field(
        default="macro",
        description="Domain of the event (e.g., 'macro', 'supply_chain', 'securities')",
        example="macro",
    )
    description: str = Field(
        default="",
        description="Optional human-readable description",
        example="Fed raises rates by 50 basis points",
    )
    horizon_days: int = Field(
        default=30,
        description="Number of days to project effects",
        ge=1,
        le=90,
    )


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
    cause_path: list[str] = Field(default_factory=list, description="Entity IDs in causal chain from trigger to this effect")


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


@app.get("/graph/full")
async def get_full_graph():
    """Get the complete graph data (all nodes and links) in a single request."""
    if GRAPH is None:
        raise HTTPException(status_code=503, detail="Graph not loaded")

    nodes = [
        {
            "id": entity.id,
            "name": entity.name,
            "type": entity.entity_type,
            "sector": entity.attributes.get("sector"),
        }
        for entity in GRAPH.entities.values()
    ]

    links = [
        {
            "source": link.source,
            "target": link.target,
            "relationship": link.relationship_type,
            "strength": link.strength,
            "delay_days": link.delay_mean,
            "confidence": link.confidence,
        }
        for link in GRAPH.iter_links()
    ]

    return {"nodes": nodes, "links": links}


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

    # Helper to extract entity IDs from cause_chain
    def extract_cause_path(cause_chain):
        """Extract entity IDs from cause_chain [Event, Link, Link, ...]."""
        if not cause_chain:
            return []

        path = []
        # First item is always the Event (trigger)
        if cause_chain and hasattr(cause_chain[0], 'entity'):
            path.append(cause_chain[0].entity)

        # Remaining items are CausalLinks - extract target from each
        for item in cause_chain[1:]:
            if hasattr(item, 'target'):
                path.append(item.target)

        return path

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
                cause_path=extract_cause_path(e.cause_chain),
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


@app.post("/predict/event", response_model=CascadeResponse)
async def predict_generic_event(request: GenericEventRequest):
    """
    Predict cascade effects from a generic event (domain-agnostic).

    This endpoint works for any domain: macro, supply chain, geopolitical, etc.
    Examples:
    - Macro: Fed rate hike, oil price surge, VIX spike
    - Supply chain: Port disruption, factory closure
    - Geopolitical: Trade sanctions, conflict escalation

    The earnings endpoint remains for backward compatibility.
    """
    if GRAPH is None:
        raise HTTPException(status_code=503, detail="Graph not loaded")

    entity_id = request.entity_id.upper()

    # Verify entity exists
    if entity_id not in GRAPH.entities:
        raise HTTPException(
            status_code=404,
            detail=f"Entity {entity_id} not found in graph. Check entity ID spelling.",
        )

    # Create generic event
    from src.engine.propagate import Event

    event = Event(
        entity=entity_id,
        magnitude=request.magnitude,
        event_type=request.event_type,
        description=request.description or f"{request.event_type} on {entity_id}",
    )

    # Propagate cascade (domain-agnostic engine)
    cascade = propagate_with_explanation(
        event,
        GRAPH,
        horizon_days=request.horizon_days,
    )

    # Helper to extract entity IDs from cause_chain
    def extract_cause_path(cause_chain):
        """Extract entity IDs from cause_chain [Event, Link, Link, ...]."""
        if not cause_chain:
            return []

        path = []
        # First item is always the Event (trigger)
        if cause_chain and hasattr(cause_chain[0], 'entity'):
            path.append(cause_chain[0].entity)

        # Remaining items are CausalLinks - extract target from each
        for item in cause_chain[1:]:
            if hasattr(item, 'target'):
                path.append(item.target)

        return path

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
                cause_path=extract_cause_path(e.cause_chain),
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

    # Support both entity_id (new) and ticker (legacy)
    ticker = (request.entity_id or request.ticker)
    if not ticker:
        raise HTTPException(status_code=400, detail="Either entity_id or ticker must be provided")

    ticker = ticker.upper()

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


# WebSocket endpoint for real-time alerts
@app.websocket("/ws/alerts")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time cascade alerts."""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, waiting for messages from client
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# Backtest endpoints
class BacktestRequest(BaseModel):
    """Request to create a new backtest run."""
    start_date: str = Field(..., description="Start date (YYYY-MM-DD)")
    end_date: str = Field(..., description="End date (YYYY-MM-DD)")
    min_surprise: float = Field(default=5.0, description="Minimum surprise percentage")
    max_events: int = Field(default=500, description="Maximum events to process")


@app.post("/backtest/run")
async def create_backtest_run(request: BacktestRequest, db: Session = Depends(get_db)):
    """Create a new backtest run."""
    try:
        # Parse dates
        start_date = datetime.fromisoformat(request.start_date)
        end_date = datetime.fromisoformat(request.end_date)

        # Create backtester and run
        backtester = BatchBacktester(db)
        run = await backtester.run_batch(
            start_date=start_date,
            end_date=end_date,
            min_surprise=request.min_surprise,
            max_events=request.max_events
        )

        return {
            "id": run.id,
            "start_date": run.start_date.isoformat(),
            "end_date": run.end_date.isoformat(),
            "min_surprise": run.min_surprise,
            "total_events": run.total_events,
            "avg_accuracy": run.avg_accuracy,
            "avg_mae": run.avg_mae,
            "profitable_trades": run.profitable_trades,
            "total_roi": run.total_roi,
            "status": run.status,
            "created_at": run.created_at.isoformat(),
            "completed_at": run.completed_at.isoformat() if run.completed_at else None,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create backtest: {str(e)}")


@app.get("/backtest/runs")
async def list_backtest_runs(db: Session = Depends(get_db)):
    """List all backtest runs."""
    runs = db.query(BacktestRun).order_by(BacktestRun.created_at.desc()).limit(50).all()

    return [
        {
            "id": run.id,
            "start_date": run.start_date.isoformat(),
            "end_date": run.end_date.isoformat(),
            "min_surprise": run.min_surprise,
            "total_events": run.total_events,
            "avg_accuracy": run.avg_accuracy,
            "avg_mae": run.avg_mae,
            "profitable_trades": run.profitable_trades,
            "total_roi": run.total_roi,
            "status": run.status,
            "created_at": run.created_at.isoformat(),
            "completed_at": run.completed_at.isoformat() if run.completed_at else None,
        }
        for run in runs
    ]


@app.get("/backtest/run/{run_id}")
async def get_backtest_run(run_id: int, db: Session = Depends(get_db)):
    """Get details of a specific backtest run."""
    run = db.query(BacktestRun).filter(BacktestRun.id == run_id).first()

    if not run:
        raise HTTPException(status_code=404, detail="Backtest run not found")

    return {
        "id": run.id,
        "start_date": run.start_date.isoformat(),
        "end_date": run.end_date.isoformat(),
        "min_surprise": run.min_surprise,
        "total_events": run.total_events,
        "avg_accuracy": run.avg_accuracy,
        "avg_mae": run.avg_mae,
        "profitable_trades": run.profitable_trades,
        "total_roi": run.total_roi,
        "status": run.status,
        "created_at": run.created_at.isoformat(),
        "completed_at": run.completed_at.isoformat() if run.completed_at else None,
    }


# Notification Preferences endpoints
class NotificationPreferencesRequest(BaseModel):
    """Request to update notification preferences."""
    min_surprise: float = Field(default=5.0, ge=0, le=100)
    high_confidence_only: bool = Field(default=True)
    pre_market_alerts: bool = Field(default=True)
    after_hours_alerts: bool = Field(default=True)

    email_enabled: bool = Field(default=False)
    email_address: str | None = Field(default=None)

    slack_enabled: bool = Field(default=False)
    slack_webhook: str | None = Field(default=None)

    whatsapp_enabled: bool = Field(default=False)
    whatsapp_number: str | None = Field(default=None)

    sms_enabled: bool = Field(default=False)
    sms_number: str | None = Field(default=None)

    watchlist: list[str] = Field(default_factory=list)


@app.get("/notifications/preferences")
async def get_notification_preferences(user_id: str = "default", db: Session = Depends(get_db)):
    """Get user notification preferences."""
    prefs = db.query(UserNotificationPreference).filter(
        UserNotificationPreference.user_id == user_id
    ).first()

    if not prefs:
        # Return defaults if no preferences exist
        return {
            "min_surprise": 5.0,
            "high_confidence_only": True,
            "pre_market_alerts": True,
            "after_hours_alerts": True,
            "email_enabled": False,
            "email_address": None,
            "slack_enabled": False,
            "slack_webhook": None,
            "whatsapp_enabled": False,
            "whatsapp_number": None,
            "sms_enabled": False,
            "sms_number": None,
            "watchlist": [],
        }

    return {
        "min_surprise": prefs.min_surprise,
        "high_confidence_only": prefs.high_confidence_only,
        "pre_market_alerts": prefs.pre_market_alerts,
        "after_hours_alerts": prefs.after_hours_alerts,
        "email_enabled": prefs.email_enabled,
        "email_address": prefs.email_address,
        "slack_enabled": prefs.slack_enabled,
        "slack_webhook": prefs.slack_webhook,
        "whatsapp_enabled": prefs.whatsapp_enabled,
        "whatsapp_number": prefs.whatsapp_number,
        "sms_enabled": prefs.sms_enabled,
        "sms_number": prefs.sms_number,
        "watchlist": prefs.watchlist or [],
    }


@app.post("/notifications/preferences")
async def save_notification_preferences(
    request: NotificationPreferencesRequest,
    user_id: str = "default",
    db: Session = Depends(get_db)
):
    """Save user notification preferences."""
    prefs = db.query(UserNotificationPreference).filter(
        UserNotificationPreference.user_id == user_id
    ).first()

    if not prefs:
        prefs = UserNotificationPreference(user_id=user_id)
        db.add(prefs)

    # Update all fields
    prefs.min_surprise = request.min_surprise
    prefs.high_confidence_only = request.high_confidence_only
    prefs.pre_market_alerts = request.pre_market_alerts
    prefs.after_hours_alerts = request.after_hours_alerts

    prefs.email_enabled = request.email_enabled
    prefs.email_address = request.email_address

    prefs.slack_enabled = request.slack_enabled
    prefs.slack_webhook = request.slack_webhook

    prefs.whatsapp_enabled = request.whatsapp_enabled
    prefs.whatsapp_number = request.whatsapp_number

    prefs.sms_enabled = request.sms_enabled
    prefs.sms_number = request.sms_number

    prefs.watchlist = request.watchlist

    db.commit()
    db.refresh(prefs)

    return {"status": "success", "message": "Notification preferences saved"}


@app.post("/notifications/test")
async def send_test_notification(user_id: str = "default", db: Session = Depends(get_db)):
    """Send a test notification to all enabled channels."""
    from src.notifications import notification_sender

    prefs = db.query(UserNotificationPreference).filter(
        UserNotificationPreference.user_id == user_id
    ).first()

    if not prefs:
        raise HTTPException(status_code=404, detail="No notification preferences found")

    # Create test alert data
    test_alert = {
        'event': {
            'ticker': 'TEST',
            'company': 'Test Company Inc.',
            'surprise_percent': 8.5,
            'report_time': datetime.utcnow().isoformat(),
        },
        'cascade': {
            'total_effects': 23,
            'horizon_days': 14,
        }
    }

    results = []

    # Actually send to enabled channels
    if prefs.email_enabled and prefs.email_address:
        success = await notification_sender.send_email(prefs.email_address, test_alert)
        results.append({
            "channel": "email",
            "status": "sent" if success else "failed",
            "target": prefs.email_address
        })

    if prefs.slack_enabled and prefs.slack_webhook:
        success = await notification_sender.send_slack(prefs.slack_webhook, test_alert)
        results.append({
            "channel": "slack",
            "status": "sent" if success else "failed",
            "target": "webhook"
        })

    if prefs.whatsapp_enabled and prefs.whatsapp_number:
        success = await notification_sender.send_whatsapp(prefs.whatsapp_number, test_alert)
        results.append({
            "channel": "whatsapp",
            "status": "sent" if success else "failed",
            "target": prefs.whatsapp_number
        })

    if prefs.sms_enabled and prefs.sms_number:
        success = await notification_sender.send_sms(prefs.sms_number, test_alert)
        results.append({
            "channel": "sms",
            "status": "sent" if success else "failed",
            "target": prefs.sms_number
        })

    if not results:
        return {"status": "error", "message": "No notification channels enabled"}

    # Check if any succeeded
    any_sent = any(r["status"] == "sent" for r in results)

    return {
        "status": "success" if any_sent else "partial_failure",
        "message": f"Sent test notifications to {len([r for r in results if r['status'] == 'sent'])} channels",
        "results": results
    }


# ==================== Portfolio Endpoints ====================

class PortfolioHoldingRequest(BaseModel):
    """Single portfolio holding."""
    entity_id: str
    shares: float
    cost_basis: float | None = None


class PortfolioAnalyzeRequest(BaseModel):
    """Request to analyze a portfolio."""
    holdings: list[PortfolioHoldingRequest]


@app.post("/portfolio/analyze")
async def analyze_portfolio(request: PortfolioAnalyzeRequest):
    """
    Analyze a portfolio against the causal graph.

    Returns exposure scores, concentration risk, and macro sensitivities
    for each holding.
    """
    if GRAPH is None:
        raise HTTPException(status_code=503, detail="Graph not loaded")

    if not request.holdings:
        raise HTTPException(status_code=400, detail="No holdings provided")

    holdings_analysis = []
    valid_entity_ids = set()
    sector_weights = {}
    total_weight = 0.0

    # Analyze each holding
    for h in request.holdings:
        eid = h.entity_id.upper()

        # Check if entity exists in graph
        if eid not in GRAPH.entities:
            continue

        entity = GRAPH.entities[eid]
        valid_entity_ids.add(eid)

        # Count incoming/outgoing links
        incoming = len(GRAPH.get_incoming(eid))
        outgoing = len(GRAPH.get_outgoing(eid))

        # Get neighbors within 3 hops (cascade reach)
        neighbors = GRAPH.get_neighbors(eid, depth=3)

        # Cascade exposure score: 0-100 based on neighbor count
        # Normalized against total graph size
        exposure_score = min(100.0, (len(neighbors) / max(GRAPH.num_entities, 1)) * 1000)

        # Equal weighting for now (without prices)
        weight = 1.0 / len(request.holdings)
        total_weight += weight

        # Track sector weights
        sector = entity.attributes.get("sector") if hasattr(entity, 'attributes') else None
        if sector:
            sector_weights[sector] = sector_weights.get(sector, 0) + weight

        holdings_analysis.append({
            "entity_id": eid,
            "name": entity.name,
            "entity_type": entity.entity_type,
            "sector": sector,
            "current_price": None,
            "market_value": None,
            "portfolio_weight": round(weight, 4),
            "incoming_cascade_count": incoming,
            "outgoing_cascade_count": outgoing,
            "cascade_exposure_score": round(exposure_score, 1),
        })

    # Compute concentration metrics
    weights = [h["portfolio_weight"] for h in holdings_analysis]
    herfindahl = sum(w * w for w in weights) if weights else 0
    top_weight = max(weights) if weights else 0

    # Interconnection: measure density of links between holdings
    links_between_holdings = 0
    for h1 in valid_entity_ids:
        for link in GRAPH.get_outgoing(h1):
            if link.target in valid_entity_ids:
                links_between_holdings += 1

    max_possible_links = len(valid_entity_ids) * (len(valid_entity_ids) - 1)
    interconnection = (links_between_holdings / max_possible_links * 100) if max_possible_links > 0 else 0

    # Find macro indicators that affect holdings
    macro_risks = []
    for entity in GRAPH.entities.values():
        if entity.entity_type == "indicator":
            affected = []
            for link in GRAPH.get_outgoing(entity.id):
                if link.target in valid_entity_ids:
                    affected.append(link.target)

            if affected:
                # Quick sensitivity estimate from link strengths
                avg_sens = sum(
                    GRAPH.get_outgoing(entity.id)[i].strength * GRAPH.get_outgoing(entity.id)[i].direction
                    for i, _ in enumerate(affected)
                    if i < len(GRAPH.get_outgoing(entity.id))
                ) / len(affected) if affected else 0

                macro_risks.append({
                    "indicator_id": entity.id,
                    "indicator_name": entity.name,
                    "affected_holdings": affected,
                    "avg_sensitivity": round(avg_sens, 3),
                    "direction": "positive" if avg_sens > 0 else "negative",
                })

    # Overall portfolio cascade exposure (average of holdings)
    avg_exposure = sum(h["cascade_exposure_score"] for h in holdings_analysis) / len(holdings_analysis) if holdings_analysis else 0

    return {
        "total_value": None,
        "total_holdings": len(request.holdings),
        "holdings": holdings_analysis,
        "concentration_risk": {
            "sector_breakdown": {k: round(v, 4) for k, v in sector_weights.items()},
            "top_holding_weight": round(top_weight, 4),
            "interconnection_score": round(interconnection, 1),
            "herfindahl_index": round(herfindahl, 4),
        },
        "top_macro_risks": sorted(macro_risks, key=lambda x: abs(x["avg_sensitivity"]), reverse=True)[:5],
        "cascade_exposure_score": round(avg_exposure, 1),
    }


class PortfolioCascadeRequest(BaseModel):
    """Request to run a cascade filtered to portfolio holdings."""
    holdings: list[PortfolioHoldingRequest]
    entity_id: str = Field(..., description="Entity where event occurs")
    surprise_percent: float
    horizon_days: int = Field(default=14, ge=1, le=90)


@app.post("/portfolio/cascade")
async def portfolio_cascade(request: PortfolioCascadeRequest):
    """
    Predict cascade effects filtered to portfolio holdings.

    Runs the standard cascade engine then filters results to show
    only impacts on the user's holdings.
    """
    if GRAPH is None:
        raise HTTPException(status_code=503, detail="Graph not loaded")

    entity_id = request.entity_id.upper()

    # Verify trigger entity exists
    if entity_id not in GRAPH.entities:
        raise HTTPException(
            status_code=404,
            detail=f"Entity {entity_id} not found in graph"
        )

    # Run standard cascade
    event = create_earnings_event(
        ticker=entity_id,
        surprise_percent=request.surprise_percent,
    )
    cascade = propagate_with_explanation(
        event,
        GRAPH,
        horizon_days=request.horizon_days,
    )

    # Build holding lookup
    holding_ids = {h.entity_id.upper() for h in request.holdings}

    # Filter effects to portfolio holdings
    holding_effects = []
    affected = set()

    # cascade.effects is a list of Effect objects
    for effect in cascade.effects:
        if effect.entity in holding_ids:
            affected.add(effect.entity)
            entity_info = GRAPH.entities.get(effect.entity)

            holding_effects.append({
                "entity_id": effect.entity,
                "name": entity_info.name if entity_info else effect.entity,
                "portfolio_weight": 1.0 / len(holding_ids),  # Equal weight
                "magnitude_percent": round(effect.magnitude * 100, 2),
                "magnitude_range": [round(r * 100, 2) for r in effect.magnitude_range],
                "day": round(effect.day, 1),
                "confidence": round(effect.confidence, 3),
                "order": effect.order,
                "relationship_type": effect.relationship_type,
                "cause_path": effect.cause_chain if hasattr(effect, 'cause_chain') else [],
                "dollar_impact": None,
            })

    # Compute weighted portfolio impact (equal weight)
    total_impact = sum(e["magnitude_percent"] * e["portfolio_weight"] for e in holding_effects)

    return {
        "trigger": {
            "entity": entity_id,
            "magnitude_percent": request.surprise_percent,
            "event_type": "earnings" if request.surprise_percent else "generic",
            "description": f"{entity_id} {'beats' if request.surprise_percent > 0 else 'misses'} by {abs(request.surprise_percent)}%",
        },
        "portfolio_impact": {
            "total_impact_percent": round(total_impact, 2),
            "total_impact_dollars": None,
            "affected_holdings": len(affected),
            "unaffected_holdings": len(holding_ids) - len(affected),
        },
        "holding_effects": sorted(holding_effects, key=lambda x: abs(x["magnitude_percent"]), reverse=True),
        "unaffected_holdings": list(holding_ids - affected),
    }


class MacroSensitivityRequest(BaseModel):
    """Request for macro sensitivity analysis."""
    holdings: list[PortfolioHoldingRequest]


@app.post("/portfolio/macro-sensitivity")
async def portfolio_macro_sensitivity(request: MacroSensitivityRequest):
    """
    Compute how each macro indicator affects portfolio holdings.

    Runs standard shocks for each macro indicator and measures
    impact on holdings.
    """
    if GRAPH is None:
        raise HTTPException(status_code=503, detail="Graph not loaded")

    # Standard shocks for each indicator type
    INDICATOR_SHOCKS = {
        "FED_FUNDS_RATE": 0.005,   # 50 bps
        "VIX": 0.20,               # +20%
        "OIL_WTI": 0.10,           # +10%
        "USD_INDEX": 0.05,         # +5%
        "CPI": 0.01,               # +1%
        "10Y_TREASURY": 0.005,     # 50 bps
        "GOLD": 0.05,              # +5%
        "UNEMPLOYMENT": 0.01,      # +1%
    }

    holding_ids = {h.entity_id.upper() for h in request.holdings}
    results = []

    # Find all indicator entities in graph
    for entity in GRAPH.entities.values():
        if entity.entity_type != "indicator":
            continue

        # Get shock magnitude for this indicator
        shock = INDICATOR_SHOCKS.get(entity.id, 0.05)  # default 5%

        # Run propagation
        from src.engine.propagate import Event
        event = Event(entity=entity.id, magnitude=shock, event_type="macro_shock")

        try:
            cascade = propagate_with_explanation(event, GRAPH, horizon_days=30)

            # Filter to holdings
            effects_on_holdings = {}
            for effect in cascade.effects:
                if effect.entity in holding_ids:
                    effects_on_holdings[effect.entity] = round(effect.magnitude * 100, 2)

            if effects_on_holdings:
                results.append({
                    "indicator_id": entity.id,
                    "indicator_name": entity.name,
                    "shock_magnitude": shock,
                    "effects_on_holdings": effects_on_holdings,
                    "avg_impact": round(sum(effects_on_holdings.values()) / len(effects_on_holdings), 2),
                })
        except Exception as e:
            print(f"[portfolio/macro-sensitivity] Failed to propagate {entity.id}: {e}")
            continue

    return {"sensitivities": sorted(results, key=lambda x: abs(x["avg_impact"]), reverse=True)}


class SubgraphRequest(BaseModel):
    """Request for portfolio subgraph."""
    holdings: list[PortfolioHoldingRequest]
    include_intermediaries: bool = Field(default=True, description="Include 1-hop intermediaries")


@app.post("/portfolio/subgraph")
async def portfolio_subgraph(request: SubgraphRequest):
    """
    Get the causal subgraph connecting portfolio holdings.

    Returns nodes and links showing how holdings are connected.
    """
    if GRAPH is None:
        raise HTTPException(status_code=503, detail="Graph not loaded")

    entity_ids = {h.entity_id.upper() for h in request.holdings}

    # Filter to holdings that exist in the graph (skip unknown ones)
    entity_ids = {eid for eid in entity_ids if eid in GRAPH.entities}

    if not entity_ids:
        return {"nodes": [], "links": []}

    # Optionally include 1-hop intermediaries
    if request.include_intermediaries:
        expanded = set(entity_ids)
        for eid in list(entity_ids):  # Iterate over copy
            # Check outgoing links
            for link in GRAPH.get_outgoing(eid):
                # If target connects back to a holding, include it
                target_links_to_holding = any(
                    l.target in entity_ids
                    for l in GRAPH.get_outgoing(link.target)
                )
                if link.target in entity_ids or target_links_to_holding:
                    expanded.add(link.target)

            # Check incoming links
            for link in GRAPH.get_incoming(eid):
                # If source connects to a holding, include it
                source_links_to_holding = any(
                    l.target in entity_ids
                    for l in GRAPH.get_outgoing(link.source)
                )
                if link.source in entity_ids or source_links_to_holding:
                    expanded.add(link.source)

        entity_ids = expanded

    # Extract subgraph
    sub = GRAPH.subgraph(entity_ids)

    # Format as graph/full response
    nodes = []
    for e in sub.entities.values():
        is_holding = e.id in {h.entity_id.upper() for h in request.holdings}
        nodes.append({
            "id": e.id,
            "name": e.name,
            "type": e.entity_type,
            "sector": e.attributes.get("sector") if hasattr(e, 'attributes') else None,
            "is_holding": is_holding,
        })

    links = []
    for link in sub.iter_links():
        links.append({
            "source": link.source,
            "target": link.target,
            "relationship": link.relationship_type,
            "strength": round(link.strength, 3),
            "delay_days": round(link.delay_mean, 2),
            "confidence": round(link.confidence, 3),
        })

    return {"nodes": nodes, "links": links}


# ============================================================
# SIGNAL ENDPOINTS
# ============================================================

class SignalGenerateRequest(BaseModel):
    """Request to generate signals from a cascade."""
    trigger_entity: str
    trigger_magnitude: float  # percent
    trigger_description: str = ""
    horizon_days: int = 14
    min_confidence: float = 0.5
    portfolio_value: float | None = None


@app.post("/signals/generate")
async def generate_signals(request: SignalGenerateRequest):
    """
    Generate trade signals from a cascade prediction.

    Runs the cascade engine, then converts high-confidence effects
    into actionable BUY/SELL signals with prices, stops, and conviction.
    """
    if GRAPH is None:
        raise HTTPException(status_code=503, detail="Graph not loaded")

    entity_id = request.trigger_entity.upper()
    if entity_id not in GRAPH.entities:
        raise HTTPException(status_code=404, detail=f"Entity {entity_id} not found in graph")

    # Run cascade
    event = create_earnings_event(
        ticker=entity_id,
        surprise_percent=request.trigger_magnitude,
    )
    cascade = propagate_with_explanation(
        event, GRAPH, horizon_days=request.horizon_days,
    )

    # Flatten effects into list of dicts
    effects = []
    for effect in cascade.effects:
        cause_path = []
        if hasattr(effect, 'cause_chain') and effect.cause_chain:
            for item in effect.cause_chain:
                if hasattr(item, 'entity'):
                    cause_path.append(item.entity)
                elif hasattr(item, 'target'):
                    cause_path.append(item.target)

        effects.append({
            "entity": effect.entity,
            "magnitude_percent": round(effect.magnitude * 100, 2),
            "day": round(effect.day, 1),
            "confidence": round(effect.confidence, 3),
            "order": effect.order,
            "relationship_type": effect.relationship_type,
            "cause_path": cause_path,
        })

    # Generate signals
    from src.signals.signal_generator import generate_signals_from_cascade
    signals = generate_signals_from_cascade(
        cascade_effects=effects,
        trigger_entity=entity_id,
        trigger_magnitude=request.trigger_magnitude,
        trigger_description=request.trigger_description,
        min_confidence=request.min_confidence,
        portfolio_value=request.portfolio_value,
        graph_entities=GRAPH.entities,
    )

    # Save signals
    from src.tracking.signal_tracker import save_signals_batch
    signal_dicts = [s.to_dict() for s in signals]
    saved = save_signals_batch(signal_dicts)

    return {"signals": saved, "total": len(saved)}


@app.get("/signals/active")
async def get_active_signals_endpoint():
    """Get all currently active trade signals."""
    from src.tracking.signal_tracker import get_active_signals
    signals = get_active_signals()
    return {"signals": signals, "total": len(signals)}


@app.get("/signals/history")
async def get_signals_history(days: int = 30):
    """Get signal history for the last N days."""
    from src.tracking.signal_tracker import get_all_signals
    signals = get_all_signals(days=days)
    return {"signals": signals, "total": len(signals)}


@app.get("/signals/performance")
async def get_signals_performance():
    """Get aggregate P&L performance across all signals."""
    from src.tracking.signal_tracker import get_signal_performance
    return get_signal_performance()


@app.post("/signals/update-prices")
async def update_signal_prices_endpoint():
    """
    Check active signals against current prices.
    Updates status to target_hit, stopped, or expired.
    """
    from src.tracking.signal_tracker import update_signal_prices
    result = update_signal_prices()
    return result


# ============================================================
# CALENDAR ENDPOINTS
# ============================================================

@app.get("/calendar/upcoming")
async def get_upcoming_earnings_endpoint(days: int = 7):
    """
    Get upcoming earnings for monitored companies.
    Uses cached data if available (refreshed every 6 hours).
    """
    import asyncio
    from src.poller.earnings_poller import get_cached_upcoming, fetch_upcoming_earnings

    # Try cache first
    cached = get_cached_upcoming()
    if cached:
        return {"earnings": cached, "source": "cache"}

    # Fetch fresh data in a thread (yfinance is blocking I/O)
    graph_entities = GRAPH.entities if GRAPH else None
    loop = asyncio.get_event_loop()
    earnings = await loop.run_in_executor(
        None, lambda: fetch_upcoming_earnings(graph_entities=graph_entities, days=days)
    )
    return {"earnings": earnings, "source": "fresh"}


@app.post("/calendar/refresh")
async def refresh_earnings_calendar(days: int = 7):
    """Force refresh the earnings calendar cache."""
    import asyncio
    from src.poller.earnings_poller import fetch_upcoming_earnings

    graph_entities = GRAPH.entities if GRAPH else None
    # Run in thread to avoid blocking the event loop
    loop = asyncio.get_event_loop()
    earnings = await loop.run_in_executor(
        None, lambda: fetch_upcoming_earnings(graph_entities=graph_entities, days=days)
    )
    return {"earnings": earnings, "total": len(earnings)}


@app.post("/calendar/check-surprises")
async def check_earnings_surprises(min_surprise: float = 3.0):
    """
    Check for new earnings surprises.
    Returns any new surprises above the threshold.
    """
    from src.poller.earnings_poller import check_for_surprises

    graph_entities = GRAPH.entities if GRAPH else None
    surprises = check_for_surprises(graph_entities=graph_entities, min_surprise=min_surprise)

    results = []
    for s in surprises:
        results.append({
            "ticker": s.ticker,
            "company_name": s.company_name,
            "report_date": s.report_date.isoformat(),
            "eps_estimate": s.eps_estimate,
            "eps_actual": s.eps_actual,
            "surprise_percent": round(s.surprise_percent, 2) if s.surprise_percent else None,
        })

    return {"surprises": results, "total": len(results)}


# Run with: uvicorn src.api.main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
