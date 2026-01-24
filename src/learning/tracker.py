"""Prediction tracking system.

This module:
1. Saves predictions to JSON with unique IDs
2. Fetches actual outcomes from Yahoo Finance
3. Calculates error metrics
4. Tracks accuracy over time
"""

import json
import uuid
from pathlib import Path
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import Optional

import yfinance as yf


@dataclass
class PredictionRecord:
    """A single prediction for one entity."""
    ticker: str
    predicted_magnitude: float  # Predicted price change (%)
    predicted_day: float  # Days after trigger event
    confidence: float
    order: int  # 1st, 2nd, 3rd order effect


@dataclass
class Prediction:
    """Complete prediction for a trigger event."""
    prediction_id: str
    timestamp: datetime
    trigger_ticker: str
    trigger_surprise: float
    trigger_date: datetime
    horizon_days: int
    predictions: list[PredictionRecord]
    status: str  # pending, validated, expired

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "prediction_id": self.prediction_id,
            "timestamp": self.timestamp.isoformat(),
            "trigger": {
                "ticker": self.trigger_ticker,
                "surprise_pct": self.trigger_surprise,
                "event_date": self.trigger_date.isoformat()
            },
            "horizon_days": self.horizon_days,
            "predictions": [
                {
                    "ticker": p.ticker,
                    "predicted_magnitude": p.predicted_magnitude,
                    "predicted_day": p.predicted_day,
                    "confidence": p.confidence,
                    "order": p.order
                }
                for p in self.predictions
            ],
            "status": self.status
        }


@dataclass
class Outcome:
    """Actual outcome for a prediction."""
    prediction_id: str
    ticker: str
    predicted_magnitude: float
    actual_magnitude: float
    predicted_day: float
    actual_day: float  # Day when max impact occurred
    error: float  # abs(actual - predicted)
    direction_correct: bool
    within_confidence_bounds: bool
    timestamp: datetime

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "prediction_id": self.prediction_id,
            "ticker": self.ticker,
            "predicted_magnitude": float(self.predicted_magnitude),
            "actual_magnitude": float(self.actual_magnitude),
            "predicted_day": float(self.predicted_day),
            "actual_day": float(self.actual_day),
            "error": float(self.error),
            "direction_correct": bool(self.direction_correct),
            "within_confidence_bounds": bool(self.within_confidence_bounds),
            "timestamp": self.timestamp.isoformat()
        }


