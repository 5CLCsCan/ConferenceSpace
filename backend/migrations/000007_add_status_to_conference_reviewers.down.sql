-- Drop unique constraint
DROP INDEX IF EXISTS idx_conference_reviewers_unique;

-- Drop status index
DROP INDEX IF EXISTS idx_conference_reviewers_status;

-- Remove status column from conference_reviewers table
ALTER TABLE conference_reviewers 
DROP COLUMN IF EXISTS status;

