ALTER TABLE paper_assignments
ADD COLUMN IF NOT EXISTS review_audit_state JSONB NOT NULL DEFAULT '{"dismissed_warnings":[]}'::jsonb;

UPDATE paper_assignments
SET review_audit_state = '{"dismissed_warnings":[]}'::jsonb
WHERE review_audit_state IS NULL;

COMMENT ON COLUMN paper_assignments.review_audit_state IS 'Backend-owned review audit metadata such as dismissed warning fingerprints';

CREATE TABLE IF NOT EXISTS review_audit_events (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES paper_assignments(id) ON DELETE CASCADE,
    conference_id BIGINT NOT NULL REFERENCES conferences(conference_id) ON DELETE CASCADE,
    actor_id BIGINT NOT NULL,
    actor_email TEXT NOT NULL,
    event_type VARCHAR(64) NOT NULL CHECK (event_type IN ('warning_dismissed', 'warning_undismissed', 'submit_override_after_audit_failure')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_audit_events_assignment_created_at
ON review_audit_events(assignment_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_review_audit_events_conference_created_at
ON review_audit_events(conference_id, created_at DESC);
