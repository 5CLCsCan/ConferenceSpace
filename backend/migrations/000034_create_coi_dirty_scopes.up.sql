CREATE TABLE IF NOT EXISTS coi_dirty_scopes (
    conference_id BIGINT NOT NULL REFERENCES conferences(conference_id) ON DELETE CASCADE,
    scope_type VARCHAR(20) NOT NULL CHECK (scope_type IN ('conference', 'submission', 'reviewer')),
    scope_key VARCHAR(64) NOT NULL,
    submission_id BIGINT,
    reviewer_id BIGINT,
    reason TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (conference_id, scope_type, scope_key),
    CHECK (
        (scope_type = 'conference' AND scope_key = 'all' AND submission_id IS NULL AND reviewer_id IS NULL) OR
        (scope_type = 'submission' AND submission_id IS NOT NULL AND reviewer_id IS NULL) OR
        (scope_type = 'reviewer' AND reviewer_id IS NOT NULL AND submission_id IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_coi_dirty_scopes_conference_updated
    ON coi_dirty_scopes(conference_id, updated_at);
