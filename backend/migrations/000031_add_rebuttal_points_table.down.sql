DROP TABLE IF EXISTS rebuttal_points;

ALTER TABLE paper_assignments
  ADD COLUMN IF NOT EXISTS rebuttal_response JSONB;
