-- Add hashed_password column to users table
ALTER TABLE users 
ADD COLUMN hashed_password VARCHAR(255) NOT NULL DEFAULT '';

