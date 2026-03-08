-- Submission-level: phase + general response
ALTER TABLE conference_submissions
    ADD COLUMN IF NOT EXISTS rebuttal_phase VARCHAR(50) NOT NULL DEFAULT 'awaiting',
    ADD COLUMN IF NOT EXISTS rebuttal_general_response TEXT;

-- Assignment-level: per-reviewer response + acknowledgment
ALTER TABLE paper_assignments
    ADD COLUMN IF NOT EXISTS rebuttal_response JSONB,
    ADD COLUMN IF NOT EXISTS rebuttal_status VARCHAR(50) NOT NULL DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS rebuttal_submitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS rebuttal_acknowledged_at TIMESTAMPTZ;
