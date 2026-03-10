-- Remove visibility column from discussion_threads
ALTER TABLE discussion_threads DROP COLUMN IF EXISTS visibility;
