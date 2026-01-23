"""Accuracy and calibration metrics for cascade predictions."""

from dataclasses import dataclass
from typing import Any
import numpy as np


@dataclass
class AccuracyMetrics:
    """Accuracy metrics for a set of predictions."""

    # Direction accuracy (did we get the direction right?)
    direction_accuracy: float

    # Magnitude accuracy (how close were we?)
    magnitude_mae: float  # Mean absolute error
    magnitude_mape: float  # Mean absolute percentage error

    # Timing accuracy
    timing_mae: float  # Mean absolute error in days

    # Confidence calibration
    calibration_error: float  # How well-calibrated are confidence scores

    # Sample size
    n_predictions: int

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "direction_accuracy": round(self.direction_accuracy, 4),
            "magnitude_mae": round(self.magnitude_mae, 4),
            "magnitude_mape": round(self.magnitude_mape, 4),
            "timing_mae": round(self.timing_mae, 4),
            "calibration_error": round(self.calibration_error, 4),
            "n_predictions": self.n_predictions,
        }

    def summary(self) -> str:
        """Get text summary of metrics."""
        return (
            f"Accuracy Metrics (n={self.n_predictions}):\n"
            f"  Direction accuracy: {self.direction_accuracy:.1%}\n"
            f"  Magnitude MAE: {self.magnitude_mae:.2%}\n"
            f"  Magnitude MAPE: {self.magnitude_mape:.1%}\n"
            f"  Timing MAE: {self.timing_mae:.1f} days\n"
            f"  Calibration error: {self.calibration_error:.3f}"
        )


def calculate_accuracy(
    predictions: list[dict],
    actuals: list[dict],
) -> AccuracyMetrics:
    """
    Calculate accuracy metrics comparing predictions to actuals.

    Args:
        predictions: List of prediction dicts with keys:
            - entity: ticker
            - magnitude: predicted change (decimal)
            - day: predicted timing
            - confidence: prediction confidence
        actuals: List of actual outcome dicts with keys:
            - entity: ticker
            - magnitude: actual change (decimal)
            - day: when it occurred

    Returns:
        AccuracyMetrics object
    """
    if not predictions or not actuals:
        return AccuracyMetrics(
            direction_accuracy=0,
            magnitude_mae=0,
            magnitude_mape=0,
            timing_mae=0,
            calibration_error=0,
            n_predictions=0,
        )

    # Match predictions to actuals by entity
    matched = []
    for pred in predictions:
        for actual in actuals:
            if pred["entity"] == actual["entity"]:
                matched.append((pred, actual))
                break

    if not matched:
        return AccuracyMetrics(
            direction_accuracy=0,
            magnitude_mae=0,
            magnitude_mape=0,
            timing_mae=0,
            calibration_error=0,
            n_predictions=0,
        )

    # Calculate metrics
    direction_correct = 0
    magnitude_errors = []
    magnitude_pct_errors = []
    timing_errors = []

    for pred, actual in matched:
        pred_mag = pred["magnitude"]
        actual_mag = actual["magnitude"]

        # Direction accuracy
        if (pred_mag > 0 and actual_mag > 0) or (pred_mag < 0 and actual_mag < 0):
            direction_correct += 1

        # Magnitude errors
        magnitude_errors.append(abs(pred_mag - actual_mag))
        if actual_mag != 0:
            magnitude_pct_errors.append(abs(pred_mag - actual_mag) / abs(actual_mag))

        # Timing errors
        if "day" in pred and "day" in actual:
            timing_errors.append(abs(pred["day"] - actual["day"]))

    n = len(matched)

    return AccuracyMetrics(
        direction_accuracy=direction_correct / n if n > 0 else 0,
        magnitude_mae=np.mean(magnitude_errors) if magnitude_errors else 0,
        magnitude_mape=np.mean(magnitude_pct_errors) if magnitude_pct_errors else 0,
        timing_mae=np.mean(timing_errors) if timing_errors else 0,
        calibration_error=0,  # Calculated separately
        n_predictions=n,
    )


