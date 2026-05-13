DROP INDEX IF EXISTS idx_user_events_feature_occurred_at;
DROP INDEX IF EXISTS idx_user_events_event_name_occurred_at;
DROP INDEX IF EXISTS idx_user_events_flow_step_occurred_at;
DROP INDEX IF EXISTS idx_user_events_session_occurred_at;
DROP INDEX IF EXISTS idx_user_events_user_occurred_at;

DROP TABLE IF EXISTS user_events;
DROP TABLE IF EXISTS user_sessions;
