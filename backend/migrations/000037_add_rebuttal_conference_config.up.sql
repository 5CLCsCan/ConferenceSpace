ALTER TABLE conferences
  ADD COLUMN IF NOT EXISTS rebuttal_enabled       BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rebuttal_phase         VARCHAR(20) NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS rebuttal_start_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rebuttal_deadline      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS char_limit_general     INT         NOT NULL DEFAULT 3000,
  ADD COLUMN IF NOT EXISTS char_limit_per_point   INT         NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS allow_discussion       BOOLEAN     NOT NULL DEFAULT FALSE;

ALTER TABLE paper_assignments
  ADD COLUMN IF NOT EXISTS post_rebuttal_score          INT,
  ADD COLUMN IF NOT EXISTS post_rebuttal_recommendation VARCHAR(20),
  ADD COLUMN IF NOT EXISTS post_rebuttal_comment        TEXT,
  ADD COLUMN IF NOT EXISTS post_rebuttal_updated_at     TIMESTAMPTZ;
