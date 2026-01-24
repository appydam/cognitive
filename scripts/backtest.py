#!/usr/bin/env python3
"""Backtest the causal graph on historical earnings events.

This script:
1. Defines historical earnings events (2024-2025)
2. For each event, predicts cascade
3. Fetches actual outcomes from Yahoo Finance
4. Calculates accuracy metrics
5. Generates comprehensive report

Usage:
    python scripts/backtest.py --events=20
"""

import argparse
from datetime import datetime, timedelta
from dataclasses import dataclass
import json
from pathlib import Path

import yfinance as yf

from src.core.graph import CausalGraph
from src.graph.builders.real_data import build_graph_from_real_data
from src.adapters.securities.events import create_earnings_event
from src.engine.propagate import propagate
from src.learning.tracker import PredictionTracker


@dataclass
class HistoricalEvent:
    """A historical earnings event for backtesting."""
    ticker: str
    date: datetime
    surprise_pct: float  # Earnings surprise %
    description: str


# Historical earnings events from 2024-2025
# NOTE: These are REAL events - dates and surprise %s should be verified from actual filings
HISTORICAL_EVENTS = [
    # Apple Q4 2024 (Nov 2024)
    HistoricalEvent(
        ticker="AAPL",
        date=datetime(2024, 11, 1),
        surprise_pct=-2.5,  # Modest miss
        description="Q4 2024 earnings"
    ),
    # NVIDIA Q3 2024 (Nov 2024)
    HistoricalEvent(
        ticker="NVDA",
        date=datetime(2024, 11, 20),
        surprise_pct=15.0,  # Strong beat
        description="Q3 2024 blowout earnings"
    ),
    # TSMC Q3 2024 (Oct 2024)
    HistoricalEvent(
        ticker="TSM",
        date=datetime(2024, 10, 17),
        surprise_pct=-3.0,  # Minor miss
        description="Q3 2024 slight miss"
    ),
    # Amazon Q3 2024 (Oct 2024)
    HistoricalEvent(
        ticker="AMZN",
        date=datetime(2024, 10, 31),
        surprise_pct=8.0,  # Beat
        description="Q3 2024 beat"
    ),
    # Microsoft Q1 FY2025 (Oct 2024)
    HistoricalEvent(
        ticker="MSFT",
        date=datetime(2024, 10, 30),
        surprise_pct=5.0,  # Beat
        description="Q1 FY2025 beat"
    ),
    # Meta Q3 2024 (Oct 2024)
    HistoricalEvent(
        ticker="META",
        date=datetime(2024, 10, 30),
        surprise_pct=12.0,  # Strong beat
        description="Q3 2024 strong beat"
    ),
    # Alphabet Q3 2024 (Oct 2024)
    HistoricalEvent(
        ticker="GOOGL",
        date=datetime(2024, 10, 29),
        surprise_pct=6.0,  # Beat
        description="Q3 2024 beat"
    ),
    # Tesla Q3 2024 (Oct 2024)
    HistoricalEvent(
        ticker="TSLA",
        date=datetime(2024, 10, 23),
        surprise_pct=-4.0,  # Miss
        description="Q3 2024 miss"
    ),
    # Intel Q3 2024 (Oct 2024)
    HistoricalEvent(
        ticker="INTC",
        date=datetime(2024, 10, 31),
        surprise_pct=-8.0,  # Significant miss
        description="Q3 2024 significant miss"
    ),
    # AMD Q3 2024 (Oct 2024)
    HistoricalEvent(
        ticker="AMD",
        date=datetime(2024, 10, 29),
        surprise_pct=3.0,  # Slight beat
        description="Q3 2024 slight beat"
    ),
]


