-- Create coi_relationships table for storing conflict of interest relationships
CREATE TABLE IF NOT EXISTS coi_relationships (
    id SERIAL PRIMARY KEY,
    conference_id INTEGER NOT NULL,
    reviewer_id INTEGER NOT NULL,
    author_email VARCHAR(255) NOT NULL,
    submission_id INTEGER,
    relationship_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB DEFAULT '[]',
    start_date DATE,
    end_date DATE,
    detected_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX idx_coi_conference_reviewer ON coi_relationships(conference_id, reviewer_id);
CREATE INDEX idx_coi_conference_author ON coi_relationships(conference_id, author_email);
CREATE INDEX idx_coi_severity ON coi_relationships(severity);
CREATE INDEX idx_coi_type ON coi_relationships(relationship_type);

-- Comment on table
COMMENT ON TABLE coi_relationships IS 'Stores detected conflicts of interest between reviewers and authors';
COMMENT ON COLUMN coi_relationships.relationship_type IS 'Type: co_author, same_organization, advisor_advisee, collaborator, declared, self_author, citation, review_history';
COMMENT ON COLUMN coi_relationships.severity IS 'Severity level: high, medium, low, none';
COMMENT ON COLUMN coi_relationships.detected_by IS 'Name of detector that found this conflict: self_author, declared_conflicts, relationship';





