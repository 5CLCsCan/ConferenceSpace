DROP INDEX IF EXISTS idx_conference_invitations_unique_pending;
DROP INDEX IF EXISTS idx_conference_invitations_expires_at;
DROP INDEX IF EXISTS idx_conference_invitations_status;
DROP INDEX IF EXISTS idx_conference_invitations_invitee_email;
DROP INDEX IF EXISTS idx_conference_invitations_conference_id;
DROP TABLE IF EXISTS conference_invitations;
