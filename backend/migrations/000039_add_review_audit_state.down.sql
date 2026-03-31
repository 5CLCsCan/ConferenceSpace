DROP TABLE IF EXISTS review_audit_events;

ALTER TABLE paper_assignments
DROP COLUMN IF EXISTS review_audit_state;
