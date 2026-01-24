"""Securities-specific event helpers.

This module provides convenience functions for creating securities-related
events (earnings, news, etc.) using the generic Event class.
"""

from datetime import datetime

from src.engine.propagate import Event


def create_earnings_event(
    ticker: str,
    surprise_percent: float,
    description: str = "",
    timestamp: datetime | None = None
) -> Event:
    """
    Create an earnings surprise event.

    Args:
        ticker: Stock ticker (e.g., "AAPL")
        surprise_percent: Earnings surprise as percentage (e.g., -8.0 for 8% miss)
        description: Human-readable description (e.g., "AAPL Q4 2024 earnings miss")
        timestamp: Event timestamp (defaults to now)

    Returns:
        Event configured for earnings surprise.

    Example:
        >>> event = create_earnings_event("AAPL", -8.0, "AAPL Q4 earnings miss")
        >>> # Creates an event representing an 8% earnings miss for Apple
    """
    return Event(
        entity=ticker,
        magnitude=surprise_percent / 100,  # Convert percentage to decimal
        event_type="earnings_surprise",
        timestamp=timestamp or datetime.now(),
        description=description or f"{ticker} earnings surprise: {surprise_percent:+.1f}%"
    )


def create_news_event(
    ticker: str,
    impact_percent: float,
    description: str,
    timestamp: datetime | None = None
) -> Event:
    """
    Create a news event (for future use).

    Args:
        ticker: Stock ticker
        impact_percent: Expected impact as percentage
        description: News description
        timestamp: Event timestamp (defaults to now)

    Returns:
        Event configured for news.
    """
    return Event(
        entity=ticker,
        magnitude=impact_percent / 100,
        event_type="news",
        timestamp=timestamp or datetime.now(),
        description=description
    )


def create_regulatory_event(
    ticker: str,
    impact_percent: float,
    description: str,
    timestamp: datetime | None = None
) -> Event:
    """
    Create a regulatory event (for future use).

    Args:
        ticker: Stock ticker
        impact_percent: Expected impact as percentage
        description: Regulatory action description
        timestamp: Event timestamp (defaults to now)

    Returns:
        Event configured for regulatory action.
    """
    return Event(
        entity=ticker,
        magnitude=impact_percent / 100,
        event_type="regulatory",
        timestamp=timestamp or datetime.now(),
        description=description
    )
