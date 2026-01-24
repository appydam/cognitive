#!/usr/bin/env python3
"""Daily price update script for Consequence AI.

This script runs daily to:
1. Update historical prices for all entities
2. Validate pending predictions
3. Update graph weights via Bayesian learning
4. Refresh materialized views

Designed to run via GitHub Actions cron job.

Usage:
    python scripts/daily_update.py
    python scripts/daily_update.py --dry-run
"""

import argparse
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.db.connection import init_db, get_db_session
from src.db.models import Entity, Prediction, Outcome
from src.learning.tracker import PredictionTracker
from sqlalchemy import text


def update_entity_prices(session, dry_run: bool = False):
    """Update latest prices for all entities.

    Args:
        session: Database session
        dry_run: If True, don't commit changes
    """
    print("\n1. Updating entity prices...")

    try:
        import yfinance as yf
    except ImportError:
        print("   ⚠️  yfinance not installed, skipping price updates")
        return

    entities = session.query(Entity).filter_by(entity_type='COMPANY').all()
    print(f"   Found {len(entities)} companies to update")

    updated_count = 0
    failed_count = 0

    for entity in entities[:10]:  # Limit to avoid API rate limits
        try:
            ticker = yf.Ticker(entity.id)
            hist = ticker.history(period='5d')

            if len(hist) > 0:
                latest_price = hist['Close'].iloc[-1]
                # Store in metadata
                if entity.metadata_json is None:
                    entity.metadata_json = {}
                entity.metadata_json['last_price'] = float(latest_price)
                entity.metadata_json['last_updated'] = datetime.utcnow().isoformat()
                updated_count += 1
            else:
                failed_count += 1

        except Exception as e:
            print(f"   ⚠️  Failed to update {entity.id}: {e}")
            failed_count += 1

    if not dry_run:
        session.commit()

    print(f"   ✅ Updated: {updated_count}, Failed: {failed_count}")


def validate_pending_predictions(session, dry_run: bool = False):
    """Validate predictions that are due.

    Args:
        session: Database session
        dry_run: If True, don't commit changes
    """
    print("\n2. Validating pending predictions...")

    # Find predictions that need validation
    # (trigger_date + horizon_days <= today and status = 'pending')
    cutoff_date = datetime.utcnow() - timedelta(days=7)

    pending = session.query(Prediction).filter(
        Prediction.status == 'pending',
        Prediction.trigger_date <= cutoff_date
    ).all()

    print(f"   Found {len(pending)} predictions to validate")

    if len(pending) == 0:
        print("   No pending predictions")
        return

    tracker = PredictionTracker()
    validated_count = 0

    for prediction in pending[:5]:  # Limit to avoid API rate limits
        try:
            # Use tracker to fetch actuals
            outcomes = tracker.validate_prediction(str(prediction.id))

            # Store outcomes in database
            for outcome in outcomes:
                db_outcome = Outcome(
                    prediction_id=prediction.id,
                    ticker=outcome.ticker,
                    predicted_magnitude=outcome.predicted_magnitude,
                    predicted_day=outcome.predicted_day,
                    confidence=0.7,  # Default confidence
                    order=1,  # Default order
                    actual_magnitude=outcome.actual_magnitude,
                    actual_day=outcome.actual_day,
                    magnitude_error=outcome.error,
                    timing_error=abs(outcome.actual_day - outcome.predicted_day),
                    direction_correct=outcome.direction_correct,
                    within_confidence_bounds=outcome.within_confidence_bounds
                )
                session.add(db_outcome)

            # Update prediction status
            prediction.status = 'validated'
            prediction.validated_at = datetime.utcnow()
            validated_count += 1

        except Exception as e:
            print(f"   ⚠️  Failed to validate prediction {prediction.id}: {e}")

    if not dry_run:
        session.commit()

    print(f"   ✅ Validated {validated_count} predictions")


