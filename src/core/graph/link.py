"""Generic causal link definition for causal graphs.

This module provides a domain-agnostic CausalLink class that represents
causal relationships between entities, regardless of domain.
"""

from dataclasses import dataclass, field
from typing import Any
import random


@dataclass
class CausalLink:
    """
    A generic causal link between two entities.

    This class is domain-agnostic. Domain-specific relationship types
    (like 'supplier_to', 'depends_on', 'regulates') should be stored
    in the `relationship_type` string field.

    The link encodes:
    - WHAT is affected (source -> target)
    - HOW MUCH (strength)
    - WHEN (delay_mean, delay_std)
    - HOW CONFIDENT (confidence)
    - DIRECTION (positive or negative correlation)
    - WHY (evidence)

    Examples:
        Securities domain:
            CausalLink(
                source="AAPL",
                target="TSMC",
                relationship_type="customer_of",
                strength=0.48,
                delay_mean=1.5,
                delay_std=0.5,
                confidence=0.75,
                direction=1.0,
                evidence=["TSMC 10-K: Customer A = 25% revenue"]
            )

        Supply chain domain:
            CausalLink(
                source="port_shanghai",
                target="port_LA",
                relationship_type="ships_to",
                strength=0.62,
                delay_mean=14.0,  # 14 days shipping time
                delay_std=2.0,
                confidence=0.85,
                direction=1.0,
                evidence=["Historical shipping routes"]
            )

        Crypto domain:
            CausalLink(
                source="ethereum",
                target="uniswap_v3",
                relationship_type="hosts",
                strength=0.95,
                delay_mean=0.01,  # Minutes
                delay_std=0.005,
                confidence=0.99,
                direction=1.0,
                evidence=["Smart contract dependency"]
            )
    """

    source: str
    """Source entity ID (the cause)."""

    target: str
    """Target entity ID (the effect)."""

    relationship_type: str
    """Domain-specific relationship type (e.g., 'supplier_to', 'depends_on', 'hosts')."""

    # Causal parameters
    strength: float
    """Magnitude of effect propagation (0.0-1.0). How much of the source's change propagates to target."""

    delay_mean: float
    """Average time delay (in domain-specific units) until effect materializes."""

    delay_std: float
    """Standard deviation of time delay."""

    confidence: float
    """Confidence in this link's existence and parameters (0.0-1.0)."""

    direction: float = 1.0
    """Direction of effect: 1.0 = same direction, -1.0 = opposite direction."""

    # Evidence and learning
    evidence: list[str] = field(default_factory=list)
    """List of evidence sources supporting this link (e.g., SEC filings, correlations, studies)."""

    historical_accuracy: float = 0.5
    """Historical prediction accuracy for this link (0.0-1.0). Starts at 0.5 (no information)."""

    observation_count: int = 0
    """Number of times this link has been observed and validated."""

    # Metadata
    source_type: str = "manual"
    """Source of this link: 'manual', 'sec_filing', 'correlation', 'learned', etc."""

    last_updated: str | None = None
    """ISO timestamp of last update."""

    def sample_delay(self) -> float:
        """
        Sample a delay from the delay distribution.

        Returns:
            A sampled delay value (always non-negative).
        """
        if self.delay_std == 0:
            return self.delay_mean
        return max(0, random.gauss(self.delay_mean, self.delay_std))

    def propagate_magnitude(self, input_magnitude: float) -> float:
        """
        Calculate the propagated magnitude through this link.

        Args:
            input_magnitude: The magnitude of change in the source entity.

        Returns:
            The propagated magnitude to the target entity.
        """
        return input_magnitude * self.strength * self.direction

    def propagate_confidence(self, input_confidence: float) -> float:
        """
        Calculate the propagated confidence through this link.

        Args:
            input_confidence: The confidence of the source effect.

        Returns:
            The propagated confidence to the target entity.
        """
        return input_confidence * self.confidence

    def update_from_outcome(
        self,
        predicted: float,
        actual: float,
        timing_error: float = 0
    ) -> None:
        """
        Update link parameters based on observed outcome (Bayesian-style learning).

        Args:
            predicted: Predicted magnitude of effect.
            actual: Actual observed magnitude.
            timing_error: Difference between predicted and actual timing (in time units).
        """
        self.observation_count += 1

        # Calculate prediction error
        if actual != 0:
            magnitude_error = abs(predicted - actual) / abs(actual)
        else:
            magnitude_error = abs(predicted) if predicted != 0 else 0

        # Update historical accuracy (exponential moving average)
        alpha = 0.1  # Learning rate
        accuracy = 1.0 - min(1.0, magnitude_error)
        self.historical_accuracy = (1 - alpha) * self.historical_accuracy + alpha * accuracy

        # Update confidence based on accuracy
        if accuracy > 0.7:
            self.confidence = min(0.99, self.confidence + 0.02)
        elif accuracy < 0.3:
            self.confidence = max(0.1, self.confidence - 0.02)

        # Update delay estimate if timing error is significant
        if timing_error != 0 and self.observation_count > 5:
            self.delay_mean = (1 - alpha) * self.delay_mean + alpha * (self.delay_mean + timing_error)

    def to_dict(self) -> dict[str, Any]:
        """Convert link to dictionary for serialization."""
        return {
            "source": self.source,
            "target": self.target,
            "relationship_type": self.relationship_type,
            "strength": self.strength,
            "delay_mean": self.delay_mean,
            "delay_std": self.delay_std,
            "confidence": self.confidence,
            "direction": self.direction,
            "evidence": self.evidence,
            "historical_accuracy": self.historical_accuracy,
            "observation_count": self.observation_count,
            "source_type": self.source_type,
            "last_updated": self.last_updated,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "CausalLink":
        """Create link from dictionary."""
        return cls(
            source=data["source"],
            target=data["target"],
            relationship_type=data["relationship_type"],
            strength=data["strength"],
            delay_mean=data["delay_mean"],
            delay_std=data["delay_std"],
            confidence=data["confidence"],
            direction=data.get("direction", 1.0),
            evidence=data.get("evidence", []),
            historical_accuracy=data.get("historical_accuracy", 0.5),
            observation_count=data.get("observation_count", 0),
            source_type=data.get("source_type", "manual"),
            last_updated=data.get("last_updated"),
        )

    def __repr__(self) -> str:
        """String representation of the link."""
        return (
            f"CausalLink({self.source} --[{self.relationship_type}]--> {self.target}, "
            f"strength={self.strength:.2f}, delay={self.delay_mean:.1f}, conf={self.confidence:.2f})"
        )
