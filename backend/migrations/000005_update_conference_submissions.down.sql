-- Remove indexes
DROP INDEX IF EXISTS idx_conference_submissions_author;
DROP INDEX IF EXISTS idx_conference_submissions_conference_id;

-- Remove columns
ALTER TABLE conference_submissions
    DROP COLUMN IF EXISTS conference_id,
    DROP COLUMN IF EXISTS title,
    DROP COLUMN IF EXISTS abstract;

-- Revert default status
ALTER TABLE conference_submissions
    ALTER COLUMN status SET DEFAULT 'pending';

