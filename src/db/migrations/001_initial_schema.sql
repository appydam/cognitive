-- Consequence AI - Initial Database Schema
-- Migration 001: Create initial tables and indexes
-- Created: 2026-01-24
-- PostgreSQL 14+

-- ==================================================
-- ENTITIES TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS entities (
    id VARCHAR(10) PRIMARY KEY,
    name TEXT NOT NULL,
    entity_type VARCHAR(20) NOT NULL,
    sector VARCHAR(50),
    market_cap FLOAT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_entity_type ON entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_sector ON entities(sector);

COMMENT ON TABLE entities IS 'Stores companies, ETFs, sectors, and other tradable entities';
COMMENT ON COLUMN entities.id IS 'Ticker symbol (e.g., AAPL, NVDA)';
COMMENT ON COLUMN entities.entity_type IS 'Type: COMPANY, ETF, SECTOR';
COMMENT ON COLUMN entities.market_cap IS 'Market capitalization in billions USD';

-- ==================================================
-- CAUSAL LINKS TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS causal_links (
    id SERIAL PRIMARY KEY,
    source VARCHAR(10) NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    target VARCHAR(10) NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    relationship_type VARCHAR(30) NOT NULL,

    -- Causal parameters
    strength FLOAT NOT NULL CHECK (strength >= 0 AND strength <= 1),
    delay_mean FLOAT NOT NULL,
    delay_std FLOAT DEFAULT 0.5,
    confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    direction FLOAT DEFAULT 1.0 CHECK (direction IN (-1, 1)),

    -- Evidence and learning
    evidence TEXT[],
    data_source VARCHAR(50),
    historical_accuracy FLOAT DEFAULT 0.0,
    observation_count INTEGER DEFAULT 0,

    -- Verified relationship data
    revenue_pct FLOAT,
    fiscal_year INTEGER,
    source_url TEXT,
    verified_date TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT uq_source_target_relationship UNIQUE (source, target, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_source ON causal_links(source);
CREATE INDEX IF NOT EXISTS idx_target ON causal_links(target);
CREATE INDEX IF NOT EXISTS idx_confidence ON causal_links(confidence);
CREATE INDEX IF NOT EXISTS idx_data_source ON causal_links(data_source);

COMMENT ON TABLE causal_links IS 'Causal relationships between entities with strength and confidence';
COMMENT ON COLUMN causal_links.strength IS 'Link strength 0.0-1.0 (how much source affects target)';
COMMENT ON COLUMN causal_links.delay_mean IS 'Average delay in days for effect to propagate';
COMMENT ON COLUMN causal_links.confidence IS 'Confidence in this relationship 0.0-1.0';
COMMENT ON COLUMN causal_links.direction IS '1.0 for positive correlation, -1.0 for negative';
COMMENT ON COLUMN causal_links.data_source IS 'Source: sec_filing, correlation, manual, sector';

-- ==================================================
-- PREDICTIONS TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_ticker VARCHAR(10) NOT NULL REFERENCES entities(id),
    trigger_surprise FLOAT NOT NULL,
    trigger_date TIMESTAMP NOT NULL,
    horizon_days INTEGER DEFAULT 7,
    predictions JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    validated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trigger_ticker ON predictions(trigger_ticker);
CREATE INDEX IF NOT EXISTS idx_trigger_date ON predictions(trigger_date);
CREATE INDEX IF NOT EXISTS idx_status ON predictions(status);
CREATE INDEX IF NOT EXISTS idx_created_at ON predictions(created_at);

COMMENT ON TABLE predictions IS 'Stores cascade predictions for earnings events';
COMMENT ON COLUMN predictions.trigger_surprise IS 'Earnings surprise percentage';
COMMENT ON COLUMN predictions.predictions IS 'JSON array of predicted effects';
COMMENT ON COLUMN predictions.status IS 'Status: pending, validated, expired';

-- ==================================================
-- OUTCOMES TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS outcomes (
    id SERIAL PRIMARY KEY,
    prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    ticker VARCHAR(10) NOT NULL REFERENCES entities(id),

    -- Prediction details
    predicted_magnitude FLOAT NOT NULL,
    predicted_day FLOAT NOT NULL,
    confidence FLOAT NOT NULL,
    "order" INTEGER NOT NULL,

    -- Actual outcome
    actual_magnitude FLOAT,
    actual_day FLOAT,

    -- Error metrics
    magnitude_error FLOAT,
    timing_error FLOAT,
    direction_correct BOOLEAN,
    within_confidence_bounds BOOLEAN,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prediction_id ON outcomes(prediction_id);
CREATE INDEX IF NOT EXISTS idx_ticker ON outcomes(ticker);
CREATE INDEX IF NOT EXISTS idx_direction_correct ON outcomes(direction_correct);
CREATE INDEX IF NOT EXISTS idx_order ON outcomes("order");

COMMENT ON TABLE outcomes IS 'Actual results for predictions (for learning and validation)';
COMMENT ON COLUMN outcomes."order" IS 'Effect order: 1st, 2nd, 3rd hop';

-- ==================================================
-- MATERIALIZED VIEW: ACCURACY STATS
-- ==================================================

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

COMMENT ON MATERIALIZED VIEW accuracy_stats IS 'Aggregated prediction accuracy metrics by ticker';

-- ==================================================
-- FUNCTIONS
-- ==================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_causal_links_updated_at BEFORE UPDATE ON causal_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- GRANTS (for production use)
-- ==================================================

-- Grant read-only access to app user (if using separate read/write users)
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_readwrite;

-- ==================================================
-- INITIAL DATA
-- ==================================================

-- Insert some common entity types for validation
-- This will be populated by the migration script

COMMIT;
