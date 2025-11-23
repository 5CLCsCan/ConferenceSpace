-- Drop the conference_user_roles table and its indexes
DROP INDEX IF EXISTS idx_conference_user_roles_unique;
DROP INDEX IF EXISTS idx_conference_user_roles_status;
DROP INDEX IF EXISTS idx_conference_user_roles_role;
DROP INDEX IF EXISTS idx_conference_user_roles_user_email;
DROP INDEX IF EXISTS idx_conference_user_roles_user_id;
DROP INDEX IF EXISTS idx_conference_user_roles_conference_id;
DROP TABLE IF EXISTS conference_user_roles;

