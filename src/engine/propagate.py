"""Core cascade propagation engine."""

import random
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from src.core.graph import CausalGraph, CausalLink


@dataclass
class Event:
    """
    A triggering event that starts a cascade.

    Examples:
    - Earnings miss: entity="AAPL", magnitude=-0.08 (8% miss)
    - Fed rate hike: entity="FED_RATE", magnitude=0.25 (25 bps)
    """

    entity: str  # Entity ID where event occurs
    magnitude: float  # Size of the event (positive = beat, negative = miss)
    event_type: str = "earnings"  # Type of event
    timestamp: datetime = field(default_factory=datetime.now)
    description: str = ""

    def __repr__(self) -> str:
        sign = "+" if self.magnitude > 0 else ""
        return f"Event({self.entity}: {sign}{self.magnitude*100:.1f}%)"


@dataclass
class Effect:
    """
    A predicted effect in the cascade.

    Tracks the magnitude, timing, confidence, and causal chain
    that led to this effect.
    """

    entity: str  # Affected entity
    magnitude: float  # Expected price change (as decimal, e.g., -0.05 = -5%)
    day: float  # Days after trigger when effect materializes
    confidence: float  # Confidence in this prediction (0-1)
    cause_chain: list[Any] = field(default_factory=list)  # Sequence of links/events

    # Additional metadata
    order: int = 1  # 1st order, 2nd order, etc.
    relationship_type: str = ""
    explanation: str = ""

    @property
    def magnitude_percent(self) -> float:
        """Magnitude as percentage."""
        return self.magnitude * 100

    @property
    def magnitude_range(self) -> tuple[float, float]:
        """
        Estimated range based on confidence.
        Lower confidence = wider range.
        """
        # Width inversely proportional to confidence
        width = abs(self.magnitude) * (1 - self.confidence) * 0.5
        return (
            (self.magnitude - width) * 100,
            (self.magnitude + width) * 100,
        )

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        low, high = self.magnitude_range
        return {
            "entity": self.entity,
            "magnitude_percent": round(self.magnitude_percent, 2),
            "magnitude_range": [round(low, 2), round(high, 2)],
            "day": round(self.day, 1),
            "confidence": round(self.confidence, 3),
            "order": self.order,
            "relationship_type": self.relationship_type,
            "explanation": self.explanation,
        }

    def __repr__(self) -> str:
        sign = "+" if self.magnitude > 0 else ""
        return (
            f"Effect({self.entity}: {sign}{self.magnitude*100:.1f}%, "
            f"day={self.day:.1f}, conf={self.confidence:.2f})"
        )


