"""Securities domain adapter for US stock market.

This adapter wraps the generic causal reasoning core with securities-specific
functionality, including entity types, relationship types, and event helpers.
"""

from .entities import (
    SecurityEntity,
    EntityType,
    create_company,
    create_etf,
    create_sector,
    SECTOR_ETFS,
    INDICES,
    SEMICONDUCTOR_ETFS,
)
from .links import (
    RelationshipType,
    create_supplier_link,
    create_sector_link,
    create_correlation_link,
)
from .events import create_earnings_event

__all__ = [
    # Entities
    "SecurityEntity",
    "EntityType",
    "create_company",
    "create_etf",
    "create_sector",
    "SECTOR_ETFS",
    "INDICES",
    "SEMICONDUCTOR_ETFS",
    # Links
    "RelationshipType",
    "create_supplier_link",
    "create_sector_link",
    "create_correlation_link",
    # Events
    "create_earnings_event",
]
