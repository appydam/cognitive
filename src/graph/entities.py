"""Entity definitions for the causal graph."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class EntityType(Enum):
    """Types of entities in the causal graph."""

    COMPANY = "company"
    ETF = "etf"
    SECTOR = "sector"
    INDEX = "index"
    INDICATOR = "indicator"  # Economic indicators like Fed rate, inflation


@dataclass
class Entity:
    """
    An entity in the causal graph.

    Entities can be companies, ETFs, sectors, indices, or economic indicators.
    Each entity has attributes that describe its characteristics.
    """

    id: str  # Ticker symbol or unique ID (e.g., "AAPL", "XLK", "FED_RATE")
    type: EntityType
    name: str  # Full name (e.g., "Apple Inc.")
    attributes: dict[str, Any] = field(default_factory=dict)

    # Optional metadata
    sector: str | None = None
    industry: str | None = None
    market_cap: float | None = None
    country: str = "US"

    def __hash__(self) -> int:
        return hash(self.id)

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Entity):
            return False
        return self.id == other.id

    def to_dict(self) -> dict:
        """Convert entity to dictionary for serialization."""
        return {
            "id": self.id,
            "type": self.type.value,
            "name": self.name,
            "attributes": self.attributes,
            "sector": self.sector,
            "industry": self.industry,
            "market_cap": self.market_cap,
            "country": self.country,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Entity":
        """Create entity from dictionary."""
        return cls(
            id=data["id"],
            type=EntityType(data["type"]),
            name=data["name"],
            attributes=data.get("attributes", {}),
            sector=data.get("sector"),
            industry=data.get("industry"),
            market_cap=data.get("market_cap"),
            country=data.get("country", "US"),
        )


# Pre-defined sector ETFs for easy reference
SECTOR_ETFS = {
    "Technology": "XLK",
    "Healthcare": "XLV",
    "Financials": "XLF",
    "Consumer Discretionary": "XLY",
    "Consumer Staples": "XLP",
    "Energy": "XLE",
    "Industrials": "XLI",
    "Materials": "XLB",
    "Utilities": "XLU",
    "Real Estate": "XLRE",
    "Communication Services": "XLC",
}

# Major indices
INDICES = {
    "S&P 500": "SPY",
    "Nasdaq 100": "QQQ",
    "Dow Jones": "DIA",
    "Russell 2000": "IWM",
}

# Semiconductor-specific ETFs (important for tech cascades)
SEMICONDUCTOR_ETFS = {
    "Semiconductors": "SMH",
    "Semiconductor Equipment": "SOXX",
}
