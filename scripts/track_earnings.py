#!/usr/bin/env python3
"""
Track upcoming earnings and detect recent surprises.

Usage:
    python scripts/track_earnings.py [--tickers AAPL,MSFT,GOOGL]
"""

import argparse
from src.data.earnings_calendar import (
    get_upcoming_earnings,
    detect_recent_earnings,
    save_earnings_calendar,
    save_earnings_surprises,
)
from src.data.yahoo_finance import TOP_100_TICKERS


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Track earnings calendar")
    parser.add_argument(
        "--tickers",
        type=str,
        help="Comma-separated list of tickers (default: top 50)"
    )
    parser.add_argument(
        "--days-ahead",
        type=int,
        default=30,
        help="Look ahead this many days for upcoming earnings (default: 30)"
    )
    parser.add_argument(
        "--days-back",
        type=int,
        default=7,
        help="Look back this many days for recent earnings (default: 7)"
    )

    args = parser.parse_args()

    # Get ticker list
    if args.tickers:
        tickers = [t.strip() for t in args.tickers.split(",")]
    else:
        tickers = TOP_100_TICKERS[:50]  # Top 50 for faster processing

    print("Tracking earnings calendar...")
    print("=" * 60)

    # Get upcoming earnings
    print(f"\nChecking upcoming earnings ({args.days_ahead} days ahead)...")
    upcoming = get_upcoming_earnings(tickers, days_ahead=args.days_ahead)

    print(f"✓ Found {len(upcoming)} upcoming earnings:")
    for item in upcoming[:20]:  # Show first 20
        date_str = item.earnings_date.strftime("%Y-%m-%d")
        eps_str = f"(EPS est: ${item.eps_estimate:.2f})" if item.eps_estimate else ""
        print(f"  {date_str}: {item.ticker} - {item.company_name} {eps_str}")

    if len(upcoming) > 20:
        print(f"  ... and {len(upcoming) - 20} more")

    # Save to file
    save_earnings_calendar(upcoming)
    print("\n✓ Saved to: data/earnings_calendar.json")

    # Detect recent earnings
    print(f"\nDetecting recent earnings ({args.days_back} days back)...")
    recent = detect_recent_earnings(tickers, days_back=args.days_back)

    print(f"✓ Found {len(recent)} recent earnings:")
    for item in recent[:10]:  # Show first 10
        date_str = item.report_date.strftime("%Y-%m-%d")
        surprise_str = ""
        if item.surprise_percent is not None:
            sign = "+" if item.surprise_percent > 0 else ""
            surprise_str = f"(surprise: {sign}{item.surprise_percent:.1f}%)"
        print(f"  {date_str}: {item.ticker} - {item.company_name} {surprise_str}")

    if len(recent) > 10:
        print(f"  ... and {len(recent) - 10} more")

    # Save recent earnings
    save_earnings_surprises(recent)
    print("\n✓ Saved to: data/earnings_surprises.json")

    print("\n" + "=" * 60)
    print("✓ Done!")
    print("=" * 60)


if __name__ == "__main__":
    main()
