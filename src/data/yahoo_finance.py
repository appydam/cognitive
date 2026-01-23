"""Yahoo Finance data ingestion using yfinance library."""

import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import Any


@dataclass
class StockInfo:
    """Basic stock information."""

    ticker: str
    name: str
    sector: str | None
    industry: str | None
    market_cap: float | None
    country: str


@dataclass
class EarningsEvent:
    """An earnings event with surprise data."""

    ticker: str
    date: datetime
    eps_estimate: float | None
    eps_actual: float | None
    surprise_percent: float | None
    revenue_estimate: float | None
    revenue_actual: float | None


def get_stock_info(ticker: str) -> StockInfo | None:
    """
    Get basic information about a stock.

    Args:
        ticker: Stock ticker symbol

    Returns:
        StockInfo object or None if ticker not found
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info

        return StockInfo(
            ticker=ticker,
            name=info.get("longName") or info.get("shortName") or ticker,
            sector=info.get("sector"),
            industry=info.get("industry"),
            market_cap=info.get("marketCap"),
            country=info.get("country", "US"),
        )
    except Exception as e:
        print(f"Error getting info for {ticker}: {e}")
        return None


def get_historical_prices(
    ticker: str,
    start_date: datetime | str | None = None,
    end_date: datetime | str | None = None,
    period: str = "2y",
) -> pd.DataFrame:
    """
    Get historical price data for a stock.

    Args:
        ticker: Stock ticker symbol
        start_date: Start date (optional if using period)
        end_date: End date (optional if using period)
        period: Period to fetch if dates not specified (e.g., "1y", "2y", "5y")

    Returns:
        DataFrame with columns: Open, High, Low, Close, Volume, Adj Close
    """
    try:
        stock = yf.Ticker(ticker)

        if start_date and end_date:
            df = stock.history(start=start_date, end=end_date)
        else:
            df = stock.history(period=period)

        if df.empty:
            return pd.DataFrame()

        # Add ticker column
        df["ticker"] = ticker

        # Calculate daily returns
        df["returns"] = df["Close"].pct_change()

        return df

    except Exception as e:
        print(f"Error getting prices for {ticker}: {e}")
        return pd.DataFrame()


def get_earnings_history(ticker: str) -> list[EarningsEvent]:
    """
    Get historical earnings data for a stock.

    Args:
        ticker: Stock ticker symbol

    Returns:
        List of EarningsEvent objects
    """
    try:
        stock = yf.Ticker(ticker)
        earnings = stock.earnings_history

        if earnings is None or earnings.empty:
            return []

        events = []
        for _, row in earnings.iterrows():
            # Calculate surprise percentage
            surprise_pct = None
            if row.get("epsEstimate") and row.get("epsActual"):
                if row["epsEstimate"] != 0:
                    surprise_pct = (
                        (row["epsActual"] - row["epsEstimate"]) / abs(row["epsEstimate"]) * 100
                    )

            events.append(
                EarningsEvent(
                    ticker=ticker,
                    date=row.name if isinstance(row.name, datetime) else datetime.now(),
                    eps_estimate=row.get("epsEstimate"),
                    eps_actual=row.get("epsActual"),
                    surprise_percent=surprise_pct,
                    revenue_estimate=None,  # Not always available
                    revenue_actual=None,
                )
            )

        return events

    except Exception as e:
        print(f"Error getting earnings for {ticker}: {e}")
        return []


def get_earnings_calendar(ticker: str) -> list[dict[str, Any]]:
    """
    Get upcoming earnings dates for a stock.

    Args:
        ticker: Stock ticker symbol

    Returns:
        List of upcoming earnings dates
    """
    try:
        stock = yf.Ticker(ticker)
        calendar = stock.calendar

        if calendar is None:
            return []

        # calendar can be a dict or DataFrame depending on yfinance version
        if isinstance(calendar, dict):
            earnings_date = calendar.get("Earnings Date")
            if earnings_date:
                return [{"ticker": ticker, "date": earnings_date}]
        elif isinstance(calendar, pd.DataFrame):
            # Extract earnings dates from DataFrame
            if "Earnings Date" in calendar.columns:
                dates = calendar["Earnings Date"].tolist()
                return [{"ticker": ticker, "date": d} for d in dates if d]

        return []

    except Exception as e:
        print(f"Error getting calendar for {ticker}: {e}")
        return []


def get_sp500_tickers() -> list[str]:
    """
    Get list of S&P 500 tickers.

    Returns:
        List of ticker symbols
    """
    # Fetch from Wikipedia (yfinance doesn't have this built-in)
    try:
        url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
        tables = pd.read_html(url)
        sp500_table = tables[0]
        tickers = sp500_table["Symbol"].tolist()
        # Clean up tickers (some have dots like BRK.B)
        return [t.replace(".", "-") for t in tickers]
    except Exception as e:
        print(f"Error fetching S&P 500 list: {e}")
        # Return top 100 most common tickers as fallback
        return TOP_100_TICKERS


def get_price_reaction(
    ticker: str,
    event_date: datetime,
    days_before: int = 1,
    days_after: int = 5,
) -> dict[str, float]:
    """
    Calculate price reaction around an event.

    Args:
        ticker: Stock ticker
        event_date: Date of the event
        days_before: Days before event for baseline
        days_after: Days after event to measure reaction

    Returns:
        Dict with reaction metrics
    """
    start = event_date - timedelta(days=days_before + 5)  # Buffer for weekends
    end = event_date + timedelta(days=days_after + 5)

    df = get_historical_prices(ticker, start_date=start, end_date=end)

    if df.empty:
        return {}

    # Find prices around event
    df.index = pd.to_datetime(df.index)

    # Get price before event
    before = df[df.index < event_date].tail(1)
    if before.empty:
        return {}
    price_before = before["Close"].iloc[0]

    # Get prices after event
    after = df[df.index >= event_date].head(days_after)
    if after.empty:
        return {}

    return {
        "price_before": price_before,
        "price_day1": after["Close"].iloc[0] if len(after) > 0 else None,
        "price_day2": after["Close"].iloc[1] if len(after) > 1 else None,
        "price_day5": after["Close"].iloc[-1] if len(after) >= 5 else None,
        "return_day1": (
            (after["Close"].iloc[0] - price_before) / price_before * 100
            if len(after) > 0
            else None
        ),
        "return_day5": (
            (after["Close"].iloc[-1] - price_before) / price_before * 100
            if len(after) >= 5
            else None
        ),
    }


def calculate_correlation(
    ticker_a: str,
    ticker_b: str,
    period: str = "1y",
    lag_days: int = 0,
) -> tuple[float, float]:
    """
    Calculate correlation between two stocks' returns.

    Args:
        ticker_a: First ticker
        ticker_b: Second ticker
        period: Period to analyze
        lag_days: Days to lag ticker_b (positive = B lags A)

    Returns:
        Tuple of (correlation, p-value)
    """
    df_a = get_historical_prices(ticker_a, period=period)
    df_b = get_historical_prices(ticker_b, period=period)

    if df_a.empty or df_b.empty:
        return 0.0, 1.0

    # Align dates
    returns_a = df_a["returns"].dropna()
    returns_b = df_b["returns"].dropna()

    # Apply lag if specified
    if lag_days > 0:
        returns_b = returns_b.shift(lag_days)

    # Find common dates
    common_idx = returns_a.index.intersection(returns_b.index)
    if len(common_idx) < 30:  # Need at least 30 observations
        return 0.0, 1.0

    returns_a = returns_a.loc[common_idx]
    returns_b = returns_b.loc[common_idx]

    correlation = returns_a.corr(returns_b)

    # Simple p-value approximation (Fisher transform)
    import numpy as np

    n = len(common_idx)
    z = 0.5 * np.log((1 + correlation) / (1 - correlation + 1e-10))
    se = 1 / np.sqrt(n - 3)
    p_value = 2 * (1 - 0.5 * (1 + np.tanh(abs(z) / se)))  # Approximate

    return correlation, p_value


# Fallback list of top tickers
TOP_100_TICKERS = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK-B", "UNH", "JNJ",
    "JPM", "V", "PG", "XOM", "MA", "HD", "CVX", "MRK", "ABBV", "LLY",
    "PEP", "COST", "KO", "AVGO", "WMT", "MCD", "CSCO", "TMO", "ACN", "ABT",
    "DHR", "NEE", "LIN", "ADBE", "NKE", "TXN", "PM", "CRM", "VZ", "CMCSA",
    "ORCL", "AMD", "INTC", "QCOM", "UPS", "RTX", "HON", "LOW", "IBM", "CAT",
    "GE", "BA", "SPGI", "INTU", "AMAT", "DE", "SBUX", "AXP", "BKNG", "GS",
    "ISRG", "MDLZ", "BLK", "PLD", "GILD", "ADI", "SYK", "MMC", "ADP", "CVS",
    "TJX", "REGN", "VRTX", "CI", "ZTS", "SCHW", "LRCX", "SO", "MO", "BDX",
    "CB", "DUK", "EOG", "FISV", "ITW", "KLAC", "PGR", "NOC", "HUM", "WM",
    "BSX", "CL", "SNPS", "MCK", "CSX", "SLB", "APD", "CME", "EMR", "FDX",
]
