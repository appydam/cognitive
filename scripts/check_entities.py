"""Check if required entities exist in the database."""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.db.connection import init_db, get_db_session
from src.db.models import Entity


def check_entities():
    """Check which entities exist in the database."""

    # Initialize database connection
    init_db()

    entities_to_check = ['MSFT', 'OPENAI', 'DELL', 'HPE']

    print("Checking which entities exist in the database...")
    print()

    with get_db_session() as session:
        for entity_id in entities_to_check:
            entity = session.query(Entity).filter_by(id=entity_id).first()
            if entity:
                print(f'✅ {entity_id:10} → {entity.name:40} ({entity.entity_type})')
            else:
                print(f'❌ {entity_id:10} → NOT FOUND')

    print()


if __name__ == '__main__':
    check_entities()
