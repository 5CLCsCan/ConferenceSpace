CREATE TABLE IF NOT EXISTS conference_invitations (
    id BIGSERIAL PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('reviewer', 'co_chair', 'pc')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'revoked')),
    inviter_email TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    invited_user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    responded_at TIMESTAMPTZ NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conference_invitations_conference_id ON conference_invitations(conference_id);
CREATE INDEX idx_conference_invitations_invitee_email ON conference_invitations(invitee_email);
CREATE INDEX idx_conference_invitations_status ON conference_invitations(status);
CREATE INDEX idx_conference_invitations_expires_at ON conference_invitations(expires_at);

CREATE UNIQUE INDEX idx_conference_invitations_unique_pending
ON conference_invitations(conference_id, invitee_email, role)
WHERE status = 'pending';
