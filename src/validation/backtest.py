"""Backtesting framework for cascade predictions."""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any
import json
from pathlib import Path

from src.core.graph import CausalGraph
from ..engine import Event, Cascade, propagate
from src.adapters.securities import create_earnings_event
from ..data.yahoo_finance import get_price_reaction, get_earnings_history
from .metrics import (
    calculate_accuracy,
    calculate_calibration,
    calculate_metrics_by_order,
    AccuracyMetrics,
    format_metrics_report,
)


@dataclass
class BacktestResult:
    """Results from backtesting a single event."""

    event: Event
    event_date: datetime
    cascade: Cascade
    predictions: list[dict]
    actuals: list[dict]
    metrics: AccuracyMetrics

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "event": {
                "entity": self.event.entity,
                "magnitude": self.event.magnitude,
                "type": self.event.event_type,
            },
            "event_date": self.event_date.isoformat(),
            "num_predictions": len(self.predictions),
            "num_actuals": len(self.actuals),
            "metrics": self.metrics.to_dict(),
        }


@dataclass
class BacktestSuite:
    """Results from a suite of backtests."""

    results: list[BacktestResult]
    aggregate_metrics: AccuracyMetrics
    metrics_by_order: dict[int, AccuracyMetrics]
    calibration: tuple[float, dict]
    timestamp: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "timestamp": self.timestamp.isoformat(),
            "num_events_tested": len(self.results),
            "aggregate_metrics": self.aggregate_metrics.to_dict(),
            "metrics_by_order": {
                str(k): v.to_dict() for k, v in self.metrics_by_order.items()
            },
            "calibration_error": self.calibration[0],
            "events": [r.to_dict() for r in self.results],
        }

    def summary(self) -> str:
        """Get text summary of backtest suite."""
        return format_metrics_report(
            self.aggregate_metrics,
            self.metrics_by_order,
            self.calibration,
        )


def backtest_cascade(
    event: Event,
    event_date: datetime,
    graph: CausalGraph,
    horizon_days: int = 14,
) -> BacktestResult:
    """
    Backtest a single cascade event.

    1. Generate predictions using the cascade engine
    2. Fetch actual price movements for affected entities
    3. Compare predictions to actuals

    Args:
        event: The triggering event
        event_date: When the event occurred
        graph: Causal graph to use
        horizon_days: Prediction horizon

    Returns:
        BacktestResult with predictions, actuals, and metrics
    """
    # Generate predictions
    cascade = propagate(event, graph, horizon_days=horizon_days)

    # Convert predictions to comparable format
    predictions = []
    for effect in cascade.effects:
        predictions.append({
            "entity": effect.entity,
            "magnitude": effect.magnitude,
            "day": effect.day,
            "confidence": effect.confidence,
            "order": effect.order,
        })

    # Fetch actual price movements
    actuals = []
    affected_entities = set(p["entity"] for p in predictions)

    for entity in affected_entities:
        try:
            reaction = get_price_reaction(
                entity,
                event_date,
                days_before=1,
                days_after=min(horizon_days, 10),
            )

            if reaction and reaction.get("return_day5") is not None:
                actuals.append({
                    "entity": entity,
                    "magnitude": reaction["return_day5"] / 100,  # Convert to decimal
                    "day": 5,  # We measure at day 5
                })
        except Exception as e:
            print(f"Could not fetch actuals for {entity}: {e}")

    # Calculate metrics
    metrics = calculate_accuracy(predictions, actuals)

    return BacktestResult(
        event=event,
        event_date=event_date,
        cascade=cascade,
        predictions=predictions,
        actuals=actuals,
        metrics=metrics,
    )


