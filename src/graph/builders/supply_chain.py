"""Build supply chain relationships for the causal graph."""

from ..causal_graph import CausalGraph
from ..entities import Entity, EntityType
from ..links import CausalLink, RelationshipType, create_supplier_link


# Curated supply chain relationships for major tech companies
# Source: 10-K filings, earnings calls, industry reports
TECH_SUPPLY_CHAIN = [
    # Apple (AAPL) - suppliers heavily dependent on Apple
    {"supplier": "TSM", "customer": "AAPL", "revenue_pct": 25.0, "delay": 1.5},
    {"supplier": "QCOM", "customer": "AAPL", "revenue_pct": 20.0, "delay": 1.5},
    {"supplier": "AVGO", "customer": "AAPL", "revenue_pct": 20.0, "delay": 1.5},
    {"supplier": "TXN", "customer": "AAPL", "revenue_pct": 12.0, "delay": 2.0},
    {"supplier": "ADI", "customer": "AAPL", "revenue_pct": 10.0, "delay": 2.0},
    {"supplier": "SWKS", "customer": "AAPL", "revenue_pct": 55.0, "delay": 1.0},
    {"supplier": "CRUS", "customer": "AAPL", "revenue_pct": 80.0, "delay": 1.0},

    # NVIDIA (NVDA) - semiconductor supply chain
    {"supplier": "TSM", "customer": "NVDA", "revenue_pct": 15.0, "delay": 1.5},
    {"supplier": "AVGO", "customer": "NVDA", "revenue_pct": 8.0, "delay": 2.0},

    # Microsoft (MSFT) - cloud infrastructure
    {"supplier": "INTC", "customer": "MSFT", "revenue_pct": 8.0, "delay": 2.0},
    {"supplier": "AMD", "customer": "MSFT", "revenue_pct": 5.0, "delay": 2.0},
    {"supplier": "NVDA", "customer": "MSFT", "revenue_pct": 5.0, "delay": 2.0},

    # Amazon (AMZN) - retail and AWS
    {"supplier": "UPS", "customer": "AMZN", "revenue_pct": 10.0, "delay": 2.0},
    {"supplier": "FDX", "customer": "AMZN", "revenue_pct": 8.0, "delay": 2.0},

    # Tesla (TSLA) - EV supply chain
    {"supplier": "ALB", "customer": "TSLA", "revenue_pct": 15.0, "delay": 2.0},  # Lithium
    {"supplier": "APTV", "customer": "TSLA", "revenue_pct": 5.0, "delay": 2.0},

    # Semiconductor equipment (affects all chip makers)
    {"supplier": "ASML", "customer": "TSM", "revenue_pct": 25.0, "delay": 2.0},
    {"supplier": "LRCX", "customer": "TSM", "revenue_pct": 20.0, "delay": 2.0},
    {"supplier": "AMAT", "customer": "TSM", "revenue_pct": 18.0, "delay": 2.0},
    {"supplier": "KLAC", "customer": "TSM", "revenue_pct": 15.0, "delay": 2.0},

    {"supplier": "ASML", "customer": "INTC", "revenue_pct": 20.0, "delay": 2.0},
    {"supplier": "LRCX", "customer": "INTC", "revenue_pct": 15.0, "delay": 2.0},
    {"supplier": "AMAT", "customer": "INTC", "revenue_pct": 12.0, "delay": 2.0},

    {"supplier": "ASML", "customer": "SAMSUNG", "revenue_pct": 15.0, "delay": 2.0},

    # Memory/Storage
    {"supplier": "MU", "customer": "AAPL", "revenue_pct": 5.0, "delay": 2.0},
    {"supplier": "WDC", "customer": "AAPL", "revenue_pct": 8.0, "delay": 2.0},
]

