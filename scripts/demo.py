#!/usr/bin/env python3
"""
Demo script for Consequence AI - Stock Market Cascade Predictions.

This script demonstrates:
1. Building a causal graph of company relationships
2. Simulating an earnings event
3. Predicting cascade effects through the graph
"""

from pathlib import Path
from src.core.graph import CausalGraph
from src.graph.builders import build_initial_graph
from src.engine import Event, propagate_with_explanation
from src.adapters.securities import create_earnings_event


def print_cascade_results(cascade):
    """Pretty print cascade results."""
    print("\n" + "=" * 60)
    print(f"CAUSAL CASCADE PREDICTION")
    print("=" * 60)
    print(f"\nTrigger: {cascade.trigger}")
    print(f"Horizon: {cascade.horizon_days} days")
    print(f"Total effects predicted: {len(cascade.effects)}")

    # Print by time period
    timeline = cascade.get_timeline()
    for period, effects in timeline.items():
        print(f"\n{period}:")
        print("-" * 40)
        for effect in effects[:8]:  # Top 8 per period
            sign = "+" if effect.magnitude > 0 else ""
            low, high = effect.magnitude_range
            print(
                f"  {effect.entity:8s}: {sign}{effect.magnitude*100:6.2f}% "
                f"[{low:+.1f}% to {high:+.1f}%] "
                f"(conf: {effect.confidence:.2f})"
            )
        if len(effects) > 8:
            print(f"  ... and {len(effects) - 8} more effects")

    # Print statistics by order
    print("\n" + "-" * 60)
    print("Effects by Order:")
    for order in [1, 2, 3, 4]:
        effects = cascade.get_effects_by_order(order)
        if effects:
            avg_conf = sum(e.confidence for e in effects) / len(effects)
            print(f"  {order}{'st' if order == 1 else 'nd' if order == 2 else 'rd' if order == 3 else 'th'} order: "
                  f"{len(effects)} effects, avg confidence: {avg_conf:.2f}")


def main():
    print("Building causal graph...")
    graph = build_initial_graph()

    print(f"\nGraph built:")
    print(f"  - Entities: {graph.num_entities}")
    print(f"  - Links: {graph.num_links}")

    # Show some example entities
    print("\nSample entities:")
    for i, entity in enumerate(list(graph.entities.values())[:5]):
        print(f"  {entity.id}: {entity.name}")

    # Demo 1: Apple earnings miss
    print("\n" + "=" * 60)
    print("DEMO 1: Apple Earnings Miss")
    print("=" * 60)

    event1 = create_earnings_event(
        ticker="AAPL",
        surprise_percent=-8.0,
        description="Apple misses Q4 earnings by 8%, citing weak iPhone demand in China"
    )

    cascade1 = propagate_with_explanation(event1, graph, horizon_days=14)
    print_cascade_results(cascade1)

    # Demo 2: NVIDIA earnings beat
    print("\n" + "=" * 60)
    print("DEMO 2: NVIDIA Earnings Beat")
    print("=" * 60)

    event2 = create_earnings_event(
        ticker="NVDA",
        surprise_percent=15.0,
        description="NVIDIA beats earnings by 15%, data center revenue exceeds expectations"
    )

    cascade2 = propagate_with_explanation(event2, graph, horizon_days=14)
    print_cascade_results(cascade2)

    # Demo 3: TSMC earnings miss (semiconductor supply chain)
    print("\n" + "=" * 60)
    print("DEMO 3: TSMC Earnings Miss (Supply Chain Cascade)")
    print("=" * 60)

    event3 = create_earnings_event(
        ticker="TSM",
        surprise_percent=-12.0,
        description="TSMC misses earnings by 12%, warns of capacity constraints"
    )

    cascade3 = propagate_with_explanation(event3, graph, horizon_days=14)
    print_cascade_results(cascade3)

    # Save graph for future use
    graph_path = Path(__file__).parent.parent / "data" / "graphs" / "initial_graph.json"
    graph_path.parent.mkdir(parents=True, exist_ok=True)
    graph.save(graph_path)
    print(f"\nGraph saved to: {graph_path}")


if __name__ == "__main__":
    main()
