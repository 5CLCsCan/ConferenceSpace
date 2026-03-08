ALTER TABLE paper_assignments
    DROP COLUMN IF EXISTS rebuttal_acknowledged_at,
    DROP COLUMN IF EXISTS rebuttal_submitted_at,
    DROP COLUMN IF EXISTS rebuttal_status,
    DROP COLUMN IF EXISTS rebuttal_response;

ALTER TABLE conference_submissions
    DROP COLUMN IF EXISTS rebuttal_general_response,
    DROP COLUMN IF EXISTS rebuttal_phase;
