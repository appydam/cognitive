"""
Add verified Microsoft (MSFT) causal relationships to the database.

This script adds only verified, documented business relationships for MSFT
based on public sources including SEC filings, earnings reports, and
official partnership announcements.

Data Sources:
- Microsoft 2025 Annual Report (10-K)
- Microsoft Investor Relations earnings reports
- Official partnership announcements from Microsoft, Dell, HPE, NVIDIA, AMD
- Industry analyst reports

All relationships include:
- Evidence citations
- Data source URLs
- Fiscal year/date of verification
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
from src.db.models import CausalLink, Entity


def add_msft_relationships():
    """Add verified Microsoft causal relationships to database."""

    # Verified relationships based on research
    relationships = [
        # MSFT supplies Azure services to OpenAI
        # Source: TechCrunch, The Register - November 2025 reports
        # OpenAI paid $865.8M to Microsoft in first 3 quarters of 2025
        # Estimated to pay $13B in total for 2025
        {
            'source': 'MSFT',
            'target': 'OPENAI',  # Note: May need to create this entity first
            'relationship_type': 'supplies',
            'strength': 0.70,  # High dependency - OpenAI uses exclusively Azure
            'delay_mean': 0.5,  # Same-day/hours correlation
            'delay_std': 0.2,
            'confidence': 0.85,  # Very high - documented recurring revenue
            'direction': 1.0,
            'evidence': [
                'OpenAI paid Microsoft $865.8M in first 3 quarters of FY2025',
                'Estimated $13B annual Azure spend by OpenAI in 2025',
                'OpenAI shares 20% of revenue with Microsoft until AGI',
            ],
            'data_source': 'partnership',
            'revenue_pct': None,  # OpenAI is customer, not measured as % of MSFT revenue
            'fiscal_year': 2025,
            'source_url': 'https://techcrunch.com/2025/11/14/leaked-documents-shed-light-into-how-much-openai-pays-microsoft/',
            'verified_date': datetime(2025, 11, 14),
        },

        # Dell and Microsoft hybrid cloud partnership
        # Source: Dell Technologies official announcement - December 2025
        {
            'source': 'MSFT',
            'target': 'DELL',
            'relationship_type': 'correlates_with',  # Partnership, not direct supply
            'strength': 0.40,  # Moderate - Dell integrates Azure Local
            'delay_mean': 2.0,
            'delay_std': 1.0,
            'confidence': 0.75,  # High - official partnership
            'direction': 1.0,
            'evidence': [
                'Dell PowerStore and Private Cloud integrated with Azure Local in 2025',
                'Customers deploying dozens to hundreds of Azure Local systems via Dell',
            ],
            'data_source': 'partnership',
            'source_url': 'https://siliconangle.com/2025/12/16/hybrid-ai-cloud-solutions-dell-microsoft-microsoftignite/',
            'verified_date': datetime(2025, 12, 16),
        },

        # HPE and Microsoft hybrid cloud partnership
        # Source: HPE official partnership page - 2025
        {
            'source': 'MSFT',
            'target': 'HPE',
            'relationship_type': 'correlates_with',  # Partnership
            'strength': 0.35,  # Moderate - HPE GreenLake integrates Azure
            'delay_mean': 2.0,
            'delay_std': 1.0,
            'confidence': 0.75,  # High - official partnership
            'direction': 1.0,
            'evidence': [
                'HPE GreenLake Flex Solution for Azure Local launched 2025',
                'Exclusive license bundle for HPE ProLiant Azure Local Systems',
            ],
            'data_source': 'partnership',
            'source_url': 'https://www.hpe.com/us/en/alliance/microsoft.html',
            'verified_date': datetime(2025, 1, 1),
        },
    ]

    # Note: These incoming relationships already exist in database
    # AMD -> MSFT (supplies, 0.18 strength)
    # NVDA -> MSFT (supplies, 0.15 strength)

    # Initialize database
    init_db()

    print("=" * 70)
    print("Adding verified Microsoft (MSFT) causal relationships")
    print("=" * 70)
    print()

    added_count = 0
    skipped_count = 0

    with get_db_session() as session:
        # Check if entities exist
        for rel in relationships:
            source_entity = session.query(Entity).filter_by(id=rel['source']).first()
            target_entity = session.query(Entity).filter_by(id=rel['target']).first()

            if not source_entity:
                print(f"⚠️  Skipping: Source entity '{rel['source']}' not found")
                skipped_count += 1
                continue

            if not target_entity:
                print(f"⚠️  Skipping: Target entity '{rel['target']}' not found")
                print(f"   → Need to create entity first: {rel['target']}")
                skipped_count += 1
                continue

            # Check if link already exists
            existing = session.query(CausalLink).filter_by(
                source=rel['source'],
                target=rel['target'],
                relationship_type=rel['relationship_type']
            ).first()

            if existing:
                print(f"⏭️  Already exists: {rel['source']} → {rel['target']} ({rel['relationship_type']})")
                skipped_count += 1
                continue

            # Add new link
            link = CausalLink(
                source=rel['source'],
                target=rel['target'],
                relationship_type=rel['relationship_type'],
                strength=rel['strength'],
                delay_mean=rel['delay_mean'],
                delay_std=rel['delay_std'],
                confidence=rel['confidence'],
                direction=rel['direction'],
                evidence=rel['evidence'],
                data_source=rel['data_source'],
                revenue_pct=rel.get('revenue_pct'),
                fiscal_year=rel.get('fiscal_year'),
                source_url=rel.get('source_url'),
                verified_date=rel.get('verified_date'),
                created_at=datetime.utcnow(),
            )

            session.add(link)
            print(f"✅ Added: {rel['source']} → {rel['target']}")
            print(f"   Type: {rel['relationship_type']}")
            print(f"   Strength: {rel['strength']:.2f} | Confidence: {rel['confidence']:.2f}")
            print(f"   Evidence: {rel['evidence'][0][:80]}...")
            print(f"   Source: {rel.get('source_url', 'N/A')}")
            print()
            added_count += 1

        if added_count > 0:
            session.commit()
            print(f"✅ Successfully added {added_count} new relationship(s)")
        else:
            print("ℹ️  No new relationships added")

        if skipped_count > 0:
            print(f"⏭️  Skipped {skipped_count} relationship(s)")

    print()
    print("=" * 70)
    print("Next Steps:")
    print("=" * 70)
    print("1. Create missing entities (if any):")
    print("   - OPENAI: OpenAI entity needs to be added to the database")
    print()
    print("2. Restart the backend to reload the graph:")
    print("   $ railway up")
    print()
    print("3. Test cascade effects:")
    print("   - Click MSFT in the explore graph")
    print("   - Click 'ANALYZE CASCADE'")
    print("   - Should now show more than 1 effect")
    print()


if __name__ == '__main__':
    add_msft_relationships()
