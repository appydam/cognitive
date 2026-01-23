"""Core causal graph implementation."""

import json
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterator

from .entities import Entity, EntityType
from .links import CausalLink, RelationshipType


@dataclass
class CausalGraph:
    """
    A directed graph representing causal relationships between entities.

    The graph supports:
    - Adding/removing entities and links
    - Querying outgoing/incoming links
    - Serialization to/from JSON
    - Subgraph extraction
    """

    entities: dict[str, Entity] = field(default_factory=dict)
    _outgoing: dict[str, list[CausalLink]] = field(default_factory=lambda: defaultdict(list))
    _incoming: dict[str, list[CausalLink]] = field(default_factory=lambda: defaultdict(list))

    def add_entity(self, entity: Entity) -> None:
        """Add an entity to the graph."""
        self.entities[entity.id] = entity

    def add_link(self, link: CausalLink) -> None:
        """Add a causal link to the graph."""
        # Ensure both entities exist
        if link.source not in self.entities:
            raise ValueError(f"Source entity '{link.source}' not found in graph")
        if link.target not in self.entities:
            raise ValueError(f"Target entity '{link.target}' not found in graph")

        # Check for duplicate links
        for existing in self._outgoing[link.source]:
            if existing.target == link.target and existing.relationship == link.relationship:
                # Update existing link instead of adding duplicate
                self._outgoing[link.source].remove(existing)
                self._incoming[link.target].remove(existing)
                break

        self._outgoing[link.source].append(link)
        self._incoming[link.target].append(link)

    def get_entity(self, entity_id: str) -> Entity | None:
        """Get an entity by ID."""
        return self.entities.get(entity_id)

    def get_outgoing(self, entity_id: str) -> list[CausalLink]:
        """Get all outgoing links from an entity."""
        return self._outgoing.get(entity_id, [])

    def get_incoming(self, entity_id: str) -> list[CausalLink]:
        """Get all incoming links to an entity."""
        return self._incoming.get(entity_id, [])

    def get_link(self, source: str, target: str) -> CausalLink | None:
        """Get a specific link between two entities."""
        for link in self._outgoing.get(source, []):
            if link.target == target:
                return link
        return None

    def get_entities_by_type(self, entity_type: EntityType) -> list[Entity]:
        """Get all entities of a specific type."""
        return [e for e in self.entities.values() if e.type == entity_type]

    def get_entities_by_sector(self, sector: str) -> list[Entity]:
        """Get all entities in a specific sector."""
        return [e for e in self.entities.values() if e.sector == sector]

    def iter_links(self) -> Iterator[CausalLink]:
        """Iterate over all links in the graph."""
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
        """Get all entities within N hops of the given entity."""
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
        """Extract a subgraph containing only the specified entities."""
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

    def to_dict(self) -> dict:
        """Convert graph to dictionary for serialization."""
        return {
            "entities": [e.to_dict() for e in self.entities.values()],
            "links": [link.to_dict() for link in self.iter_links()],
        }

    @classmethod
    def from_dict(cls, data: dict) -> "CausalGraph":
        """Create graph from dictionary."""
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
        """Save graph to JSON file."""
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(self.to_dict(), f, indent=2)

    @classmethod
    def load(cls, path: str | Path) -> "CausalGraph":
        """Load graph from JSON file."""
        with open(path) as f:
            return cls.from_dict(json.load(f))

    def summary(self) -> str:
        """Get a summary of the graph."""
        entity_types = defaultdict(int)
        relationship_types = defaultdict(int)

        for entity in self.entities.values():
            entity_types[entity.type.value] += 1

        for link in self.iter_links():
            relationship_types[link.relationship.value] += 1

        lines = [
            f"Causal Graph Summary",
            f"=" * 40,
            f"Total Entities: {self.num_entities}",
            f"Total Links: {self.num_links}",
            f"",
            f"Entities by Type:",
        ]
        for etype, count in sorted(entity_types.items()):
            lines.append(f"  {etype}: {count}")

        lines.append("")
        lines.append("Links by Type:")
        for rtype, count in sorted(relationship_types.items()):
            lines.append(f"  {rtype}: {count}")

        return "\n".join(lines)

    def __repr__(self) -> str:
        return f"CausalGraph(entities={self.num_entities}, links={self.num_links})"


def merge_graphs(*graphs: CausalGraph) -> CausalGraph:
    """Merge multiple causal graphs into one."""
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
