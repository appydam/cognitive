"""
Populate database with entities and relationships from the graph builder.

Supports both the initial graph (legacy) and the expanded real data graph.

Usage:
    python scripts/populate_database_from_initial_graph.py             # Production DB, initial graph
    python scripts/populate_database_from_initial_graph.py --local     # Local DB, real data graph
    python scripts/populate_database_from_initial_graph.py --local --reset  # Reset local DB first
    python scripts/populate_database_from_initial_graph.py --local --legacy # Local DB, initial graph
"""

from datetime import datetime
import sys
import argparse
from pathlib import Path
import os

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

LOCAL_DB_URL = "postgresql://localhost/consequence_ai_local"


def populate_database(db_url: str = None, use_real_data: bool = True, reset: bool = False):
    """Populate database with graph data.

    Args:
        db_url: Database URL (None = use default from env)
        use_real_data: If True, use build_graph_from_real_data(); else build_initial_graph()
        reset: If True, drop and recreate all tables first
    """
    # Set DATABASE_URL if provided
    if db_url:
        os.environ['DATABASE_URL'] = db_url

    from src.db.connection import init_db, get_db_session, reset_database
    from src.db.models import Entity as EntityModel, CausalLink as CausalLinkModel

    graph_source = "real data (expanded)" if use_real_data else "initial graph (legacy)"

    print("=" * 70)
    print(f"Populating database from {graph_source}")
    print(f"Database: {db_url or 'default (from env)'}")
    print("=" * 70)
    print()

    # Initialize database
    engine = init_db(db_url) if db_url else init_db()

    if reset:
        print("⚠️  Resetting database (dropping all tables)...")
        reset_database(engine)
        print()

    # Build graph in memory
    print("Building graph in memory...")
    if use_real_data:
        from src.graph.builders.real_data import build_graph_from_real_data
        graph = build_graph_from_real_data()
    else:
        from src.graph.builders.initial import build_initial_graph
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

            if entities_added % 50 == 0:
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
                data_source=link.source_type or 'real_data',
                historical_accuracy=link.historical_accuracy,
                observation_count=link.observation_count,
                created_at=datetime.utcnow(),
            )
            session.add(db_link)
            links_added += 1

            if links_added % 50 == 0:
                print(f"  Added {links_added} links...")

        session.commit()
        print(f"✅ Added {links_added} links (skipped {links_skipped} existing)")
        print()

    print("=" * 70)
    print("Database population complete!")
    print("=" * 70)
    print(f"Total entities in graph: {graph.num_entities}")
    print(f"Total links in graph: {graph.num_links}")
    print(f"Entities added to DB: {entities_added}")
    print(f"Links added to DB: {links_added}")
    print()
    print("Next step: Restart backend to reload graph from database")
    print()


def main():
    parser = argparse.ArgumentParser(description="Populate database with graph data")
    parser.add_argument("--local", action="store_true",
                        help="Use local database (consequence_ai_local)")
    parser.add_argument("--reset", action="store_true",
                        help="Drop and recreate all tables first")
    parser.add_argument("--legacy", action="store_true",
                        help="Use legacy initial graph instead of real data graph")
    parser.add_argument("--db-url", type=str,
                        help="Custom database URL")
    args = parser.parse_args()

    db_url = args.db_url or (LOCAL_DB_URL if args.local else None)
    use_real_data = not args.legacy

    if not args.local and not args.db_url and not args.legacy:
        print("⚠️  No --local flag specified. This will use the default DATABASE_URL.")
        print("   Use --local to target the local test database.")
        print("   Press Ctrl+C to cancel, or Enter to continue...")
        try:
            input()
        except KeyboardInterrupt:
            print("\nCancelled.")
            sys.exit(0)

    populate_database(db_url=db_url, use_real_data=use_real_data, reset=args.reset)


if __name__ == '__main__':
    main()