def run_backtest_suite(
    graph: CausalGraph,
    events: list[tuple[str, float, datetime, str]],  # (ticker, surprise%, date, description)
    horizon_days: int = 14,
) -> BacktestSuite:
    """
    Run backtests on multiple historical events.

    Args:
        graph: Causal graph to use
        events: List of (ticker, surprise_percent, date, description) tuples
        horizon_days: Prediction horizon

    Returns:
        BacktestSuite with aggregate results
    """
    results = []
    all_predictions = []
    all_actuals = []

    for ticker, surprise_pct, event_date, description in events:
        print(f"Backtesting: {ticker} on {event_date.date()} ({surprise_pct:+.1f}%)")

        event = create_earnings_event(ticker, surprise_pct, description)
        result = backtest_cascade(event, event_date, graph, horizon_days)

        results.append(result)
        all_predictions.extend(result.predictions)
        all_actuals.extend(result.actuals)

    # Calculate aggregate metrics
    aggregate_metrics = calculate_accuracy(all_predictions, all_actuals)
    metrics_by_order = calculate_metrics_by_order(all_predictions, all_actuals)
    calibration = calculate_calibration(all_predictions, all_actuals)

    return BacktestSuite(
        results=results,
        aggregate_metrics=aggregate_metrics,
        metrics_by_order=metrics_by_order,
        calibration=calibration,
    )


def compare_to_baseline(
    cascade_metrics: AccuracyMetrics,
    baseline_metrics: AccuracyMetrics,
) -> dict[str, float]:
    """
    Compare cascade predictions to a baseline.

    Args:
        cascade_metrics: Metrics from cascade predictions
        baseline_metrics: Metrics from baseline (e.g., LLM predictions)

    Returns:
        Dict with improvement percentages
    """
    def improvement(cascade_val, baseline_val, higher_is_better=True):
        if baseline_val == 0:
            return 0
        diff = cascade_val - baseline_val
        if not higher_is_better:
            diff = -diff
        return diff / abs(baseline_val) * 100

    return {
        "direction_accuracy_improvement": improvement(
            cascade_metrics.direction_accuracy,
            baseline_metrics.direction_accuracy,
            higher_is_better=True,
        ),
        "magnitude_mae_improvement": improvement(
            cascade_metrics.magnitude_mae,
            baseline_metrics.magnitude_mae,
            higher_is_better=False,  # Lower is better
        ),
        "calibration_improvement": improvement(
            cascade_metrics.calibration_error,
            baseline_metrics.calibration_error,
            higher_is_better=False,
        ),
    }


# Historical events for backtesting
# Format: (ticker, surprise_percent, date, description)
HISTORICAL_EVENTS = [
    # 2023 Events
    ("AAPL", -2.5, datetime(2023, 5, 4), "Apple Q2 2023 slight miss on iPhone revenue"),
    ("MSFT", 5.0, datetime(2023, 7, 25), "Microsoft Q4 2023 cloud beat"),
    ("NVDA", 25.0, datetime(2023, 5, 24), "NVIDIA Q1 2024 massive AI beat"),
    ("META", 15.0, datetime(2023, 4, 26), "Meta Q1 2023 efficiency gains"),
    ("GOOGL", -5.0, datetime(2023, 2, 2), "Alphabet Q4 2022 ad revenue miss"),

    # 2024 Events
    ("TSLA", -10.0, datetime(2024, 1, 24), "Tesla Q4 2023 margin compression"),
    ("INTC", -15.0, datetime(2024, 1, 25), "Intel Q4 2023 foundry struggles"),
    ("AMD", 8.0, datetime(2024, 1, 30), "AMD Q4 2023 data center strength"),
    ("AMZN", 12.0, datetime(2024, 2, 1), "Amazon Q4 2023 AWS reacceleration"),
    ("AAPL", -3.0, datetime(2024, 2, 1), "Apple Q1 2024 China weakness"),
]


def run_standard_backtest(graph: CausalGraph) -> BacktestSuite:
    """Run backtest on standard historical events."""
    return run_backtest_suite(graph, HISTORICAL_EVENTS)


def save_backtest_results(suite: BacktestSuite, path: str | Path) -> None:
    """Save backtest results to JSON file."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(suite.to_dict(), f, indent=2, default=str)


def load_backtest_results(path: str | Path) -> dict:
    """Load backtest results from JSON file."""
    with open(path) as f:
        return json.load(f)
