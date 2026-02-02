"""Data source adapter interface for domain-agnostic data loading.

This module provides an abstract base class for data source adapters,
enabling pluggable data sources across different domains (securities,
macro, supply chain, etc.).
"""

from abc import ABC, abstractmethod
from typing import Any


class DataSourceAdapter(ABC):
    """Interface for domain-specific data sources.

    Subclasses implement domain-specific logic for loading and normalizing
    data from various sources (JSON files, APIs, databases, etc.).

    The adapter pattern allows new data sources to be added without modifying
    core graph building logic.
    """

    @abstractmethod
    def load_entities(self) -> list[dict[str, Any]]:
        """Load raw entity data from the data source.

        Returns:
            List of entity dictionaries with keys:
                - id (str): Unique entity identifier
                - name (str): Human-readable name
                - type (str): Entity type (e.g., "company", "indicator")
                - attributes (dict): Domain-specific attributes

        Example:
            [
                {
                    "id": "AAPL",
                    "name": "Apple Inc.",
                    "type": "company",
                    "attributes": {"sector": "Technology", "market_cap": 3000000000000}
                }
            ]
        """
        pass

    @abstractmethod
    def load_relationships(self) -> list[dict[str, Any]]:
        """Load raw relationship data from the data source.

        Returns:
            List of relationship dictionaries with keys:
                - source (str): Source entity ID
                - target (str): Target entity ID
                - relationship_type (str): Type of relationship
                - strength (float): Strength of causal link (0-1)
                - Additional domain-specific fields

        Example:
            [
                {
                    "source": "AAPL",
                    "target": "TSMC",
                    "relationship_type": "customer_of",
                    "strength": 0.85,
                    "revenue_pct": 25.0
                }
            ]
        """
        pass

    def normalize_entities(self, raw: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Convert raw entity data to standardized format.

        Override this method if custom normalization is needed beyond
        the default passthrough.

        Args:
            raw: Raw entity data from load_entities()

        Returns:
            Normalized entity dictionaries ready for Entity object creation
        """
        return raw

    def normalize_relationships(self, raw: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Convert raw relationship data to standardized format.

        Subclasses MUST override this to handle domain-specific relationship
        attributes (e.g., revenue_pct for securities, volume for supply chain).

        Args:
            raw: Raw relationship data from load_relationships()

        Returns:
            Normalized relationship dictionaries ready for CausalLink creation
        """
        return raw

    def get_entity_count(self) -> int:
        """Get count of entities from this adapter.

        Useful for logging and validation.
        """
        return len(self.load_entities())

    def get_relationship_count(self) -> int:
        """Get count of relationships from this adapter.

        Useful for logging and validation.
        """
        return len(self.load_relationships())
