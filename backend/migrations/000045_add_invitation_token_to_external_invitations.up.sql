-- Each row gets its own token. Reusing auth_tokens would have required
-- making auth_tokens.user_email nullable (external invitations may have no
-- email at all), so we keep the lifecycle on the invitation row itself.
ALTER TABLE external_invitations
    ADD COLUMN IF NOT EXISTS invitation_token            VARCHAR(64),
    ADD COLUMN IF NOT EXISTS invitation_token_expires_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS invitation_token_used_at    TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS accepted_user_id            INTEGER NULL REFERENCES users(user_id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_external_invitations_token
    ON external_invitations(invitation_token)
    WHERE invitation_token IS NOT NULL;

-- Backfill existing rows with a NULL token; they remain "shareable-link only"
-- in the legacy state until the chair re-issues. (We don't auto-generate
-- tokens here because it's hard to backfill expiry/uniqueness deterministically
-- from SQL; the BatchCreate path generates tokens for all new rows.)
