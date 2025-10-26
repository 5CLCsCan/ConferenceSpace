-- Create paper_assignments table for reviewer assignments
CREATE TABLE IF NOT EXISTS paper_assignments (
    id BIGSERIAL PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES conferences(conference_id) ON DELETE CASCADE,
    submission_id BIGINT NOT NULL REFERENCES conference_submissions(submission_id) ON DELETE CASCADE,
    reviewer_id BIGINT NOT NULL REFERENCES conference_reviewers(id) ON DELETE CASCADE,
    score DECIMAL(5, 4) DEFAULT 0.0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient queries
CREATE INDEX idx_paper_assignments_conference ON paper_assignments(conference_id);
CREATE INDEX idx_paper_assignments_submission ON paper_assignments(submission_id);
CREATE INDEX idx_paper_assignments_reviewer ON paper_assignments(reviewer_id);
CREATE INDEX idx_paper_assignments_status ON paper_assignments(status);

-- Create unique constraint to prevent duplicate assignments
CREATE UNIQUE INDEX idx_paper_assignments_unique ON paper_assignments(submission_id, reviewer_id);

-- Add comments
COMMENT ON TABLE paper_assignments IS 'Stores paper-reviewer assignments';
COMMENT ON COLUMN paper_assignments.score IS 'Similarity score between paper and reviewer (0.0 to 1.0)';
COMMENT ON COLUMN paper_assignments.status IS 'Assignment status: pending, accepted, declined, completed';

