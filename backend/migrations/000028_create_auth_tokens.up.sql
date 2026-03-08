CREATE TABLE auth_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_email TEXT        NOT NULL,
    token      TEXT        NOT NULL UNIQUE,
    token_type TEXT        NOT NULL CHECK (token_type IN ('password_reset', 'email_verification')),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_tokens_token ON auth_tokens(token);
CREATE INDEX idx_auth_tokens_email_type ON auth_tokens(user_email, token_type);
