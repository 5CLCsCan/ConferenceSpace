-- Create unified conference_user_roles table to replace multiple role tracking mechanisms
CREATE TABLE IF NOT EXISTS conference_user_roles (
    id SERIAL PRIMARY KEY,
    conference_id INTEGER NOT NULL,
    user_id INTEGER,
    user_email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_conference_user_roles_conference_id ON conference_user_roles(conference_id);
CREATE INDEX idx_conference_user_roles_user_id ON conference_user_roles(user_id);
CREATE INDEX idx_conference_user_roles_user_email ON conference_user_roles(user_email);
CREATE INDEX idx_conference_user_roles_role ON conference_user_roles(role);
CREATE INDEX idx_conference_user_roles_status ON conference_user_roles(status);

-- Create unique constraint on conference_id and user_email (a user can only have one role per conference)
CREATE UNIQUE INDEX idx_conference_user_roles_unique ON conference_user_roles(conference_id, user_email);

-- Migrate existing chairs from conferences table
INSERT INTO conference_user_roles (conference_id, user_email, role, status)
SELECT conference_id, chair, 'chair', 'active'
FROM conferences
WHERE chair IS NOT NULL AND chair != '';

-- Migrate existing co-chairs from conferences table (requires unnesting the array)
INSERT INTO conference_user_roles (conference_id, user_email, role, status)
SELECT conference_id, unnest(co_chairs), 'co_chair', 'active'
FROM conferences
WHERE co_chairs IS NOT NULL AND array_length(co_chairs, 1) > 0;

-- Migrate existing reviewers from conference_reviewers table
-- Only migrate user_email as primary identifier
INSERT INTO conference_user_roles (conference_id, user_email, role, status, created_at, updated_at)
SELECT 
    cr.conference_id,
    u.email,
    'reviewer',
    cr.status,
    cr.created_at,
    cr.updated_at
FROM conference_reviewers cr
JOIN users u ON cr.user_id = u.user_id
ON CONFLICT (conference_id, user_email) DO NOTHING;

-- Migrate existing authors from conference_submissions table
INSERT INTO conference_user_roles (conference_id, user_email, role, status, created_at)
SELECT DISTINCT
    cs.conference_id,
    cs.author,
    'author',
    'active',
    cs.created_at
FROM conference_submissions cs
WHERE cs.author IS NOT NULL AND cs.author != ''
ON CONFLICT (conference_id, user_email) DO NOTHING;

