CREATE TABLE IF NOT EXISTS external_invitations (
    id              SERIAL PRIMARY KEY,
    conference_id   INTEGER NOT NULL REFERENCES conferences(conference_id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL,
    scholar_id      VARCHAR(50),
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255),
    affiliation     VARCHAR(500),
    profile_url     VARCHAR(500),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    invited_by      INTEGER NOT NULL REFERENCES users(user_id),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(conference_id, scholar_id)
);

CREATE INDEX idx_external_invitations_conference_id ON external_invitations(conference_id);
CREATE INDEX idx_external_invitations_status ON external_invitations(status);
