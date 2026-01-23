"""Feedback loop for learning from outcomes."""

from dataclasses import dataclass
from datetime import datetime
from typing import Any
import math

from ..graph import CausalGraph, CausalLink
from ..engine import Effect, Cascade


@dataclass
class Outcome:
    """An observed outcome for an entity."""

    entity: str
    magnitude: float  # Actual price change (decimal)
    timing_days: float  # When it occurred (days after trigger)
    observed_at: datetime


@dataclass
class PredictionOutcome:
    """A prediction paired with its actual outcome."""

    effect: Effect
    outcome: Outcome
    direction_correct: bool
    magnitude_error: float
    timing_error: float


def compare_prediction_to_outcome(
    effect: Effect,
    outcome: Outcome,
) -> PredictionOutcome:
    """
    Compare a predicted effect to an actual outcome.

    Args:
        effect: The predicted effect
        outcome: The actual observed outcome

    Returns:
        PredictionOutcome with comparison metrics
    """
    # Direction accuracy
    direction_correct = (
        (effect.magnitude > 0 and outcome.magnitude > 0) or
        (effect.magnitude < 0 and outcome.magnitude < 0) or
        (effect.magnitude == 0 and outcome.magnitude == 0)
    )

    # Magnitude error (absolute)
    magnitude_error = abs(effect.magnitude - outcome.magnitude)

    # Timing error (days)
    timing_error = abs(effect.day - outcome.timing_days)

    return PredictionOutcome(
        effect=effect,
        outcome=outcome,
        direction_correct=direction_correct,
        magnitude_error=magnitude_error,
        timing_error=timing_error,
    )


def learn_from_outcomes(
    cascade: Cascade,
    outcomes: list[Outcome],
    graph: CausalGraph,
    learning_rate: float = 0.1,
) -> dict[str, Any]:
    """
    Update graph weights based on observed outcomes.

    Uses Bayesian-style updates to adjust:
    - Link strengths (based on magnitude accuracy)
    - Link delays (based on timing accuracy)
    - Link confidences (based on overall accuracy)

    Args:
        cascade: The cascade that generated predictions
        outcomes: List of observed outcomes
        graph: The causal graph to update (modified in place)
        learning_rate: How much to adjust weights (0-1)

    Returns:
        Dict with update statistics
    """
    stats = {
        "links_updated": 0,
        "predictions_matched": 0,
        "average_magnitude_error": 0,
        "average_timing_error": 0,
        "direction_accuracy": 0,
    }

    # Match predictions to outcomes
    matched = []
    outcomes_by_entity = {o.entity: o for o in outcomes}

    for effect in cascade.effects:
        if effect.entity in outcomes_by_entity:
            outcome = outcomes_by_entity[effect.entity]
            comparison = compare_prediction_to_outcome(effect, outcome)
            matched.append(comparison)

    if not matched:
        return stats

    stats["predictions_matched"] = len(matched)
    stats["direction_accuracy"] = sum(m.direction_correct for m in matched) / len(matched)
    stats["average_magnitude_error"] = sum(m.magnitude_error for m in matched) / len(matched)
    stats["average_timing_error"] = sum(m.timing_error for m in matched) / len(matched)

    # Update links involved in each prediction
    for comparison in matched:
        effect = comparison.effect

        # Extract links from the causal chain
        for item in effect.cause_chain:
            if isinstance(item, CausalLink):
                # Find this link in the graph
                graph_link = graph.get_link(item.source, item.target)
                if graph_link:
                    _update_link(
                        graph_link,
                        comparison,
                        learning_rate,
                    )
                    stats["links_updated"] += 1

    return stats


