"""Generic causal graph implementation.

This module provides a domain-agnostic CausalGraph class for managing
entities and causal relationships between them.
"""

import json
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterator

from .entity import Entity
from .link import CausalLink


@dataclass
class CausalGraph:
    """
    A directed graph representing causal relationships between entities.

    This class is domain-agnostic and can represent causal relationships
    in any domain (securities, supply chain, crypto, energy, etc.).

    The graph supports:
    - Adding/removing entities and links
    - Querying outgoing/incoming links
    - Serialization to/from JSON
    - Subgraph extraction
    - Neighbor traversal
    """

    entities: dict[str, Entity] = field(default_factory=dict)
    """Dictionary mapping entity IDs to Entity objects."""

    _outgoing: dict[str, list[CausalLink]] = field(default_factory=lambda: defaultdict(list))
    """Internal: outgoing links from each entity."""

    _incoming: dict[str, list[CausalLink]] = field(default_factory=lambda: defaultdict(list))
    """Internal: incoming links to each entity."""

    def add_entity(self, entity: Entity) -> None:
        """
        Add an entity to the graph.

        Args:
            entity: The entity to add.
        """
        self.entities[entity.id] = entity

    def add_link(self, link: CausalLink) -> None:
        """
        Add a causal link to the graph.

        Args:
            link: The causal link to add.

        Raises:
            ValueError: If source or target entity doesn't exist in the graph.
        """
        # Ensure both entities exist
        if link.source not in self.entities:
            raise ValueError(f"Source entity '{link.source}' not found in graph")
        if link.target not in self.entities:
            raise ValueError(f"Target entity '{link.target}' not found in graph")

        # Check for duplicate links (same source, target, relationship_type)
        for existing in self._outgoing[link.source]:
            if (existing.target == link.target and
                existing.relationship_type == link.relationship_type):
                # Update existing link instead of adding duplicate
                self._outgoing[link.source].remove(existing)
                self._incoming[link.target].remove(existing)
                break

        self._outgoing[link.source].append(link)
        self._incoming[link.target].append(link)

    def get_entity(self, entity_id: str) -> Entity | None:
        """
        Get an entity by ID.

        Args:
            entity_id: The entity ID to look up.

        Returns:
            The entity if found, None otherwise.
        """
        return self.entities.get(entity_id)

    def get_outgoing(self, entity_id: str) -> list[CausalLink]:
        """
        Get all outgoing links from an entity.

        IMPORTANT: Returns links in deterministic order (sorted by target entity)
        to ensure consistent cascade predictions for financial reliability.

        Args:
            entity_id: The entity ID.

        Returns:
            List of outgoing causal links, sorted by target for determinism.
        """
        links = self._outgoing.get(entity_id, [])
        # Sort by target entity to ensure deterministic BFS traversal
        return sorted(links, key=lambda link: link.target)

    def get_incoming(self, entity_id: str) -> list[CausalLink]:
        """
        Get all incoming links to an entity.

        Args:
            entity_id: The entity ID.

        Returns:
            List of incoming causal links.
        """
        return self._incoming.get(entity_id, [])

    def get_link(self, source: str, target: str) -> CausalLink | None:
        """
        Get a specific link between two entities.

        Args:
            source: Source entity ID.
            target: Target entity ID.

        Returns:
            The first link found from source to target, or None.
        """
        for link in self._outgoing.get(source, []):
            if link.target == target:
                return link
        return None

    def get_entities_by_type(self, entity_type: str) -> list[Entity]:
        """
        Get all entities of a specific type.

        Args:
            entity_type: The entity type to filter by.

        Returns:
            List of entities matching the type.
        """
        return [e for e in self.entities.values() if e.entity_type == entity_type]

    def get_entities_by_attribute(self, attribute_name: str, attribute_value: Any) -> list[Entity]:
        """
        Get all entities with a specific attribute value.

        Args:
            attribute_name: The attribute key to filter by.
            attribute_value: The attribute value to match.

        Returns:
            List of entities with matching attribute.
        """
        return [
            e for e in self.entities.values()
            if e.attributes.get(attribute_name) == attribute_value
        ]

    def iter_links(self) -> Iterator[CausalLink]:
        """
        Iterate over all links in the graph.

        Yields:
            CausalLink objects.
        """
        for links in self._outgoing.values():
            yield from links

    @property
    def num_entities(self) -> int:
        """Number of entities in the graph."""
        return len(self.entities)

    @property
    def num_links(self) -> int:
        """Number of links in the graph."""
        return sum(len(links) for links in self._outgoing.values())

    def get_neighbors(self, entity_id: str, depth: int = 1) -> set[str]:
        """
        Get all entities within N hops of the given entity.

        Args:
            entity_id: The starting entity ID.
            depth: Number of hops to traverse (default: 1).

        Returns:
            Set of entity IDs within the specified depth.
        """
        neighbors = set()
        current_level = {entity_id}

        for _ in range(depth):
            next_level = set()
            for eid in current_level:
                # Add outgoing neighbors
                for link in self.get_outgoing(eid):
                    next_level.add(link.target)
                # Add incoming neighbors
                for link in self.get_incoming(eid):
                    next_level.add(link.source)
            neighbors.update(next_level)
            current_level = next_level - neighbors

        neighbors.discard(entity_id)  # Remove the starting entity
        return neighbors

    def subgraph(self, entity_ids: set[str]) -> "CausalGraph":
        """
        Extract a subgraph containing only the specified entities.

        Args:
            entity_ids: Set of entity IDs to include.

        Returns:
            A new CausalGraph with only the specified entities and links between them.
        """
        subgraph = CausalGraph()

        # Add entities
        for eid in entity_ids:
            if eid in self.entities:
                subgraph.add_entity(self.entities[eid])

        # Add links between included entities
        for eid in entity_ids:
            for link in self.get_outgoing(eid):
                if link.target in entity_ids:
                    subgraph.add_link(link)

        return subgraph

    def to_dict(self) -> dict[str, Any]:
        """
        Convert graph to dictionary for serialization.

        Returns:
            Dictionary with 'entities' and 'links' keys.
        """
        return {
            "entities": [e.to_dict() for e in self.entities.values()],
            "links": [link.to_dict() for link in self.iter_links()],
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "CausalGraph":
        """
        Create graph from dictionary.

        Args:
            data: Dictionary with 'entities' and 'links' keys.

        Returns:
            A new CausalGraph instance.
        """
        graph = cls()

        # Add entities first
        for entity_data in data.get("entities", []):
            graph.add_entity(Entity.from_dict(entity_data))

        # Then add links
        for link_data in data.get("links", []):
            try:
                graph.add_link(CausalLink.from_dict(link_data))
            except ValueError as e:
                # Skip links with missing entities (can happen with partial graphs)
                print(f"Warning: Skipping link due to error: {e}")

        return graph

    def save(self, path: str | Path) -> None:
        """
        Save graph to JSON file.

        Args:
            path: Path to save the JSON file.
        """
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(self.to_dict(), f, indent=2)

    @classmethod
    def load(cls, path: str | Path) -> "CausalGraph":
        """
        Load graph from JSON file.

        Args:
            path: Path to the JSON file.

        Returns:
            A new CausalGraph instance.
        """
        with open(path) as f:
            return cls.from_dict(json.load(f))

    def summary(self) -> str:
        """
        Get a summary of the graph.

        Returns:
            A multi-line string summary.
        """
        entity_types = defaultdict(int)
        relationship_types = defaultdict(int)

        for entity in self.entities.values():
            entity_types[entity.entity_type] += 1

        for link in self.iter_links():
            relationship_types[link.relationship_type] += 1

        lines = [
            "Causal Graph Summary",
            "=" * 40,
            f"Total Entities: {self.num_entities}",
            f"Total Links: {self.num_links}",
            "",
            "Entities by Type:",
        ]
        for etype, count in sorted(entity_types.items()):
            lines.append(f"  {etype}: {count}")

        lines.append("")
        lines.append("Links by Type:")
        for rtype, count in sorted(relationship_types.items()):
            lines.append(f"  {rtype}: {count}")

        return "\n".join(lines)

    def __repr__(self) -> str:
        """String representation of the graph."""
        return f"CausalGraph(entities={self.num_entities}, links={self.num_links})"


def merge_graphs(*graphs: CausalGraph) -> CausalGraph:
    """
    Merge multiple causal graphs into one.

    Args:
        *graphs: Variable number of CausalGraph instances to merge.

    Returns:
        A new CausalGraph containing all entities and links from input graphs.
    """
    merged = CausalGraph()

    for graph in graphs:
        # Add all entities
        for entity in graph.entities.values():
            if entity.id not in merged.entities:
                merged.add_entity(entity)

        # Add all links
        for link in graph.iter_links():
            try:
                merged.add_link(link)
            except ValueError:
                pass  # Skip if entity doesn't exist

    return merged