def update_graph_weights(session, dry_run: bool = False):
    """Update causal link weights based on outcomes.

    Args:
        session: Database session
        dry_run: If True, don't commit changes
    """
    print("\n3. Updating graph weights...")

    # This would use Bayesian learning to update link strengths
    # Based on recent prediction outcomes

    # For now, just log that this would happen
    recent_outcomes = session.query(Outcome).filter(
        Outcome.created_at >= datetime.utcnow() - timedelta(days=7)
    ).count()

    print(f"   Found {recent_outcomes} recent outcomes for learning")

    if recent_outcomes > 0:
        print("   ⚠️  Bayesian weight updates not yet implemented")
        print("   (Will be added when learning loop is fully integrated)")

    # TODO: Implement Bayesian weight updates
    # from src.learning.feedback import learn_from_outcomes


def refresh_materialized_views(session, dry_run: bool = False):
    """Refresh materialized views for performance.

    Args:
        session: Database session
        dry_run: If True, don't execute refresh
    """
    print("\n4. Refreshing materialized views...")

    try:
        if not dry_run:
            # Refresh accuracy stats view
            session.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY accuracy_stats"))
            session.commit()
            print("   ✅ Refreshed accuracy_stats view")
        else:
            print("   📝 Would refresh accuracy_stats view (dry run)")
    except Exception as e:
        print(f"   ⚠️  Failed to refresh views: {e}")
        print("   (View may not exist yet - run migrations first)")


def cleanup_old_data(session, dry_run: bool = False, days: int = 90):
    """Clean up old predictions and outcomes.

    Args:
        session: Database session
        dry_run: If True, don't delete data
        days: Delete predictions older than this many days
    """
    print(f"\n5. Cleaning up data older than {days} days...")

    cutoff_date = datetime.utcnow() - timedelta(days=days)

    old_predictions = session.query(Prediction).filter(
        Prediction.created_at < cutoff_date,
        Prediction.status == 'validated'
    ).count()

    if old_predictions > 0:
        print(f"   Found {old_predictions} old predictions")
        if not dry_run:
            # Actually delete (cascades to outcomes via ON DELETE CASCADE)
            session.query(Prediction).filter(
                Prediction.created_at < cutoff_date,
                Prediction.status == 'validated'
            ).delete()
            session.commit()
            print(f"   ✅ Deleted {old_predictions} old predictions")
        else:
            print(f"   📝 Would delete {old_predictions} predictions (dry run)")
    else:
        print("   No old data to clean up")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Daily database updates")
    parser.add_argument('--dry-run', action='store_true', help='Test without committing changes')
    parser.add_argument('--skip-prices', action='store_true', help='Skip price updates (faster)')
    parser.add_argument('--skip-cleanup', action='store_true', help='Skip data cleanup')

    args = parser.parse_args()

    print("=" * 60)
    print("Consequence AI - Daily Update")
    print("=" * 60)
    print(f"Time: {datetime.utcnow().isoformat()}")

    if args.dry_run:
        print("Mode: DRY RUN (no changes will be committed)")
    else:
        print("Mode: LIVE (changes will be committed)")

    # Get database URL
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("\n❌ DATABASE_URL not set")
        sys.exit(1)

    # Initialize database
    try:
        init_db(database_url)
        print("\n✅ Connected to database")
    except Exception as e:
        print(f"\n❌ Database connection failed: {e}")
        sys.exit(1)

    # Run updates
    try:
        with get_db_session() as session:
            if not args.skip_prices:
                update_entity_prices(session, dry_run=args.dry_run)

            validate_pending_predictions(session, dry_run=args.dry_run)
            update_graph_weights(session, dry_run=args.dry_run)
            refresh_materialized_views(session, dry_run=args.dry_run)

            if not args.skip_cleanup:
                cleanup_old_data(session, dry_run=args.dry_run)

    except Exception as e:
        print(f"\n❌ Update failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    print("\n" + "=" * 60)
    print("Daily update complete!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
