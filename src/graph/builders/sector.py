"""Build sector and index relationships for the causal graph."""

from src.core.graph import CausalGraph, CausalLink
from src.adapters.securities import (
    create_company,
    create_etf,
    create_sector_link,
    RelationshipType,
    SECTOR_ETFS,
    INDICES,
    SEMICONDUCTOR_ETFS,
)


# Major companies and their sector ETF weights (approximate)
# Source: ETF holdings data
SECTOR_WEIGHTS = {
    "XLK": {  # Technology Select Sector SPDR
        "AAPL": 0.22,
        "MSFT": 0.21,
        "NVDA": 0.06,
        "AVGO": 0.05,
        "CRM": 0.03,
        "ADBE": 0.03,
        "CSCO": 0.03,
        "ACN": 0.03,
        "ORCL": 0.03,
        "INTC": 0.02,
        "AMD": 0.02,
        "QCOM": 0.02,
        "TXN": 0.02,
        "IBM": 0.02,
    },
    "XLV": {  # Healthcare Select Sector SPDR
        "UNH": 0.10,
        "JNJ": 0.08,
        "LLY": 0.08,
        "MRK": 0.06,
        "ABBV": 0.06,
        "PFE": 0.04,
        "TMO": 0.04,
        "ABT": 0.04,
        "DHR": 0.03,
        "BMY": 0.03,
    },
    "XLF": {  # Financial Select Sector SPDR
        "BRK-B": 0.14,
        "JPM": 0.10,
        "V": 0.08,
        "MA": 0.07,
        "BAC": 0.05,
        "WFC": 0.04,
        "GS": 0.03,
        "MS": 0.03,
        "SCHW": 0.03,
        "AXP": 0.03,
    },
    "XLY": {  # Consumer Discretionary Select Sector SPDR
        "AMZN": 0.23,
        "TSLA": 0.13,
        "HD": 0.08,
        "MCD": 0.05,
        "NKE": 0.04,
        "LOW": 0.04,
        "SBUX": 0.03,
        "TJX": 0.03,
        "BKNG": 0.03,
    },
    "XLP": {  # Consumer Staples Select Sector SPDR
        "PG": 0.15,
        "COST": 0.12,
        "KO": 0.10,
        "PEP": 0.10,
        "WMT": 0.08,
        "PM": 0.05,
        "MO": 0.04,
        "MDLZ": 0.04,
        "CL": 0.04,
    },
    "XLE": {  # Energy Select Sector SPDR
        "XOM": 0.23,
        "CVX": 0.17,
        "SLB": 0.05,
        "EOG": 0.05,
        "COP": 0.05,
        "MPC": 0.04,
        "PSX": 0.03,
        "VLO": 0.03,
    },
    "SMH": {  # VanEck Semiconductor ETF
        "NVDA": 0.20,
        "TSM": 0.12,
        "AVGO": 0.08,
        "ASML": 0.07,
        "AMD": 0.05,
        "QCOM": 0.05,
        "TXN": 0.05,
        "INTC": 0.04,
        "LRCX": 0.04,
        "AMAT": 0.04,
        "MU": 0.04,
        "KLAC": 0.03,
    },
}

# S&P 500 weights for top companies (approximate)
SPY_WEIGHTS = {
    "AAPL": 0.07,
    "MSFT": 0.07,
    "NVDA": 0.04,
    "AMZN": 0.04,
    "META": 0.02,
    "GOOGL": 0.02,
    "GOOG": 0.02,
    "BRK-B": 0.02,
    "TSLA": 0.02,
    "UNH": 0.01,
    "JNJ": 0.01,
    "JPM": 0.01,
    "V": 0.01,
    "XOM": 0.01,
}

