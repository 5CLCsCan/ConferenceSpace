-- Add 'suggested' to assignment status constraint
-- First drop existing constraint if it exists
ALTER TABLE paper_assignments DROP CONSTRAINT IF EXISTS chk_status;

-- Add new constraint with 'suggested' status
ALTER TABLE paper_assignments
ADD CONSTRAINT chk_status CHECK (
  status IN ('suggested', 'pending', 'accepted', 'declined', 'completed')
);

-- Add index for filtering suggested assignments
CREATE INDEX IF NOT EXISTS idx_paper_assignments_suggested
ON paper_assignments(conference_id, status)
WHERE status = 'suggested';

COMMENT ON CONSTRAINT chk_status ON paper_assignments IS 'Assignment status: suggested (awaiting chair confirmation), pending (confirmed, awaiting reviewer), accepted, declined, completed';
