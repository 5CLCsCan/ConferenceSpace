-- Revert conference_bookmarks table to use user_id instead of user_email

-- Add user_id column back
ALTER TABLE conference_bookmarks ADD COLUMN user_id INTEGER;

-- Populate user_id from users table
UPDATE conference_bookmarks cb
SET user_id = u.user_id
FROM users u
WHERE cb.user_email = u.email;

-- Drop indexes and constraints
DROP INDEX IF EXISTS idx_conference_bookmarks_unique;
DROP INDEX IF EXISTS idx_conference_bookmarks_user_email;

-- Make user_id NOT NULL (assumes all emails match existing users)
ALTER TABLE conference_bookmarks ALTER COLUMN user_id SET NOT NULL;

-- Drop user_email column
ALTER TABLE conference_bookmarks DROP COLUMN user_email;

-- Recreate old unique constraint
CREATE UNIQUE INDEX idx_conference_bookmarks_unique ON conference_bookmarks(user_id, conference_id);

