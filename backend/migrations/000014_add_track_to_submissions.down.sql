-- Remove index
DROP INDEX IF EXISTS idx_submissions_track;

-- Remove track column from submissions table
ALTER TABLE conference_submissions DROP COLUMN IF EXISTS track;

