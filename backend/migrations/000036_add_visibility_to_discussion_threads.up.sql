-- Add visibility column to discussion_threads
-- Valid values: 'committee', 'reviewers', 'authors'
ALTER TABLE discussion_threads ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'reviewers';