@dataclass
class Cascade:
    """
    A complete cascade of effects from an event.

    Contains all predicted effects organized by timing and order.
    """

    trigger: Event
    effects: list[Effect]
    horizon_days: int

    # Computed properties
    _by_day: dict[int, list[Effect]] = field(default_factory=dict, repr=False)
    _by_entity: dict[str, list[Effect]] = field(default_factory=dict, repr=False)
    _by_order: dict[int, list[Effect]] = field(default_factory=dict, repr=False)

    def __post_init__(self):
        """Organize effects after initialization."""
        self._by_day = defaultdict(list)
        self._by_entity = defaultdict(list)
        self._by_order = defaultdict(list)

        for effect in self.effects:
            day_bucket = int(effect.day)
            self._by_day[day_bucket].append(effect)
            self._by_entity[effect.entity].append(effect)
            self._by_order[effect.order].append(effect)

    def get_effects_by_day(self, day: int) -> list[Effect]:
        """Get all effects for a specific day."""
        return self._by_day.get(day, [])

    def get_effects_for_entity(self, entity: str) -> list[Effect]:
        """Get all effects for a specific entity."""
        return self._by_entity.get(entity, [])

    def get_effects_by_order(self, order: int) -> list[Effect]:
        """Get all nth-order effects."""
        return self._by_order.get(order, [])

    def get_timeline(self) -> dict[str, list[Effect]]:
        """
        Get effects organized as a timeline.

        Returns dict with keys like "Day 0", "Day 1-2", etc.
        """
        timeline = {}

        # Group by time periods
        periods = [
            (0, 0, "Hour 0-4"),
            (1, 1, "Day 1"),
            (2, 3, "Day 2-3"),
            (4, 7, "Day 4-7"),
            (8, 14, "Day 7-14"),
            (15, 30, "Day 15-30"),
        ]

        for start, end, label in periods:
            period_effects = []
            for day in range(start, end + 1):
                period_effects.extend(self._by_day.get(day, []))

            if period_effects:
                # Sort by confidence (highest first)
                period_effects.sort(key=lambda e: e.confidence, reverse=True)
                timeline[label] = period_effects

        return timeline

    @property
    def first_order_effects(self) -> list[Effect]:
        """Direct effects from the trigger."""
        return self._by_order.get(1, [])

    @property
    def second_order_effects(self) -> list[Effect]:
        """Effects one hop from trigger."""
        return self._by_order.get(2, [])

    @property
    def third_order_effects(self) -> list[Effect]:
        """Effects two hops from trigger."""
        return self._by_order.get(3, [])

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "trigger": {
                "entity": self.trigger.entity,
                "magnitude_percent": self.trigger.magnitude * 100,
                "event_type": self.trigger.event_type,
                "description": self.trigger.description,
            },
            "horizon_days": self.horizon_days,
            "total_effects": len(self.effects),
            "effects_by_order": {
                f"order_{k}": len(v) for k, v in self._by_order.items()
            },
            "timeline": {
                period: [e.to_dict() for e in effects]
                for period, effects in self.get_timeline().items()
            },
        }

    def summary(self) -> str:
        """Get a text summary of the cascade."""
        lines = [
            f"Cascade from {self.trigger}",
            f"=" * 50,
            f"Horizon: {self.horizon_days} days",
            f"Total effects: {len(self.effects)}",
            "",
        ]

        for period, effects in self.get_timeline().items():
            lines.append(f"{period}:")
            for effect in effects[:5]:  # Top 5 per period
                sign = "+" if effect.magnitude > 0 else ""
                lines.append(
                    f"  {effect.entity}: {sign}{effect.magnitude*100:.1f}% "
                    f"(conf: {effect.confidence:.2f})"
                )
            if len(effects) > 5:
                lines.append(f"  ... and {len(effects) - 5} more")
            lines.append("")

        return "\n".join(lines)


def propagate(
    event: Event,
    graph: CausalGraph,
    horizon_days: int = 14,
    min_confidence: float = 0.1,
    min_magnitude: float = 0.005,  # 0.5% minimum effect
    max_order: int = 5,
) -> Cascade:
    """
    Propagate an event through the causal graph.

    Uses BFS to traverse the graph, calculating cascading effects
    at each hop with diminishing confidence and magnitude.

    Args:
        event: The triggering event
        graph: The causal graph to propagate through
        horizon_days: Maximum days to project
        min_confidence: Stop propagating below this confidence
        min_magnitude: Stop propagating below this magnitude
        max_order: Maximum hops from trigger

    Returns:
        Cascade object with all predicted effects
    """
    effects = []
    visited = set()

    # Queue: (entity, current_magnitude, current_day, current_confidence, order, chain)
    queue = [(event.entity, event.magnitude, 0.0, 1.0, 0, [event])]

    while queue:
        entity, magnitude, day, confidence, order, chain = queue.pop(0)

        # Skip if already processed this entity at similar magnitude
        visit_key = (entity, round(magnitude, 3))
        if visit_key in visited:
            continue
        visited.add(visit_key)

        # Skip trigger entity for effects list (it's the cause, not effect)
        if order > 0:
            effects.append(
                Effect(
                    entity=entity,
                    magnitude=magnitude,
                    day=day,
                    confidence=confidence,
                    cause_chain=chain.copy(),
                    order=order,
                )
            )

        # Stop conditions
        if order >= max_order:
            continue
        if confidence < min_confidence:
            continue
        if abs(magnitude) < min_magnitude:
            continue
        if day > horizon_days:
            continue

        # Propagate to connected entities
        for link in graph.get_outgoing(entity):
            # Calculate propagated values
            new_magnitude = link.propagate_magnitude(magnitude)
            new_confidence = link.propagate_confidence(confidence)
            new_day = day + link.sample_delay()

            # Skip if below thresholds
            if abs(new_magnitude) < min_magnitude:
                continue
            if new_confidence < min_confidence:
                continue
            if new_day > horizon_days:
                continue

            queue.append((
                link.target,
                new_magnitude,
                new_day,
                new_confidence,
                order + 1,
                chain + [link],
            ))

    # Sort effects by day, then by confidence
    effects.sort(key=lambda e: (e.day, -e.confidence))

    return Cascade(trigger=event, effects=effects, horizon_days=horizon_days)