def _update_link(
    link: CausalLink,
    comparison: PredictionOutcome,
    learning_rate: float,
) -> None:
    """
    Update a single link based on prediction outcome.

    Args:
        link: The link to update
        comparison: The prediction/outcome comparison
        learning_rate: Learning rate for updates
    """
    # Update strength based on magnitude accuracy
    if comparison.outcome.magnitude != 0:
        # Calculate how well the strength predicted the outcome
        predicted_contribution = abs(comparison.effect.magnitude)
        actual_contribution = abs(comparison.outcome.magnitude)

        if predicted_contribution > 0:
            ratio = actual_contribution / predicted_contribution

            # If actual was larger than predicted, increase strength
            # If actual was smaller, decrease strength
            # But cap the adjustment
            adjustment = (ratio - 1.0) * learning_rate
            adjustment = max(-0.1, min(0.1, adjustment))  # Cap at ±10%

            new_strength = link.strength * (1 + adjustment)
            link.strength = max(0.01, min(0.99, new_strength))

    # Update delay based on timing accuracy
    if comparison.timing_error > 0:
        # Adjust delay estimate toward actual timing
        actual_delay = comparison.outcome.timing_days
        delay_diff = actual_delay - link.delay_mean

        link.delay_mean += delay_diff * learning_rate
        link.delay_mean = max(0.1, link.delay_mean)  # Keep positive

        # Also adjust std based on error
        if comparison.timing_error > link.delay_std:
            link.delay_std *= (1 + learning_rate * 0.5)
        else:
            link.delay_std *= (1 - learning_rate * 0.2)
        link.delay_std = max(0.1, min(link.delay_mean, link.delay_std))

    # Update confidence based on direction accuracy
    if comparison.direction_correct:
        # Increase confidence slightly
        link.confidence = min(0.99, link.confidence + 0.02 * learning_rate)
    else:
        # Decrease confidence
        link.confidence = max(0.1, link.confidence - 0.05 * learning_rate)

    # Update observation count and historical accuracy
    link.observation_count += 1

    alpha = 1.0 / (link.observation_count + 1)  # Decreasing learning rate
    accuracy = 1.0 - min(1.0, comparison.magnitude_error / max(0.01, abs(comparison.outcome.magnitude)))
    link.historical_accuracy = (1 - alpha) * link.historical_accuracy + alpha * accuracy

    # Update timestamp
    link.last_updated = datetime.now().isoformat()


def update_graph_from_backtest(
    graph: CausalGraph,
    backtest_results: list,  # List of BacktestResult
    learning_rate: float = 0.05,
) -> dict[str, Any]:
    """
    Update graph from a batch of backtest results.

    Args:
        graph: The causal graph to update
        backtest_results: List of BacktestResult objects
        learning_rate: Learning rate for updates

    Returns:
        Aggregate statistics
    """
    total_stats = {
        "events_processed": 0,
        "total_links_updated": 0,
        "total_predictions_matched": 0,
        "average_direction_accuracy": 0,
    }

    direction_accuracies = []

    for result in backtest_results:
        # Convert actuals to Outcome objects
        outcomes = [
            Outcome(
                entity=a["entity"],
                magnitude=a["magnitude"],
                timing_days=a.get("day", 5),
                observed_at=result.event_date,
            )
            for a in result.actuals
        ]

        # Learn from this cascade
        stats = learn_from_outcomes(
            result.cascade,
            outcomes,
            graph,
            learning_rate,
        )

        total_stats["events_processed"] += 1
        total_stats["total_links_updated"] += stats["links_updated"]
        total_stats["total_predictions_matched"] += stats["predictions_matched"]

        if stats["predictions_matched"] > 0:
            direction_accuracies.append(stats["direction_accuracy"])

    if direction_accuracies:
        total_stats["average_direction_accuracy"] = sum(direction_accuracies) / len(direction_accuracies)

    return total_stats


def get_link_history(link: CausalLink) -> dict[str, Any]:
    """Get learning history for a link."""
    return {
        "source": link.source,
        "target": link.target,
        "current_strength": link.strength,
        "current_confidence": link.confidence,
        "current_delay": link.delay_mean,
        "observation_count": link.observation_count,
        "historical_accuracy": link.historical_accuracy,
        "last_updated": link.last_updated,
    }


def reset_link_learning(link: CausalLink) -> None:
    """Reset learning history for a link (keep initial values)."""
    link.observation_count = 0
    link.historical_accuracy = 0.5
    link.last_updated = None