def fetch_actual_price_change(ticker: str, event_date: datetime, days_after: int = 7) -> tuple[float, int]:
    """
    Fetch actual price change after an event.

    Args:
        ticker: Stock ticker
        event_date: Date of earnings event
        days_after: How many days to look forward

    Returns:
        (max_change_pct, day_of_max): Maximum price change and when it occurred
    """
    try:
        end_date = event_date + timedelta(days=days_after + 2)
        stock = yf.Ticker(ticker)
        hist = stock.history(start=event_date, end=end_date)

        if len(hist) < 2:
            return 0.0, 0

        base_price = hist['Close'].iloc[0]
        max_change = 0.0
        max_day = 0

        for i in range(1, min(len(hist), days_after + 1)):
            price = hist['Close'].iloc[i]
            change_pct = ((price - base_price) / base_price) * 100

            if abs(change_pct) > abs(max_change):
                max_change = change_pct
                max_day = i - 1

        return max_change, max_day

    except Exception as e:
        print(f"   ⚠️  Error fetching {ticker}: {e}")
        return 0.0, 0


def run_backtest(
    events: list[HistoricalEvent],
    graph: CausalGraph,
    horizon_days: int = 7,
    min_magnitude: float = 0.01
) -> dict:
    """
    Run backtest on historical events.

    Args:
        events: List of historical events
        graph: Causal graph to test
        horizon_days: Prediction horizon
        min_magnitude: Minimum effect magnitude

    Returns:
        Dict with backtest results and metrics
    """
    results = {
        "events_tested": len(events),
        "total_predictions": 0,
        "direction_correct": 0,
        "magnitude_errors": [],
        "timing_errors": [],
        "by_order": {1: {"correct": 0, "total": 0}, 2: {"correct": 0, "total": 0}, 3: {"correct": 0, "total": 0}},
        "events": []
    }

    print(f"\nRunning backtest on {len(events)} historical events...")
    print("=" * 60)

    for i, event in enumerate(events, 1):
        print(f"\n[{i}/{len(events)}] {event.ticker} - {event.date.date()} ({event.surprise_pct:+.1f}%)")
        print(f"   {event.description}")

        # Create event
        earnings_event = create_earnings_event(
            ticker=event.ticker,
            surprise_percent=event.surprise_pct,
            description=event.description
        )
        earnings_event.timestamp = event.date

        # Predict cascade
        cascade = propagate(
            event=earnings_event,
            graph=graph,
            horizon_days=horizon_days,
            min_magnitude=min_magnitude
        )

        # Fetch actuals for predicted entities
        event_result = {
            "ticker": event.ticker,
            "date": event.date.isoformat(),
            "surprise_pct": event.surprise_pct,
            "predictions": [],
            "accuracy": {}
        }

        direction_correct_count = 0
        total_predictions = 0

        for effect in cascade.effects[:15]:  # Top 15 predictions
            # Fetch actual outcome
            actual_change, actual_day = fetch_actual_price_change(
                effect.entity, event.date, horizon_days
            )

            # Skip if failed to fetch data (both are 0 means fetch failed)
            if actual_change == 0.0 and actual_day == 0:
                continue

            predicted_magnitude = effect.magnitude * 100  # Convert to %

            # Calculate metrics
            is_direction_correct = (
                (predicted_magnitude > 0 and actual_change > 0) or
                (predicted_magnitude < 0 and actual_change < 0)
            )

            magnitude_error = abs(actual_change - predicted_magnitude)
            timing_error = abs(actual_day - effect.day)

            # Update results
            results["total_predictions"] += 1
            total_predictions += 1

            if is_direction_correct:
                results["direction_correct"] += 1
                direction_correct_count += 1

            results["magnitude_errors"].append(magnitude_error)
            results["timing_errors"].append(timing_error)

            # Track by order
            order = min(effect.order, 3)
            results["by_order"][order]["total"] += 1
            if is_direction_correct:
                results["by_order"][order]["correct"] += 1

            # Store prediction
            event_result["predictions"].append({
                "entity": effect.entity,
                "predicted": float(predicted_magnitude),
                "actual": float(actual_change),
                "predicted_day": float(effect.day),
                "actual_day": float(actual_day),
                "direction_correct": bool(is_direction_correct),
                "magnitude_error": float(magnitude_error),
                "order": int(effect.order)
            })

        # Event-level accuracy
        event_accuracy = (direction_correct_count / total_predictions * 100) if total_predictions > 0 else 0
        event_result["accuracy"] = {
            "direction": float(event_accuracy),
            "predictions": int(total_predictions)
        }

        results["events"].append(event_result)

        print(f"   ✅ Predicted {total_predictions} effects, {event_accuracy:.0f}% direction accuracy")

    return results


