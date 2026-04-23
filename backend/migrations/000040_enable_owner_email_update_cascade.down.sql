ALTER TABLE conference_config_templates
    DROP CONSTRAINT IF EXISTS conference_config_templates_owner_email_fkey;

ALTER TABLE conference_config_templates
    ADD CONSTRAINT conference_config_templates_owner_email_fkey
    FOREIGN KEY (owner_email)
    REFERENCES users(email)
    ON DELETE CASCADE;
