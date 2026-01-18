-- Discussion threads table
CREATE TABLE discussion_threads (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL REFERENCES conference_submissions(submission_id) ON DELETE CASCADE,
    reviewer_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    conference_id BIGINT NOT NULL REFERENCES conferences(conference_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_discussion_threads_submission ON discussion_threads(submission_id);
CREATE INDEX idx_discussion_threads_reviewer ON discussion_threads(reviewer_id);
CREATE INDEX idx_discussion_threads_conference ON discussion_threads(conference_id);

-- Discussion messages table
CREATE TABLE discussion_messages (
    id BIGSERIAL PRIMARY KEY,
    thread_id BIGINT NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_discussion_messages_thread ON discussion_messages(thread_id);
CREATE INDEX idx_discussion_messages_author ON discussion_messages(author_id);