# Retail/Consumer supply chains
RETAIL_SUPPLY_CHAIN = [
    # Walmart (WMT) - major customer for consumer goods
    {"supplier": "PG", "customer": "WMT", "revenue_pct": 15.0, "delay": 2.0},
    {"supplier": "KO", "customer": "WMT", "revenue_pct": 10.0, "delay": 2.0},
    {"supplier": "PEP", "customer": "WMT", "revenue_pct": 8.0, "delay": 2.0},
    {"supplier": "CL", "customer": "WMT", "revenue_pct": 12.0, "delay": 2.0},
    {"supplier": "GIS", "customer": "WMT", "revenue_pct": 10.0, "delay": 2.0},

    # Costco (COST)
    {"supplier": "KO", "customer": "COST", "revenue_pct": 5.0, "delay": 2.0},
    {"supplier": "PG", "customer": "COST", "revenue_pct": 8.0, "delay": 2.0},

    # Home Depot (HD)
    {"supplier": "SHW", "customer": "HD", "revenue_pct": 10.0, "delay": 2.0},
    {"supplier": "MAS", "customer": "HD", "revenue_pct": 15.0, "delay": 2.0},
]

# Healthcare supply chains
HEALTHCARE_SUPPLY_CHAIN = [
    # Pharmaceutical distributors
    {"supplier": "ABC", "customer": "WBA", "revenue_pct": 15.0, "delay": 2.0},
    {"supplier": "MCK", "customer": "CVS", "revenue_pct": 20.0, "delay": 2.0},

    # Medical devices
    {"supplier": "ABT", "customer": "UNH", "revenue_pct": 5.0, "delay": 2.5},
]


def build_supply_chain_graph() -> CausalGraph:
    """
    Build a causal graph with supply chain relationships.

    Returns:
        CausalGraph with supplier-customer links
    """
    graph = CausalGraph()

    # Combine all supply chain data
    all_relationships = TECH_SUPPLY_CHAIN + RETAIL_SUPPLY_CHAIN + HEALTHCARE_SUPPLY_CHAIN

    # Extract unique tickers
    tickers = set()
    for rel in all_relationships:
        tickers.add(rel["supplier"])
        tickers.add(rel["customer"])

    # Create entities (we'll update with real info from yfinance later)
    for ticker in tickers:
        entity = Entity(
            id=ticker,
            type=EntityType.COMPANY,
            name=ticker,  # Will be updated
        )
        graph.add_entity(entity)

    # Create links
    for rel in all_relationships:
        link = create_supplier_link(
            supplier=rel["supplier"],
            customer=rel["customer"],
            revenue_percentage=rel["revenue_pct"],
            evidence=[f"Industry estimate, ~{rel['revenue_pct']}% revenue dependency"],
        )
        # Override delay if specified
        link.delay_mean = rel.get("delay", 1.5)
        link.delay_std = link.delay_mean * 0.3

        try:
            graph.add_link(link)
        except ValueError as e:
            print(f"Skipping link: {e}")

    return graph


def add_company_to_supply_chain(
    graph: CausalGraph,
    ticker: str,
    suppliers: list[dict],
    customers: list[dict],
) -> None:
    """
    Add a company and its supply chain relationships to an existing graph.

    Args:
        graph: Existing causal graph
        ticker: Company ticker
        suppliers: List of supplier relationships
        customers: List of customer relationships
    """
    # Ensure company exists
    if ticker not in graph.entities:
        graph.add_entity(Entity(id=ticker, type=EntityType.COMPANY, name=ticker))

    # Add supplier links
    for sup in suppliers:
        if sup["ticker"] not in graph.entities:
            graph.add_entity(Entity(
                id=sup["ticker"],
                type=EntityType.COMPANY,
                name=sup["ticker"]
            ))

        link = create_supplier_link(
            supplier=sup["ticker"],
            customer=ticker,
            revenue_percentage=sup.get("revenue_pct", 10.0),
        )
        graph.add_link(link)

    # Add customer links
    for cust in customers:
        if cust["ticker"] not in graph.entities:
            graph.add_entity(Entity(
                id=cust["ticker"],
                type=EntityType.COMPANY,
                name=cust["ticker"]
            ))

        link = create_supplier_link(
            supplier=ticker,
            customer=cust["ticker"],
            revenue_percentage=cust.get("revenue_pct", 10.0),
        )
        graph.add_link(link)
