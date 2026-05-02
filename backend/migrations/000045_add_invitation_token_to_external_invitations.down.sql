DROP INDEX IF EXISTS idx_external_invitations_token;
ALTER TABLE external_invitations
    DROP COLUMN IF EXISTS accepted_user_id,
    DROP COLUMN IF EXISTS invitation_token_used_at,
    DROP COLUMN IF EXISTS invitation_token_expires_at,
    DROP COLUMN IF EXISTS invitation_token;
