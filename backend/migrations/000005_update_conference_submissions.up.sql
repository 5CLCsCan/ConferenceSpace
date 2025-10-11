-- Add conference_id to submissions table
ALTER TABLE conference_submissions
    ADD COLUMN IF NOT EXISTS conference_id INTEGER NOT NULL DEFAULT 0;

-- Add title and abstract fields
ALTER TABLE conference_submissions
    ADD COLUMN IF NOT EXISTS title VARCHAR(500) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS abstract TEXT NOT NULL DEFAULT '';

-- Create index for conference_id
CREATE INDEX IF NOT EXISTS idx_conference_submissions_conference_id ON conference_submissions(conference_id);

-- Create index for author
CREATE INDEX IF NOT EXISTS idx_conference_submissions_author ON conference_submissions(author);

-- Update default status from 'pending' to 'draft'
ALTER TABLE conference_submissions
    ALTER COLUMN status SET DEFAULT 'draft';

