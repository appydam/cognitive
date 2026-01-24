"""Securities-specific entity wrappers and helpers.

This module provides convenience wrappers around the generic Entity class
for the securities domain (stocks, ETFs, sectors, indices).
"""

from enum import Enum
from typing import Any

from src.core.graph import Entity


class EntityType(Enum):
    """Types of entities in the securities domain."""

    COMPANY = "company"
    ETF = "etf"
    SECTOR = "sector"
    INDEX = "index"
    INDICATOR = "indicator"  # Economic indicators like Fed rate, inflation


class SecurityEntity(Entity):
    """
    Convenience wrapper for securities entities.

    Provides property accessors for common securities attributes
    while storing everything in the generic Entity.attributes dict.
    """

    def __init__(
        self,
        id: str,
        entity_type: EntityType,
        name: str,
        sector: str | None = None,
        industry: str | None = None,
        market_cap: float | None = None,
        country: str = "US",
        **kwargs: Any
    ):
        """
        Create a security entity.

        Args:
            id: Ticker symbol (e.g., "AAPL")
            entity_type: Type of security (COMPANY, ETF, etc.)
            name: Full name (e.g., "Apple Inc.")
            sector: Sector name (e.g., "Technology")
            industry: Industry name (e.g., "Consumer Electronics")
            market_cap: Market capitalization in USD
            country: Country code (default: "US")
            **kwargs: Additional attributes
        """
        attributes = {
            "sector": sector,
            "industry": industry,
            "market_cap": market_cap,
            "country": country,
            **kwargs
        }

        super().__init__(
            id=id,
            entity_type=entity_type.value,
            name=name,
            attributes=attributes
        )

    @property
    def ticker(self) -> str:
        """Get ticker symbol (same as ID)."""
        return self.id

    @property
    def sector(self) -> str | None:
        """Get sector."""
        return self.attributes.get("sector")

    @property
    def industry(self) -> str | None:
        """Get industry."""
        return self.attributes.get("industry")

    @property
    def market_cap(self) -> float | None:
        """Get market capitalization."""
        return self.attributes.get("market_cap")

    @property
    def country(self) -> str:
        """Get country code."""
        return self.attributes.get("country", "US")


def create_company(
    ticker: str,
    name: str,
    sector: str | None = None,
    industry: str | None = None,
    market_cap: float | None = None,
    **kwargs: Any
) -> SecurityEntity:
    """
    Create a company entity.

    Args:
        ticker: Stock ticker (e.g., "AAPL")
        name: Company name (e.g., "Apple Inc.")
        sector: Sector (e.g., "Technology")
        industry: Industry (e.g., "Consumer Electronics")
        market_cap: Market cap in USD
        **kwargs: Additional attributes

    Returns:
        SecurityEntity configured as a company.
    """
    return SecurityEntity(
        id=ticker,
        entity_type=EntityType.COMPANY,
        name=name,
        sector=sector,
        industry=industry,
        market_cap=market_cap,
        **kwargs
    )


def create_etf(
    ticker: str,
    name: str,
    sector: str | None = None,
    **kwargs: Any
) -> SecurityEntity:
    """
    Create an ETF entity.

    Args:
        ticker: ETF ticker (e.g., "XLK")
        name: ETF name (e.g., "Technology Select Sector SPDR Fund")
        sector: Sector focus (if applicable)
        **kwargs: Additional attributes

    Returns:
        SecurityEntity configured as an ETF.
    """
    return SecurityEntity(
        id=ticker,
        entity_type=EntityType.ETF,
        name=name,
        sector=sector,
        **kwargs
    )


def create_sector(
    sector_id: str,
    name: str,
    **kwargs: Any
) -> SecurityEntity:
    """
    Create a sector entity.

    Args:
        sector_id: Sector identifier (e.g., "TECH_SECTOR")
        name: Sector name (e.g., "Technology")
        **kwargs: Additional attributes

    Returns:
        SecurityEntity configured as a sector.
    """
    return SecurityEntity(
        id=sector_id,
        entity_type=EntityType.SECTOR,
        name=name,
        **kwargs
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
