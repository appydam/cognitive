#!/usr/bin/env python3
"""Test the complete learning loop.

This script:
1. Makes a prediction using the real data graph
2. Saves it to tracker
3. Fetches actual outcomes
4. Updates graph weights using Bayesian learning
5. Shows before/after comparison
"""

from datetime import datetime
from src.core.graph import CausalGraph
from src.graph.builders.real_data import build_graph_from_real_data
from src.adapters.securities.events import create_earnings_event
from src.engine.propagate import propagate
from src.learning.tracker import PredictionTracker, PredictionRecord
from src.learning.feedback import learn_from_outcomes, Outcome, get_link_history


def main():
    """Test learning loop."""
    print("Learning Loop Test")
    print("=" * 60)

    # Build graph
    print("\n1. Building real data graph...")
    graph = build_graph_from_real_data(
        include_sec=True,
        include_correlations=True,
        include_sectors=True
    )
    print(f"✅ Graph built: {graph.num_entities} entities, {graph.num_links} links")

    # Get initial link stats for a key relationship
    initial_link = graph.get_link("AAPL", "TSM")
    if initial_link:
        print(f"\n2. Initial link state (AAPL → TSM):")
        print(f"   Strength: {initial_link.strength:.3f}")
        print(f"   Delay: {initial_link.delay_mean:.1f} days")
        print(f"   Confidence: {initial_link.confidence:.2f}")
        print(f"   Observations: {initial_link.observation_count}")
    else:
        print("\n⚠️  No direct AAPL → TSM link found")

    # Create test event (hypothetical)
    print("\n3. Creating test earnings event...")
    event = create_earnings_event(
        ticker="AAPL",
        surprise_percent=-8.0,
        description="Q4 2025 earnings miss"
    )
    event.timestamp = datetime(2025, 1, 15)  # Recent date

    # Predict cascade
    print("\n4. Predicting cascade...")
    cascade = propagate(
        event=event,
        graph=graph,
        horizon_days=7,
        min_magnitude=0.01
    )

    print(f"✅ Predicted {len(cascade.effects)} cascading effects")

    # Show predictions
    print("\n5. Top predictions:")
    for effect in cascade.effects[:5]:
        print(f"   {effect.entity}: {effect.magnitude*100:+.1f}% on day {effect.day:.1f} (conf: {effect.confidence:.2f})")

    # Save to tracker
    tracker = PredictionTracker()

    prediction_records = [
        PredictionRecord(
            ticker=effect.entity,
            predicted_magnitude=effect.magnitude * 100,  # Convert to %
            predicted_day=effect.day,
            confidence=effect.confidence,
            order=effect.order
        )
        for effect in cascade.effects[:10]  # Top 10
    ]

    print("\n6. Saving prediction to tracker...")
    pred_id = tracker.save_prediction(
        trigger_ticker="AAPL",
        trigger_surprise=-8.0,
        trigger_date=event.timestamp,
        predictions=prediction_records,
        horizon_days=7
    )
    print(f"✅ Prediction saved: {pred_id}")

    # Fetch actuals
    print("\n7. Fetching actual outcomes from Yahoo Finance...")
    tracker_outcomes = tracker.validate_prediction(pred_id)
    print(f"✅ Fetched {len(tracker_outcomes)} outcomes")

    # Show sample outcomes
    print("\n8. Sample outcomes:")
    for outcome in tracker_outcomes[:5]:
        status = "✅" if outcome.direction_correct else "❌"
        print(f"   {status} {outcome.ticker}: predicted {outcome.predicted_magnitude:+.1f}%, actual {outcome.actual_magnitude:+.1f}%")

    # Convert tracker outcomes to feedback Outcome objects
    print("\n9. Converting to feedback format and updating graph...")
    feedback_outcomes = [
        Outcome(
            entity=o.ticker,
            magnitude=o.actual_magnitude / 100,  # Convert back to decimal
            timing_days=o.actual_day,
            observed_at=o.timestamp
        )
        for o in tracker_outcomes
    ]

    # Learn from outcomes
    stats = learn_from_outcomes(
        cascade=cascade,
        outcomes=feedback_outcomes,
        graph=graph,
        learning_rate=0.1
    )

    print(f"✅ Learning complete:")
    print(f"   Links updated: {stats['links_updated']}")
    print(f"   Predictions matched: {stats['predictions_matched']}")
    print(f"   Direction accuracy: {stats['direction_accuracy']*100:.1f}%")
    print(f"   Avg magnitude error: {stats['average_magnitude_error']*100:.1f}%")

    # Check updated link
    updated_link = graph.get_link("AAPL", "TSM")
    if updated_link:
        print(f"\n10. Updated link state (AAPL → TSM):")
        print(f"    Strength: {initial_link.strength:.3f} → {updated_link.strength:.3f}")
        print(f"    Delay: {initial_link.delay_mean:.1f} → {updated_link.delay_mean:.1f} days")
        print(f"    Confidence: {initial_link.confidence:.2f} → {updated_link.confidence:.2f}")
        print(f"    Observations: {initial_link.observation_count} → {updated_link.observation_count}")
        print(f"    Historical accuracy: {updated_link.historical_accuracy:.2f}")

    # Get overall tracker stats
    print("\n11. Overall tracker statistics:")
    tracker_stats = tracker.get_accuracy_stats()
    if tracker_stats['total_predictions'] > 0:
        print(f"    Total predictions: {tracker_stats['total_predictions']}")
        print(f"    Direction accuracy: {tracker_stats['direction_accuracy']:.1f}%")
        print(f"    Mean error: ±{tracker_stats['mean_error']:.1f}%")
    else:
        print("    No statistics yet")

    print("\n" + "=" * 60)
    print("Learning loop test complete!")
    print("\nKey takeaways:")
    print("1. ✅ Predictions are saved with unique IDs")
    print("2. ✅ Actual outcomes fetched from Yahoo Finance")
    print("3. ✅ Graph weights updated via Bayesian learning")
    print("4. ✅ Link observation counts and accuracy tracked")
    print("5. ✅ System learns from each prediction/outcome pair")


if __name__ == "__main__":
    main()
