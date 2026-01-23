#!/usr/bin/env python3
"""
Generate visualization diagrams for Consequence AI.

Creates:
1. Entity Relationship Diagram (network graph)
2. System Architecture Diagram
3. Causal Intelligence Flow Diagram
"""

import matplotlib.pyplot as plt
import networkx as nx
from pathlib import Path
from src.graph.builders import build_initial_graph

def visualize_entity_relationships():
    """Create a network graph showing all entities and their relationships."""
    print("Building causal graph...")
    graph = build_initial_graph()

    # Create NetworkX graph
    G = nx.DiGraph()

    # Add nodes with attributes
    entity_colors = {
        "company": "#4F46E5",  # Indigo
        "etf": "#10B981",      # Green
        "sector": "#F59E0B",   # Amber
        "index": "#EF4444",    # Red
    }

    for entity in graph.entities.values():
        G.add_node(
            entity.id,
            type=entity.type.value,
            name=entity.name,
            color=entity_colors.get(entity.type.value, "#6B7280")
        )

    # Add edges with weights
    for link in graph.iter_links():
        G.add_edge(
            link.source,
            link.target,
            weight=link.strength,
            relationship=link.relationship.value,
        )

    # Create figure
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(24, 12))
    fig.suptitle('Consequence AI - Entity Relationship Network', fontsize=20, fontweight='bold')

    # Full graph (ax1)
    pos = nx.spring_layout(G, k=1.5, iterations=50, seed=42)
    node_colors = [data['color'] for _, data in G.nodes(data=True)]

    nx.draw_networkx_nodes(
        G, pos, node_color=node_colors, node_size=200, alpha=0.9, ax=ax1
    )
    nx.draw_networkx_edges(
        G, pos, alpha=0.3, width=1, edge_color='#6B7280',
        arrows=True, arrowsize=10, ax=ax1
    )
    nx.draw_networkx_labels(
        G, pos, font_size=6, font_weight='bold', ax=ax1
    )

    ax1.set_title(f'Full Network: {G.number_of_nodes()} Entities, {G.number_of_edges()} Links', fontsize=14)
    ax1.axis('off')

    # Focused subgraph: Apple ecosystem (ax2)
    # Get Apple and its 2-hop neighbors
    apple_neighbors = set()
    if "AAPL" in G:
        apple_neighbors.add("AAPL")
        # 1st hop
        for neighbor in list(G.predecessors("AAPL")) + list(G.successors("AAPL")):
            apple_neighbors.add(neighbor)
        # 2nd hop
        second_hop = set()
        for node in list(apple_neighbors):
            for neighbor in list(G.predecessors(node)) + list(G.successors(node)):
                second_hop.add(neighbor)
        apple_neighbors.update(list(second_hop)[:20])  # Limit to 20 for clarity

    G_sub = G.subgraph(apple_neighbors)
    pos_sub = nx.spring_layout(G_sub, k=2, iterations=50, seed=42)
    node_colors_sub = [data['color'] for _, data in G_sub.nodes(data=True)]

    nx.draw_networkx_nodes(
        G_sub, pos_sub, node_color=node_colors_sub, node_size=800, alpha=0.9, ax=ax2
    )
    nx.draw_networkx_edges(
        G_sub, pos_sub, alpha=0.4, width=2, edge_color='#6B7280',
        arrows=True, arrowsize=15, ax=ax2, connectionstyle="arc3,rad=0.1"
    )
    nx.draw_networkx_labels(
        G_sub, pos_sub, font_size=9, font_weight='bold', ax=ax2
    )

    # Add edge labels for strength
    edge_labels = {
        (u, v): f"{d['weight']:.2f}"
        for u, v, d in G_sub.edges(data=True)
    }
    nx.draw_networkx_edge_labels(
        G_sub, pos_sub, edge_labels, font_size=6, ax=ax2
    )

    ax2.set_title('Apple Ecosystem (2-hop neighborhood)', fontsize=14)
    ax2.axis('off')

    # Add legend
    legend_elements = [
        plt.Line2D([0], [0], marker='o', color='w', label='Company',
                  markerfacecolor=entity_colors['company'], markersize=10),
        plt.Line2D([0], [0], marker='o', color='w', label='ETF',
                  markerfacecolor=entity_colors['etf'], markersize=10),
        plt.Line2D([0], [0], marker='o', color='w', label='Sector',
                  markerfacecolor=entity_colors['sector'], markersize=10),
        plt.Line2D([0], [0], marker='o', color='w', label='Index',
                  markerfacecolor=entity_colors['index'], markersize=10),
    ]
    fig.legend(handles=legend_elements, loc='upper right', fontsize=12)

    # Save
    output_path = Path("diagrams/entity_relationships.png")
    output_path.parent.mkdir(exist_ok=True)
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"✓ Entity relationship diagram saved to: {output_path}")
    plt.close()

    return G


