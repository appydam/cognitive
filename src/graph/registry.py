"""Registries for entity types and relationship types across domains.

This module provides centralized registration and validation for entity and
relationship types, enabling domain-agnostic graph construction and type safety.
"""

from dataclasses import dataclass
from typing import Any


@dataclass
class EntityTypeMetadata:
    """Metadata for a registered entity type."""

    name: str
    """Entity type name (e.g., 'company', 'indicator', 'port')"""

    domain: str
    """Domain this type belongs to (e.g., 'securities', 'macro', 'supply_chain')"""

    description: str
    """Human-readable description of this entity type"""

    attributes: dict[str, type]
    """Expected attribute names and types for entities of this type"""


@dataclass
class RelationshipTypeMetadata:
    """Metadata for a registered relationship type."""

    name: str
    """Relationship type name (e.g., 'customer_of', 'correlated')"""

    domain: str
    """Domain this relationship belongs to"""

    description: str
    """Human-readable description of this relationship"""

    source_entity_types: list[str]
    """Valid entity types for the source of this relationship"""

    target_entity_types: list[str]
    """Valid entity types for the target of this relationship"""

    is_bidirectional: bool = False
    """Whether this relationship is bidirectional (symmetric)"""


class EntityTypeRegistry:
    """Global registry for entity types across all domains.

    This registry allows:
    - Type validation (ensure entities match their type definition)
    - Type discovery (query available types per domain)
    - Type documentation (get metadata about types)

    Example:
        # Register a type
        EntityTypeRegistry.register(
            domain="securities",
            entity_type="company",
            description="Publicly traded company",
            sector=str,
            market_cap=float,
        )

        # Validate an entity
        is_valid = EntityTypeRegistry.validate_entity(
            domain="securities",
            entity=my_entity
        )
    """

    _types: dict[str, EntityTypeMetadata] = {}

    @classmethod
    def register(
        cls,
        domain: str,
        entity_type: str,
        description: str,
        **attributes: type,
    ) -> None:
        """Register an entity type with expected attributes.

        Args:
            domain: Domain name (e.g., 'securities', 'macro')
            entity_type: Entity type name (e.g., 'company', 'indicator')
            description: Human-readable description
            **attributes: Expected attribute names and their types
                Example: sector=str, market_cap=float

        Raises:
            ValueError: If type is already registered
        """
        key = f"{domain}/{entity_type}"

        if key in cls._types:
            raise ValueError(f"Entity type '{key}' is already registered")

        cls._types[key] = EntityTypeMetadata(
            name=entity_type,
            domain=domain,
            description=description,
            attributes=attributes,
        )

    @classmethod
    def validate_entity(cls, domain: str, entity: Any) -> bool:
        """Check if entity matches its type definition.

        Args:
            domain: Domain name
            entity: Entity object with entity_type and attributes

        Returns:
            True if valid, False otherwise
        """
        key = f"{domain}/{entity.entity_type}"

        if key not in cls._types:
            # Type not registered - allow for flexibility
            return True

        metadata = cls._types[key]

        # Validate that required attributes exist
        # Note: We don't enforce types strictly, just check presence
        for attr_name in metadata.attributes:
            if not hasattr(entity, "attributes") or attr_name not in entity.attributes:
                return False

        return True

    @classmethod
    def get_types_for_domain(cls, domain: str) -> list[str]:
        """Get all entity type names for a specific domain.

        Args:
            domain: Domain name

        Returns:
            List of entity type names
        """
        return [meta.name for key, meta in cls._types.items() if meta.domain == domain]

    @classmethod
    def get_metadata(cls, domain: str, entity_type: str) -> EntityTypeMetadata | None:
        """Get metadata for a specific entity type.

        Args:
            domain: Domain name
            entity_type: Entity type name

        Returns:
            EntityTypeMetadata or None if not registered
        """
        key = f"{domain}/{entity_type}"
        return cls._types.get(key)

    @classmethod
    def get_all_types(cls) -> dict[str, EntityTypeMetadata]:
        """Get all registered entity types.

        Returns:
            Dictionary mapping 'domain/type' to metadata
        """
        return cls._types.copy()


