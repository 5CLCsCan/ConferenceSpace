CREATE TABLE IF NOT EXISTS conference_config_templates (
    template_id BIGSERIAL PRIMARY KEY,
    owner_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conference_config_templates_owner_updated_at
    ON conference_config_templates(owner_email, updated_at DESC);
