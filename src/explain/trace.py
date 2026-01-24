"""Causal chain tracing and explanation generation."""

from dataclasses import dataclass, field
from typing import Any

from src.core.graph import CausalGraph, CausalLink
from ..engine import Event, Effect, Cascade


@dataclass
class CausalStep:
    """A single step in a causal chain."""

    from_entity: str
    to_entity: str
    relationship: str
    strength: float
    delay_days: float
    confidence: float
    evidence: list[str]
    explanation: str


@dataclass
class CausalExplanation:
    """
    Complete explanation of a predicted effect.

    Includes the full causal chain and natural language explanation.
    """

    effect: Effect
    trigger: Event
    steps: list[CausalStep]
    narrative: str
    confidence_factors: dict[str, float]

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "effect": self.effect.to_dict(),
            "trigger": {
                "entity": self.trigger.entity,
                "magnitude_percent": self.trigger.magnitude * 100,
                "event_type": self.trigger.event_type,
            },
            "steps": [
                {
                    "from": step.from_entity,
                    "to": step.to_entity,
                    "relationship": step.relationship,
                    "strength": step.strength,
                    "delay_days": step.delay_days,
                    "confidence": step.confidence,
                    "evidence": step.evidence,
                    "explanation": step.explanation,
                }
                for step in self.steps
            ],
            "narrative": self.narrative,
            "confidence_factors": self.confidence_factors,
        }


def trace_causal_chain(effect: Effect, graph: CausalGraph) -> list[CausalStep]:
    """
    Trace the causal chain that led to an effect.

    Args:
        effect: The effect to trace
        graph: The causal graph

    Returns:
        List of CausalStep objects representing the chain
    """
    steps = []

    for item in effect.cause_chain:
        if isinstance(item, CausalLink):
            source_entity = graph.get_entity(item.source)
            target_entity = graph.get_entity(item.target)

            source_name = source_entity.name if source_entity else item.source
            target_name = target_entity.name if target_entity else item.target

            step = CausalStep(
                from_entity=item.source,
                to_entity=item.target,
                relationship=item.relationship.value,
                strength=item.strength,
                delay_days=item.delay_mean,
                confidence=item.confidence,
                evidence=item.evidence,
                explanation=_step_explanation(item, source_name, target_name),
            )
            steps.append(step)

    return steps


def _step_explanation(link: CausalLink, source_name: str, target_name: str) -> str:
    """Generate explanation for a single causal step."""
    relationship = link.relationship.value.replace("_", " ")

    if "supplier" in relationship or "customer" in relationship:
        return (
            f"{target_name} is a {relationship} {source_name}. "
            f"A {link.strength*100:.0f}% revenue dependency means significant exposure "
            f"to {source_name}'s performance."
        )
    elif "sector" in relationship:
        return (
            f"{source_name} is a component of {target_name} ETF. "
            f"Movements typically propagate within {link.delay_mean:.1f} days."
        )
    elif "competes" in relationship:
        return (
            f"{source_name} competes with {target_name}. "
            f"Weakness in one may benefit or concern the other."
        )
    else:
        return (
            f"{source_name} has a {relationship} relationship with {target_name}."
        )


def explain_effect(
    effect: Effect,
    cascade: Cascade,
    graph: CausalGraph,
) -> CausalExplanation:
    """
    Generate a complete explanation for an effect.

    Args:
        effect: The effect to explain
        cascade: The cascade containing this effect
        graph: The causal graph

    Returns:
        CausalExplanation with full details
    """
    steps = trace_causal_chain(effect, graph)
    narrative = generate_narrative(effect, cascade.trigger, steps, graph)

    # Calculate confidence factors
    confidence_factors = {
        "base_confidence": cascade.trigger.magnitude if cascade.trigger else 1.0,
        "chain_length_penalty": 0.9 ** (effect.order - 1),
        "relationship_confidence": min(s.confidence for s in steps) if steps else 1.0,
        "final_confidence": effect.confidence,
    }

    return CausalExplanation(
        effect=effect,
        trigger=cascade.trigger,
        steps=steps,
        narrative=narrative,
        confidence_factors=confidence_factors,
    )


