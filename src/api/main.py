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
    print("Loading causal graph from database...")
    GRAPH = load_graph_from_database()
    print(f"Graph loaded: {GRAPH.num_entities} entities, {GRAPH.num_links} links")


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


# Run with: uvicorn src.api.main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
