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
        "NOW": 0.02,
        "INTU": 0.02,
        "SNPS": 0.01,
        "CDNS": 0.01,
        "FTNT": 0.01,
        "PANW": 0.01,
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
        "AMGN": 0.03,
        "GILD": 0.02,
        "ISRG": 0.02,
        "MDT": 0.02,
        "CI": 0.02,
        "CVS": 0.02,
        "SYK": 0.02,
        "ELV": 0.02,
        "VRTX": 0.02,
        "REGN": 0.02,
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
        "BLK": 0.02,
        "C": 0.02,
        "SPGI": 0.02,
        "CME": 0.02,
        "ICE": 0.02,
        "CB": 0.02,
        "MMC": 0.02,
        "PGR": 0.02,
        "AON": 0.01,
        "MET": 0.01,
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
    "XLI": {  # Industrials Select Sector SPDR
        "HON": 0.06,
        "UNP": 0.05,
        "GE": 0.05,
        "CAT": 0.05,
        "RTX": 0.04,
        "BA": 0.04,
        "DE": 0.04,
        "LMT": 0.03,
        "UPS": 0.03,
        "FDX": 0.03,
        "GD": 0.02,
        "NOC": 0.02,
        "ETN": 0.02,
        "EMR": 0.02,
        "ITW": 0.02,
        "WM": 0.02,
        "CSX": 0.02,
        "NSC": 0.02,
        "CARR": 0.02,
        "MMM": 0.02,
    },
    "XLB": {  # Materials Select Sector SPDR
        "LIN": 0.18,
        "SHW": 0.10,
        "APD": 0.08,
        "FCX": 0.07,
        "ECL": 0.06,
        "NEM": 0.06,
        "DOW": 0.05,
        "NUE": 0.04,
        "PPG": 0.04,
        "VMC": 0.04,
        "MLM": 0.03,
        "DD": 0.03,
        "CTVA": 0.03,
        "ALB": 0.03,
        "CF": 0.02,
        "MOS": 0.02,
    },
    "XLU": {  # Utilities Select Sector SPDR
        "NEE": 0.16,
        "SO": 0.09,
        "DUK": 0.09,
        "CEG": 0.06,
        "SRE": 0.05,
        "AEP": 0.05,
        "D": 0.05,
        "EXC": 0.04,
        "XEL": 0.04,
        "PEG": 0.03,
        "ED": 0.03,
        "WEC": 0.03,
        "ES": 0.03,
        "AWK": 0.02,
        "ETR": 0.02,
        "DTE": 0.02,
    },
    "XLRE": {  # Real Estate Select Sector SPDR
        "PLD": 0.12,
        "AMT": 0.09,
        "EQIX": 0.08,
        "CCI": 0.06,
        "PSA": 0.06,
        "SPG": 0.05,
        "O": 0.05,
        "WELL": 0.04,
        "DLR": 0.04,
        "VICI": 0.04,
        "AVB": 0.03,
        "EQR": 0.03,
        "SBAC": 0.03,
        "WY": 0.02,
        "ARE": 0.02,
        "MAA": 0.02,
    },
    "XLC": {  # Communication Services Select Sector SPDR
        "META": 0.22,
        "GOOGL": 0.12,
        "GOOG": 0.11,
        "NFLX": 0.06,
        "T": 0.05,
        "VZ": 0.05,
        "CMCSA": 0.05,
        "DIS": 0.04,
        "TMUS": 0.04,
        "CHTR": 0.03,
        "EA": 0.02,
        "WBD": 0.02,
        "TTWO": 0.02,
        "OMC": 0.02,
        "LYV": 0.01,
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
    # Tech
    "AAPL": ["MSFT", "GOOGL"],
    "MSFT": ["AAPL", "GOOGL", "AMZN", "CRM", "ORCL"],
    "GOOGL": ["META", "MSFT", "AMZN"],
    "CRM": ["MSFT", "ORCL", "NOW"],
    "ORCL": ["MSFT", "CRM", "SAP"],
    "NOW": ["CRM", "MSFT"],
    "ADBE": ["CRM", "MSFT"],
    # Semiconductors
    "NVDA": ["AMD", "INTC"],
    "AMD": ["NVDA", "INTC"],
    "INTC": ["AMD", "NVDA", "TSM"],
    "AVGO": ["QCOM", "TXN"],
    "QCOM": ["AVGO", "MRVL"],
    # Cloud / E-commerce
    "AMZN": ["WMT", "TGT", "COST", "MSFT", "GOOGL"],
    # Retail
    "WMT": ["COST", "TGT", "AMZN"],
    "COST": ["WMT", "TGT"],
    "HD": ["LOW"],
    "LOW": ["HD"],
    # Consumer / Beverage
    "KO": ["PEP"],
    "PEP": ["KO"],
    "PG": ["CL", "KMB"],
    "CL": ["PG"],
    # Payments
    "V": ["MA", "PYPL"],
    "MA": ["V", "PYPL"],
    # Auto / EV
    "TSLA": ["GM", "F", "RIVN"],
    "GM": ["F", "TSLA"],
    "F": ["GM", "TSLA"],
    # Streaming / Media
    "NFLX": ["DIS", "CMCSA", "WBD"],
    "DIS": ["NFLX", "CMCSA", "WBD"],
    # Telecom
    "T": ["VZ", "TMUS"],
    "VZ": ["T", "TMUS"],
    "TMUS": ["T", "VZ"],
    # Logistics
    "UPS": ["FDX"],
    "FDX": ["UPS"],
    # Pharma
    "PFE": ["MRK", "JNJ", "LLY"],
    "MRK": ["PFE", "LLY", "ABBV"],
    "LLY": ["MRK", "NVO"],
    "ABBV": ["MRK", "BMY"],
    # Health Insurance
    "UNH": ["CI", "ELV", "CVS"],
    "CI": ["UNH", "ELV"],
    # Energy
    "XOM": ["CVX", "COP"],
    "CVX": ["XOM", "COP"],
    "COP": ["XOM", "CVX"],
    # Banks
    "JPM": ["BAC", "GS", "MS", "WFC"],
    "BAC": ["JPM", "WFC", "C"],
    "GS": ["MS", "JPM"],
    "MS": ["GS", "JPM"],
    # Defense
    "BA": ["LMT", "RTX"],
    "LMT": ["RTX", "BA", "NOC", "GD"],
    "RTX": ["LMT", "BA", "NOC"],
    # Industrial / Equipment
    "CAT": ["DE"],
    "DE": ["CAT"],
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
