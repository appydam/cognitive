"""Earnings calendar tracking and event detection.

This module provides functionality to:
1. Track upcoming earnings dates for companies
2. Auto-detect when earnings are released
3. Calculate earnings surprise (actual vs expected)
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
from dataclasses import dataclass, asdict

import yfinance as yf


@dataclass
class UpcomingEarnings:
    """An upcoming earnings event."""

    ticker: str
    company_name: str
    earnings_date: datetime
    eps_estimate: float | None
    revenue_estimate: float | None
    fetched_at: datetime


@dataclass
class EarningsSurprise:
    """A reported earnings event with surprise calculation."""

    ticker: str
    company_name: str
    report_date: datetime
    eps_estimate: float | None
    eps_actual: float | None
    surprise_percent: float | None
    revenue_estimate: float | None
    revenue_actual: float | None
    detected_at: datetime


def get_upcoming_earnings(
    tickers: list[str],
    days_ahead: int = 30
) -> list[UpcomingEarnings]:
    """
    Get upcoming earnings dates for a list of tickers.

    Args:
        tickers: List of stock tickers
        days_ahead: Look ahead this many days

    Returns:
        List of UpcomingEarnings objects
    """
    upcoming = []
    cutoff_date = datetime.now() + timedelta(days=days_ahead)

    for ticker in tickers:
        try:
            stock = yf.Ticker(ticker)
            info = stock.info

            company_name = info.get("longName", ticker)

            # Try to get earnings date from calendar
            calendar = stock.calendar
            if calendar is not None:
                earnings_date = None

                if isinstance(calendar, dict):
                    earnings_date = calendar.get("Earnings Date")
                elif hasattr(calendar, "iloc"):
                    # DataFrame-like object
                    if len(calendar) > 0:
                        earnings_date = calendar.iloc[0].get("Earnings Date")

                if earnings_date and earnings_date < cutoff_date:
                    # Try to get estimates
                    earnings_estimate = stock.earnings_dates
                    eps_estimate = None

                    if earnings_estimate is not None and not earnings_estimate.empty:
                        # Get most recent estimate
                        if "EPS Estimate" in earnings_estimate.columns:
                            eps_estimate = earnings_estimate["EPS Estimate"].iloc[0]

                    upcoming.append(
                        UpcomingEarnings(
                            ticker=ticker,
                            company_name=company_name,
                            earnings_date=earnings_date,
                            eps_estimate=eps_estimate,
                            revenue_estimate=None,  # Not always available
                            fetched_at=datetime.now()
                        )
                    )

        except Exception as e:
            # Skip on error (ticker may not exist or API issue)
            continue

    # Sort by date
    upcoming.sort(key=lambda x: x.earnings_date)
    return upcoming


def detect_recent_earnings(
    tickers: list[str],
    days_back: int = 1
) -> list[EarningsSurprise]:
    """
    Detect earnings reported in the last N days.

    Args:
        tickers: List of stock tickers to check
        days_back: Check this many days back

    Returns:
        List of EarningsSurprise objects
    """
    cutoff_date = datetime.now() - timedelta(days=days_back)
    detected = []

    for ticker in tickers:
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            company_name = info.get("longName", ticker)

            # Get earnings history
            earnings_history = stock.earnings_history

            if earnings_history is None or earnings_history.empty:
                continue

            # Check most recent earnings
            latest = earnings_history.iloc[0]

            # Get report date (index is the date)
            report_date = latest.name if hasattr(latest, "name") else datetime.now()

            if report_date > cutoff_date:
                # Recent earnings found
                eps_estimate = latest.get("epsEstimate")
                eps_actual = latest.get("epsActual")

                # Calculate surprise
                surprise_pct = None
                if eps_estimate and eps_actual and eps_estimate != 0:
                    surprise_pct = (eps_actual - eps_estimate) / abs(eps_estimate) * 100

                detected.append(
                    EarningsSurprise(
                        ticker=ticker,
                        company_name=company_name,
                        report_date=report_date,
                        eps_estimate=eps_estimate,
                        eps_actual=eps_actual,
                        surprise_percent=surprise_pct,
                        revenue_estimate=None,
                        revenue_actual=None,
                        detected_at=datetime.now()
                    )
                )

        except Exception as e:
            continue

    # Sort by date (most recent first)
    detected.sort(key=lambda x: x.report_date, reverse=True)
    return detected


def save_earnings_calendar(
    upcoming: list[UpcomingEarnings],
    output_path: str = "data/earnings_calendar.json"
) -> None:
    """
    Save upcoming earnings to file.

    Args:
        upcoming: List of UpcomingEarnings
        output_path: Output file path
    """
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    # Convert to serializable format
    data = []
    for item in upcoming:
        d = asdict(item)
        d["earnings_date"] = d["earnings_date"].isoformat()
        d["fetched_at"] = d["fetched_at"].isoformat()
        data.append(d)

    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def load_earnings_calendar(
    input_path: str = "data/earnings_calendar.json"
) -> list[UpcomingEarnings]:
    """
    Load earnings calendar from file.

    Args:
        input_path: Input file path

    Returns:
        List of UpcomingEarnings
    """
    path = Path(input_path)
    if not path.exists():
        return []

    with open(path) as f:
        data = json.load(f)

    upcoming = []
    for item in data:
        item["earnings_date"] = datetime.fromisoformat(item["earnings_date"])
        item["fetched_at"] = datetime.fromisoformat(item["fetched_at"])
        upcoming.append(UpcomingEarnings(**item))

    return upcoming


def save_earnings_surprises(
    surprises: list[EarningsSurprise],
    output_path: str = "data/earnings_surprises.json",
    append: bool = True
) -> None:
    """
    Save detected earnings surprises.

    Args:
        surprises: List of EarningsSurprise
        output_path: Output file path
        append: If True, append to existing file
    """
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    # Load existing if appending
    existing = []
    if append and path.exists():
        with open(path) as f:
            existing = json.load(f)

    # Convert to serializable format
    for item in surprises:
        d = asdict(item)
        d["report_date"] = d["report_date"].isoformat()
        d["detected_at"] = d["detected_at"].isoformat()

        # Avoid duplicates
        if not any(
            e["ticker"] == d["ticker"] and e["report_date"] == d["report_date"]
            for e in existing
        ):
            existing.append(d)

    with open(path, "w") as f:
        json.dump(existing, f, indent=2)
