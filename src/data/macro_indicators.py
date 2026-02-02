"""Macro economic indicator data fetching and correlation calculation.

This module fetches macro economic indicators from FRED (Federal Reserve Economic Data)
and Yahoo Finance, then calculates correlations with stock tickers to establish
causal relationships in the graph.
"""

import json
from pathlib import Path
from typing import Any
from src.data.fred_api import FREDClient
from src.data.yahoo_finance import get_historical_prices, calculate_correlation


# FRED series for macro indicators
FRED_SERIES = {
    "FED_FUNDS_RATE": {
        "series_id": "FEDFUNDS",
        "name": "Federal Funds Rate",
        "description": "Target federal funds rate set by the Federal Reserve",
    },
    "CPI": {
        "series_id": "CPIAUCSL",
        "name": "Consumer Price Index",
        "description": "CPI for all urban consumers (seasonally adjusted)",
    },
    "UNEMPLOYMENT": {
        "series_id": "UNRATE",
        "name": "Unemployment Rate",
        "description": "Civilian unemployment rate (seasonally adjusted)",
    },
}

# Yahoo Finance tickers for macro indicators
YAHOO_MACRO_TICKERS = {
    "10Y_TREASURY": {
        "ticker": "^TNX",
        "name": "10-Year Treasury Yield",
        "description": "10-year Treasury constant maturity rate",
    },
    "VIX": {
        "ticker": "^VIX",
        "name": "VIX Volatility Index",
        "description": "CBOE Volatility Index (market fear gauge)",
    },
    "GOLD": {
        "ticker": "GC=F",
        "name": "Gold Futures",
        "description": "Gold futures front month price",
    },
    "OIL_WTI": {
        "ticker": "CL=F",
        "name": "Crude Oil WTI",
        "description": "West Texas Intermediate crude oil futures",
    },
    "USD_INDEX": {
        "ticker": "DX-Y.NYB",
        "name": "US Dollar Index",
        "description": "US Dollar Index (measure of dollar strength)",
    },
}


def fetch_macro_indicators() -> dict[str, dict[str, Any]]:
    """Fetch macro economic indicator data from FRED and Yahoo Finance.

    Returns:
        Dictionary mapping indicator_id to metadata:
            {
                "FED_FUNDS_RATE": {
                    "id": "FED_FUNDS_RATE",
                    "name": "Federal Funds Rate",
                    "source": "FRED",
                    "series_id": "FEDFUNDS",
                    "latest_value": 4.33,
                    "data": [...],  # Time series data
                },
                ...
            }

    Raises:
        ValueError: If FRED API key is not set
        requests.HTTPError: If API requests fail

    Example:
        indicators = fetch_macro_indicators()
        print(f"Current Fed Funds Rate: {indicators['FED_FUNDS_RATE']['latest_value']}%")
    """
    indicators = {}

    # Fetch FRED data
    try:
        fred = FREDClient()

        for indicator_id, meta in FRED_SERIES.items():
            print(f"[MacroData] Fetching FRED series {meta['series_id']}...")

            # Get 1 year of data
            observations = fred.get_series_observations(
                series_id=meta["series_id"],
                limit=252,  # ~1 year of daily data
            )

            # Filter out missing values
            observations = [obs for obs in observations if obs["value"] != "."]

            latest_value = float(observations[-1]["value"]) if observations else None

            indicators[indicator_id] = {
                "id": indicator_id,
                "name": meta["name"],
                "description": meta["description"],
                "source": "FRED",
                "series_id": meta["series_id"],
                "latest_value": latest_value,
                "data": observations,
            }

            print(f"[MacroData] ✓ {meta['name']}: {latest_value}")

    except ValueError as e:
        print(f"[MacroData] ⚠️  FRED API not configured: {e}")
        print("[MacroData] Skipping FRED indicators. Set FRED_API_KEY to enable.")

    # Fetch Yahoo Finance data
    for indicator_id, meta in YAHOO_MACRO_TICKERS.items():
        try:
            print(f"[MacroData] Fetching Yahoo Finance ticker {meta['ticker']}...")

            prices = get_historical_prices(meta["ticker"], period="1y")

            if prices.empty:
                print(f"[MacroData] ✗ No data for {meta['name']}")
                continue

            latest_value = float(prices["Close"].iloc[-1])

            # Convert DataFrame to list of dicts for JSON serialization
            data = []
            for idx, row in prices.iterrows():
                data.append({
                    "date": str(idx.date()),
                    "close": float(row["Close"]),
                    "volume": int(row["Volume"]) if row["Volume"] > 0 else 0,
                })

            indicators[indicator_id] = {
                "id": indicator_id,
                "name": meta["name"],
                "description": meta["description"],
                "source": "YahooFinance",
                "ticker": meta["ticker"],
                "latest_value": latest_value,
                "data": data,
            }

            print(f"[MacroData] ✓ {meta['name']}: {latest_value:.2f}")

        except Exception as e:
            print(f"[MacroData] ✗ Error fetching {meta['name']}: {e}")

    return indicators


