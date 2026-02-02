#!/usr/bin/env python3
"""
Verify data integrity in the local database.

This script:
1. Counts entities and relationships
2. Breaks down by type
3. Checks for orphan links (links to non-existent entities)
4. Checks for duplicates
5. Prints a comprehensive summary

Usage:
    python scripts/verify_local_data.py          # Check local DB
    python scripts/verify_local_data.py --prod    # Check production DB (read-only)
    python scripts/verify_local_data.py --json    # Also verify JSON data files
"""

import sys
import json
import argparse
from pathlib import Path
from collections import Counter

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


LOCAL_DB_URL = "postgresql://localhost/consequence_ai_local"


def verify_json_files():
    """Verify all JSON data files in data/ directory."""
    data_dir = project_root / "data"

    print("\n" + "=" * 60)
    print("JSON DATA FILES")
    print("=" * 60)

    files_to_check = {
        "sp500_entities.json": "S&P 500 entities",
        "sec_relationships.json": "SEC supplier relationships",
        "correlations.json": "Price correlations",
        "verified_relationships.json": "Verified relationships",
        "wikipedia_competitors.json": "Wikipedia competitors",
        "etf_holdings.json": "ETF holdings",
        "macro_indicators.json": "Macro indicators",
    }

    total_entities = 0
    total_relationships = 0

    for filename, description in files_to_check.items():
        filepath = data_dir / filename
        if filepath.exists():
            with open(filepath) as f:
                data = json.load(f)

            if isinstance(data, list):
                count = len(data)
            elif isinstance(data, dict):
                # Handle nested structures
                if "relationships" in data:
                    count = len(data["relationships"])
                elif "results" in data:
                    count = len(data["results"])
                elif "entities" in data:
                    count = len(data["entities"])
                else:
                    count = len(data)
            else:
                count = 0

            # Classify as entity or relationship file
            if "entities" in filename or "sp500" in filename:
                total_entities += count
                print(f"  ✅ {filename}: {count} entries ({description})")
            else:
                total_relationships += count
                print(f"  ✅ {filename}: {count} entries ({description})")
        else:
            print(f"  ⚠️  {filename}: NOT FOUND ({description})")

    print(f"\n  📊 Total from JSON files: ~{total_entities} entities, ~{total_relationships} relationships")


