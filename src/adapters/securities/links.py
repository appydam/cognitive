"""Securities-specific link helpers and relationship types.

This module provides convenience functions for creating common types
of causal links in the securities domain.
"""

from enum import Enum

from src.core.graph import CausalLink


class RelationshipType(Enum):
    """Types of causal relationships in the securities domain."""

    # Supply chain relationships
    SUPPLIER_TO = "supplier_to"  # A supplies to B
    CUSTOMER_OF = "customer_of"  # A is customer of B

    # Market relationships
    IN_SECTOR = "in_sector"  # Company is in this sector ETF
    IN_INDEX = "in_index"  # Company is in this index
    COMPETES_WITH = "competes_with"  # Direct competitors

    # Correlation-based (learned from data)
    CORRELATED = "correlated"  # Price movements are correlated
    INVERSE_CORRELATED = "inverse_correlated"  # Prices move opposite

    # Economic relationships
    AFFECTED_BY = "affected_by"  # Affected by economic indicator


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

    Returns:
        CausalLink representing the supplier relationship.

    Example:
        >>> link = create_supplier_link("TSMC", "AAPL", 25.0, ["10-K FY2024"])
        >>> # AAPL moves -> TSMC moves (25% revenue dependency)
    """
    # Strength is proportional to revenue dependency
    # 50% revenue dependency = 0.5 strength, but with diminishing returns
    strength = min(0.8, revenue_percentage / 100 * 1.2)

    return CausalLink(
        source=customer,  # Customer's movement affects supplier
        target=supplier,
        relationship_type=RelationshipType.CUSTOMER_OF.value,
        strength=strength,
        delay_mean=1.5,  # Suppliers typically react within 1-2 days
        delay_std=0.5,
        confidence=0.75,  # Higher confidence for documented relationships
        direction=1.0,  # Same direction (customer down = supplier down)
        evidence=evidence or [],
        source_type="sec_filing",
    )


def create_sector_link(
    company: str,
    sector_etf: str,
    weight: float
) -> CausalLink:
    """
    Create a sector membership link.

    Companies affect their sector ETF based on their weight in the ETF.

    Args:
        company: Company ticker
        sector_etf: Sector ETF ticker (e.g., "XLK")
        weight: Weight in the ETF (0.0-1.0)

    Returns:
        CausalLink representing sector membership.

    Example:
        >>> link = create_sector_link("AAPL", "XLK", 0.15)
        >>> # AAPL represents 15% of XLK, so AAPL moves -> XLK moves
    """
    return CausalLink(
        source=company,
        target=sector_etf,
        relationship_type=RelationshipType.IN_SECTOR.value,
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
        correlation: Pearson correlation coefficient (-1.0 to 1.0)
        lag_days: Average lag between movements

    Returns:
        CausalLink representing the correlation.

    Example:
        >>> link = create_correlation_link("AAPL", "TSMC", 0.62, 1.0)
        >>> # AAPL moves -> TSMC moves 1 day later with 0.62 correlation
    """
    return CausalLink(
        source=entity_a,
        target=entity_b,
        relationship_type=(
            RelationshipType.CORRELATED.value if correlation > 0
            else RelationshipType.INVERSE_CORRELATED.value
        ),
        strength=abs(correlation) * 0.8,  # Scale down correlation to strength
        delay_mean=lag_days,
        delay_std=lag_days * 0.3,  # 30% std dev
        confidence=0.5,  # Lower confidence for learned relationships
        direction=1.0 if correlation > 0 else -1.0,
        evidence=[f"Historical correlation: {correlation:.2f}"],
        source_type="correlation",
    )
