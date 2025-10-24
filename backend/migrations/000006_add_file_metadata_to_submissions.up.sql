-- Add file metadata columns to conference_submissions table
ALTER TABLE conference_submissions
ADD COLUMN file_path TEXT,
ADD COLUMN file_original_name TEXT,
ADD COLUMN file_size BIGINT,
ADD COLUMN file_mime_type TEXT,
ADD COLUMN file_uploaded_at TIMESTAMP WITH TIME ZONE;