class RelationshipTypeRegistry:
    """Global registry for relationship types across all domains.

    This registry allows:
    - Relationship validation (ensure source/target types are compatible)
    - Relationship discovery (query available relationship types)
    - Relationship documentation (get metadata about relationships)

    Example:
        # Register a relationship type
        RelationshipTypeRegistry.register(
            domain="securities",
            rel_type="customer_of",
            description="B is a customer of A",
            source_types=["company"],
            target_types=["company"],
        )

        # Validate a link
        is_valid = RelationshipTypeRegistry.validate_link(
            domain="securities",
            link=my_link,
            graph=my_graph,
        )
    """

    _types: dict[str, RelationshipTypeMetadata] = {}

    @classmethod
    def register(
        cls,
        domain: str,
        rel_type: str,
        description: str,
        source_types: list[str],
        target_types: list[str],
        bidirectional: bool = False,
    ) -> None:
        """Register a relationship type.

        Args:
            domain: Domain name
            rel_type: Relationship type name
            description: Human-readable description
            source_types: Valid entity types for source
            target_types: Valid entity types for target
            bidirectional: Whether relationship is symmetric

        Raises:
            ValueError: If type is already registered
        """
        key = f"{domain}/{rel_type}"

        if key in cls._types:
            raise ValueError(f"Relationship type '{key}' is already registered")

        cls._types[key] = RelationshipTypeMetadata(
            name=rel_type,
            domain=domain,
            description=description,
            source_entity_types=source_types,
            target_entity_types=target_types,
            is_bidirectional=bidirectional,
        )

    @classmethod
    def validate_link(cls, domain: str, link: Any, graph: Any) -> bool:
        """Validate link against domain rules.

        Args:
            domain: Domain name
            link: CausalLink object
            graph: CausalGraph containing entities

        Returns:
            True if valid, False otherwise
        """
        key = f"{domain}/{link.relationship_type}"

        if key not in cls._types:
            # Type not registered - allow for flexibility
            return True

        metadata = cls._types[key]

        # Get source and target entities
        source = graph.get_entity(link.source)
        target = graph.get_entity(link.target)

        if source is None or target is None:
            return False

        # Check entity type compatibility
        if source.entity_type not in metadata.source_entity_types:
            return False

        if target.entity_type not in metadata.target_entity_types:
            return False

        return True

    @classmethod
    def get_types_for_domain(cls, domain: str) -> list[str]:
        """Get all relationship type names for a specific domain.

        Args:
            domain: Domain name

        Returns:
            List of relationship type names
        """
        return [meta.name for key, meta in cls._types.items() if meta.domain == domain]

    @classmethod
    def get_metadata(
        cls, domain: str, rel_type: str
    ) -> RelationshipTypeMetadata | None:
        """Get metadata for a specific relationship type.

        Args:
            domain: Domain name
            rel_type: Relationship type name

        Returns:
            RelationshipTypeMetadata or None if not registered
        """
        key = f"{domain}/{rel_type}"
        return cls._types.get(key)

    @classmethod
    def get_all_types(cls) -> dict[str, RelationshipTypeMetadata]:
        """Get all registered relationship types.

        Returns:
            Dictionary mapping 'domain/type' to metadata
        """
        return cls._types.copy()

    @classmethod
    def is_bidirectional(cls, domain: str, rel_type: str) -> bool:
        """Check if a relationship type is bidirectional.

        Args:
            domain: Domain name
            rel_type: Relationship type name

        Returns:
            True if bidirectional, False otherwise
        """
        metadata = cls.get_metadata(domain, rel_type)
        return metadata.is_bidirectional if metadata else False