def verify_database(db_url: str):
    """Verify data in a PostgreSQL database."""
    from sqlalchemy import create_engine, text

    print("\n" + "=" * 60)
    print(f"DATABASE: {db_url.split('@')[-1] if '@' in db_url else db_url}")
    print("=" * 60)

    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            # Entity counts
            result = conn.execute(text("SELECT COUNT(*) FROM entities"))
            entity_count = result.scalar()

            result = conn.execute(text("SELECT entity_type, COUNT(*) FROM entities GROUP BY entity_type ORDER BY COUNT(*) DESC"))
            entity_types = dict(result.fetchall())

            # Link counts
            result = conn.execute(text("SELECT COUNT(*) FROM causal_links"))
            link_count = result.scalar()

            result = conn.execute(text("SELECT relationship_type, COUNT(*) FROM causal_links GROUP BY relationship_type ORDER BY COUNT(*) DESC"))
            link_types = dict(result.fetchall())

            # Confidence distribution
            result = conn.execute(text("""
                SELECT
                    CASE
                        WHEN confidence > 0.7 THEN 'high'
                        WHEN confidence >= 0.5 THEN 'medium'
                        ELSE 'low'
                    END as level,
                    COUNT(*)
                FROM causal_links
                GROUP BY level
                ORDER BY level
            """))
            confidence_dist = dict(result.fetchall())

            # Data source distribution
            result = conn.execute(text("SELECT data_source, COUNT(*) FROM causal_links GROUP BY data_source ORDER BY COUNT(*) DESC"))
            data_sources = dict(result.fetchall())

            # Orphan check: links referencing non-existent entities
            result = conn.execute(text("""
                SELECT COUNT(*) FROM causal_links cl
                WHERE NOT EXISTS (SELECT 1 FROM entities e WHERE e.id = cl.source)
                   OR NOT EXISTS (SELECT 1 FROM entities e WHERE e.id = cl.target)
            """))
            orphan_count = result.scalar()

            # Duplicate check
            result = conn.execute(text("""
                SELECT source, target, relationship_type, COUNT(*) as cnt
                FROM causal_links
                GROUP BY source, target, relationship_type
                HAVING COUNT(*) > 1
            """))
            duplicates = result.fetchall()

            # Sector coverage
            result = conn.execute(text("SELECT sector, COUNT(*) FROM entities WHERE sector IS NOT NULL GROUP BY sector ORDER BY COUNT(*) DESC"))
            sectors = dict(result.fetchall())

        # Print results
        print(f"\n  📊 Entities: {entity_count}")
        for etype, count in entity_types.items():
            print(f"     - {etype}: {count}")

        print(f"\n  🔗 Relationships: {link_count}")
        for rtype, count in link_types.items():
            print(f"     - {rtype}: {count}")

        print(f"\n  📈 Confidence distribution:")
        for level, count in confidence_dist.items():
            print(f"     - {level}: {count}")

        print(f"\n  📦 Data sources:")
        for source, count in data_sources.items():
            print(f"     - {source or 'unknown'}: {count}")

        print(f"\n  🏭 Sector coverage: {len(sectors)} sectors")
        for sector, count in list(sectors.items())[:10]:
            print(f"     - {sector}: {count} companies")
        if len(sectors) > 10:
            print(f"     ... and {len(sectors) - 10} more sectors")

        # Integrity checks
        print(f"\n  🔍 Integrity checks:")
        if orphan_count == 0:
            print(f"     ✅ No orphan links")
        else:
            print(f"     ❌ {orphan_count} orphan links found!")

        if not duplicates:
            print(f"     ✅ No duplicate links")
        else:
            print(f"     ❌ {len(duplicates)} duplicate links found!")
            for dup in duplicates[:5]:
                print(f"        {dup[0]} → {dup[1]} ({dup[2]}): {dup[3]} copies")

        engine.dispose()

        return {
            "entities": entity_count,
            "links": link_count,
            "orphans": orphan_count,
            "duplicates": len(duplicates),
        }

    except Exception as e:
        print(f"\n  ❌ Failed to connect: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description="Verify data integrity")
    parser.add_argument("--prod", action="store_true", help="Check production database (read-only)")
    parser.add_argument("--json", action="store_true", help="Also verify JSON data files")
    parser.add_argument("--db-url", type=str, help="Custom database URL")
    args = parser.parse_args()

    print("=" * 60)
    print("DATA VERIFICATION REPORT")
    print("=" * 60)

    # Verify JSON files
    if args.json:
        verify_json_files()

    # Verify database
    if args.db_url:
        db_url = args.db_url
    elif args.prod:
        import os
        from dotenv import load_dotenv
        load_dotenv()
        db_url = os.getenv('DATABASE_URL', '')
        if db_url.startswith('postgres://'):
            db_url = db_url.replace('postgres://', 'postgresql://', 1)
        if not db_url:
            print("\n❌ No DATABASE_URL found in .env for production")
            sys.exit(1)
    else:
        db_url = LOCAL_DB_URL

    result = verify_database(db_url)

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    if result:
        print(f"  Entities: {result['entities']}")
        print(f"  Links: {result['links']}")
        issues = result['orphans'] + result['duplicates']
        if issues == 0:
            print(f"  Status: ✅ All checks passed")
        else:
            print(f"  Status: ⚠️  {issues} issue(s) found")
    else:
        print("  Status: ❌ Could not connect to database")
    print("=" * 60)


if __name__ == '__main__':
    main()
