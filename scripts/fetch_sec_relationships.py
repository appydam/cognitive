#!/usr/bin/env python3
"""
Fetch supplier relationships from SEC 10-K filings.

This script:
1. Fetches 10-K filings for S&P 100 companies
2. Extracts major customer relationships (>10% revenue)
3. Caches results to data/sec_relationships.json
"""

import json
import time
from pathlib import Path
from datetime import datetime

from src.data.sec_edgar import (
    get_supplier_relationships,
    get_known_relationships,
    CustomerRelationship,
)

# S&P 100 component tickers (subset - top tech/industrial companies)
SP100_TICKERS = [
    # Tech
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "AVGO",
    "ORCL", "CRM", "ADBE", "CSCO", "INTC", "AMD", "QCOM", "TXN",
    "IBM", "NFLX", "PYPL",
    # Semiconductors & Equipment
    "TSM", "ASML", "LRCX", "AMAT", "KLAC", "MU", "ADI", "MCHP",
    # Consumer
    "WMT", "COST", "HD", "LOW", "TGT", "NKE", "SBUX", "MCD",
    # Healthcare
    "UNH", "JNJ", "LLY", "ABBV", "MRK", "PFE", "TMO", "ABT",
    # Financials
    "BRK-B", "JPM", "V", "MA", "BAC", "WFC",
    # Energy
    "XOM", "CVX",
    # Industrials
    "BA", "CAT", "GE", "HON", "UPS", "LMT",
    # Consumer Staples
    "PG", "KO", "PEP", "PM",
]


def fetch_all_relationships(
    tickers: list[str],
    use_cache: bool = True,
    max_companies: int = 20
) -> list[dict]:
    """
    Fetch supplier relationships for multiple companies.

    Args:
        tickers: List of stock tickers
        use_cache: If True, load from cache if exists
        max_companies: Maximum companies to fetch from SEC (rate limiting)

    Returns:
        List of relationship dicts
    """
    cache_file = Path("data/sec_relationships.json")

    # Load from cache if exists
    if use_cache and cache_file.exists():
        print(f"Loading relationships from cache: {cache_file}")
        with open(cache_file) as f:
            cached = json.load(f)
        print(f"Loaded {len(cached)} relationships from cache")
        return cached

    # Start with known relationships
    print("Starting with known relationships...")
    known = get_known_relationships()
    relationships = [
        {
            "supplier": rel.supplier_ticker,
            "customer": rel.customer_ticker or rel.customer_name,
            "customer_name": rel.customer_name,
            "revenue_pct": rel.revenue_percentage,
            "year": rel.year,
            "source": rel.source,
            "fetched_at": datetime.now().isoformat(),
        }
        for rel in known
    ]
    print(f"Starting with {len(relationships)} known relationships")

    # Fetch from SEC (limited to avoid rate limits)
    print(f"\nFetching from SEC EDGAR (max {max_companies} companies)...")
    print("This may take several minutes due to SEC rate limiting (10 req/sec)...")

    fetched_count = 0
    for i, ticker in enumerate(tickers[:max_companies], 1):
        print(f"\n[{i}/{min(len(tickers), max_companies)}] Fetching {ticker}...")

        try:
            sec_rels = get_supplier_relationships(ticker)

            for rel in sec_rels:
                # Skip if we already have this relationship
                existing = any(
                    r["supplier"] == rel.supplier_ticker
                    and r["customer"] == (rel.customer_ticker or rel.customer_name)
                    for r in relationships
                )

                if not existing and rel.revenue_percentage:
                    relationships.append({
                        "supplier": rel.supplier_ticker,
                        "customer": rel.customer_ticker or rel.customer_name,
                        "customer_name": rel.customer_name,
                        "revenue_pct": rel.revenue_percentage,
                        "year": rel.year,
                        "source": rel.source,
                        "fetched_at": datetime.now().isoformat(),
                    })
                    print(f"  ✓ Found: {rel.customer_name} = {rel.revenue_percentage}%")

            fetched_count += 1

            # Rate limit: SEC allows 10 requests/sec, we'll do 2/sec to be safe
            time.sleep(0.5)

        except Exception as e:
            print(f"  ✗ Error fetching {ticker}: {e}")
            continue

    print(f"\n✓ Fetched relationships from {fetched_count} companies")
    print(f"✓ Total relationships: {len(relationships)}")

    # Save to cache
    cache_file.parent.mkdir(parents=True, exist_ok=True)
    with open(cache_file, "w") as f:
        json.dump(relationships, f, indent=2)
    print(f"✓ Saved to cache: {cache_file}")

    return relationships


def print_summary(relationships: list[dict]) -> None:
    """Print summary statistics."""
    print("\n" + "=" * 60)
    print("SEC RELATIONSHIPS SUMMARY")
    print("=" * 60)

    print(f"\nTotal relationships: {len(relationships)}")

    # Count by source
    sources = {}
    for rel in relationships:
        source = rel.get("source", "Unknown")
        sources[source] = sources.get(source, 0) + 1

    print("\nBy source:")
    for source, count in sorted(sources.items(), key=lambda x: -x[1]):
        print(f"  {source}: {count}")

    # Top suppliers (most relationships)
    suppliers = {}
    for rel in relationships:
        supplier = rel["supplier"]
        suppliers[supplier] = suppliers.get(supplier, 0) + 1

    print("\nTop suppliers (most customers):")
    for supplier, count in sorted(suppliers.items(), key=lambda x: -x[1])[:10]:
        print(f"  {supplier}: {count} customers")

    # High dependency relationships (>20% revenue)
    high_dep = [r for r in relationships if r.get("revenue_pct", 0) > 20]
    print(f"\nHigh dependency relationships (>20% revenue): {len(high_dep)}")
    for rel in sorted(high_dep, key=lambda x: -x.get("revenue_pct", 0))[:10]:
        print(
            f"  {rel['supplier']} → {rel['customer']}: "
            f"{rel['revenue_pct']:.1f}% ({rel['source']})"
        )


def main():
    """Main entry point."""
    print("Fetching SEC supplier relationships...")
    print("=" * 60)

    # Fetch relationships
    # Start with max_companies=20 to avoid long wait times
    # Set to higher number or len(SP100_TICKERS) for full S&P 100
    relationships = fetch_all_relationships(
        SP100_TICKERS,
        use_cache=True,
        max_companies=len(SP100_TICKERS)  # Fetch all SP100 companies
    )

    # Print summary
    print_summary(relationships)

    print("\n" + "=" * 60)
    print("✓ Done! Relationships cached to data/sec_relationships.json")
    print("=" * 60)


if __name__ == "__main__":
    main()
