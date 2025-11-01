CREATE TABLE IF NOT EXISTS conference_bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    conference_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, conference_id)
);

CREATE INDEX idx_conference_bookmarks_user_id ON conference_bookmarks(user_id);
CREATE INDEX idx_conference_bookmarks_conference_id ON conference_bookmarks(conference_id);

