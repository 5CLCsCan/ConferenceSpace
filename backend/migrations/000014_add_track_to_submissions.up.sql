-- Add track column to submissions table
ALTER TABLE conference_submissions ADD COLUMN track TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN conference_submissions.track IS 'The track/category this submission belongs to (must be one of the conference tracks)';

-- Add index for filtering submissions by track
CREATE INDEX idx_submissions_track ON conference_submissions(track);

