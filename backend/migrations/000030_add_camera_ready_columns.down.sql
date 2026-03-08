ALTER TABLE conference_submissions
    DROP COLUMN IF EXISTS camera_ready_uploaded_at,
    DROP COLUMN IF EXISTS camera_ready_mime_type,
    DROP COLUMN IF EXISTS camera_ready_size,
    DROP COLUMN IF EXISTS camera_ready_original_name,
    DROP COLUMN IF EXISTS camera_ready_path;
