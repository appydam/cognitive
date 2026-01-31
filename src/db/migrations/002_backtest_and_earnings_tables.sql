-- Consequence AI - Backtest and Earnings Tables
-- Migration 002: Add tables for live earnings alerts and historical backtesting
-- Created: 2026-01-30
-- PostgreSQL 14+

-- ==================================================
-- EARNINGS EVENTS TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS earnings_events (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    report_date TIMESTAMP NOT NULL,
    report_time VARCHAR(10),  -- "BMO" (before market open) or "AMC" (after market close)

    -- Earnings data
    estimate_eps FLOAT,
    actual_eps FLOAT,
    surprise_percent FLOAT,

    -- Cascade tracking
    cascade_id UUID REFERENCES predictions(id),
    status VARCHAR(20) DEFAULT 'pending',  -- pending, completed, skipped

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    CONSTRAINT chk_status CHECK (status IN ('pending', 'completed', 'skipped'))
);

CREATE INDEX IF NOT EXISTS idx_earnings_ticker ON earnings_events(ticker);
CREATE INDEX IF NOT EXISTS idx_earnings_report_date ON earnings_events(report_date);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON earnings_events(status);
CREATE INDEX IF NOT EXISTS idx_earnings_surprise ON earnings_events(surprise_percent);

COMMENT ON TABLE earnings_events IS 'Stores upcoming and completed earnings events for real-time monitoring';
COMMENT ON COLUMN earnings_events.report_time IS 'BMO = Before Market Open, AMC = After Market Close';
COMMENT ON COLUMN earnings_events.surprise_percent IS 'Earnings surprise as percentage: (actual - estimate) / |estimate| * 100';
COMMENT ON COLUMN earnings_events.cascade_id IS 'Link to generated cascade prediction';
COMMENT ON COLUMN earnings_events.status IS 'pending = awaiting results, completed = cascade generated, skipped = ignored';