def create_architecture_diagram():
    """Create high-level system architecture diagram."""
    fig, ax = plt.subplots(figsize=(16, 12))
    fig.suptitle('Consequence AI - System Architecture', fontsize=20, fontweight='bold', y=0.98)

    # Define component boxes
    components = {
        # Data Layer
        "Yahoo Finance\n(Prices,Earnings)": (0.15, 0.85, 0.15, 0.08, '#10B981'),
        "SEC EDGAR\n(10-K Filings)": (0.4, 0.85, 0.15, 0.08, '#10B981'),
        "FRED\n(Economic Data)": (0.65, 0.85, 0.15, 0.08, '#10B981'),

        # Ingestion Layer
        "Data Ingestion Layer": (0.3, 0.70, 0.4, 0.08, '#3B82F6'),

        # Graph Layer
        "Causal Graph\nEntities + Links": (0.3, 0.55, 0.4, 0.10, '#4F46E5'),

        # Core Engine
        "Propagation Engine\nBFS Cascade": (0.15, 0.38, 0.25, 0.10, '#8B5CF6'),
        "Learning Loop\nBayesian Updates": (0.55, 0.38, 0.25, 0.10, '#8B5CF6'),

        # Supporting Modules
        "Explainability\nCausal Tracing": (0.05, 0.22, 0.20, 0.08, '#EC4899'),
        "Validation\nBacktesting": (0.38, 0.22, 0.20, 0.08, '#EC4899'),
        "Metrics\nAccuracy": (0.72, 0.22, 0.20, 0.08, '#EC4899'),

        # API Layer
        "FastAPI\nEndpoints": (0.3, 0.08, 0.4, 0.08, '#F59E0B'),
    }

    # Draw components
    for label, (x, y, w, h, color) in components.items():
        rect = plt.Rectangle((x, y), w, h, facecolor=color, edgecolor='black',
                            linewidth=2, alpha=0.7)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2, label, ha='center', va='center',
               fontsize=10, fontweight='bold', color='white')

    # Draw arrows
    arrows = [
        # Data -> Ingestion
        ((0.225, 0.85), (0.35, 0.78)),
        ((0.475, 0.85), (0.5, 0.78)),
        ((0.725, 0.85), (0.65, 0.78)),

        # Ingestion -> Graph
        ((0.5, 0.70), (0.5, 0.65)),

        # Graph -> Engines
        ((0.45, 0.55), (0.25, 0.48)),
        ((0.55, 0.55), (0.7, 0.48)),

        # Engines -> Supporting
        ((0.2, 0.38), (0.12, 0.30)),
        ((0.3, 0.38), (0.48, 0.30)),
        ((0.7, 0.38), (0.82, 0.30)),

        # Supporting -> API
        ((0.15, 0.22), (0.4, 0.16)),
        ((0.48, 0.22), (0.5, 0.16)),
        ((0.82, 0.22), (0.6, 0.16)),
    ]

    for (x1, y1), (x2, y2) in arrows:
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                   arrowprops=dict(arrowstyle='->', lw=2, color='#374151'))

    # Add layer labels
    ax.text(0.02, 0.89, 'DATA LAYER', fontsize=12, fontweight='bold', color='#10B981')
    ax.text(0.02, 0.74, 'INGESTION', fontsize=12, fontweight='bold', color='#3B82F6')
    ax.text(0.02, 0.59, 'GRAPH CORE', fontsize=12, fontweight='bold', color='#4F46E5')
    ax.text(0.02, 0.43, 'ENGINES', fontsize=12, fontweight='bold', color='#8B5CF6')
    ax.text(0.02, 0.26, 'ANALYSIS', fontsize=12, fontweight='bold', color='#EC4899')
    ax.text(0.02, 0.12, 'API', fontsize=12, fontweight='bold', color='#F59E0B')

    # Add description boxes
    descriptions = [
        (0.05, 0.02, "Free public data sources\n(Yahoo Finance, SEC, FRED)", 8, '#6B7280'),
        (0.35, 0.02, "Persistent causal graph with 105+ entities\nand 160+ causal relationships", 8, '#6B7280'),
        (0.7, 0.02, "RESTful API with prediction\nand explanation endpoints", 8, '#6B7280'),
    ]

    for x, y, text, fontsize, color in descriptions:
        ax.text(x, y, text, fontsize=fontsize, color=color, style='italic')

    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')

    output_path = Path("diagrams/system_architecture.png")
    output_path.parent.mkdir(exist_ok=True)
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"✓ Architecture diagram saved to: {output_path}")
    plt.close()


