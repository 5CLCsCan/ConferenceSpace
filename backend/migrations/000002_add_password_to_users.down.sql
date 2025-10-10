-- Remove hashed_password column from users table
ALTER TABLE users 
DROP COLUMN IF EXISTS hashed_password;

