-- Remove check constraint
ALTER TABLE conferences
    DROP CONSTRAINT IF EXISTS check_conference_status;

-- Remove index
DROP INDEX IF EXISTS idx_conferences_status;

-- Remove status column from conferences table
ALTER TABLE conferences
    DROP COLUMN IF EXISTS status;

