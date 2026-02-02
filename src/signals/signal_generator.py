"""Trade signal generator.

Converts cascade effects into actionable BUY/SELL signals with
entry prices, targets, stop losses, and conviction scores.
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Optional
import yfinance as yf


@dataclass
class TradeSignal:
    """A concrete trade signal derived from a cascade effect."""
    ticker: str
    name: str
    direction: str  # "BUY" or "SELL"
    entry_price: float
    target_price: float
    stop_price: float
    conviction: int  # 1-5 stars
    confidence: float
    cascade_order: int
    magnitude_percent: float
    day: float
    horizon_days: int
    relationship_type: str
    cause_chain: list[str]
    trigger_event: str  # e.g. "TSMC earnings miss -12%"
    reward_risk_ratio: float
    max_loss_dollars: Optional[float] = None
    max_gain_dollars: Optional[float] = None
    position_size_pct: float = 0.0  # % of portfolio
    created_at: str = ""
    status: str = "active"  # active, target_hit, stopped, expired
    id: Optional[int] = None

    def to_dict(self) -> dict:
        return asdict(self)


def get_current_price(ticker: str) -> Optional[float]:
    """Fetch current market price for a ticker via yfinance."""
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="5d")
        if hist.empty:
            return None
        return float(hist["Close"].iloc[-1])
    except Exception as e:
        print(f"[SignalGen] Failed to get price for {ticker}: {e}")
        return None


def calculate_conviction(
    confidence: float,
    cascade_order: int,
    magnitude_pct: float,
) -> int:
    """
    Calculate conviction score (1-5 stars).

    Based on:
    - Confidence from the cascade engine (0-1)
    - Cascade order (1st order = strongest)
    - Magnitude (bigger moves = more actionable)
    """
    score = 0.0

    # Confidence contributes 0-2 points
    score += confidence * 2.0

    # Order contributes 0-1.5 points (1st order = 1.5, 2nd = 1.0, 3rd = 0.5)
    order_score = max(0, 2.0 - cascade_order * 0.5)
    score += order_score

    # Magnitude contributes 0-1.5 points
    abs_mag = abs(magnitude_pct)
    if abs_mag >= 5:
        score += 1.5
    elif abs_mag >= 2:
        score += 1.0
    elif abs_mag >= 1:
        score += 0.5

    # Clamp to 1-5
    stars = max(1, min(5, round(score)))
    return stars


def calculate_position_size(conviction: int) -> float:
    """Suggested position size as % of portfolio based on conviction."""
    sizes = {1: 1.0, 2: 2.0, 3: 3.0, 4: 4.0, 5: 5.0}
    return sizes.get(conviction, 2.0)


def generate_signals_from_cascade(
    cascade_effects: list[dict],
    trigger_entity: str,
    trigger_magnitude: float,
    trigger_description: str = "",
    min_confidence: float = 0.5,
    portfolio_value: Optional[float] = None,
    graph_entities: Optional[dict] = None,
) -> list[TradeSignal]:
    """
    Generate trade signals from cascade effects.

    Args:
        cascade_effects: Flat list of effect dicts from the cascade engine.
            Each has: entity, magnitude_percent, day, confidence, order,
            relationship_type, cause_path
        trigger_entity: The entity that triggered the cascade
        trigger_magnitude: The trigger magnitude in percent
        trigger_description: Human-readable description
        min_confidence: Minimum confidence to generate a signal
        portfolio_value: Optional portfolio value for dollar calculations
        graph_entities: Optional dict of entity_id -> entity info from graph

    Returns:
        List of TradeSignal objects
    """
    if not trigger_description:
        direction_word = "beat" if trigger_magnitude > 0 else "miss"
        trigger_description = f"{trigger_entity} earnings {direction_word} {abs(trigger_magnitude):.1f}%"

    signals = []
    seen_tickers = set()

    for effect in cascade_effects:
        ticker = effect.get("entity", "")
        confidence = effect.get("confidence", 0)
        magnitude_pct = effect.get("magnitude_percent", 0)
        order = effect.get("order", 1)
        day = effect.get("day", 1)
        rel_type = effect.get("relationship_type", "")
        cause_path = effect.get("cause_path", [])

        # Skip low confidence or already seen tickers (take strongest signal)
        if confidence < min_confidence:
            continue
        if ticker in seen_tickers:
            continue
        # Skip the trigger entity itself
        if ticker.upper() == trigger_entity.upper():
            continue

        # Get current price
        price = get_current_price(ticker)
        if price is None or price <= 0:
            continue

        seen_tickers.add(ticker)

        # Determine direction
        direction = "BUY" if magnitude_pct > 0 else "SELL"

        # Calculate target and stop
        target_price = price * (1 + magnitude_pct / 100)
        # Stop loss = half the magnitude in the opposite direction
        stop_offset = abs(magnitude_pct) * 0.5 / 100
        if direction == "BUY":
            stop_price = price * (1 - stop_offset)
        else:
            stop_price = price * (1 + stop_offset)

        # Reward/risk ratio
        reward = abs(target_price - price)
        risk = abs(stop_price - price)
        rr_ratio = reward / risk if risk > 0 else 0

        # Conviction
        conviction = calculate_conviction(confidence, order, magnitude_pct)
        position_size = calculate_position_size(conviction)

        # Dollar amounts
        max_loss = None
        max_gain = None
        if portfolio_value:
            position_dollars = portfolio_value * position_size / 100
            shares = position_dollars / price if price > 0 else 0
            max_loss = round(shares * risk, 2)
            max_gain = round(shares * reward, 2)

        # Entity name
        name = ticker
        if graph_entities and ticker in graph_entities:
            entity = graph_entities[ticker]
            if hasattr(entity, 'name'):
                name = entity.name

        # Horizon days
        horizon = max(1, int(round(day + 2)))  # Buffer of 2 days beyond predicted timing

        signal = TradeSignal(
            ticker=ticker,
            name=name,
            direction=direction,
            entry_price=round(price, 2),
            target_price=round(target_price, 2),
            stop_price=round(stop_price, 2),
            conviction=conviction,
            confidence=round(confidence, 3),
            cascade_order=order,
            magnitude_percent=round(magnitude_pct, 2),
            day=round(day, 1),
            horizon_days=horizon,
            relationship_type=rel_type,
            cause_chain=cause_path,
            trigger_event=trigger_description,
            reward_risk_ratio=round(rr_ratio, 1),
            max_loss_dollars=max_loss,
            max_gain_dollars=max_gain,
            position_size_pct=position_size,
            created_at=datetime.now().isoformat(),
        )
        signals.append(signal)

    # Sort by conviction (highest first), then by magnitude
    signals.sort(key=lambda s: (s.conviction, abs(s.magnitude_percent)), reverse=True)

    return signals


def flatten_cascade_effects(timeline: dict) -> list[dict]:
    """
    Flatten a CascadeResponse timeline dict into a flat list of effects.

    The cascade API returns {period: [effects]}, this flattens it.
    """
    effects = []
    for period, period_effects in timeline.items():
        for effect in period_effects:
            if isinstance(effect, dict):
                effects.append(effect)
            else:
                # If it's a Pydantic model or similar
                effects.append(effect.__dict__ if hasattr(effect, '__dict__') else effect)
    return effects
