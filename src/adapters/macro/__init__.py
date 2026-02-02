"""Macro economic domain adapter.

This package provides domain-specific adapters for macro economic indicators
including entity types, relationship types, and data sources.

On module import, automatically registers macro entity and relationship types
with the global registries.
"""

from src.graph.registry import EntityTypeRegistry, RelationshipTypeRegistry

# Register macro entity type
EntityTypeRegistry.register(
    domain="macro",
    entity_type="indicator",
    description="Macroeconomic or market indicator",
    source=str,
    latest_value=float,
    description_=str,
)

# Macro indicators reuse existing correlation relationship types from securities
# No new relationship types needed, but we document which types are used:
#
# - "correlated": Positive correlation (both move in same direction)
#   - Registered in securities domain, works cross-domain
#   - Example: Oil prices correlated with energy stocks
#
# - "inverse_correlated": Negative correlation (move in opposite directions)
#   - Registered in securities domain, works cross-domain
#   - Example: VIX inverse correlated with S&P 500

# If these types aren't registered yet (securities module not imported),
# register them here as cross-domain types
try:
    # Check if correlated type exists
    if not RelationshipTypeRegistry.get_metadata("securities", "correlated"):
        RelationshipTypeRegistry.register(
            domain="macro",
            rel_type="correlated",
            description="Positive correlation between entities",
            source_types=["indicator", "company", "etf"],
            target_types=["indicator", "company", "etf"],
            bidirectional=True,
        )

        RelationshipTypeRegistry.register(
            domain="macro",
            rel_type="inverse_correlated",
            description="Negative correlation between entities",
            source_types=["indicator", "company", "etf"],
            target_types=["indicator", "company", "etf"],
            bidirectional=True,
        )
except Exception:
    # If securities domain already registered these, that's fine
    pass

__all__ = ["MacroIndicatorsAdapter"]

from src.adapters.macro.data_sources import MacroIndicatorsAdapter
