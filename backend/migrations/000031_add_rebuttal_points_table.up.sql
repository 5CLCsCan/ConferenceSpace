CREATE TABLE rebuttal_points (
  id            BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL,
  conference_id BIGINT NOT NULL,
  assignment_id BIGINT NOT NULL,
  point_id      VARCHAR(100) NOT NULL,
  category      VARCHAR(50),
  section       VARCHAR(100),
  original_comment TEXT,
  author_response  TEXT,
  status        VARCHAR(50) NOT NULL DEFAULT 'pending_review',
  reviewer_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  reviewer_note TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(submission_id, point_id)
);

-- Remove the now-redundant JSONB column (points table replaces it)
ALTER TABLE paper_assignments
  DROP COLUMN IF EXISTS rebuttal_response;
