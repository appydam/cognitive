#!/usr/bin/env python3
"""
Validate data quality for production readiness.

This script:
1. Loads verified relationships
2. Validates each data point
3. Generates quality report
4. Identifies data that needs verification
"""

from src.data.data_quality import (
    load_verified_relationships,
    generate_data_quality_report,
    print_quality_report,
)


def main():
    """Main entry point."""
    print("Data Quality Validation")
    print("=" * 60)

    try:
        # Load verified relationships
        relationships, metadata = load_verified_relationships()

        print(f"\nLoaded {len(relationships)} verified relationships")
        print(f"Data version: {metadata.get('version', 'unknown')}")
        print(f"Last updated: {metadata.get('last_updated', 'unknown')}")

        # Generate quality report
        report = generate_data_quality_report(relationships)

        # Print report
        print_quality_report(report)

        # Production readiness assessment
        print("\nPRODUCTION READINESS ASSESSMENT")
        print("=" * 60)

        if report["production_ready_pct"] >= 80:
            print("✅ PASS: Data quality meets production standards (≥80% ready)")
        elif report["production_ready_pct"] >= 60:
            print("⚠️  CAUTION: Data quality is acceptable but needs improvement")
        else:
            print("❌ FAIL: Data quality does not meet production standards")

        print(f"\nProduction-ready relationships: {report['production_ready']}/{report['total_relationships']}")

        # Recommendations
        print("\nRECOMMENDATIONS:")
        if report["by_confidence"]["low"] > 0:
            print(f"  - Verify {report['by_confidence']['low']} LOW confidence relationships")
        if report["by_confidence"]["unknown"] > 0:
            print(f"  - Add confidence levels to {report['by_confidence']['unknown']} relationships")
        if report["by_freshness"]["stale"] + report["by_freshness"]["outdated"] > 0:
            stale_count = report["by_freshness"]["stale"] + report["by_freshness"]["outdated"]
            print(f"  - Update {stale_count} stale/outdated relationships")
        if report["needs_verification"] > 0:
            print(f"  - Add source documentation to {report['needs_verification']} relationships")

        print("\n" + "=" * 60)

    except FileNotFoundError as e:
        print(f"\n❌ ERROR: {e}")
        print("\nTo create verified relationships file:")
        print("  1. Review data/verified_relationships.json template")
        print("  2. Verify each relationship from primary sources")
        print("  3. Add source URLs and verification dates")


if __name__ == "__main__":
    main()