def generate_narrative(
    effect: Effect,
    trigger: Event,
    steps: list[CausalStep],
    graph: CausalGraph,
) -> str:
    """
    Generate a natural language narrative explaining the causal chain.

    Args:
        effect: The predicted effect
        trigger: The triggering event
        steps: Causal chain steps
        graph: The causal graph

    Returns:
        Human-readable narrative
    """
    if not trigger:
        return "Unable to generate narrative: missing trigger event."

    trigger_entity = graph.get_entity(trigger.entity)
    effect_entity = graph.get_entity(effect.entity)

    trigger_name = trigger_entity.name if trigger_entity else trigger.entity
    effect_name = effect_entity.name if effect_entity else effect.entity

    # Start with trigger
    direction = "beat" if trigger.magnitude > 0 else "miss"
    parts = [
        f"{trigger_name} reported earnings {direction} of {abs(trigger.magnitude)*100:.1f}%."
    ]

    # Describe the chain
    if effect.order == 1:
        parts.append(f"As a directly connected entity, {effect_name} is expected to react.")
    elif effect.order == 2:
        parts.append(
            f"This cascades through the supply chain/sector to affect {effect_name} "
            f"within {effect.day:.0f} days."
        )
    else:
        parts.append(
            f"Through a {effect.order}-step causal chain, {effect_name} "
            f"is predicted to be affected by day {effect.day:.0f}."
        )

    # Add relationship details
    for step in steps[:2]:  # First two steps for brevity
        parts.append(step.explanation)

    # Add prediction
    sign = "+" if effect.magnitude > 0 else ""
    low, high = effect.magnitude_range
    parts.append(
        f"Predicted impact on {effect_name}: {sign}{effect.magnitude*100:.1f}% "
        f"(range: {low:+.1f}% to {high:+.1f}%, confidence: {effect.confidence:.0%})."
    )

    # Add confidence caveat
    if effect.confidence < 0.5:
        parts.append(
            "Note: This is a lower-confidence prediction due to the indirect "
            "relationship and multiple inference steps."
        )

    return " ".join(parts)


def explain_cascade(cascade: Cascade, graph: CausalGraph, top_n: int = 10) -> dict[str, Any]:
    """
    Generate explanations for the top effects in a cascade.

    Args:
        cascade: The cascade to explain
        graph: The causal graph
        top_n: Number of top effects to explain

    Returns:
        Dictionary with explanations
    """
    # Sort by confidence and magnitude
    sorted_effects = sorted(
        cascade.effects,
        key=lambda e: abs(e.magnitude) * e.confidence,
        reverse=True,
    )

    explanations = []
    for effect in sorted_effects[:top_n]:
        exp = explain_effect(effect, cascade, graph)
        explanations.append(exp.to_dict())

    return {
        "trigger": {
            "entity": cascade.trigger.entity,
            "magnitude_percent": cascade.trigger.magnitude * 100,
            "event_type": cascade.trigger.event_type,
            "description": cascade.trigger.description,
        },
        "summary": {
            "total_effects": len(cascade.effects),
            "first_order": len(cascade.first_order_effects),
            "second_order": len(cascade.second_order_effects),
            "third_order": len(cascade.third_order_effects),
        },
        "top_effects": explanations,
    }


def format_explanation_text(explanation: CausalExplanation) -> str:
    """Format explanation as readable text."""
    lines = [
        f"Effect on {explanation.effect.entity}",
        "=" * 40,
        "",
        "Causal Chain:",
    ]

    for i, step in enumerate(explanation.steps, 1):
        lines.append(f"  {i}. {step.from_entity} → {step.to_entity}")
        lines.append(f"     Relationship: {step.relationship}")
        lines.append(f"     Strength: {step.strength:.2f}, Delay: {step.delay_days:.1f} days")
        if step.evidence:
            lines.append(f"     Evidence: {step.evidence[0]}")
        lines.append("")

    lines.append("Narrative:")
    lines.append(explanation.narrative)

    lines.append("")
    lines.append("Confidence Breakdown:")
    for factor, value in explanation.confidence_factors.items():
        lines.append(f"  - {factor}: {value:.3f}")

    return "\n".join(lines)
