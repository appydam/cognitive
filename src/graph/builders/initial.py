"""Build the initial combined causal graph."""

from src.core.graph import CausalGraph
from src.core.graph.graph import merge_graphs
from src.adapters.securities import create_company
from .supply_chain import build_supply_chain_graph
from .sector import build_sector_graph


def build_initial_graph(
    include_supply_chain: bool = True,
    include_sectors: bool = True,
) -> CausalGraph:
    """
    Build the initial causal graph combining all relationship types.

    Args:
        include_supply_chain: Include supplier-customer relationships
        include_sectors: Include sector and index relationships

    Returns:
        Combined CausalGraph
    """
    graphs = []

    if include_supply_chain:
        print("Building supply chain relationships...")
        graphs.append(build_supply_chain_graph())

    if include_sectors:
        print("Building sector relationships...")
        graphs.append(build_sector_graph())

    if not graphs:
        return CausalGraph()

    print("Merging graphs...")
    combined = merge_graphs(*graphs)

    # Add any missing top companies
    top_companies = [
        ("AAPL", "Apple Inc.", "Technology"),
        ("MSFT", "Microsoft Corporation", "Technology"),
        ("GOOGL", "Alphabet Inc.", "Technology"),
        ("AMZN", "Amazon.com Inc.", "Consumer Discretionary"),
        ("NVDA", "NVIDIA Corporation", "Technology"),
        ("META", "Meta Platforms Inc.", "Technology"),
        ("TSLA", "Tesla Inc.", "Consumer Discretionary"),
        ("BRK-B", "Berkshire Hathaway Inc.", "Financials"),
        ("UNH", "UnitedHealth Group Inc.", "Healthcare"),
        ("JNJ", "Johnson & Johnson", "Healthcare"),
        ("JPM", "JPMorgan Chase & Co.", "Financials"),
        ("V", "Visa Inc.", "Financials"),
        ("PG", "Procter & Gamble Co.", "Consumer Staples"),
        ("XOM", "Exxon Mobil Corporation", "Energy"),
        ("MA", "Mastercard Inc.", "Financials"),
        ("HD", "Home Depot Inc.", "Consumer Discretionary"),
        ("CVX", "Chevron Corporation", "Energy"),
        ("MRK", "Merck & Co. Inc.", "Healthcare"),
        ("ABBV", "AbbVie Inc.", "Healthcare"),
        ("LLY", "Eli Lilly and Company", "Healthcare"),
        ("PEP", "PepsiCo Inc.", "Consumer Staples"),
        ("COST", "Costco Wholesale Corporation", "Consumer Staples"),
        ("KO", "Coca-Cola Company", "Consumer Staples"),
        ("AVGO", "Broadcom Inc.", "Technology"),
        ("WMT", "Walmart Inc.", "Consumer Staples"),
        ("MCD", "McDonald's Corporation", "Consumer Discretionary"),
        ("CSCO", "Cisco Systems Inc.", "Technology"),
        ("TMO", "Thermo Fisher Scientific Inc.", "Healthcare"),
        ("ACN", "Accenture plc", "Technology"),
        ("ABT", "Abbott Laboratories", "Healthcare"),
        ("CRM", "Salesforce Inc.", "Technology"),
        ("AMD", "Advanced Micro Devices Inc.", "Technology"),
        ("INTC", "Intel Corporation", "Technology"),
        ("QCOM", "Qualcomm Inc.", "Technology"),
        ("TXN", "Texas Instruments Inc.", "Technology"),
        ("ORCL", "Oracle Corporation", "Technology"),
        ("NFLX", "Netflix Inc.", "Technology"),
        ("ADBE", "Adobe Inc.", "Technology"),
        ("IBM", "IBM Corporation", "Technology"),
        ("TSM", "Taiwan Semiconductor Manufacturing", "Technology"),
        ("ASML", "ASML Holding N.V.", "Technology"),
    ]

    for ticker, name, sector in top_companies:
        if ticker not in combined.entities:
            entity = create_company(
                ticker=ticker,
                name=name,
                sector=sector,
            )
            combined.add_entity(entity)
        else:
            # Update name if entity exists but has placeholder name
            existing = combined.entities[ticker]
            if existing.name == ticker:
                existing.name = name
                existing.attributes["sector"] = sector

    print(f"Graph built: {combined.num_entities} entities, {combined.num_links} links")
    return combined


def save_initial_graph(path: str = "data/graphs/initial_graph.json") -> CausalGraph:
    """Build and save the initial graph."""
    graph = build_initial_graph()
    graph.save(path)
    print(f"Graph saved to {path}")
    return graph


def load_or_build_graph(path: str = "data/graphs/initial_graph.json") -> CausalGraph:
    """Load existing graph or build new one."""
    from pathlib import Path

    if Path(path).exists():
        print(f"Loading graph from {path}")
        return CausalGraph.load(path)
    else:
        print("Building new graph...")
        return save_initial_graph(path)
