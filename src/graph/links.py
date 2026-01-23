"""Causal link definitions for the causal graph."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any
import random
import math


class RelationshipType(Enum):
    """Types of causal relationships between entities."""

    # Supply chain relationships
    SUPPLIER_TO = "supplier_to"  # A supplies to B (A's performance affects B)
    CUSTOMER_OF = "customer_of"  # A is customer of B (A's performance affects B)

    # Market relationships
    IN_SECTOR = "in_sector"  # Company is in this sector ETF
    IN_INDEX = "in_index"  # Company is in this index
    COMPETES_WITH = "competes_with"  # Direct competitors

    # Correlation-based (learned from data)
    CORRELATED = "correlated"  # Price movements are correlated
    INVERSE_CORRELATED = "inverse_correlated"  # Prices move opposite

    # Economic relationships
    AFFECTED_BY = "affected_by"  # Affected by economic indicator


@dataclass
class CausalLink:
    """
    A causal link between two entities in the graph.

    Represents how changes in the source entity affect the target entity,
    including the strength, timing, and confidence of the relationship.
    """

    source: str  # Source entity ID
    target: str  # Target entity ID
    relationship: RelationshipType

    # Causal parameters
    strength: float  # 0.0-1.0: magnitude of effect propagation
    delay_mean: float  # Average days until effect materializes
    delay_std: float  # Standard deviation of delay
    confidence: float  # 0.0-1.0: how confident we are in this link

    # Direction of effect (positive = same direction, negative = opposite)
    direction: float = 1.0  # 1.0 or -1.0

    # Evidence and learning
    evidence: list[str] = field(default_factory=list)
    historical_accuracy: float = 0.5  # Starts at 50% (no information)
    observation_count: int = 0

    # Metadata
    source_type: str = "manual"  # "manual", "sec_filing", "correlation", "learned"
    last_updated: str | None = None

    def sample_delay(self) -> float:
        """Sample a delay from the delay distribution."""
        # Use log-normal distribution to ensure positive delays
        if self.delay_std == 0:
            return self.delay_mean
        return max(0, random.gauss(self.delay_mean, self.delay_std))

    def propagate_magnitude(self, input_magnitude: float) -> float:
        """Calculate the propagated magnitude through this link."""
        return input_magnitude * self.strength * self.direction

    def propagate_confidence(self, input_confidence: float) -> float:
        """Calculate the propagated confidence through this link."""
        return input_confidence * self.confidence

    def update_from_outcome(self, predicted: float, actual: float, timing_error: float = 0) -> None:
        """
        Update link parameters based on observed outcome.

        Uses Bayesian-style updates to adjust strength and confidence.
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
        # Confidence increases if predictions are accurate, decreases otherwise
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
            "relationship": self.relationship.value,
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
            relationship=RelationshipType(data["relationship"]),
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
        return (
            f"CausalLink({self.source} --[{self.relationship.value}]--> {self.target}, "
            f"strength={self.strength:.2f}, delay={self.delay_mean:.1f}d, conf={self.confidence:.2f})"
        )


def create_supplier_link(
    supplier: str,
    customer: str,
    revenue_percentage: float,
    evidence: list[str] | None = None,
) -> CausalLink:
    """
    Create a supplier relationship link.

    When a customer's stock moves, suppliers with high revenue dependency
    tend to move in the same direction.

    Args:
        supplier: Supplier company ticker
        customer: Customer company ticker
        revenue_percentage: % of supplier's revenue from this customer (0-100)
        evidence: Source of this information (e.g., "10-K FY2024")
    """
    # Strength is proportional to revenue dependency
    # 50% revenue dependency = 0.5 strength, but with diminishing returns
    strength = min(0.8, revenue_percentage / 100 * 1.2)

    return CausalLink(
        source=customer,  # Customer's movement affects supplier
        target=supplier,
        relationship=RelationshipType.CUSTOMER_OF,
        strength=strength,
        delay_mean=1.5,  # Suppliers typically react within 1-2 days
        delay_std=0.5,
        confidence=0.75,  # Higher confidence for documented relationships
        direction=1.0,  # Same direction (customer down = supplier down)
        evidence=evidence or [],
        source_type="sec_filing",
    )


def create_sector_link(company: str, sector_etf: str, weight: float) -> CausalLink:
    """
    Create a sector membership link.

    Companies affect their sector ETF based on their weight in the ETF.
    """
    return CausalLink(
        source=company,
        target=sector_etf,
        relationship=RelationshipType.IN_SECTOR,
        strength=min(0.3, weight * 2),  # Cap at 0.3 to prevent over-influence
        delay_mean=0.25,  # Same day, within hours
        delay_std=0.1,
        confidence=0.9,  # High confidence for index composition
        direction=1.0,
        evidence=[f"ETF weight: {weight*100:.1f}%"],
        source_type="manual",
    )


def create_correlation_link(
    entity_a: str,
    entity_b: str,
    correlation: float,
    lag_days: float,
) -> CausalLink:
    """
    Create a correlation-based link learned from historical price data.

    Args:
        entity_a: First entity (the "cause")
        entity_b: Second entity (the "effect")
        correlation: Pearson correlation coefficient
        lag_days: Average lag between movements
    """
    return CausalLink(
        source=entity_a,
        target=entity_b,
        relationship=RelationshipType.CORRELATED if correlation > 0 else RelationshipType.INVERSE_CORRELATED,
        strength=abs(correlation) * 0.8,  # Scale down correlation to strength
        delay_mean=lag_days,
        delay_std=lag_days * 0.3,  # 30% std dev
        confidence=0.5,  # Lower confidence for learned relationships
        direction=1.0 if correlation > 0 else -1.0,
        evidence=[f"Historical correlation: {correlation:.2f}"],
        source_type="correlation",
    )
