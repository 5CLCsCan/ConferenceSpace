-- Remove file metadata columns from conference_submissions table
ALTER TABLE conference_submissions
DROP COLUMN IF EXISTS file_path,
DROP COLUMN IF EXISTS file_original_name,
DROP COLUMN IF EXISTS file_size,
DROP COLUMN IF EXISTS file_mime_type,
DROP COLUMN IF EXISTS file_uploaded_at;