def create_causal_flow_diagram():
    """Create diagram showing how causal intelligence is calculated."""
    fig, ax = plt.subplots(figsize=(14, 16))
    fig.suptitle('Causal Intelligence Calculation Flow', fontsize=20, fontweight='bold', y=0.98)

    # Define flow steps
    steps = [
        # Step 1: Input
        {
            "y": 0.92,
            "box": (0.2, 0.90, 0.6, 0.06),
            "color": "#10B981",
            "title": "1. TRIGGER EVENT",
            "text": 'Event("AAPL", magnitude=-8%, type="earnings")',
            "desc": "User inputs an earnings surprise event"
        },

        # Step 2: Graph Lookup
        {
            "y": 0.82,
            "box": (0.2, 0.80, 0.6, 0.06),
            "color": "#3B82F6",
            "title": "2. GRAPH LOOKUP",
            "text": "graph.get_outgoing('AAPL') → Returns all causal links",
            "desc": "Find all entities connected to Apple in the causal graph"
        },

        # Step 3: 1st Order Propagation
        {
            "y": 0.70,
            "box": (0.15, 0.66, 0.7, 0.10),
            "color": "#4F46E5",
            "title": "3. FIRST-ORDER EFFECTS",
            "text": "For each link:\n• new_magnitude = trigger_mag × link.strength\n• new_day = 0 + link.delay_mean\n• new_confidence = 1.0 × link.confidence",
            "desc": "Direct effects: TSMC, suppliers, XLK sector ETF"
        },

        # Step 4: Calculation Example
        {
            "y": 0.54,
            "box": (0.15, 0.48, 0.7, 0.12),
            "color": "#8B5CF6",
            "title": "4. EXAMPLE CALCULATION (AAPL → TSMC)",
            "text": "Link: AAPL → TSMC\n• Relationship: customer_of\n• Strength: 0.25 (25% revenue from Apple)\n• Delay: 1.5 days\n• Confidence: 0.75\n\nResult: TSMC effect = -8% × 0.25 × 1.0 × 0.75 = -1.5%",
            "desc": "Quantified prediction with confidence bounds"
        },

        # Step 5: Multi-hop
        {
            "y": 0.36,
            "box": (0.15, 0.30, 0.7, 0.12),
            "color": "#EC4899",
            "title": "5. MULTI-HOP PROPAGATION (BFS)",
            "text": "Queue: [(TSMC, -1.5%, day=1.5, conf=0.75)]\n• Find TSMC's outgoing links → ASML, LRCX, SMH\n• For ASML:\n  - new_mag = -1.5% × 0.25 = -0.375%\n  - new_day = 1.5 + 2.0 = 3.5 days\n  - new_conf = 0.75 × 0.75 = 0.56",
            "desc": "Cascade continues until effects become negligible"
        },

        # Step 6: Aggregation
        {
            "y": 0.18,
            "box": (0.15, 0.14, 0.7, 0.10),
            "color": "#F59E0B",
            "title": "6. AGGREGATION & RANKING",
            "text": "• Group by time period (Hour 0-4, Day 1, Day 2-3...)\n• Sort by confidence × magnitude\n• Calculate ranges: magnitude ± (1-confidence) × magnitude",
            "desc": "Organize results into timeline with confidence bounds"
        },

        # Step 7: Output
        {
            "y": 0.06,
            "box": (0.15, 0.02, 0.7, 0.08),
            "color": "#6366F1",
            "title": "7. OUTPUT CASCADE",
            "text": "Timeline with:\n• 14 predicted effects across 5 time periods\n• Confidence-weighted magnitude ranges\n• Explainable causal chains\n• 1st order (10 effects), 2nd order (4 effects)",
            "desc": "Complete cascade prediction ready for user"
        },
    ]

    # Draw steps
    for step in steps:
        # Box
        rect = plt.Rectangle(
            (step["box"][0], step["box"][1]), step["box"][2], step["box"][3],
            facecolor=step["color"], edgecolor='black', linewidth=2, alpha=0.8
        )
        ax.add_patch(rect)

        # Title
        ax.text(
            step["box"][0] + step["box"][2]/2,
            step["box"][1] + step["box"][3] - 0.015,
            step["title"],
            ha='center', va='top', fontsize=11, fontweight='bold', color='white'
        )

        # Content
        ax.text(
            step["box"][0] + step["box"][2]/2,
            step["box"][1] + step["box"][3]/2 - 0.01,
            step["text"],
            ha='center', va='center', fontsize=8, color='white', family='monospace'
        )

        # Description
        ax.text(
            0.5, step["y"] - 0.065,
            step["desc"],
            ha='center', va='top', fontsize=9, style='italic', color='#374151'
        )

    # Draw arrows between steps
    arrow_positions = [
        (0.5, 0.90, 0.5, 0.86),  # 1->2
        (0.5, 0.80, 0.5, 0.76),  # 2->3
        (0.5, 0.66, 0.5, 0.60),  # 3->4
        (0.5, 0.48, 0.5, 0.42),  # 4->5
        (0.5, 0.30, 0.5, 0.24),  # 5->6
        (0.5, 0.14, 0.5, 0.10),  # 6->7
    ]

    for x1, y1, x2, y2 in arrow_positions:
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                   arrowprops=dict(arrowstyle='->', lw=3, color='#374151'))

    # Add key principles box
    principles_box = plt.Rectangle(
        (0.05, 0.90), 0.1, 0.08,
        facecolor='#F3F4F6', edgecolor='#374151', linewidth=2, alpha=0.9
    )
    ax.add_patch(principles_box)
    ax.text(
        0.1, 0.95,
        "KEY:\n• Strength\n• Delay\n• Confidence",
        ha='center', va='center', fontsize=8, fontweight='bold', color='#374151'
    )

    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')

    output_path = Path("diagrams/causal_flow.png")
    output_path.parent.mkdir(exist_ok=True)
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"✓ Causal flow diagram saved to: {output_path}")
    plt.close()


def main():
    """Generate all diagrams."""
    print("=" * 60)
    print("Generating Consequence AI Visualization Diagrams")
    print("=" * 60)

    print("\n1. Creating entity relationship diagram...")
    G = visualize_entity_relationships()

    print(f"\nGraph Statistics:")
    print(f"  - Nodes: {G.number_of_nodes()}")
    print(f"  - Edges: {G.number_of_edges()}")
    print(f"  - Density: {nx.density(G):.4f}")
    if G.number_of_nodes() > 0:
        print(f"  - Avg degree: {sum(dict(G.degree()).values()) / G.number_of_nodes():.2f}")

    print("\n2. Creating system architecture diagram...")
    create_architecture_diagram()

    print("\n3. Creating causal intelligence flow diagram...")
    create_causal_flow_diagram()

    print("\n" + "=" * 60)
    print("✓ All diagrams generated successfully!")
    print("=" * 60)
    print("\nDiagrams saved to: diagrams/")
    print("  - entity_relationships.png")
    print("  - system_architecture.png")
    print("  - causal_flow.png")


if __name__ == "__main__":
    main()
