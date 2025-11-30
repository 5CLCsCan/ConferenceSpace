-- Rollback migration: Remove unique index on (conference_id, author)
--
-- This allows multiple submissions per author per conference again.
-- Use this if you need to rollback the uniqueness enforcement.

-- Drop the unique index (this is the only constraint we created)
DROP INDEX IF EXISTS idx_unique_author_per_conference;

-- Note: This rollback does NOT restore deleted duplicate submissions.
-- If you need to restore data, use a database backup from before the migration.
