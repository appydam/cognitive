"""Generic entity definition for causal graphs.

This module provides a domain-agnostic Entity class that can represent
any type of node in a causal graph, regardless of the domain (securities,
supply chain, crypto, energy markets, etc.).
"""

from dataclasses import dataclass, field
from typing import Any


@dataclass
class Entity:
    """
    A generic entity in a causal graph.

    This class is intentionally domain-agnostic. All domain-specific
    attributes (like ticker, sector, market_cap for securities) should
    be stored in the `attributes` dictionary.

    Examples:
        Securities domain:
            Entity(
                id="AAPL",
                entity_type="company",
                name="Apple Inc.",
                attributes={"sector": "Technology", "market_cap": 3000000000000}
            )

        Supply chain domain:
            Entity(
                id="port_LA",
                entity_type="port",
                name="Port of Los Angeles",
                attributes={"capacity_teu": 10000000, "country": "US"}
            )

        Crypto domain:
            Entity(
                id="uniswap_v3",
                entity_type="protocol",
                name="Uniswap V3",
                attributes={"chain": "ethereum", "tvl": 5000000000}
            )
    """

    id: str
    """Unique identifier for this entity (domain-specific)."""

    entity_type: str
    """Type of entity in domain-specific terms (e.g., 'company', 'port', 'protocol')."""

    name: str
    """Human-readable name of the entity."""

    attributes: dict[str, Any] = field(default_factory=dict)
    """Domain-specific attributes stored as key-value pairs."""

    def __hash__(self) -> int:
        """Hash based on ID for use in sets and dicts."""
        return hash(self.id)

    def __eq__(self, other: object) -> bool:
        """Equality based on ID."""
        if not isinstance(other, Entity):
            return False
        return self.id == other.id

    def to_dict(self) -> dict[str, Any]:
        """Convert entity to dictionary for serialization."""
        return {
            "id": self.id,
            "entity_type": self.entity_type,
            "name": self.name,
            "attributes": self.attributes,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Entity":
        """Create entity from dictionary."""
        return cls(
            id=data["id"],
            entity_type=data["entity_type"],
            name=data["name"],
            attributes=data.get("attributes", {}),
        )

    def __repr__(self) -> str:
        """String representation of the entity."""
        return f"Entity(id='{self.id}', type='{self.entity_type}', name='{self.name}')"
