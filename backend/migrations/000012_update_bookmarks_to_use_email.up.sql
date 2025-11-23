-- Update conference_bookmarks table to use user_email instead of user_id

-- Add user_email column
ALTER TABLE conference_bookmarks ADD COLUMN user_email VARCHAR(255);

-- Populate user_email from users table for existing bookmarks
UPDATE conference_bookmarks cb
SET user_email = u.email
FROM users u
WHERE cb.user_id = u.user_id;

-- Drop the old unique constraint
DROP INDEX IF EXISTS idx_conference_reviewers_unique;

-- Make user_email NOT NULL
ALTER TABLE conference_bookmarks ALTER COLUMN user_email SET NOT NULL;

-- Drop user_id column
ALTER TABLE conference_bookmarks DROP COLUMN user_id;

-- Create new unique constraint on (user_email, conference_id)
CREATE UNIQUE INDEX idx_conference_bookmarks_unique ON conference_bookmarks(user_email, conference_id);

-- Create index on user_email for faster lookups
CREATE INDEX idx_conference_bookmarks_user_email ON conference_bookmarks(user_email);

