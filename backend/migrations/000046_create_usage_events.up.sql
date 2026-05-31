CREATE TABLE IF NOT EXISTS usage_events (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id BIGINT,
    role VARCHAR(32),
    event_name VARCHAR(160) NOT NULL,
    page_path TEXT,
    entity_type VARCHAR(64),
    entity_id TEXT,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_session_created_at
ON usage_events(session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_usage_events_event_created_at
ON usage_events(event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_role_created_at
ON usage_events(role, created_at DESC);