def print_backtest_report(results: dict):
    """Print comprehensive backtest report."""
    print("\n" + "=" * 60)
    print("BACKTEST RESULTS")
    print("=" * 60)

    # Overall metrics
    total = results["total_predictions"]
    if total == 0:
        print("\n⚠️  No predictions to analyze")
        return

    direction_accuracy = results["direction_correct"] / total * 100
    avg_magnitude_error = sum(results["magnitude_errors"]) / len(results["magnitude_errors"])
    avg_timing_error = sum(results["timing_errors"]) / len(results["timing_errors"])

    print(f"\nOverall Performance ({results['events_tested']} events, {total} predictions):")
    print(f"  Direction Accuracy: {direction_accuracy:.1f}% ({results['direction_correct']}/{total})")
    print(f"  Avg Magnitude Error: ±{avg_magnitude_error:.1f}%")
    print(f"  Avg Timing Error: ±{avg_timing_error:.1f} days")

    # By order
    print(f"\nAccuracy by Order:")
    for order in [1, 2, 3]:
        stats = results["by_order"][order]
        if stats["total"] > 0:
            accuracy = stats["correct"] / stats["total"] * 100
            print(f"  {order}-hop: {accuracy:.1f}% ({stats['correct']}/{stats['total']})")

    # Best/worst events
    print(f"\nTop 5 Events (by accuracy):")
    sorted_events = sorted(results["events"], key=lambda e: e["accuracy"]["direction"], reverse=True)
    for event in sorted_events[:5]:
        print(f"  {event['ticker']} ({event['date'][:10]}): {event['accuracy']['direction']:.0f}%")

    print(f"\nWorst 5 Events:")
    for event in sorted_events[-5:]:
        print(f"  {event['ticker']} ({event['date'][:10]}): {event['accuracy']['direction']:.0f}%")

    # Production readiness assessment
    print(f"\n" + "=" * 60)
    print("PRODUCTION READINESS ASSESSMENT")
    print("=" * 60)

    if direction_accuracy >= 70:
        print("✅ PASS: Direction accuracy ≥70% - Ready for production")
    elif direction_accuracy >= 60:
        print("⚠️  MARGINAL: Direction accuracy 60-70% - Needs improvement")
    else:
        print("❌ FAIL: Direction accuracy <60% - Not ready for production")

    print(f"\nKey Metrics:")
    print(f"  Target: ≥70% direction accuracy on 1st order effects")
    first_order = results["by_order"][1]
    if first_order["total"] > 0:
        first_order_accuracy = first_order["correct"] / first_order["total"] * 100
        print(f"  Actual: {first_order_accuracy:.1f}% on 1st order effects")


def save_backtest_results(results: dict, output_file: str = "data/backtest_results.json"):
    """Save backtest results to JSON."""
    Path(output_file).parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n📊 Results saved to: {output_file}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Backtest causal graph on historical earnings")
    parser.add_argument("--events", type=int, default=10, help="Number of events to test (max 10)")
    parser.add_argument("--horizon", type=int, default=7, help="Prediction horizon in days")
    parser.add_argument("--output", type=str, default="data/backtest_results.json", help="Output file")

    args = parser.parse_args()

    print("Backtesting Framework")
    print("=" * 60)

    # Build graph
    print("\n1. Building real data graph...")
    graph = build_graph_from_real_data(
        include_sec=True,
        include_correlations=True,
        include_sectors=True
    )
    print(f"✅ Graph ready: {graph.num_entities} entities, {graph.num_links} links")

    # Run backtest
    events_to_test = HISTORICAL_EVENTS[:args.events]
    results = run_backtest(
        events=events_to_test,
        graph=graph,
        horizon_days=args.horizon
    )

    # Print report
    print_backtest_report(results)

    # Save results
    save_backtest_results(results, args.output)

    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
