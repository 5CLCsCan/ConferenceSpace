CREATE TABLE semantic_scholar_cache (
    id          SERIAL PRIMARY KEY,
    cache_key   VARCHAR(255) NOT NULL UNIQUE,
    cache_type  VARCHAR(50) NOT NULL,
    data        JSONB NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ss_cache_key ON semantic_scholar_cache(cache_key);
CREATE INDEX idx_ss_cache_type ON semantic_scholar_cache(cache_type);