class PredictionTracker:
    """Track predictions and validate against actual outcomes."""

    def __init__(self, data_dir: str = "data/predictions"):
        """Initialize tracker with data directory."""
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

        self.predictions_dir = self.data_dir / "predictions"
        self.outcomes_dir = self.data_dir / "outcomes"

        self.predictions_dir.mkdir(exist_ok=True)
        self.outcomes_dir.mkdir(exist_ok=True)

    def save_prediction(
        self,
        trigger_ticker: str,
        trigger_surprise: float,
        trigger_date: datetime,
        predictions: list[PredictionRecord],
        horizon_days: int = 7
    ) -> str:
        """
        Save a prediction to disk.

        Args:
            trigger_ticker: Ticker that triggered the cascade
            trigger_surprise: Earnings surprise % (e.g., -8.0 for 8% miss)
            trigger_date: Date of the trigger event
            predictions: List of predicted effects
            horizon_days: How many days to track

        Returns:
            prediction_id: Unique ID for this prediction
        """
        prediction_id = str(uuid.uuid4())[:8]  # Short ID

        prediction = Prediction(
            prediction_id=prediction_id,
            timestamp=datetime.now(),
            trigger_ticker=trigger_ticker,
            trigger_surprise=trigger_surprise,
            trigger_date=trigger_date,
            horizon_days=horizon_days,
            predictions=predictions,
            status="pending"
        )

        # Save to JSON
        file_path = self.predictions_dir / f"{prediction_id}.json"
        with open(file_path, 'w') as f:
            json.dump(prediction.to_dict(), f, indent=2)

        return prediction_id

    def fetch_actual_outcome(
        self,
        ticker: str,
        start_date: datetime,
        days_after: int = 7
    ) -> tuple[float, int]:
        """
        Fetch actual price change from Yahoo Finance.

        Args:
            ticker: Stock ticker
            start_date: Event date
            days_after: How many days to look forward

        Returns:
            (max_change_pct, day_of_max_change)
            - max_change_pct: Largest absolute price change in period
            - day_of_max_change: Which day the max occurred (0-based)
        """
        try:
            # Fetch price data
            end_date = start_date + timedelta(days=days_after + 2)
            stock = yf.Ticker(ticker)
            hist = stock.history(start=start_date, end=end_date)

            if len(hist) < 2:
                return 0.0, 0

            # Calculate daily returns
            base_price = hist['Close'].iloc[0]
            changes = []

            for i in range(1, min(len(hist), days_after + 1)):
                price = hist['Close'].iloc[i]
                change_pct = ((price - base_price) / base_price) * 100
                changes.append((change_pct, i - 1))  # 0-indexed day

            # Find max absolute change
            if not changes:
                return 0.0, 0

            max_change = max(changes, key=lambda x: abs(x[0]))
            return max_change[0], max_change[1]

        except Exception as e:
            print(f"Error fetching {ticker}: {e}")
            return 0.0, 0

    def validate_prediction(self, prediction_id: str) -> list[Outcome]:
        """
        Validate a prediction against actual outcomes.

        Args:
            prediction_id: ID of prediction to validate

        Returns:
            List of Outcome objects
        """
        # Load prediction
        pred_file = self.predictions_dir / f"{prediction_id}.json"
        if not pred_file.exists():
            raise FileNotFoundError(f"Prediction {prediction_id} not found")

        with open(pred_file) as f:
            pred_data = json.load(f)

        trigger_date = datetime.fromisoformat(pred_data['trigger']['event_date'])
        horizon_days = pred_data['horizon_days']

        outcomes = []

        # Validate each prediction
        for pred in pred_data['predictions']:
            ticker = pred['ticker']
            predicted_magnitude = pred['predicted_magnitude']
            predicted_day = pred['predicted_day']
            confidence = pred['confidence']

            # Fetch actual outcome
            actual_magnitude, actual_day = self.fetch_actual_outcome(
                ticker, trigger_date, horizon_days
            )

            # Calculate metrics
            error = abs(actual_magnitude - predicted_magnitude)
            direction_correct = (
                (predicted_magnitude > 0 and actual_magnitude > 0) or
                (predicted_magnitude < 0 and actual_magnitude < 0)
            )

            # Within confidence bounds (simple: error < 2x predicted)
            within_confidence = error < abs(predicted_magnitude * 2)

            outcome = Outcome(
                prediction_id=prediction_id,
                ticker=ticker,
                predicted_magnitude=predicted_magnitude,
                actual_magnitude=actual_magnitude,
                predicted_day=predicted_day,
                actual_day=float(actual_day),
                error=error,
                direction_correct=direction_correct,
                within_confidence_bounds=within_confidence,
                timestamp=datetime.now()
            )

            outcomes.append(outcome)

            # Save outcome
            outcome_file = self.outcomes_dir / f"{prediction_id}_{ticker}.json"
            with open(outcome_file, 'w') as f:
                json.dump(outcome.to_dict(), f, indent=2)

        # Update prediction status
        pred_data['status'] = 'validated'
        with open(pred_file, 'w') as f:
            json.dump(pred_data, f, indent=2)

        return outcomes

    def get_pending_predictions(self) -> list[str]:
        """Get list of prediction IDs that need validation."""
        pending = []

        for pred_file in self.predictions_dir.glob("*.json"):
            with open(pred_file) as f:
                data = json.load(f)
                if data['status'] == 'pending':
                    # Check if enough time has passed
                    trigger_date = datetime.fromisoformat(data['trigger']['event_date'])
                    horizon_days = data['horizon_days']
                    expiry_date = trigger_date + timedelta(days=horizon_days + 1)

                    if datetime.now() >= expiry_date:
                        pending.append(data['prediction_id'])

        return pending

    def get_accuracy_stats(self) -> dict:
        """
        Calculate overall accuracy statistics.

        Returns:
            Dictionary with accuracy metrics
        """
        all_outcomes = []

        for outcome_file in self.outcomes_dir.glob("*.json"):
            with open(outcome_file) as f:
                all_outcomes.append(json.load(f))

        if not all_outcomes:
            return {
                "total_predictions": 0,
                "direction_accuracy": 0.0,
                "mean_error": 0.0,
                "within_bounds_pct": 0.0
            }

        direction_correct = sum(1 for o in all_outcomes if o['direction_correct'])
        within_bounds = sum(1 for o in all_outcomes if o['within_confidence_bounds'])
        total_error = sum(o['error'] for o in all_outcomes)

        return {
            "total_predictions": len(all_outcomes),
            "direction_accuracy": direction_correct / len(all_outcomes) * 100,
            "mean_error": total_error / len(all_outcomes),
            "within_bounds_pct": within_bounds / len(all_outcomes) * 100,
            "outcomes": all_outcomes[:10]  # Sample
        }

    def load_outcomes_for_link(self, source: str, target: str) -> list[Outcome]:
        """
        Load all outcomes for a specific causal link.

        Args:
            source: Source ticker
            target: Target ticker

        Returns:
            List of Outcome objects for this link
        """
        outcomes = []

        for outcome_file in self.outcomes_dir.glob("*.json"):
            with open(outcome_file) as f:
                data = json.load(f)

                # Load corresponding prediction to check if it matches link
                pred_id = data['prediction_id']
                pred_file = self.predictions_dir / f"{pred_id}.json"

                if pred_file.exists():
                    with open(pred_file) as pf:
                        pred_data = json.load(pf)

                        if (pred_data['trigger']['ticker'] == source and
                            data['ticker'] == target):

                            outcomes.append(Outcome(
                                prediction_id=data['prediction_id'],
                                ticker=data['ticker'],
                                predicted_magnitude=data['predicted_magnitude'],
                                actual_magnitude=data['actual_magnitude'],
                                predicted_day=data['predicted_day'],
                                actual_day=data['actual_day'],
                                error=data['error'],
                                direction_correct=data['direction_correct'],
                                within_confidence_bounds=data['within_confidence_bounds'],
                                timestamp=datetime.fromisoformat(data['timestamp'])
                            ))

        return outcomes
