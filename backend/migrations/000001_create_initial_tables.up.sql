-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    domain TEXT[] DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email
CREATE INDEX idx_users_email ON users(email);

-- Create conferences table
CREATE TABLE IF NOT EXISTS conferences (
    conference_id SERIAL PRIMARY KEY,
    chair VARCHAR(255) NOT NULL,
    configurations JSONB DEFAULT '{}',
    domain TEXT[] DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create conference_reviewers table
CREATE TABLE IF NOT EXISTS conference_reviewers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    conference_id INTEGER NOT NULL,
    domain TEXT[] DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for conference_reviewers
CREATE INDEX idx_conference_reviewers_user_id ON conference_reviewers(user_id);
CREATE INDEX idx_conference_reviewers_conference_id ON conference_reviewers(conference_id);

-- Create conference_submissions table
CREATE TABLE IF NOT EXISTS conference_submissions (
    submission_id SERIAL PRIMARY KEY,
    author VARCHAR(255) NOT NULL,
    domain TEXT[] DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    link TEXT,
    information JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on status for filtering
CREATE INDEX idx_conference_submissions_status ON conference_submissions(status);

