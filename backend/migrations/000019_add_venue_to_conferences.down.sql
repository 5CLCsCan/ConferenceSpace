-- Remove venue column from conferences table
ALTER TABLE conferences
    DROP COLUMN IF EXISTS venue;

