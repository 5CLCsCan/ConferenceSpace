ALTER TABLE paper_assignments
  DROP COLUMN IF EXISTS decline_reason,
  DROP COLUMN IF EXISTS decline_category,
  DROP COLUMN IF EXISTS responded_at;