# Competitor relationships (companies that compete directly)
COMPETITORS = {
    "AAPL": ["MSFT", "GOOGL", "SAMSUNG"],
    "MSFT": ["AAPL", "GOOGL", "AMZN", "CRM", "ORCL"],
    "GOOGL": ["META", "MSFT", "AMZN"],
    "AMZN": ["WMT", "TGT", "COST", "MSFT", "GOOGL"],
    "NVDA": ["AMD", "INTC"],
    "AMD": ["NVDA", "INTC"],
    "INTC": ["AMD", "NVDA", "TSM"],
    "KO": ["PEP"],
    "PEP": ["KO"],
    "V": ["MA", "PYPL"],
    "MA": ["V", "PYPL"],
    "HD": ["LOW"],
    "LOW": ["HD"],
    "WMT": ["COST", "TGT", "AMZN"],
    "COST": ["WMT", "TGT"],
}


def build_sector_graph() -> CausalGraph:
    """
    Build a causal graph with sector and index relationships.

    Returns:
        CausalGraph with sector membership and competitor links
    """
    graph = CausalGraph()

    # Add sector ETF entities
    for sector_name, etf_ticker in SECTOR_ETFS.items():
        entity = create_etf(
            ticker=etf_ticker,
            name=f"{sector_name} Select Sector SPDR",
            sector=sector_name,
        )
        graph.add_entity(entity)

    # Add semiconductor ETFs
    for name, ticker in SEMICONDUCTOR_ETFS.items():
        entity = create_etf(
            ticker=ticker,
            name=name,
            sector="Technology",
        )
        graph.add_entity(entity)

    # Add index entities (use ETF as entity type since they're traded)
    for index_name, ticker in INDICES.items():
        entity = create_etf(
            ticker=ticker,
            name=index_name,
        )
        graph.add_entity(entity)

    # Add companies and their sector links
    all_tickers = set()
    for etf_ticker, weights in SECTOR_WEIGHTS.items():
        for company_ticker in weights.keys():
            all_tickers.add(company_ticker)

    for ticker in all_tickers:
        if ticker not in graph.entities:
            entity = create_company(
                ticker=ticker,
                name=ticker,
            )
            graph.add_entity(entity)

    # Add sector membership links
    for etf_ticker, weights in SECTOR_WEIGHTS.items():
        for company_ticker, weight in weights.items():
            link = create_sector_link(company_ticker, etf_ticker, weight)
            try:
                graph.add_link(link)
            except ValueError:
                pass

    # Add SPY links for top companies
    for company_ticker, weight in SPY_WEIGHTS.items():
        if company_ticker not in graph.entities:
            graph.add_entity(create_company(
                ticker=company_ticker,
                name=company_ticker
            ))
        link = create_sector_link(company_ticker, "SPY", weight)
        try:
            graph.add_link(link)
        except ValueError:
            pass

    # Add competitor links
    for company, competitors in COMPETITORS.items():
        if company not in graph.entities:
            continue

        for competitor in competitors:
            if competitor not in graph.entities:
                graph.add_entity(create_company(
                    ticker=competitor,
                    name=competitor
                ))

            # Competitors have inverse correlation - when one does well,
            # the other may be seen as relatively worse (or vice versa)
            link = CausalLink(
                source=company,
                target=competitor,
                relationship_type=RelationshipType.COMPETES_WITH.value,
                strength=0.15,  # Moderate effect
                delay_mean=1.0,
                delay_std=0.5,
                confidence=0.6,
                direction=-0.3,  # Slight negative correlation for zero-sum markets
                evidence=["Competitor relationship"],
                source_type="manual",
            )
            try:
                graph.add_link(link)
            except ValueError:
                pass

    return graph


def get_sector_for_company(ticker: str) -> str | None:
    """Get the sector for a company based on ETF membership."""
    for etf_ticker, weights in SECTOR_WEIGHTS.items():
        if ticker in weights:
            # Map ETF to sector name
            for sector_name, sector_etf in SECTOR_ETFS.items():
                if sector_etf == etf_ticker:
                    return sector_name
    return None


def get_peer_companies(ticker: str) -> list[str]:
    """Get peer companies (same sector and competitors)."""
    peers = set()

    # Same sector peers
    for etf_ticker, weights in SECTOR_WEIGHTS.items():
        if ticker in weights:
            for peer in weights.keys():
                if peer != ticker:
                    peers.add(peer)

    # Direct competitors
    if ticker in COMPETITORS:
        peers.update(COMPETITORS[ticker])

    return list(peers)