-- ==================================================
-- BACKTEST RUNS TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS backtest_runs (
    id SERIAL PRIMARY KEY,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    min_surprise FLOAT NOT NULL,

    -- Summary statistics
    total_events INTEGER DEFAULT 0,
    avg_accuracy FLOAT,
    avg_mae FLOAT,
    profitable_trades INTEGER DEFAULT 0,
    total_roi FLOAT DEFAULT 0,

    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending',  -- pending, running, completed, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,

    -- Constraints
    CONSTRAINT chk_backtest_status CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    CONSTRAINT chk_date_range CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_backtest_status ON backtest_runs(status);
CREATE INDEX IF NOT EXISTS idx_backtest_created ON backtest_runs(created_at);
CREATE INDEX IF NOT EXISTS idx_backtest_date_range ON backtest_runs(start_date, end_date);

COMMENT ON TABLE backtest_runs IS 'Metadata for historical backtesting runs';
COMMENT ON COLUMN backtest_runs.min_surprise IS 'Minimum earnings surprise % to include events';
COMMENT ON COLUMN backtest_runs.avg_accuracy IS 'Average prediction accuracy across all events in run';
COMMENT ON COLUMN backtest_runs.avg_mae IS 'Average mean absolute error across predictions';
COMMENT ON COLUMN backtest_runs.profitable_trades IS 'Number of events with positive ROI';
COMMENT ON COLUMN backtest_runs.total_roi IS 'Simulated total return on investment %';

-- ==================================================
-- BACKTEST RESULTS TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS backtest_results (
    id SERIAL PRIMARY KEY,
    run_id INTEGER NOT NULL REFERENCES backtest_runs(id) ON DELETE CASCADE,
    ticker VARCHAR(10) NOT NULL REFERENCES entities(id) ON DELETE CASCADE,

    -- Event details
    event_date TIMESTAMP NOT NULL,
    surprise_percent FLOAT NOT NULL,

    -- Prediction metrics
    num_predictions INTEGER NOT NULL,
    accuracy FLOAT NOT NULL,
    mae FLOAT NOT NULL,
    roi FLOAT NOT NULL,

    -- Full cascade data
    cascade JSONB NOT NULL,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT chk_accuracy_range CHECK (accuracy >= 0 AND accuracy <= 1),
    CONSTRAINT chk_mae_positive CHECK (mae >= 0)
);

CREATE INDEX IF NOT EXISTS idx_backtest_result_run ON backtest_results(run_id);
CREATE INDEX IF NOT EXISTS idx_backtest_result_ticker ON backtest_results(ticker);
CREATE INDEX IF NOT EXISTS idx_backtest_result_event_date ON backtest_results(event_date);
CREATE INDEX IF NOT EXISTS idx_backtest_result_accuracy ON backtest_results(accuracy);
CREATE INDEX IF NOT EXISTS idx_backtest_result_roi ON backtest_results(roi);

COMMENT ON TABLE backtest_results IS 'Individual event results within a backtest run';
COMMENT ON COLUMN backtest_results.num_predictions IS 'Number of cascade predictions for this event';
COMMENT ON COLUMN backtest_results.accuracy IS 'Prediction accuracy: 1 - (MAE / 100)';
COMMENT ON COLUMN backtest_results.mae IS 'Mean absolute error in percentage points';
COMMENT ON COLUMN backtest_results.roi IS 'Simulated ROI if trading based on predictions';
COMMENT ON COLUMN backtest_results.cascade IS 'Full JSON of cascade prediction and actual outcomes';

-- ==================================================
-- MATERIALIZED VIEW: BACKTEST SUMMARY
-- ==================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS backtest_summary AS
SELECT
    br.id as run_id,
    br.start_date,
    br.end_date,
    br.total_events,
    br.avg_accuracy,
    br.avg_mae,
    br.profitable_trades,
    br.total_roi,
    br.status,
    COUNT(DISTINCT bres.ticker) as unique_tickers,
    AVG(bres.accuracy) as avg_accuracy_calculated,
    AVG(bres.mae) as avg_mae_calculated,
    SUM(CASE WHEN bres.roi > 0 THEN 1 ELSE 0 END) as profitable_count,
    SUM(bres.roi) as total_roi_calculated,
    br.created_at,
    br.completed_at
FROM backtest_runs br
LEFT JOIN backtest_results bres ON br.id = bres.run_id
GROUP BY br.id, br.start_date, br.end_date, br.total_events, br.avg_accuracy,
         br.avg_mae, br.profitable_trades, br.total_roi, br.status,
         br.created_at, br.completed_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_backtest_summary_run_id ON backtest_summary(run_id);

COMMENT ON MATERIALIZED VIEW backtest_summary IS 'Aggregated statistics for backtest runs with calculated metrics';

-- ==================================================
-- FUNCTIONS
-- ==================================================

-- Function to refresh backtest summary materialized view
CREATE OR REPLACE FUNCTION refresh_backtest_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY backtest_summary;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_backtest_summary IS 'Refreshes the backtest summary materialized view';

-- ==================================================
-- USER NOTIFICATION PREFERENCES TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) DEFAULT 'default' NOT NULL,

    -- Alert thresholds
    min_surprise FLOAT DEFAULT 5.0,
    high_confidence_only BOOLEAN DEFAULT TRUE,
    pre_market_alerts BOOLEAN DEFAULT TRUE,
    after_hours_alerts BOOLEAN DEFAULT TRUE,

    -- Email notifications
    email_enabled BOOLEAN DEFAULT FALSE,
    email_address VARCHAR(255),

    -- Slack notifications
    slack_enabled BOOLEAN DEFAULT FALSE,
    slack_webhook TEXT,

    -- WhatsApp notifications
    whatsapp_enabled BOOLEAN DEFAULT FALSE,
    whatsapp_number VARCHAR(50),

    -- SMS notifications
    sms_enabled BOOLEAN DEFAULT FALSE,
    sms_number VARCHAR(50),

    -- Watchlist (JSON array of tickers)
    watchlist JSON DEFAULT '[]'::json,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT uq_user_notification_preferences UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);

COMMENT ON TABLE user_notification_preferences IS 'User notification preferences for cascade alerts';
COMMENT ON COLUMN user_notification_preferences.user_id IS 'User identifier (default for single-user, UUID for multi-user)';
COMMENT ON COLUMN user_notification_preferences.min_surprise IS 'Minimum earnings surprise % to trigger alerts';
COMMENT ON COLUMN user_notification_preferences.slack_webhook IS 'Slack webhook URL for posting alerts';
COMMENT ON COLUMN user_notification_preferences.watchlist IS 'JSON array of ticker symbols for priority monitoring';

-- ==================================================
-- GRANTS (for production use)
-- ==================================================

-- Grant appropriate permissions
-- GRANT SELECT, INSERT, UPDATE ON earnings_events TO app_readwrite;
-- GRANT SELECT, INSERT, UPDATE ON backtest_runs TO app_readwrite;
-- GRANT SELECT, INSERT ON backtest_results TO app_readwrite;
-- GRANT SELECT ON backtest_summary TO app_readonly;
-- GRANT SELECT, INSERT, UPDATE ON user_notification_preferences TO app_readwrite;

COMMIT;