def propagate_with_explanation(
    event: Event,
    graph: CausalGraph,
    horizon_days: int = 14,
) -> Cascade:
    """
    Propagate with detailed explanations for each effect.

    Same as propagate() but adds human-readable explanations
    to each effect based on the causal chain.
    """
    cascade = propagate(event, graph, horizon_days)

    # Add explanations to each effect
    for effect in cascade.effects:
        effect.explanation = _generate_explanation(effect, graph)

    return cascade


def _generate_explanation(effect: Effect, graph: CausalGraph) -> str:
    """Generate a human-readable explanation for an effect."""
    if not effect.cause_chain:
        return ""

    parts = []

    # Start with the trigger
    trigger = effect.cause_chain[0]
    if isinstance(trigger, Event):
        sign = "beat" if trigger.magnitude > 0 else "miss"
        parts.append(
            f"{trigger.entity} earnings {sign} of {abs(trigger.magnitude)*100:.1f}%"
        )

    # Add each link in the chain
    for item in effect.cause_chain[1:]:
        if isinstance(item, CausalLink):
            source_entity = graph.get_entity(item.source)
            target_entity = graph.get_entity(item.target)

            source_name = source_entity.name if source_entity else item.source
            target_name = target_entity.name if target_entity else item.target

            relationship = item.relationship_type.replace("_", " ")
            parts.append(f"{source_name} → {target_name} ({relationship})")

    if not parts:
        return ""

    # Build the explanation
    explanation = " → ".join(parts)

    # Add confidence note
    if effect.confidence < 0.5:
        explanation += " [lower confidence due to indirect relationship]"

    return explanation


def create_earnings_event(
    ticker: str,
    surprise_percent: float,
    description: str = "",
) -> Event:
    """
    Create an earnings event.

    Args:
        ticker: Stock ticker
        surprise_percent: Earnings surprise as percentage (e.g., -8 for 8% miss)
        description: Optional description

    Returns:
        Event object
    """
    return Event(
        entity=ticker,
        magnitude=surprise_percent / 100,  # Convert to decimal
        event_type="earnings",
        description=description or f"{ticker} earnings {'beat' if surprise_percent > 0 else 'miss'} of {abs(surprise_percent):.1f}%",
    )


def simulate_cascade(
    event: Event,
    graph: CausalGraph,
    num_simulations: int = 100,
    horizon_days: int = 14,
) -> dict[str, dict[str, float]]:
    """
    Run Monte Carlo simulation of cascade effects.

    Accounts for uncertainty in delay timing by running multiple
    simulations and aggregating results.

    Args:
        event: Triggering event
        graph: Causal graph
        num_simulations: Number of simulation runs
        horizon_days: Projection horizon

    Returns:
        Dict mapping entity -> {mean, std, p5, p95} of effects
    """
    # Collect effects across simulations
    entity_effects: dict[str, list[float]] = defaultdict(list)

    for _ in range(num_simulations):
        cascade = propagate(event, graph, horizon_days)
        for effect in cascade.effects:
            entity_effects[effect.entity].append(effect.magnitude)

    # Aggregate results
    results = {}
    for entity, magnitudes in entity_effects.items():
        import numpy as np

        magnitudes = np.array(magnitudes)
        results[entity] = {
            "mean": float(np.mean(magnitudes)),
            "std": float(np.std(magnitudes)),
            "p5": float(np.percentile(magnitudes, 5)),
            "p95": float(np.percentile(magnitudes, 95)),
            "occurrences": len(magnitudes),
            "probability": len(magnitudes) / num_simulations,
        }

    return results
