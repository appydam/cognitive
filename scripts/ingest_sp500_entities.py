#!/usr/bin/env python3
"""
Ingest S&P 500 entities from Wikipedia + Yahoo Finance.

This script:
1. Scrapes the S&P 500 table from Wikipedia (name, sector, sub-industry)
2. Optionally enriches with market cap from yfinance (slow, rate-limited)
3. Saves to data/sp500_entities.json

Usage:
    python scripts/ingest_sp500_entities.py                 # Wikipedia only (fast)
    python scripts/ingest_sp500_entities.py --enrich         # Also fetch market caps from yfinance
    python scripts/ingest_sp500_entities.py --use-cache      # Skip if cache exists
    python scripts/ingest_sp500_entities.py --limit 50       # Only process first N
"""

import json
import sys
import time
import argparse
from pathlib import Path
from datetime import datetime

import pandas as pd

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.data.yahoo_finance import TOP_100_TICKERS


OUTPUT_FILE = Path("data/sp500_entities.json")

# Sector name mapping (GICS sector → shorter form used in existing code)
SECTOR_MAP = {
    "Information Technology": "Technology",
    "Communication Services": "Communication Services",
    "Consumer Discretionary": "Consumer Discretionary",
    "Consumer Staples": "Consumer Staples",
    "Health Care": "Healthcare",
    "Financials": "Financials",
    "Industrials": "Industrials",
    "Energy": "Energy",
    "Materials": "Materials",
    "Real Estate": "Real Estate",
    "Utilities": "Utilities",
}


def fetch_sp500_from_wikipedia() -> list[dict]:
    """
    Scrape S&P 500 companies from Wikipedia.

    Returns:
        List of entity dicts with id, name, sector, industry
    """
    print("Fetching S&P 500 from Wikipedia...")

    url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"

    try:
        tables = pd.read_html(
            url,
            header=0,
            attrs={"id": "constituents"},
        )
        df = tables[0]
    except Exception as e:
        print(f"  Failed with default method: {e}")
        print("  Trying with requests + user-agent...")

        import requests
        from io import StringIO

        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ConsequenceAI/1.0"
        }
        resp = requests.get(url, headers=headers)
        resp.raise_for_status()
        tables = pd.read_html(StringIO(resp.text))
        df = tables[0]

    entities = []
    for _, row in df.iterrows():
        ticker = str(row["Symbol"]).replace(".", "-")  # BRK.B -> BRK-B
        name = str(row["Security"])
        gics_sector = str(row.get("GICS Sector", ""))
        gics_sub_industry = str(row.get("GICS Sub-Industry", ""))
        hq = str(row.get("Headquarters Location", ""))
        date_added = str(row.get("Date added", ""))
        cik = str(row.get("CIK", ""))

        sector = SECTOR_MAP.get(gics_sector, gics_sector)

        entities.append({
            "id": ticker,
            "name": name,
            "entity_type": "company",
            "sector": sector if sector and sector != "nan" else None,
            "industry": gics_sub_industry if gics_sub_industry != "nan" else None,
            "market_cap": None,  # Filled by --enrich
            "country": "US",
            "headquarters": hq if hq != "nan" else None,
            "date_added_to_sp500": date_added if date_added != "nan" else None,
            "cik": cik if cik != "nan" else None,
        })

    print(f"  ✓ Found {len(entities)} S&P 500 companies from Wikipedia")
    return entities


def add_top100_extras(entities: list[dict]) -> list[dict]:
    """Add any TOP_100_TICKERS not already in the S&P 500 list."""
    existing_ids = {e["id"] for e in entities}
    added = 0

    for ticker in TOP_100_TICKERS:
        if ticker not in existing_ids:
            entities.append({
                "id": ticker,
                "name": ticker,  # Will be enriched later
                "entity_type": "company",
                "sector": None,
                "industry": None,
                "market_cap": None,
                "country": "US",
            })
            added += 1

    if added:
        print(f"  ✓ Added {added} additional tickers from TOP_100")
    return entities


