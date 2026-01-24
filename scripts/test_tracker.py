#!/usr/bin/env python3
"""Test the prediction tracking system.

This script:
1. Creates a sample prediction
2. Saves it to disk
3. Validates it against actual outcomes
4. Shows accuracy statistics
"""

from datetime import datetime, timedelta
from src.learning.tracker import PredictionTracker, PredictionRecord


def main():
    """Test prediction tracking."""
    print("Prediction Tracking System Test")
    print("=" * 60)

    tracker = PredictionTracker()

    # Example: AAPL earnings miss on Jan 1, 2025
    # Predicted cascades to TSMC, QCOM, SWKS
    trigger_date = datetime(2025, 1, 1)

    predictions = [
        PredictionRecord(
            ticker="TSM",
            predicted_magnitude=-2.5,  # Predict 2.5% drop
            predicted_day=1.0,
            confidence=0.75,
            order=1
        ),
        PredictionRecord(
            ticker="QCOM",
            predicted_magnitude=-1.8,
            predicted_day=0.5,
            confidence=0.72,
            order=1
        ),
        PredictionRecord(
            ticker="SWKS",
            predicted_magnitude=-3.2,
            predicted_day=0.5,
            confidence=0.78,
            order=1
        ),
    ]

    # Save prediction
    print("\n1. Saving prediction...")
    pred_id = tracker.save_prediction(
        trigger_ticker="AAPL",
        trigger_surprise=-8.0,  # 8% earnings miss
        trigger_date=trigger_date,
        predictions=predictions,
        horizon_days=7
    )

    print(f"✅ Saved prediction: {pred_id}")
    print(f"   Trigger: AAPL -8% on {trigger_date.date()}")
    print(f"   Predicted {len(predictions)} cascading effects")

    # Simulate validation (only if enough time has passed)
    print("\n2. Checking if ready for validation...")
    pending = tracker.get_pending_predictions()

    if pred_id in pending:
        print(f"✅ Prediction is ready for validation")

        print("\n3. Fetching actual outcomes from Yahoo Finance...")
        outcomes = tracker.validate_prediction(pred_id)

        print(f"✅ Validated {len(outcomes)} predictions")

        print("\n4. Results:")
        print("-" * 60)
        for outcome in outcomes:
            status = "✅" if outcome.direction_correct else "❌"
            print(f"\n{status} {outcome.ticker}:")
            print(f"   Predicted: {outcome.predicted_magnitude:+.1f}% on day {outcome.predicted_day}")
            print(f"   Actual:    {outcome.actual_magnitude:+.1f}% on day {outcome.actual_day}")
            print(f"   Error:     {outcome.error:.1f}%")
            print(f"   Direction: {'Correct' if outcome.direction_correct else 'Wrong'}")

    else:
        print(f"⏳ Prediction not ready yet (need to wait {7} days from trigger)")
        print(f"   Current date is later than trigger, but checking pending logic...")

        # For demo purposes, manually validate
        print("\n3. Manually validating (demo mode)...")
        try:
            outcomes = tracker.validate_prediction(pred_id)
            print(f"✅ Validated {len(outcomes)} predictions")

            print("\n4. Results:")
            print("-" * 60)
            for outcome in outcomes:
                status = "✅" if outcome.direction_correct else "❌"
                print(f"\n{status} {outcome.ticker}:")
                print(f"   Predicted: {outcome.predicted_magnitude:+.1f}% on day {outcome.predicted_day}")
                print(f"   Actual:    {outcome.actual_magnitude:+.1f}% on day {outcome.actual_day}")
                print(f"   Error:     {outcome.error:.1f}%")
                print(f"   Direction: {'Correct' if outcome.direction_correct else 'Wrong'}")

        except Exception as e:
            print(f"⚠️  Could not validate: {e}")
            print("   (This is expected if the date is too far in the past for Yahoo Finance)")

    # Show overall stats
    print("\n5. Overall Accuracy Statistics:")
    print("-" * 60)
    stats = tracker.get_accuracy_stats()

    if stats['total_predictions'] > 0:
        print(f"Total Predictions: {stats['total_predictions']}")
        print(f"Direction Accuracy: {stats['direction_accuracy']:.1f}%")
        print(f"Mean Error: ±{stats['mean_error']:.1f}%")
        print(f"Within Confidence Bounds: {stats['within_bounds_pct']:.1f}%")
    else:
        print("No validated predictions yet")

    print("\n" + "=" * 60)
    print("Test complete!")
    print(f"Predictions saved to: data/predictions/predictions/")
    print(f"Outcomes saved to: data/predictions/outcomes/")


if __name__ == "__main__":
    main()
