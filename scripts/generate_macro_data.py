#!/usr/bin/env python3
"""Generate macro economic indicator data and correlations.

This script:
1. Fetches macro indicator data from FRED and Yahoo Finance
2. Calculates correlations with stock tickers
3. Saves entities to data/macro_indicators.json
4. Saves correlations to data/macro_correlations.json

Usage:
    # Generate correlations with top 50 S&P 500 stocks
    python scripts/generate_macro_data.py --stock-limit 50

    # Generate correlations with top 100 stocks
    python scripts/generate_macro_data.py --stock-limit 100

    # Use custom correlation thresholds
    python scripts/generate_macro_data.py --min-correlation 0.20 --max-p-value 0.01

Requirements:
    - FRED_API_KEY must be set in .env file
    - Internet connection for API access
"""

import argparse
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.data.macro_indicators import generate_macro_relationships
from src.data.yahoo_finance import get_sp500_tickers, TOP_100_TICKERS


def main():
    """Main entry point for macro data generation."""
    parser = argparse.ArgumentParser(
        description="Generate macro economic indicator data and correlations",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate with top 50 stocks
  python scripts/generate_macro_data.py --stock-limit 50

  # Generate with top 100 stocks (more correlations, longer runtime)
  python scripts/generate_macro_data.py --stock-limit 100

  # Stricter thresholds (fewer but higher-quality correlations)
  python scripts/generate_macro_data.py --min-correlation 0.20 --max-p-value 0.01

Notes:
  - Requires FRED_API_KEY in .env file (get free key from https://fredaccount.stlouisfed.org)
  - Runtime: ~1-2 minutes for 50 stocks, ~3-5 minutes for 100 stocks
  - Outputs saved to data/macro_indicators.json and data/macro_correlations.json
        """,
    )

    parser.add_argument(
        "--stock-limit",
        type=int,
        default=100,
        help="Number of stocks to correlate with (default: 100)",
    )

    parser.add_argument(
        "--min-correlation",
        type=float,
        default=0.15,
        help="Minimum absolute correlation to include (default: 0.15)",
    )

    parser.add_argument(
        "--max-p-value",
        type=float,
        default=0.05,
        help="Maximum p-value for statistical significance (default: 0.05)",
    )

    parser.add_argument(
        "--use-top-100",
        action="store_true",
        help="Use hardcoded TOP_100_TICKERS instead of fetching S&P 500",
    )

    parser.add_argument(
        "--output-dir",
        type=str,
        default="data",
        help="Output directory for JSON files (default: data)",
    )

    args = parser.parse_args()

    # Validate arguments
    if args.stock_limit < 1:
        print("Error: --stock-limit must be at least 1")
        sys.exit(1)

    if not (0.0 <= args.min_correlation <= 1.0):
        print("Error: --min-correlation must be between 0.0 and 1.0")
        sys.exit(1)

    if not (0.0 <= args.max_p_value <= 1.0):
        print("Error: --max-p-value must be between 0.0 and 1.0")
        sys.exit(1)

    print("\nMacro Economic Layer - Data Generation")
    print("=" * 60)
    print(f"Configuration:")
    print(f"  Stock limit:        {args.stock_limit}")
    print(f"  Min correlation:    {args.min_correlation}")
    print(f"  Max p-value:        {args.max_p_value}")
    print(f"  Output directory:   {args.output_dir}")
    print("=" * 60)

    # Get stock tickers
    try:
        if args.use_top_100:
            print("\nUsing hardcoded TOP_100_TICKERS...")
            sp500 = [(ticker, ticker) for ticker in TOP_100_TICKERS]
        else:
            print("\nFetching S&P 500 tickers from Wikipedia...")
            sp500_list = get_sp500_tickers()
            sp500 = [(ticker, ticker) for ticker in sp500_list]
            print(f"✓ Fetched {len(sp500)} S&P 500 tickers")

        # Limit to requested number
        stock_tickers = [ticker for ticker, _ in sp500[: args.stock_limit]]

        print(f"✓ Selected {len(stock_tickers)} stocks for correlation analysis")

    except Exception as e:
        print(f"\n✗ Error fetching stock tickers: {e}")
        print("\nFalling back to TOP_100_TICKERS...")
        stock_tickers = TOP_100_TICKERS[: args.stock_limit]

    # Check if FRED_API_KEY is set
    import os

    if not os.getenv("FRED_API_KEY"):
        print("\n" + "=" * 60)
        print("⚠️  WARNING: FRED_API_KEY not set")
        print("=" * 60)
        print("FRED data will not be fetched. Only Yahoo Finance indicators will be available.")
        print("\nTo enable FRED data:")
        print("  1. Get free API key: https://fredaccount.stlouisfed.org")
        print("  2. Add to .env file: FRED_API_KEY=your_key_here")
        print("  3. Re-run this script")
        print("=" * 60)
        print("\nContinuing with Yahoo Finance indicators only...")

    # Generate macro data
    try:
        entities, correlations = generate_macro_relationships(
            stock_tickers=stock_tickers,
            min_correlation=args.min_correlation,
            max_p_value=args.max_p_value,
            output_dir=args.output_dir,
        )

        # Print summary statistics
        print("\n" + "=" * 60)
        print("GENERATION SUMMARY")
        print("=" * 60)

        print(f"\nEntities generated: {len(entities)}")
        entity_sources = {}
        for entity in entities:
            source = entity["attributes"]["source"]
            entity_sources[source] = entity_sources.get(source, 0) + 1

        for source, count in sorted(entity_sources.items()):
            print(f"  {source}: {count}")

        print(f"\nCorrelations generated: {len(correlations)}")
        if correlations:
            pos_corr = sum(1 for c in correlations if c["relationship_type"] == "correlated")
            neg_corr = sum(1 for c in correlations if c["relationship_type"] == "inverse_correlated")
            print(f"  Positive correlations: {pos_corr}")
            print(f"  Negative correlations: {neg_corr}")

            # Top correlated pairs
            print(f"\nTop 5 strongest correlations:")
            sorted_corr = sorted(correlations, key=lambda x: abs(x["correlation"]), reverse=True)
            for i, corr in enumerate(sorted_corr[:5], 1):
                indicator = corr["source"]
                stock = corr["target"]
                corr_val = corr["correlation"]
                p_val = corr["p_value"]
                rel_type = "+" if corr["relationship_type"] == "correlated" else "-"
                print(f"  {i}. {indicator} {rel_type} {stock}: {corr_val:+.3f} (p={p_val:.4f})")

        print("\n" + "=" * 60)
        print("✓ Data generation complete!")
        print("=" * 60)
        print(f"\nNext steps:")
        print(f"  1. Review generated files in {args.output_dir}/")
        print(f"  2. Run: python scripts/populate_database_from_initial_graph.py --local --domains securities_real_data macro")
        print(f"  3. Start backend: uvicorn src.api.main:app --reload")
        print(f"  4. Test prediction: curl -X POST http://localhost:8000/predict/event \\")
        print(f"       -H 'Content-Type: application/json' \\")
        print(f"       -d '{{\"entity_id\": \"FED_FUNDS_RATE\", \"magnitude\": 0.005, \"event_type\": \"rate_hike\"}}'")
        print("=" * 60 + "\n")

        return 0

    except ValueError as e:
        print(f"\n✗ Error: {e}")
        print("\nCommon issues:")
        print("  - FRED_API_KEY not set (get free key from https://fredaccount.stlouisfed.org)")
        print("  - No internet connection")
        print("  - Yahoo Finance API temporarily unavailable")
        return 1

    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback

        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
