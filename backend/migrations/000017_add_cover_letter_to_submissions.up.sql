-- Add cover letter metadata columns to conference_submissions table
ALTER TABLE conference_submissions
ADD COLUMN cover_letter_path TEXT,
ADD COLUMN cover_letter_original_name TEXT,
ADD COLUMN cover_letter_size BIGINT,
ADD COLUMN cover_letter_mime_type TEXT,
ADD COLUMN cover_letter_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the cover letter columns
COMMENT ON COLUMN conference_submissions.cover_letter_path IS 'Path to the uploaded cover letter file (optional)';
COMMENT ON COLUMN conference_submissions.cover_letter_original_name IS 'Original filename of the cover letter';
COMMENT ON COLUMN conference_submissions.cover_letter_size IS 'Size of the cover letter file in bytes';
COMMENT ON COLUMN conference_submissions.cover_letter_mime_type IS 'MIME type of the cover letter (PDF, DOCX, or TXT)';
COMMENT ON COLUMN conference_submissions.cover_letter_uploaded_at IS 'Timestamp when the cover letter was uploaded';

