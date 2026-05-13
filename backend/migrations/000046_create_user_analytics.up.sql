CREATE TABLE IF NOT EXISTS user_sessions (
    session_id UUID PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP NULL,
    active_ms BIGINT NOT NULL DEFAULT 0,
    user_agent TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_events (
    event_id UUID PRIMARY KEY,
    session_id UUID REFERENCES user_sessions(session_id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    event_name TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'feature', 'flow_step', 'timing')),
    route TEXT NOT NULL,
    role TEXT NULL CHECK (role IS NULL OR role IN ('author', 'reviewer', 'chair', 'pc', 'admin')),
    feature TEXT NULL,
    flow_id UUID NULL,
    flow_name TEXT NULL,
    step_name TEXT NULL,
    step_index INT NULL,
    active_ms BIGINT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    occurred_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_events_user_occurred_at ON user_events(user_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_user_events_session_occurred_at ON user_events(session_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_user_events_flow_step_occurred_at ON user_events(flow_id, step_index, occurred_at);
CREATE INDEX IF NOT EXISTS idx_user_events_event_name_occurred_at ON user_events(event_name, occurred_at);
CREATE INDEX IF NOT EXISTS idx_user_events_feature_occurred_at ON user_events(feature, occurred_at);
