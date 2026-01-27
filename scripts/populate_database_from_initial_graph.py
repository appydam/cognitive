"""
Populate database with all entities and relationships from build_initial_graph().

This script ensures the database has all the entities and causal links that were
previously generated in-memory by build_initial_graph(), so the backend can load
the complete graph from the database instead of generating it on every startup.
"""

from datetime import datetime
import sys
from pathlib import Path
import os

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.db.connection import init_db, get_db_session
from src.db.models import Entity as EntityModel, CausalLink as CausalLinkModel
from src.graph.builders.initial import build_initial_graph


def populate_database():
    """Populate database with initial graph data."""

    print("=" * 70)
    print("Populating database from build_initial_graph()")
    print("=" * 70)
    print()

    # Initialize database
    init_db()

    # Build the initial graph (in-memory)
    print("Building initial graph in memory...")
    graph = build_initial_graph()
    print(f"Graph built: {graph.num_entities} entities, {graph.num_links} links")
    print()

    entities_added = 0
    entities_skipped = 0
    links_added = 0
    links_skipped = 0

    with get_db_session() as session:
        # Add entities
        print("Adding entities to database...")
        for entity_id, entity in graph.entities.items():
            existing = session.query(EntityModel).filter_by(id=entity_id).first()
            if existing:
                entities_skipped += 1
                continue

            db_entity = EntityModel(
                id=entity.id,
                name=entity.name,
                entity_type=entity.entity_type,
                sector=entity.attributes.get('sector'),
                market_cap=entity.attributes.get('market_cap'),
                metadata_json=entity.attributes,
                created_at=datetime.utcnow(),
            )
            session.add(db_entity)
            entities_added += 1

            if entities_added % 10 == 0:
                print(f"  Added {entities_added} entities...")

        session.commit()
        print(f"✅ Added {entities_added} entities (skipped {entities_skipped} existing)")
        print()

        # Add causal links
        print("Adding causal links to database...")
        for link in graph.iter_links():
            # Check if link already exists
            existing = session.query(CausalLinkModel).filter_by(
                source=link.source,
                target=link.target,
                relationship_type=link.relationship_type
            ).first()

            if existing:
                links_skipped += 1
                continue

            db_link = CausalLinkModel(
                source=link.source,
                target=link.target,
                relationship_type=link.relationship_type,
                strength=link.strength,
                delay_mean=link.delay_mean,
                delay_std=link.delay_std,
                confidence=link.confidence,
                direction=link.direction,
                evidence=link.evidence,
                data_source='initial_graph',  # Mark as from initial graph
                historical_accuracy=link.historical_accuracy,
                observation_count=link.observation_count,
                created_at=datetime.utcnow(),
            )
            session.add(db_link)
            links_added += 1

            if links_added % 20 == 0:
                print(f"  Added {links_added} links...")

        session.commit()
        print(f"✅ Added {links_added} links (skipped {links_skipped} existing)")
        print()

    print("=" * 70)
    print("Database population complete!")
    print("=" * 70)
    print(f"Total entities in graph: {graph.num_entities}")
    print(f"Total links in graph: {graph.num_links}")
    print()
    print("Next step: Restart backend to reload graph from database")
    print("  Backend will now load the complete graph from PostgreSQL")
    print()


if __name__ == '__main__':
    populate_database()
