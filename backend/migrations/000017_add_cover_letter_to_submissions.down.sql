-- Remove cover letter metadata columns from conference_submissions table
ALTER TABLE conference_submissions
DROP COLUMN IF EXISTS cover_letter_path,
DROP COLUMN IF EXISTS cover_letter_original_name,
DROP COLUMN IF EXISTS cover_letter_size,
DROP COLUMN IF EXISTS cover_letter_mime_type,
DROP COLUMN IF EXISTS cover_letter_uploaded_at;

