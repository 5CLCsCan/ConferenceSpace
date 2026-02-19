# Reviewer-Author Discussion Threads Design

## Overview

Enable threaded discussions between reviewers and authors during the reviewing phase. Reviewers can create multiple threads per paper with required titles, and authors respond within them.

## Requirements

- **Thread model**: Reviewers create threads, authors respond
- **Visibility**: Author, reviewer, and chair can see identities and conversations; no one else
- **Timing**: Enabled during reviewing phase
- **Notifications**: Real-time WebSocket + persistent in-app notifications
- **Messages**: Immutable (no editing, no deleting), threads auto-close when reviewing phase ends
- **Titles**: Required for each thread

## Data Model

### New Tables

```sql
-- Discussion threads
CREATE TABLE discussion_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES conference_submissions(submission_id),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    conference_id UUID NOT NULL REFERENCES conferences(id),
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_discussion_threads_submission ON discussion_threads(submission_id);
CREATE INDEX idx_discussion_threads_reviewer ON discussion_threads(reviewer_id);
CREATE INDEX idx_discussion_threads_conference ON discussion_threads(conference_id);

-- Discussion messages
CREATE TABLE discussion_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_discussion_messages_thread ON discussion_messages(thread_id);
```

### Access Control Logic

- Thread visible to: the reviewer who created it, the paper's author, and conference chairs
- No cross-reviewer visibility (Reviewer A can't see Reviewer B's threads)
- Phase gating: Check conference status = "reviewing" before allowing thread creation or replies

## API Endpoints

### Thread Operations

```
POST   /api/v1/conferences/{conf_id}/submissions/{sub_id}/threads
       → Create thread (reviewer only)
       Body: { "title": "string", "content": "string" }
       Returns: thread object with first message

GET    /api/v1/conferences/{conf_id}/submissions/{sub_id}/threads
       → List threads for a submission (filtered by access)
       Returns: array of thread objects
```

### Message Operations

```
POST   /api/v1/threads/{thread_id}/messages
       → Add reply to thread
       Body: { "content": "string" }
       Returns: message object

GET    /api/v1/threads/{thread_id}/messages
       → Get all messages in a thread
       Returns: array of message objects
```

### Access Rules

| Endpoint | Access |
|----------|--------|
| Create thread | Assigned reviewer + conference in reviewing phase |
| List threads | Own threads (reviewer), threads about own paper (author), all threads (chair) |
| Add message | Thread participant (the reviewer or the author) + reviewing phase |
| Get messages | Thread participant or chair |

## Backend Architecture

Following clean architecture pattern:

### Storage Layer (`backend/internal/storage/discussion/`)

```go
type DiscussionStorage interface {
    CreateThread(thread *model.DiscussionThread) (*model.DiscussionThread, error)
    GetThreadsBySubmission(submissionID uuid.UUID) ([]model.DiscussionThread, error)
    GetThreadByID(threadID uuid.UUID) (*model.DiscussionThread, error)
    CreateMessage(message *model.DiscussionMessage) (*model.DiscussionMessage, error)
    GetMessagesByThread(threadID uuid.UUID) ([]model.DiscussionMessage, error)
    GetThreadsForChair(conferenceID uuid.UUID) ([]model.DiscussionThread, error)
}
```

### Service Layer (`backend/internal/service/discussion/`)

```go
type DiscussionService interface {
    CreateThread(userID, submissionID uuid.UUID, title, content string) (*model.DiscussionThread, error)
    GetThreadsForUser(userID, submissionID uuid.UUID) ([]model.DiscussionThread, error)
    AddMessage(userID, threadID uuid.UUID, content string) (*model.DiscussionMessage, error)
    GetMessages(userID, threadID uuid.UUID) ([]model.DiscussionMessage, error)
}
```

Service validates:
- User is assigned reviewer (for thread creation)
- Conference in reviewing phase
- User is participant (for messaging)

### Controller Layer (`backend/internal/controller/discussion/`)

HTTP handlers calling service methods with JWT middleware for user identity.

### Wiring

In `cmd/server/main.go`: Storage → Service → Controller injection.

## Notifications

### WebSocket Integration

Extend existing `websocket/hub.go` with new message types:
- `discussion_new_thread`
- `discussion_new_message`

### Notification Flow

1. User posts message → Service creates message in DB
2. Service calls NotificationService.Create() for recipient
3. NotificationService stores notification + broadcasts via WebSocket Hub
4. If recipient online → instant push
5. If recipient offline → sees notification on next visit

### Notification Recipients

- New thread created → notify author
- New message in thread → notify the other participant
- Chair not notified (passive oversight)

### Notification Data (JSONB)

```json
{
  "thread_id": "uuid",
  "thread_title": "Question about Figure 3",
  "submission_id": "uuid",
  "submission_title": "Paper Title",
  "conference_id": "uuid",
  "sender_name": "Reviewer or Author Name"
}
```

### Frontend Redirect on Click

- Reviewer: `/dashboard/reviewer/papers/{submission_id}?thread={thread_id}`
- Author: `/dashboard/author/submissions/{submission_id}?thread={thread_id}`

Behavior: Auto-opens discussion tab, scrolls to thread, marks notification as read.

## Frontend Components

### New Components (`frontend/components/discussion/`)

```
discussion-thread-list.tsx
├── Lists all threads for a submission
├── Shows: title, last message preview, timestamp, unread indicator
└── "New Thread" button (visible to reviewers only)

discussion-thread-view.tsx
├── Displays all messages in a thread
├── Message input at bottom
└── Auto-scroll to latest message

discussion-create-modal.tsx
├── Form: title (required), first message (required)
└── Triggered by "New Thread" button
```

### Integration Points

- `components/reviewer/paper-review.tsx` - Replace mock discussion data, embed thread list in Discussion tab
- `components/author/submission-detail-view.tsx` - Add Discussion tab with thread list
- `components/chair/` - Add discussion oversight view (read-only)

### Real-time Updates

Listen to WebSocket for `discussion_new_thread` and `discussion_new_message`, update UI without refresh.

## API Tests

Located in `backend/tests/discussion_test.go`:

### Thread Tests
- TestCreateThread_Success
- TestCreateThread_NotReviewer_Forbidden
- TestCreateThread_WrongPhase_Forbidden
- TestCreateThread_MissingTitle_BadRequest
- TestGetThreads_ReviewerSeesOwnOnly
- TestGetThreads_AuthorSeesTheirPaperThreads
- TestGetThreads_ChairSeesAll
- TestGetThreads_UnrelatedUser_Empty

### Message Tests
- TestAddMessage_ReviewerSuccess
- TestAddMessage_AuthorSuccess
- TestAddMessage_NonParticipant_Forbidden
- TestAddMessage_WrongPhase_Forbidden
- TestGetMessages_ParticipantSuccess
- TestGetMessages_NonParticipant_Forbidden

### Notification Tests
- TestNewThread_NotifiesAuthor
- TestNewMessage_NotifiesOtherParticipant

## Implementation Order

1. Database migration (new tables)
2. Storage layer
3. Service layer with access control
4. Controller layer with routes
5. API tests (`make test-api`)
6. Frontend components
7. WebSocket integration
8. End-to-end testing
