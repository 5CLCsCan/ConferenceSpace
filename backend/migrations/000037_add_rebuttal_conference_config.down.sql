ALTER TABLE conferences
  DROP COLUMN IF EXISTS rebuttal_enabled,
  DROP COLUMN IF EXISTS rebuttal_phase,
  DROP COLUMN IF EXISTS rebuttal_start_at,
  DROP COLUMN IF EXISTS rebuttal_deadline,
  DROP COLUMN IF EXISTS char_limit_general,
  DROP COLUMN IF EXISTS char_limit_per_point,
  DROP COLUMN IF EXISTS allow_discussion;

ALTER TABLE paper_assignments
  DROP COLUMN IF EXISTS post_rebuttal_score,
  DROP COLUMN IF EXISTS post_rebuttal_recommendation,
  DROP COLUMN IF EXISTS post_rebuttal_comment,
  DROP COLUMN IF EXISTS post_rebuttal_updated_at;
