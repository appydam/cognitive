#!/usr/bin/env python3
"""
Set up a local PostgreSQL database for testing data expansion.

This script:
1. Creates a local database 'consequence_ai_local'
2. Creates all tables using SQLAlchemy models
3. Does NOT touch the production database

Usage:
    python scripts/setup_local_db.py
    python scripts/setup_local_db.py --reset  # Drop and recreate all tables
"""

import sys
import argparse
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import subprocess


LOCAL_DB_NAME = "consequence_ai_local"
LOCAL_DB_URL = f"postgresql://localhost/{LOCAL_DB_NAME}"


def create_database():
    """Create the local PostgreSQL database if it doesn't exist."""
    # Check if database exists
    result = subprocess.run(
        ["psql", "-l"],
        capture_output=True, text=True
    )

    if LOCAL_DB_NAME in result.stdout:
        print(f"✅ Database '{LOCAL_DB_NAME}' already exists")
        return True

    # Create database
    print(f"Creating database '{LOCAL_DB_NAME}'...")
    result = subprocess.run(
        ["createdb", LOCAL_DB_NAME],
        capture_output=True, text=True
    )

    if result.returncode != 0:
        print(f"❌ Failed to create database: {result.stderr}")
        return False

    print(f"✅ Database '{LOCAL_DB_NAME}' created successfully")
    return True


def create_tables(reset: bool = False):
    """Create all tables in the local database."""
    import os
    os.environ['DATABASE_URL'] = LOCAL_DB_URL

    from src.db.connection import init_db, create_tables as _create_tables, reset_database

    engine = init_db(LOCAL_DB_URL)

    if reset:
        print("⚠️  Resetting database (dropping all tables)...")
        reset_database(engine)
    else:
        _create_tables(engine)

    print(f"✅ Tables created in '{LOCAL_DB_NAME}'")


def verify_setup():
    """Verify the local database is properly set up."""
    from sqlalchemy import create_engine, inspect

    engine = create_engine(LOCAL_DB_URL)
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    print(f"\n📊 Local database '{LOCAL_DB_NAME}' status:")
    print(f"   Tables: {len(tables)}")
    for table in sorted(tables):
        print(f"   - {table}")

    expected_tables = [
        'entities', 'causal_links', 'predictions', 'outcomes',
        'earnings_events', 'backtest_runs', 'backtest_results',
        'user_notification_preferences'
    ]

    missing = [t for t in expected_tables if t not in tables]
    if missing:
        print(f"\n⚠️  Missing tables: {', '.join(missing)}")
    else:
        print(f"\n✅ All {len(expected_tables)} expected tables present")

    engine.dispose()


def main():
    parser = argparse.ArgumentParser(description="Set up local PostgreSQL database for testing")
    parser.add_argument("--reset", action="store_true", help="Drop and recreate all tables")
    args = parser.parse_args()

    print("=" * 60)
    print("Setting up local database for data expansion testing")
    print("=" * 60)
    print(f"Database: {LOCAL_DB_NAME}")
    print(f"URL: {LOCAL_DB_URL}")
    print()

    # Step 1: Create database
    if not create_database():
        sys.exit(1)

    # Step 2: Create tables
    create_tables(reset=args.reset)

    # Step 3: Verify
    verify_setup()

    print()
    print("=" * 60)
    print("✅ Local database setup complete!")
    print("=" * 60)
    print()
    print("To use the local database:")
    print(f"  export DATABASE_URL={LOCAL_DB_URL}")
    print("  python scripts/populate_database_from_initial_graph.py --local")
    print()


if __name__ == '__main__':
    main()
