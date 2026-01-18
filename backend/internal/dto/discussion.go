package dto

import "time"

// DiscussionThread represents a discussion thread response
type DiscussionThread struct {
	ID                int64      `json:"id"`
	SubmissionID      int64      `json:"submission_id"`
	ReviewerID        int64      `json:"reviewer_id"`
	ConferenceID      int64      `json:"conference_id"`
	Title             string     `json:"title"`
	CreatedAt         time.Time  `json:"created_at"`
	ReviewerEmail     string     `json:"reviewer_email,omitempty"`
	ReviewerFirstName string     `json:"reviewer_first_name,omitempty"`
	ReviewerLastName  string     `json:"reviewer_last_name,omitempty"`
	AuthorEmail       string     `json:"author_email,omitempty"`
	SubmissionTitle   string     `json:"submission_title,omitempty"`
	MessageCount      int        `json:"message_count"`
	LastMessageAt     *time.Time `json:"last_message_at,omitempty"`
}

// DiscussionMessage represents a discussion message response
type DiscussionMessage struct {
	ID              int64     `json:"id"`
	ThreadID        int64     `json:"thread_id"`
	AuthorID        int64     `json:"author_id"`
	Content         string    `json:"content"`
	CreatedAt       time.Time `json:"created_at"`
	AuthorEmail     string    `json:"author_email,omitempty"`
	AuthorFirstName string    `json:"author_first_name,omitempty"`
	AuthorLastName  string    `json:"author_last_name,omitempty"`
}

// CreateThreadRequest represents the request to create a new thread
type CreateThreadRequest struct {
	Title   string `json:"title" binding:"required,min=1,max=255"`
	Content string `json:"content" binding:"required,min=1"`
}

// CreateThreadResponse represents the response after creating a thread
type CreateThreadResponse struct {
	Thread  *DiscussionThread  `json:"thread"`
	Message *DiscussionMessage `json:"message"`
}

// CreateMessageRequest represents the request to create a new message
type CreateMessageRequest struct {
	Content string `json:"content" binding:"required,min=1"`
}

// ThreadListResponse represents a list of threads
type ThreadListResponse struct {
	Threads []*DiscussionThread `json:"threads"`
	Total   int64               `json:"total"`
}

// MessageListResponse represents a list of messages
type MessageListResponse struct {
	Messages []*DiscussionMessage `json:"messages"`
	Total    int64                `json:"total"`
}
