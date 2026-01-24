"""Load causal graph from PostgreSQL database."""

from ...core.graph import CausalGraph, Entity, CausalLink
from ...db.connection import get_db_session
from ...db.models import EntityModel, CausalLinkModel


def load_graph_from_database() -> CausalGraph:
    """Load graph from PostgreSQL database."""
    print("Loading graph from PostgreSQL database...")

    session = get_db_session()
    graph = CausalGraph()

    try:
        # Load entities
        entities = session.query(EntityModel).all()
        print(f"Loading {len(entities)} entities from database...")

        for entity_model in entities:
            entity = Entity(
                id=entity_model.id,
                entity_type=entity_model.type,
                name=entity_model.name,
                attributes=entity_model.metadata or {}
            )
            graph.add_entity(entity)

        # Load causal links
        links = session.query(CausalLinkModel).all()
        print(f"Loading {len(links)} causal links from database...")

        for link_model in links:
            link = CausalLink(
                source=link_model.source,
                target=link_model.target,
                relationship_type=link_model.relationship,
                strength=link_model.strength,
                delay_mean=link_model.delay_mean,
                delay_std=link_model.delay_std,
                confidence=link_model.confidence,
                direction=1.0,  # Positive direction by default
                evidence=link_model.evidence or [],
                historical_accuracy=1.0,  # Default to perfect accuracy
                observation_count=link_model.observation_count or 0
            )
            graph.add_link(link)

        print(f"Graph loaded successfully: {graph.num_entities} entities, {graph.num_links} links")
        return graph

    except Exception as e:
        print(f"Error loading graph from database: {e}")
        print("Falling back to build_initial_graph()")
        from ..builders.initial import build_initial_graph
        return build_initial_graph()
    finally:
        session.close()