def calculate_macro_correlations(
    macro_indicators: dict[str, dict[str, Any]],
    stock_tickers: list[str],
    min_correlation: float = 0.15,
    max_p_value: float = 0.05,
) -> list[dict[str, Any]]:
    """Calculate correlations between macro indicators and stocks.

    Args:
        macro_indicators: Output from fetch_macro_indicators()
        stock_tickers: List of stock tickers to correlate with
        min_correlation: Minimum absolute correlation to include (default: 0.15)
        max_p_value: Maximum p-value for statistical significance (default: 0.05)

    Returns:
        List of correlation relationships with format:
            {
                "source": "FED_FUNDS_RATE",
                "target": "JPM",
                "correlation": 0.35,
                "p_value": 0.001,
                "relationship_type": "correlated",
            }

    Example:
        indicators = fetch_macro_indicators()
        stocks = ["JPM", "AAPL", "XOM"]
        correlations = calculate_macro_correlations(indicators, stocks)
        print(f"Found {len(correlations)} significant correlations")
    """
    correlations = []

    # Only Yahoo Finance indicators can be correlated directly
    # (FRED data would need daily conversion first)
    yahoo_indicators = {
        ind_id: ind
        for ind_id, ind in macro_indicators.items()
        if ind.get("source") == "YahooFinance"
    }

    print(f"\n[MacroCorr] Calculating correlations for {len(yahoo_indicators)} macro indicators "
          f"with {len(stock_tickers)} stocks...")

    for indicator_id, indicator_data in yahoo_indicators.items():
        ticker = indicator_data["ticker"]
        print(f"[MacroCorr] Processing {indicator_data['name']} ({ticker})...")

        valid_correlations = 0

        for stock_ticker in stock_tickers:
            try:
                # Calculate correlation using existing function
                correlation, p_value = calculate_correlation(
                    ticker_a=ticker,
                    ticker_b=stock_ticker,
                    period="1y",
                )

                # Check significance thresholds
                if abs(correlation) >= min_correlation and p_value < max_p_value:
                    relationship_type = (
                        "correlated" if correlation > 0 else "inverse_correlated"
                    )

                    correlations.append({
                        "source": indicator_id,
                        "target": stock_ticker,
                        "correlation": round(correlation, 4),
                        "p_value": round(p_value, 4),
                        "relationship_type": relationship_type,
                    })

                    valid_correlations += 1

            except Exception as e:
                # Skip failed correlations
                pass

        print(f"[MacroCorr] ✓ {indicator_data['name']}: {valid_correlations} significant correlations")

    print(f"\n[MacroCorr] Total: {len(correlations)} significant correlations found")

    return correlations


def generate_macro_relationships(
    stock_tickers: list[str],
    min_correlation: float = 0.15,
    max_p_value: float = 0.05,
    output_dir: str = "data",
) -> tuple[list[dict], list[dict]]:
    """Generate macro indicator entities and relationships, save to JSON files.

    This is the main entry point for generating macro data. It:
    1. Fetches all macro indicators from FRED and Yahoo Finance
    2. Calculates correlations with provided stock tickers
    3. Saves entities to data/macro_indicators.json
    4. Saves correlations to data/macro_correlations.json

    Args:
        stock_tickers: List of stock tickers to correlate with
        min_correlation: Minimum absolute correlation threshold
        max_p_value: Maximum p-value for significance
        output_dir: Directory to save JSON files (default: "data")

    Returns:
        Tuple of (entities, correlations) where:
            - entities: List of macro indicator entity dicts
            - correlations: List of correlation relationship dicts

    Example:
        from src.data.yahoo_finance import get_sp500_tickers

        # Get S&P 500 tickers
        sp500 = get_sp500_tickers()
        tickers = sp500[:100]  # Top 100

        # Generate macro data
        entities, correlations = generate_macro_relationships(tickers)
        print(f"Generated {len(entities)} indicators, {len(correlations)} correlations")
    """
    print(f"\n{'='*60}")
    print("MACRO ECONOMIC LAYER DATA GENERATION")
    print(f"{'='*60}")

    # Fetch indicator data
    print("\n[Step 1/3] Fetching macro indicator data...")
    indicators = fetch_macro_indicators()

    if not indicators:
        raise ValueError(
            "No macro indicators fetched. "
            "Check FRED_API_KEY and internet connection."
        )

    # Calculate correlations with stocks
    print(f"\n[Step 2/3] Calculating correlations with {len(stock_tickers)} stocks...")
    correlations = calculate_macro_correlations(
        indicators,
        stock_tickers,
        min_correlation=min_correlation,
        max_p_value=max_p_value,
    )

    # Prepare entity data
    entities = [
        {
            "id": ind_id,
            "name": ind["name"],
            "type": "indicator",
            "attributes": {
                "description": ind["description"],
                "source": ind["source"],
                "latest_value": ind["latest_value"],
                "series_id": ind.get("series_id"),  # FRED only
                "ticker": ind.get("ticker"),  # Yahoo Finance only
            },
        }
        for ind_id, ind in indicators.items()
    ]

    # Save to JSON files
    print(f"\n[Step 3/3] Saving to JSON files...")
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)

    entities_file = output_path / "macro_indicators.json"
    correlations_file = output_path / "macro_correlations.json"

    with open(entities_file, "w") as f:
        json.dump(entities, f, indent=2)
    print(f"✓ Saved {len(entities)} entities to {entities_file}")

    with open(correlations_file, "w") as f:
        json.dump(correlations, f, indent=2)
    print(f"✓ Saved {len(correlations)} correlations to {correlations_file}")

    print(f"\n{'='*60}")
    print("MACRO DATA GENERATION COMPLETE")
    print(f"{'='*60}")
    print(f"Entities:      {len(entities)}")
    print(f"Correlations:  {len(correlations)}")
    print(f"\nFiles saved:")
    print(f"  - {entities_file}")
    print(f"  - {correlations_file}")
    print(f"{'='*60}\n")

    return entities, correlations
