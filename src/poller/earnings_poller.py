"""Earnings poller — automatic detection of earnings surprises.

Runs periodically to check for new earnings reports, triggers cascade
predictions, generates signals, and broadcasts alerts.
"""

import asyncio
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from src.data.earnings_calendar import (
    get_upcoming_earnings,
    detect_recent_earnings,
    EarningsSurprise,
)


# Cache file for upcoming earnings
CALENDAR_CACHE = Path("data/earnings_calendar_cache.json")
# Track already-processed surprises
PROCESSED_FILE = Path("data/processed_surprises.json")


def _load_processed() -> set[str]:
    """Load set of already-processed surprise keys (ticker+date)."""
    if not PROCESSED_FILE.exists():
        return set()
    try:
        with open(PROCESSED_FILE) as f:
            return set(json.load(f))
    except Exception:
        return set()


def _save_processed(processed: set[str]) -> None:
    PROCESSED_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PROCESSED_FILE, "w") as f:
        json.dump(list(processed), f)


def get_watchlist_tickers(graph_entities: Optional[dict] = None) -> list[str]:
    """
    Get tickers to monitor for earnings.
    Uses graph entities that are companies (not indicators/sectors).
    """
    if graph_entities:
        tickers = []
        for eid, entity in graph_entities.items():
            etype = getattr(entity, 'entity_type', '')
            if etype in ('company', 'COMPANY'):
                tickers.append(eid)
        return tickers[:30]  # Limit to avoid rate limiting and slowness

    # Fallback: top 20 high-impact tickers (kept small for speed)
    return [
        "AAPL", "MSFT", "NVDA", "AMD", "GOOGL", "META", "AMZN", "TSLA",
        "AVGO", "INTC", "JPM", "GS", "UNH", "JNJ", "XOM", "CVX",
        "HD", "WMT", "NFLX", "CRM",
    ]


def fetch_upcoming_earnings(
    graph_entities: Optional[dict] = None,
    days: int = 7,
) -> list[dict]:
    """
    Fetch upcoming earnings for monitored tickers.
    Returns list of dicts with ticker, company_name, earnings_date, eps_estimate.
    """
    tickers = get_watchlist_tickers(graph_entities)
    upcoming = get_upcoming_earnings(tickers, days_ahead=days)

    results = []
    for item in upcoming:
        results.append({
            "ticker": item.ticker,
            "company_name": item.company_name,
            "earnings_date": item.earnings_date.isoformat() if item.earnings_date else None,
            "eps_estimate": item.eps_estimate,
        })

    # Cache results
    CALENDAR_CACHE.parent.mkdir(parents=True, exist_ok=True)
    with open(CALENDAR_CACHE, "w") as f:
        json.dump({
            "fetched_at": datetime.now().isoformat(),
            "earnings": results,
        }, f, indent=2)

    return results


def get_cached_upcoming() -> list[dict]:
    """Get cached upcoming earnings (avoids hitting yfinance repeatedly)."""
    if not CALENDAR_CACHE.exists():
        return []
    try:
        with open(CALENDAR_CACHE) as f:
            data = json.load(f)
        # Check if cache is fresh (< 6 hours)
        fetched = datetime.fromisoformat(data.get("fetched_at", "2000-01-01"))
        if datetime.now() - fetched > timedelta(hours=6):
            return []  # Stale
        return data.get("earnings", [])
    except Exception:
        return []


def check_for_surprises(
    graph_entities: Optional[dict] = None,
    min_surprise: float = 3.0,
) -> list[EarningsSurprise]:
    """
    Check for new earnings surprises that haven't been processed yet.

    Returns only NEW surprises above the threshold.
    """
    tickers = get_watchlist_tickers(graph_entities)
    processed = _load_processed()

    # Detect recent earnings (last 2 days)
    recent = detect_recent_earnings(tickers, days_back=2)

    new_surprises = []
    for surprise in recent:
        key = f"{surprise.ticker}_{surprise.report_date.date().isoformat()}"
        if key in processed:
            continue
        if surprise.surprise_percent is None:
            continue
        if abs(surprise.surprise_percent) < min_surprise:
            continue

        new_surprises.append(surprise)
        processed.add(key)

    # Save updated processed set
    _save_processed(processed)

    return new_surprises
