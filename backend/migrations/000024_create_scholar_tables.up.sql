CREATE TABLE IF NOT EXISTS scholar_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    semantic_scholar_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    affiliations TEXT[],
    paper_count INT DEFAULT 0,
    citation_count INT DEFAULT 0,
    h_index INT DEFAULT 0,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scholar_papers (
    id SERIAL PRIMARY KEY,
    semantic_scholar_id VARCHAR(100) NOT NULL UNIQUE,
    title TEXT NOT NULL,
    abstract TEXT,
    venue TEXT,
    year INT,
    citation_count INT DEFAULT 0,
    url TEXT,
    authors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scholar_profile_papers (
    profile_id INT NOT NULL REFERENCES scholar_profiles(id) ON DELETE CASCADE,
    paper_id INT NOT NULL REFERENCES scholar_papers(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, paper_id)
);