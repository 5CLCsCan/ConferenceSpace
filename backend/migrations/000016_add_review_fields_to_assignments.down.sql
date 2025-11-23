-- Remove review fields from paper_assignments table
DROP INDEX IF EXISTS idx_paper_assignments_review_status;

ALTER TABLE paper_assignments
DROP CONSTRAINT IF EXISTS chk_review_status,
DROP CONSTRAINT IF EXISTS chk_review_score;

ALTER TABLE paper_assignments
DROP COLUMN IF EXISTS review_status,
DROP COLUMN IF EXISTS review_score,
DROP COLUMN IF EXISTS review_data,
DROP COLUMN IF EXISTS review_submitted_at;

