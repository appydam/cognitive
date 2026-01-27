"""SQLAlchemy ORM models for Consequence AI database.

This module defines the database schema using SQLAlchemy ORM.
Designed to work with PostgreSQL on Railway/Supabase.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, String, Float, Integer, DateTime, Boolean, Text,
    ForeignKey, JSON, UniqueConstraint, Index, CheckConstraint
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import uuid

Base = declarative_base()


class Entity(Base):
    """Entity table - represents companies, ETFs, sectors, etc."""

    __tablename__ = 'entities'

    # Primary key
    id = Column(String(10), primary_key=True)  # Ticker symbol

    # Core attributes
    name = Column(Text, nullable=False)
    entity_type = Column(String(20), nullable=False)  # COMPANY, ETF, SECTOR
    sector = Column(String(50))
    market_cap = Column(Float)  # Market cap in billions

    # Metadata
    metadata_json = Column('metadata', JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    outgoing_links = relationship('CausalLink', foreign_keys='CausalLink.source', back_populates='source_entity')
    incoming_links = relationship('CausalLink', foreign_keys='CausalLink.target', back_populates='target_entity')

    # Indexes
    __table_args__ = (
        Index('idx_entity_type', 'entity_type'),
        Index('idx_sector', 'sector'),
    )

    def __repr__(self):
        return f"<Entity(id='{self.id}', name='{self.name}', type='{self.entity_type}')>"


class CausalLink(Base):
    """Causal link table - represents relationships between entities."""

    __tablename__ = 'causal_links'

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Foreign keys
    source = Column(String(10), ForeignKey('entities.id'), nullable=False)
    target = Column(String(10), ForeignKey('entities.id'), nullable=False)

    # Relationship metadata
    relationship_type = Column(String(30), nullable=False)  # supplies, depends_on, correlates_with

    # Causal parameters
    strength = Column(Float, nullable=False)  # 0.0-1.0
    delay_mean = Column(Float, nullable=False)  # Days
    delay_std = Column(Float, default=0.5)
    confidence = Column(Float, nullable=False)  # 0.0-1.0
    direction = Column(Float, default=1.0)  # 1.0 (positive) or -1.0 (negative)

    # Evidence and learning
    evidence = Column(ARRAY(Text), default=list)
    data_source = Column(String(50))  # sec_filing, correlation, manual, sector
    historical_accuracy = Column(Float, default=0.0)
    observation_count = Column(Integer, default=0)

    # Verified relationship data (for SEC filings)
    revenue_pct = Column(Float)  # % of revenue this relationship represents
    fiscal_year = Column(Integer)
    source_url = Column(Text)
    verified_date = Column(DateTime)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    source_entity = relationship('Entity', foreign_keys=[source], back_populates='outgoing_links')
    target_entity = relationship('Entity', foreign_keys=[target], back_populates='incoming_links')

    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint('source', 'target', 'relationship_type', name='uq_source_target_relationship'),
        Index('idx_source', 'source'),
        Index('idx_target', 'target'),
        Index('idx_confidence', 'confidence'),
        Index('idx_data_source', 'data_source'),
        CheckConstraint('strength >= 0 AND strength <= 1', name='chk_strength_range'),
        CheckConstraint('confidence >= 0 AND confidence <= 1', name='chk_confidence_range'),
        CheckConstraint('direction >= -1 AND direction <= 1', name='chk_direction_values'),
    )

    def __repr__(self):
        return f"<CausalLink(source='{self.source}', target='{self.target}', strength={self.strength:.2f})>"


class Prediction(Base):
    """Prediction table - stores cascade predictions for events."""

    __tablename__ = 'predictions'

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Event details
    trigger_ticker = Column(String(10), ForeignKey('entities.id'), nullable=False)
    trigger_surprise = Column(Float, nullable=False)  # Earnings surprise %
    trigger_date = Column(DateTime, nullable=False)

    # Prediction metadata
    horizon_days = Column(Integer, default=7)
    predictions_json = Column('predictions', JSON, nullable=False)  # Array of predicted effects

    # Status tracking
    status = Column(String(20), default='pending')  # pending, validated, expired
    validated_at = Column(DateTime)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    trigger_entity = relationship('Entity')
    outcomes = relationship('Outcome', back_populates='prediction')

    # Indexes
    __table_args__ = (
        Index('idx_trigger_ticker', 'trigger_ticker'),
        Index('idx_trigger_date', 'trigger_date'),
        Index('idx_status', 'status'),
        Index('idx_created_at', 'created_at'),
    )

    def __repr__(self):
        return f"<Prediction(id='{self.id}', trigger='{self.trigger_ticker}', surprise={self.trigger_surprise:.1f}%)>"


class Outcome(Base):
    """Outcome table - stores actual results for predictions."""

    __tablename__ = 'outcomes'

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Foreign key
    prediction_id = Column(UUID(as_uuid=True), ForeignKey('predictions.id'), nullable=False)

    # Prediction details
    ticker = Column(String(10), ForeignKey('entities.id'), nullable=False)
    predicted_magnitude = Column(Float, nullable=False)  # Predicted price change %
    predicted_day = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    order = Column(Integer, nullable=False)  # 1st, 2nd, 3rd order effect

    # Actual outcome
    actual_magnitude = Column(Float)
    actual_day = Column(Float)

    # Error metrics
    magnitude_error = Column(Float)
    timing_error = Column(Float)
    direction_correct = Column(Boolean)
    within_confidence_bounds = Column(Boolean)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    prediction = relationship('Prediction', back_populates='outcomes')
    entity = relationship('Entity')

    # Indexes
    __table_args__ = (
        Index('idx_prediction_id', 'prediction_id'),
        Index('idx_ticker', 'ticker'),
        Index('idx_direction_correct', 'direction_correct'),
        Index('idx_order', 'order'),
    )

    def __repr__(self):
        return f"<Outcome(ticker='{self.ticker}', predicted={self.predicted_magnitude:.1f}%, actual={self.actual_magnitude:.1f}%)>"


# Materialized view for accuracy stats (defined as SQL, not ORM)
# This will be created via migration script
ACCURACY_STATS_VIEW_SQL = """
CREATE MATERIALIZED VIEW IF NOT EXISTS accuracy_stats AS
SELECT
    ticker,
    COUNT(*) as total_predictions,
    AVG(CASE WHEN direction_correct THEN 1 ELSE 0 END)::float as direction_accuracy,
    AVG(ABS(magnitude_error))::float as mean_absolute_error,
    AVG(ABS(timing_error))::float as mean_timing_error,
    MIN(created_at) as first_prediction,
    MAX(created_at) as last_prediction
FROM outcomes
WHERE actual_magnitude IS NOT NULL
GROUP BY ticker;

CREATE UNIQUE INDEX IF NOT EXISTS idx_accuracy_stats_ticker ON accuracy_stats(ticker);
"""

REFRESH_ACCURACY_STATS_SQL = "REFRESH MATERIALIZED VIEW CONCURRENTLY accuracy_stats;"
