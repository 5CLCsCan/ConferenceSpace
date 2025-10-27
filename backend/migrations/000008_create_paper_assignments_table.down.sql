-- Drop paper_assignments table and all associated indexes
DROP INDEX IF EXISTS idx_paper_assignments_unique;
DROP INDEX IF EXISTS idx_paper_assignments_status;
DROP INDEX IF EXISTS idx_paper_assignments_reviewer;
DROP INDEX IF EXISTS idx_paper_assignments_submission;
DROP INDEX IF EXISTS idx_paper_assignments_conference;
DROP TABLE IF EXISTS paper_assignments;

