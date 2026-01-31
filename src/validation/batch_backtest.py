"""Batch backtesting engine for historical earnings events."""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from src.engine import propagate_with_explanation
from src.adapters.securities import create_earnings_event
from src.db.models import BacktestRun, BacktestResult, Entity
import yfinance as yf
import asyncio
from typing import List, Dict
import httpx
import os


class BatchBacktester:
    """Runs batch backtests on historical earnings events."""

    def __init__(self, db: Session):
        self.db = db

    async def run_batch(
        self,
        start_date: datetime,
        end_date: datetime,
        min_surprise: float = 3.0,
        max_events: int = 1000
    ) -> BacktestRun:
        """
        Run a batch backtest on historical earnings events.

        Args:
            start_date: Start of backtest period
            end_date: End of backtest period
            min_surprise: Minimum surprise percentage to include
            max_events: Maximum number of events to process

        Returns:
            Completed BacktestRun with results
        """
        run = BacktestRun(
            start_date=start_date,
            end_date=end_date,
            min_surprise=min_surprise,
            status='running',
            created_at=datetime.utcnow()
        )
        self.db.add(run)
        self.db.commit()

        try:
            # Fetch historical events
            events = await self.fetch_historical_events(start_date, end_date, min_surprise)
            events = events[:max_events]

            print(f"Processing {len(events)} historical events...")

            # Process in batches to avoid overwhelming the system
            batch_size = 50
            for i in range(0, len(events), batch_size):
                batch = events[i:i+batch_size]
                await asyncio.gather(*[
                    self.process_event(run.id, event) for event in batch
                ])
                print(f"Processed {min(i + batch_size, len(events))}/{len(events)} events")

            # Calculate summary statistics
            run.total_events = len(events)
            run.status = 'completed'
            run.completed_at = datetime.utcnow()

            results = self.db.query(BacktestResult).filter_by(run_id=run.id).all()

            if results:
                run.avg_accuracy = sum(r.accuracy for r in results) / len(results)
                run.avg_mae = sum(r.mae for r in results) / len(results)
                run.profitable_trades = sum(1 for r in results if r.roi > 0)
                run.total_roi = sum(r.roi for r in results)
            else:
                run.avg_accuracy = 0
                run.avg_mae = 0
                run.profitable_trades = 0
                run.total_roi = 0

            self.db.commit()
            return run

        except Exception as e:
            run.status = 'failed'
            self.db.commit()
            print(f"Backtest failed: {e}")
            raise

    async def fetch_historical_events(
        self,
        start_date: datetime,
        end_date: datetime,
        min_surprise: float
    ) -> List[Dict]:
        """
        Fetch historical earnings events from external API.

        Args:
            start_date: Start date for events
            end_date: End date for events
            min_surprise: Minimum surprise percentage

        Returns:
            List of event dictionaries
        """
        # For now, use a simplified approach with entities we have in the database
        # In production, you would integrate with a real earnings calendar API
        entities = self.db.query(Entity).filter(Entity.type == 'company').limit(100).all()

        events = []
        for entity in entities:
            # Simulate historical events with varying surprise percentages
            # In production, fetch from real API like Financial Modeling Prep
            event_date = start_date + timedelta(days=30)
            while event_date < end_date:
                # Simulate some events with significant surprises
                import random
                if random.random() > 0.7:  # 30% of companies have events
                    surprise_pct = random.uniform(-15, 15)
                    if abs(surprise_pct) >= min_surprise:
                        events.append({
                            'ticker': entity.id,
                            'date': event_date,
                            'surprise_percent': surprise_pct
                        })
                event_date += timedelta(days=90)  # Quarterly earnings

        return events[:1000]  # Limit to reasonable number

    async def process_event(self, run_id: int, event: Dict):
        """
        Process a single historical event.

        Args:
            run_id: ID of the backtest run
            event: Event dictionary with ticker, date, surprise_percent
        """
        ticker = event['ticker']
        surprise_pct = event['surprise_percent']
        event_date = event['date']

        try:
            # Generate cascade prediction
            cascade = await predict_earnings_cascade(
                entity_id=ticker,
                surprise_percent=surprise_pct,
                horizon_days=14
            )

            # Fetch actual outcomes
            outcomes = await self.fetch_actual_outcomes(cascade, event_date)

            if not outcomes:
                return  # Skip if no actual data available

            # Calculate metrics
            predictions = []
            actuals = []

            for day, effects in cascade.timeline.items():
                for effect in effects:
                    if effect.entity in outcomes:
                        predictions.append(effect.magnitude_percent)
                        actuals.append(outcomes[effect.entity])

            if not predictions:
                return

            # Calculate mean absolute error
            mae = sum(abs(p - a) for p, a in zip(predictions, actuals)) / len(predictions)

            # Calculate accuracy (inverse of normalized MAE)
            accuracy = max(0, 1 - (mae / 100))

            # Calculate ROI based on direction accuracy
            roi = self.calculate_roi(cascade, outcomes)

            # Store result
            result = BacktestResult(
                run_id=run_id,
                ticker=ticker,
                event_date=event_date,
                surprise_percent=surprise_pct,
                num_predictions=len(predictions),
                accuracy=accuracy,
                mae=mae,
                roi=roi,
                cascade_json=cascade.to_dict()
            )
            self.db.add(result)
            self.db.commit()

        except Exception as e:
            print(f"Failed to process event {ticker} on {event_date}: {e}")

    async def fetch_actual_outcomes(
        self,
        cascade,
        event_date: datetime
    ) -> Dict[str, float]:
        """
        Fetch actual price movements using yfinance.

        Args:
            cascade: CascadePrediction object
            event_date: Date of the earnings event

        Returns:
            Dictionary mapping ticker to actual percentage change
        """
        outcomes = {}

        # Collect all unique tickers from cascade
        tickers = set()
        for effects in cascade.timeline.values():
            for effect in effects:
                tickers.add(effect.entity)

        # Fetch actual data for each ticker
        for ticker in tickers:
            try:
                stock = yf.Ticker(ticker)
                history = stock.history(
                    start=event_date,
                    end=event_date + timedelta(days=14)
                )

                if len(history) >= 2:
                    initial_price = history['Close'].iloc[0]
                    final_price = history['Close'].iloc[-1]
                    actual_change = ((final_price - initial_price) / initial_price) * 100
                    outcomes[ticker] = actual_change

            except Exception as e:
                # Skip tickers with data issues
                continue

        return outcomes

    def calculate_roi(self, cascade, outcomes: Dict[str, float]) -> float:
        """
        Calculate simulated ROI based on trading the cascade predictions.

        Args:
            cascade: CascadePrediction object
            outcomes: Dictionary of actual outcomes

        Returns:
            Total ROI percentage
        """
        total_return = 0
        num_trades = 0

        for effects in cascade.timeline.values():
            for effect in effects:
                if effect.entity in outcomes:
                    predicted_direction = 1 if effect.magnitude_percent > 0 else -1
                    actual_return = outcomes[effect.entity]

                    # If we predicted direction correctly, we profit
                    if (predicted_direction > 0 and actual_return > 0) or \
                       (predicted_direction < 0 and actual_return < 0):
                        total_return += abs(actual_return)
                    else:
                        # Wrong direction means we lose
                        total_return -= abs(actual_return)

                    num_trades += 1

        return total_return / num_trades if num_trades > 0 else 0
