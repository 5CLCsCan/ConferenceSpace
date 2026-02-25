-- Remove 'suggested' status - first delete any suggested assignments
DELETE FROM paper_assignments WHERE status = 'suggested';

-- Drop the constraint
ALTER TABLE paper_assignments DROP CONSTRAINT IF EXISTS chk_status;

-- Recreate without 'suggested'
ALTER TABLE paper_assignments
ADD CONSTRAINT chk_status CHECK (
  status IN ('pending', 'accepted', 'declined', 'completed')
);

-- Drop the index
DROP INDEX IF EXISTS idx_paper_assignments_suggested;
