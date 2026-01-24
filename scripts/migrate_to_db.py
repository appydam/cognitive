#!/usr/bin/env python3
"""Migrate existing data to PostgreSQL database.

This script:
1. Creates database tables
2. Loads verified relationships from JSON
3. Populates entities and causal_links tables
4. Validates migration

Usage:
    python scripts/migrate_to_db.py --database-url postgresql://user:pass@host/dbname
    python scripts/migrate_to_db.py --dry-run  # Test without writing
"""

import argparse
import json
import os
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.db.connection import init_db, get_db_session, create_tables
from src.db.models import Entity, CausalLink


def load_verified_relationships(file_path: str = "data/verified_relationships.json") -> dict:
    """Load verified relationships from JSON file."""
    with open(file_path, 'r') as f:
        data = json.load(f)
    return data


def create_entity_if_not_exists(session, ticker: str, entity_data: dict = None) -> Entity:
    """Create entity if it doesn't exist in database.

    Args:
        session: Database session
        ticker: Ticker symbol
        entity_data: Optional entity metadata

    Returns:
        Entity instance
    """
    entity = session.query(Entity).filter_by(id=ticker).first()

    if entity:
        return entity

    # Create new entity
    entity = Entity(
        id=ticker,
        name=entity_data.get('name', ticker) if entity_data else ticker,
        entity_type=entity_data.get('entity_type', 'COMPANY') if entity_data else 'COMPANY',
        sector=entity_data.get('sector') if entity_data else None,
        market_cap=entity_data.get('market_cap') if entity_data else None,
        metadata_json=entity_data.get('metadata', {}) if entity_data else {}
    )

    session.add(entity)
    return entity


def migrate_verified_relationships(data: dict, session, dry_run: bool = False):
    """Migrate verified relationships to database.

    Args:
        data: Verified relationships data
        session: Database session
        dry_run: If True, don't commit changes
    """
    relationships = data.get('relationships', [])

    print(f"\n{'DRY RUN: ' if dry_run else ''}Migrating {len(relationships)} verified relationships...")

    entities_created = 0
    links_created = 0
    links_updated = 0

    for rel in relationships:
        supplier = rel['supplier']
        customer = rel['customer']

        # Create entities if they don't exist
        supplier_entity = create_entity_if_not_exists(session, supplier)
        if supplier_entity.id == supplier and supplier_entity not in session.new:
            pass  # Already exists
        else:
            entities_created += 1
            session.flush()  # Flush immediately to avoid duplicates

        customer_entity = create_entity_if_not_exists(session, customer)
        if customer_entity.id == customer and customer_entity not in session.new:
            pass  # Already exists
        else:
            entities_created += 1
            session.flush()  # Flush immediately to avoid duplicates

        # Create or update causal link
        existing_link = session.query(CausalLink).filter_by(
            source=supplier,
            target=customer,
            relationship_type='supplies'
        ).first()

        if existing_link:
            # Update existing link
            existing_link.strength = rel['revenue_pct'] / 100.0  # Convert to 0-1
            existing_link.confidence = 0.85 if rel['confidence'] == 'high' else 0.6
            existing_link.revenue_pct = rel['revenue_pct']
            existing_link.fiscal_year = rel['fiscal_year']
            existing_link.source_url = rel.get('source_url')
            existing_link.verified_date = datetime.fromisoformat(rel['verified_date']) if rel.get('verified_date') else None
            existing_link.evidence = [rel.get('source', '')]
            existing_link.data_source = 'sec_filing'
            links_updated += 1
        else:
            # Create new link
            link = CausalLink(
                source=supplier,
                target=customer,
                relationship_type='supplies',
                strength=rel['revenue_pct'] / 100.0,  # Convert to 0-1
                delay_mean=1.0,  # Default 1 day delay
                delay_std=0.5,
                confidence=0.85 if rel['confidence'] == 'high' else 0.6,
                direction=1.0,  # Positive relationship
                evidence=[rel.get('source', '')],
                data_source='sec_filing',
                revenue_pct=rel['revenue_pct'],
                fiscal_year=rel['fiscal_year'],
                source_url=rel.get('source_url'),
                verified_date=datetime.fromisoformat(rel['verified_date']) if rel.get('verified_date') else None
            )
            session.add(link)
            links_created += 1

    if not dry_run:
        session.commit()
        print(f"\n✅ Migration complete:")
    else:
        print(f"\n📝 Dry run complete (no changes committed):")

    print(f"   Entities created: {entities_created}")
    print(f"   Links created: {links_created}")
    print(f"   Links updated: {links_updated}")
    print(f"   Total relationships: {links_created + links_updated}")


def validate_migration(session):
    """Validate migration was successful."""
    entity_count = session.query(Entity).count()
    link_count = session.query(CausalLink).count()

    print(f"\n📊 Database validation:")
    print(f"   Entities in database: {entity_count}")
    print(f"   Links in database: {link_count}")

    # Sample a few relationships
    print(f"\n🔍 Sample relationships:")
    sample_links = session.query(CausalLink).limit(5).all()
    for link in sample_links:
        print(f"   {link.source} → {link.target}: {link.strength*100:.1f}% ({link.confidence:.2f} confidence)")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Migrate data to PostgreSQL")
    parser.add_argument('--database-url', type=str, help='PostgreSQL connection string')
    parser.add_argument('--dry-run', action='store_true', help='Test without committing changes')
    parser.add_argument('--data-file', type=str, default='data/verified_relationships.json',
                       help='Path to verified relationships JSON file')

    args = parser.parse_args()

    print("=" * 60)
    print("Consequence AI - Database Migration")
    print("=" * 60)

    # Get database URL
    database_url = args.database_url or os.getenv('DATABASE_URL')

    if not database_url:
        print("\n⚠️  No database URL provided.")
        print("   Set DATABASE_URL environment variable or use --database-url")
        print("   Example: --database-url postgresql://user:pass@localhost/consequence_ai")
        sys.exit(1)

    # Initialize database
    print(f"\n1. Connecting to database...")
    print(f"   URL: {database_url.split('@')[1] if '@' in database_url else database_url}")

    try:
        init_db(database_url)
        print("   ✅ Connected")
    except Exception as e:
        print(f"   ❌ Connection failed: {e}")
        sys.exit(1)

    # Create tables
    print(f"\n2. Creating database schema...")
    try:
        create_tables()
    except Exception as e:
        print(f"   ⚠️  Tables may already exist: {e}")

    # Load verified relationships
    print(f"\n3. Loading verified relationships...")
    try:
        data = load_verified_relationships(args.data_file)
        print(f"   ✅ Loaded {data['metadata']['total_relationships']} relationships")
        print(f"   Version: {data['metadata']['version']}")
        print(f"   Last updated: {data['metadata']['last_updated']}")
    except Exception as e:
        print(f"   ❌ Failed to load data: {e}")
        sys.exit(1)

    # Migrate data
    with get_db_session() as session:
        migrate_verified_relationships(data, session, dry_run=args.dry_run)

        if not args.dry_run:
            validate_migration(session)

    print("\n" + "=" * 60)
    if args.dry_run:
        print("Dry run complete. Use without --dry-run to apply changes.")
    else:
        print("Migration complete!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