def enrich_with_yfinance(entities: list[dict], limit: int = 0) -> list[dict]:
    """
    Enrich entities with market cap data from yfinance.
    This is slow and rate-limited, so it's optional.
    """
    from src.data.yahoo_finance import get_stock_info

    to_process = entities[:limit] if limit > 0 else entities
    print(f"\nEnriching {len(to_process)} entities with yfinance data...")

    enriched = 0
    failed = 0

    for i, entity in enumerate(to_process, 1):
        ticker = entity["id"]
        if entity.get("market_cap"):
            continue  # Already has market cap

        print(f"  [{i}/{len(to_process)}] {ticker}...", end="", flush=True)

        info = get_stock_info(ticker)
        if info:
            entity["market_cap"] = info.market_cap
            if not entity.get("name") or entity["name"] == ticker:
                entity["name"] = info.name
            if not entity.get("sector") and info.sector:
                entity["sector"] = info.sector
            if not entity.get("industry") and info.industry:
                entity["industry"] = info.industry
            enriched += 1
            print(f" ✓ (mcap: ${info.market_cap / 1e9:.0f}B)" if info.market_cap else " ✓")
        else:
            failed += 1
            print(" ✗")

        # Rate limiting - increase delays to avoid 429s
        if i % 5 == 0:
            time.sleep(3)
        else:
            time.sleep(1)

    print(f"\n  ✓ Enriched {enriched} entities, {failed} failed")
    return entities


def ingest_sp500_entities(limit: int = 0, use_cache: bool = False, enrich: bool = False) -> list[dict]:
    """
    Main ingestion function.

    Args:
        limit: Max tickers to process (0 = all)
        use_cache: Skip if output file already exists
        enrich: Fetch market caps from yfinance (slow)

    Returns:
        List of entity dicts
    """
    if use_cache and OUTPUT_FILE.exists():
        print(f"Loading from cache: {OUTPUT_FILE}")
        with open(OUTPUT_FILE) as f:
            cached = json.load(f)
        entities = cached.get("entities", cached if isinstance(cached, list) else [])
        print(f"Loaded {len(entities)} entities from cache")
        return entities

    # Step 1: Get S&P 500 from Wikipedia (fast, no rate limits)
    entities = fetch_sp500_from_wikipedia()

    # Step 2: Add any extra TOP_100 tickers
    entities = add_top100_extras(entities)

    if limit > 0:
        entities = entities[:limit]
        print(f"Limiting to first {limit} entities")

    # Step 3: Optionally enrich with yfinance (slow)
    if enrich:
        entities = enrich_with_yfinance(entities, limit=limit)

    # Summary
    sectors = {}
    for e in entities:
        s = e.get("sector") or "Unknown"
        sectors[s] = sectors.get(s, 0) + 1

    print(f"\n✓ Total entities: {len(entities)}")
    print("\nSector breakdown:")
    for sector, count in sorted(sectors.items(), key=lambda x: -x[1]):
        print(f"  {sector}: {count}")

    # Save to file
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    output_data = {
        "metadata": {
            "source": "Wikipedia S&P 500 list + TOP_100_TICKERS",
            "fetched_at": datetime.now().isoformat(),
            "total_entities": len(entities),
            "enriched_with_yfinance": enrich,
        },
        "entities": entities,
    }

    with open(OUTPUT_FILE, "w") as f:
        json.dump(output_data, f, indent=2)
    print(f"\n✓ Saved to {OUTPUT_FILE}")

    return entities


def main():
    parser = argparse.ArgumentParser(description="Ingest S&P 500 entities")
    parser.add_argument("--use-cache", action="store_true", help="Skip if cache exists")
    parser.add_argument("--limit", type=int, default=0, help="Max tickers to process (0 = all)")
    parser.add_argument("--enrich", action="store_true", help="Fetch market caps from yfinance (slow)")
    args = parser.parse_args()

    print("=" * 60)
    print("S&P 500 Entity Ingestion")
    print("=" * 60)

    entities = ingest_sp500_entities(
        limit=args.limit,
        use_cache=args.use_cache,
        enrich=args.enrich,
    )

    print("\n" + "=" * 60)
    print(f"✓ Done! {len(entities)} entities saved to {OUTPUT_FILE}")
    print("=" * 60)


if __name__ == "__main__":
    main()
