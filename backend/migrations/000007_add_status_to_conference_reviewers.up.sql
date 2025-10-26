-- Add status column to conference_reviewers table
ALTER TABLE conference_reviewers 
ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending';

-- Create index on status for filtering
CREATE INDEX idx_conference_reviewers_status ON conference_reviewers(status);

-- Add unique constraint to prevent duplicate reviewer invitations
CREATE UNIQUE INDEX idx_conference_reviewers_unique ON conference_reviewers(user_id, conference_id);

