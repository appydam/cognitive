"""Signal outcome tracker.

Tracks active signals against real prices to determine wins/losses
and calculate running P&L.
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from src.signals.signal_generator import get_current_price


SIGNALS_FILE = Path("data/signals.json")


def _load_signals() -> list[dict]:
    """Load signals from file storage."""
    if not SIGNALS_FILE.exists():
        return []
    try:
        with open(SIGNALS_FILE) as f:
            return json.load(f)
    except Exception:
        return []


def _save_signals(signals: list[dict]) -> None:
    """Save signals to file storage."""
    SIGNALS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(SIGNALS_FILE, "w") as f:
        json.dump(signals, f, indent=2, default=str)


def save_signal(signal_dict: dict) -> dict:
    """Save a new signal and return it with an ID."""
    signals = _load_signals()
    # Assign ID
    max_id = max((s.get("id", 0) for s in signals), default=0)
    signal_dict["id"] = max_id + 1
    signal_dict["status"] = "active"
    signals.append(signal_dict)
    _save_signals(signals)
    return signal_dict


def save_signals_batch(signal_dicts: list[dict]) -> list[dict]:
    """Save multiple signals at once."""
    signals = _load_signals()
    max_id = max((s.get("id", 0) for s in signals), default=0)
    for i, s in enumerate(signal_dicts):
        s["id"] = max_id + 1 + i
        s["status"] = "active"
        signals.append(s)
    _save_signals(signals)
    return signal_dicts


def get_active_signals() -> list[dict]:
    """Get all active signals."""
    signals = _load_signals()
    return [s for s in signals if s.get("status") == "active"]


def get_all_signals(days: int = 30) -> list[dict]:
    """Get all signals from the last N days."""
    signals = _load_signals()
    cutoff = (datetime.now() - timedelta(days=days)).isoformat()
    return [s for s in signals if s.get("created_at", "") >= cutoff]


def get_signal_performance() -> dict:
    """Calculate aggregate P&L performance across all signals."""
    signals = _load_signals()

    closed = [s for s in signals if s.get("status") in ("target_hit", "stopped", "expired")]
    active = [s for s in signals if s.get("status") == "active"]

    if not closed:
        return {
            "total_pnl_pct": 0,
            "total_pnl_dollars": 0,
            "win_rate": 0,
            "avg_return_pct": 0,
            "total_signals": len(signals),
            "active_signals": len(active),
            "closed_signals": 0,
            "wins": 0,
            "losses": 0,
            "pnl_history": [],
        }

    wins = [s for s in closed if (s.get("pnl_percent") or 0) > 0]
    losses = [s for s in closed if (s.get("pnl_percent") or 0) <= 0]

    total_pnl_pct = sum(s.get("pnl_percent", 0) for s in closed)
    total_pnl_dollars = sum(s.get("pnl_dollars", 0) for s in closed)
    avg_return = total_pnl_pct / len(closed) if closed else 0

    # Build P&L history (cumulative by date)
    pnl_history = []
    cumulative = 0
    sorted_closed = sorted(closed, key=lambda s: s.get("exit_date", s.get("created_at", "")))
    for s in sorted_closed:
        cumulative += s.get("pnl_percent", 0)
        pnl_history.append({
            "date": s.get("exit_date", s.get("created_at", "")),
            "cumulative_pnl_pct": round(cumulative, 2),
            "ticker": s.get("ticker", ""),
            "pnl_percent": round(s.get("pnl_percent", 0), 2),
        })

    return {
        "total_pnl_pct": round(total_pnl_pct, 2),
        "total_pnl_dollars": round(total_pnl_dollars, 2),
        "win_rate": round(len(wins) / len(closed) * 100, 1) if closed else 0,
        "avg_return_pct": round(avg_return, 2),
        "total_signals": len(signals),
        "active_signals": len(active),
        "closed_signals": len(closed),
        "wins": len(wins),
        "losses": len(losses),
        "pnl_history": pnl_history,
    }


def update_signal_prices() -> dict:
    """
    Check active signals against current prices.
    Updates status to target_hit, stopped, or expired.

    Returns summary of updates.
    """
    signals = _load_signals()
    updates = {"checked": 0, "target_hit": 0, "stopped": 0, "expired": 0}

    now = datetime.now()

    for signal in signals:
        if signal.get("status") != "active":
            continue

        ticker = signal.get("ticker")
        if not ticker:
            continue

        updates["checked"] += 1

        # Check expiration first
        created = signal.get("created_at", "")
        horizon = signal.get("horizon_days", 7)
        try:
            created_dt = datetime.fromisoformat(created)
            if now > created_dt + timedelta(days=horizon):
                # Expired - get final price
                current = get_current_price(ticker)
                if current:
                    entry = signal.get("entry_price", current)
                    if signal["direction"] == "BUY":
                        pnl_pct = (current - entry) / entry * 100
                    else:
                        pnl_pct = (entry - current) / entry * 100

                    signal["status"] = "expired"
                    signal["exit_price"] = round(current, 2)
                    signal["exit_date"] = now.isoformat()
                    signal["pnl_percent"] = round(pnl_pct, 2)
                    signal["pnl_dollars"] = round(pnl_pct * entry / 100, 2)
                    updates["expired"] += 1
                continue
        except (ValueError, TypeError):
            pass

        # Check target/stop
        current = get_current_price(ticker)
        if current is None:
            continue

        entry = signal.get("entry_price", 0)
        target = signal.get("target_price", 0)
        stop = signal.get("stop_price", 0)
        direction = signal.get("direction", "BUY")

        hit_target = False
        hit_stop = False

        if direction == "BUY":
            hit_target = current >= target
            hit_stop = current <= stop
            pnl_pct = (current - entry) / entry * 100 if entry > 0 else 0
        else:
            hit_target = current <= target
            hit_stop = current >= stop
            pnl_pct = (entry - current) / entry * 100 if entry > 0 else 0

        if hit_target:
            signal["status"] = "target_hit"
            signal["exit_price"] = round(current, 2)
            signal["exit_date"] = now.isoformat()
            signal["pnl_percent"] = round(pnl_pct, 2)
            signal["pnl_dollars"] = round(pnl_pct * entry / 100, 2)
            updates["target_hit"] += 1
        elif hit_stop:
            signal["status"] = "stopped"
            signal["exit_price"] = round(current, 2)
            signal["exit_date"] = now.isoformat()
            signal["pnl_percent"] = round(pnl_pct, 2)
            signal["pnl_dollars"] = round(pnl_pct * entry / 100, 2)
            updates["stopped"] += 1

    _save_signals(signals)
    return updates
