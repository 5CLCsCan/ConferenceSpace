ALTER TABLE conference_submissions
    ADD COLUMN IF NOT EXISTS camera_ready_path VARCHAR(500),
    ADD COLUMN IF NOT EXISTS camera_ready_original_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS camera_ready_size BIGINT,
    ADD COLUMN IF NOT EXISTS camera_ready_mime_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS camera_ready_uploaded_at TIMESTAMPTZ;