def calculate_calibration(
    predictions: list[dict],
    actuals: list[dict],
    num_bins: int = 10,
) -> tuple[float, dict]:
    """
    Calculate calibration error for confidence scores.

    A well-calibrated model has predictions with 80% confidence
    that are correct 80% of the time.

    Args:
        predictions: List of predictions with confidence scores
        actuals: List of actual outcomes
        num_bins: Number of confidence bins

    Returns:
        Tuple of (calibration_error, bin_details)
    """
    if not predictions or not actuals:
        return 0.0, {}

    # Match predictions to actuals
    results = []
    for pred in predictions:
        for actual in actuals:
            if pred["entity"] == actual["entity"]:
                # Determine if prediction was "correct" (direction match)
                correct = (
                    (pred["magnitude"] > 0 and actual["magnitude"] > 0) or
                    (pred["magnitude"] < 0 and actual["magnitude"] < 0)
                )
                results.append({
                    "confidence": pred.get("confidence", 0.5),
                    "correct": correct,
                })
                break

    if not results:
        return 0.0, {}

    # Bin by confidence
    bins = np.linspace(0, 1, num_bins + 1)
    bin_details = {}
    errors = []

    for i in range(num_bins):
        bin_low, bin_high = bins[i], bins[i + 1]
        bin_results = [
            r for r in results
            if bin_low <= r["confidence"] < bin_high
        ]

        if bin_results:
            expected_accuracy = (bin_low + bin_high) / 2
            actual_accuracy = sum(r["correct"] for r in bin_results) / len(bin_results)
            error = abs(expected_accuracy - actual_accuracy)
            errors.append(error)

            bin_details[f"{bin_low:.1f}-{bin_high:.1f}"] = {
                "expected": expected_accuracy,
                "actual": actual_accuracy,
                "count": len(bin_results),
                "error": error,
            }

    calibration_error = np.mean(errors) if errors else 0.0
    return calibration_error, bin_details


def calculate_metrics_by_order(
    predictions: list[dict],
    actuals: list[dict],
) -> dict[int, AccuracyMetrics]:
    """
    Calculate accuracy metrics broken down by prediction order.

    Args:
        predictions: List of predictions with 'order' field
        actuals: List of actual outcomes

    Returns:
        Dict mapping order -> AccuracyMetrics
    """
    # Group predictions by order
    by_order = {}
    for pred in predictions:
        order = pred.get("order", 1)
        if order not in by_order:
            by_order[order] = []
        by_order[order].append(pred)

    # Calculate metrics for each order
    metrics = {}
    for order, order_preds in by_order.items():
        metrics[order] = calculate_accuracy(order_preds, actuals)

    return metrics


def format_metrics_report(
    metrics: AccuracyMetrics,
    by_order: dict[int, AccuracyMetrics] | None = None,
    calibration: tuple[float, dict] | None = None,
) -> str:
    """Format a complete metrics report."""
    lines = [
        "=" * 60,
        "PREDICTION ACCURACY REPORT",
        "=" * 60,
        "",
        metrics.summary(),
    ]

    if by_order:
        lines.extend([
            "",
            "Accuracy by Order:",
            "-" * 40,
        ])
        for order, order_metrics in sorted(by_order.items()):
            order_suffix = {1: "st", 2: "nd", 3: "rd"}.get(order, "th")
            lines.append(
                f"  {order}{order_suffix} order: "
                f"Direction {order_metrics.direction_accuracy:.1%}, "
                f"Magnitude MAE {order_metrics.magnitude_mae:.2%}, "
                f"n={order_metrics.n_predictions}"
            )

    if calibration:
        cal_error, cal_bins = calibration
        lines.extend([
            "",
            f"Calibration Error: {cal_error:.3f}",
            "Calibration by Confidence Bin:",
        ])
        for bin_range, details in cal_bins.items():
            lines.append(
                f"  {bin_range}: expected {details['expected']:.1%}, "
                f"actual {details['actual']:.1%} (n={details['count']})"
            )

    return "\n".join(lines)
