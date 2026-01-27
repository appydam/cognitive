"""
Create missing entities needed for Microsoft relationships.

This script creates entities for:
- OpenAI (OPENAI)
- Dell Technologies (DELL)
- Hewlett Packard Enterprise (HPE)

These entities are needed to establish verified causal relationships with Microsoft.
"""

from datetime import datetime
import sys
from pathlib import Path
import os

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Set DATABASE_URL to Railway production database
# Note: This will be set by Railway environment, or can be passed as env var
if 'DATABASE_URL' not in os.environ:
    print("⚠️  Warning: DATABASE_URL not set. Using Railway production database.")
    print("   Make sure you have Railway CLI configured or set DATABASE_URL manually.")
    print()

from src.db.connection import init_db, get_db_session
from src.db.models import Entity


def create_missing_entities():
    """Create missing entities for Microsoft relationships."""

    # Initialize database
    init_db()

    entities_to_create = [
        {
            'id': 'OPENAI',
            'name': 'OpenAI',
            'entity_type': 'COMPANY',
            'sector': 'Technology',
            'market_cap': None,  # Private company
            'metadata': {
                'description': 'AI research and deployment company',
                'founded': 2015,
                'headquarters': 'San Francisco, CA',
                'industry': 'Artificial Intelligence',
                'private': True,
            },
        },
        {
            'id': 'DELL',
            'name': 'Dell Technologies Inc.',
            'entity_type': 'COMPANY',
            'sector': 'Technology',
            'market_cap': 75.0,  # Approximate market cap in billions (2025)
            'metadata': {
                'description': 'Computer technology company',
                'founded': 1984,
                'headquarters': 'Round Rock, TX',
                'industry': 'Computer Hardware & Cloud Infrastructure',
            },
        },
        {
            'id': 'HPE',
            'name': 'Hewlett Packard Enterprise Company',
            'entity_type': 'COMPANY',
            'sector': 'Technology',
            'market_cap': 28.0,  # Approximate market cap in billions (2025)
            'metadata': {
                'description': 'Enterprise technology company',
                'founded': 2015,  # Spun off from HP
                'headquarters': 'Spring, TX',
                'industry': 'Enterprise IT Infrastructure',
            },
        },
    ]

    print("=" * 70)
    print("Creating missing entities for Microsoft relationships")
    print("=" * 70)
    print()

    added_count = 0
    skipped_count = 0

    with get_db_session() as session:
        for entity_data in entities_to_create:
            # Check if entity already exists
            existing = session.query(Entity).filter_by(id=entity_data['id']).first()

            if existing:
                print(f"⏭️  Already exists: {entity_data['id']} - {entity_data['name']}")
                skipped_count += 1
                continue

            # Create new entity
            entity = Entity(
                id=entity_data['id'],
                name=entity_data['name'],
                entity_type=entity_data['entity_type'],
                sector=entity_data['sector'],
                market_cap=entity_data['market_cap'],
                metadata_json=entity_data['metadata'],
                created_at=datetime.utcnow(),
            )

            session.add(entity)
            print(f"✅ Created: {entity_data['id']} - {entity_data['name']}")
            print(f"   Type: {entity_data['entity_type']} | Sector: {entity_data['sector']}")
            print()
            added_count += 1

        if added_count > 0:
            session.commit()
            print(f"✅ Successfully created {added_count} new entity/entities")
        else:
            print("ℹ️  No new entities created")

        if skipped_count > 0:
            print(f"⏭️  Skipped {skipped_count} entity/entities (already exist)")

    print()
    print("=" * 70)
    print("Next step: Run add_msft_relationships.py to add causal links")
    print("=" * 70)
    print()


if __name__ == '__main__':
    create_missing_entities()
