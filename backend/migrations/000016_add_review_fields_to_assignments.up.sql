-- Add review fields to paper_assignments table
ALTER TABLE paper_assignments
ADD COLUMN IF NOT EXISTS review_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS review_score DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS review_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS review_submitted_at TIMESTAMP;

-- Update existing NULL review_data to empty JSON object
UPDATE paper_assignments SET review_data = '{}'::jsonb WHERE review_data IS NULL;

-- Add check constraint for review_status
ALTER TABLE paper_assignments
ADD CONSTRAINT chk_review_status CHECK (review_status IN ('draft', 'submitted') OR review_status IS NULL);

-- Add check constraint for review_score range (0.00 to 10.00)
ALTER TABLE paper_assignments
ADD CONSTRAINT chk_review_score CHECK (review_score >= 0.00 AND review_score <= 10.00 OR review_score IS NULL);

-- Create index on review_status for efficient filtering
CREATE INDEX IF NOT EXISTS idx_paper_assignments_review_status ON paper_assignments(review_status);

-- Add comments
COMMENT ON COLUMN paper_assignments.review_status IS 'Review status: draft, submitted, or null if not started';
COMMENT ON COLUMN paper_assignments.review_score IS 'Overall review score from 0.00 to 10.00';
COMMENT ON COLUMN paper_assignments.review_data IS 'JSONB containing criteria scores, feedback, recommendation, and confidence';
COMMENT ON COLUMN paper_assignments.review_submitted_at IS 'Timestamp when review was submitted (finalized)';

