-- Remove co_chairs field
DROP INDEX IF EXISTS idx_conferences_co_chairs;
ALTER TABLE conferences DROP COLUMN co_chairs;

