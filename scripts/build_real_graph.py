#!/usr/bin/env python3
"""
Build causal graph from real data.

This script combines:
- SEC 10-K supplier relationships
- Historical price correlations
- Sector/index relationships

Usage:
    python scripts/build_real_graph.py [--force-rebuild]
"""

import argparse
from src.graph.builders.real_data import build_graph_from_real_data, save_real_data_graph


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Build real data graph")
    parser.add_argument(
        "--force-rebuild",
        action="store_true",
        help="Force rebuild even if cache exists"
    )
    parser.add_argument(
        "--no-sec",
        action="store_true",
        help="Skip SEC relationships"
    )
    parser.add_argument(
        "--no-correlations",
        action="store_true",
        help="Skip price correlations"
    )
    parser.add_argument(
        "--no-sectors",
        action="store_true",
        help="Skip sector relationships"
    )
    parser.add_argument(
        "--min-correlation",
        type=float,
        default=0.4,
        help="Minimum correlation threshold (default: 0.4)"
    )

    args = parser.parse_args()

    print("Building real data graph...")
    print("=" * 60)

    # Build graph
    graph = build_graph_from_real_data(
        include_sec=not args.no_sec,
        include_correlations=not args.no_correlations,
        include_sectors=not args.no_sectors,
        min_correlation=args.min_correlation,
        max_correlation_lag=3,
    )

    # Save graph
    save_real_data_graph(graph)

    print("\n" + "=" * 60)
    print("✓ Real data graph built successfully!")
    print("=" * 60)

    # Show example predictions
    print("\nExample: Testing prediction with real data graph...")
    from src.engine import propagate
    from src.adapters.securities import create_earnings_event

    # Create a test event
    event = create_earnings_event("AAPL", -8.0, "AAPL earnings miss 8%")

    # Predict cascade
    cascade = propagate(event, graph, horizon_days=14)

    print(f"\nPredicted {len(cascade.effects)} effects from AAPL -8% miss:")
    for effect in cascade.effects[:10]:
        sign = "+" if effect.magnitude > 0 else ""
        print(
            f"  {effect.entity}: {sign}{effect.magnitude*100:.1f}% "
            f"(day {effect.day:.1f}, conf: {effect.confidence:.2f})"
        )

    if len(cascade.effects) > 10:
        print(f"  ... and {len(cascade.effects) - 10} more effects")


if __name__ == "__main__":
    main()
