import { apiFetch } from "./client"

// Response types
export interface DiscussionThread {
  id: number
  submission_id: number
  reviewer_id: number
  conference_id: number
  title: string
  created_at: string
  reviewer_email?: string
  reviewer_first_name?: string
  reviewer_last_name?: string
  author_email?: string
  submission_title?: string
  message_count: number
  last_message_at?: string
}

export interface DiscussionMessage {
  id: number
  thread_id: number
  author_id: number
  content: string
  created_at: string
  author_email?: string
  author_first_name?: string
  author_last_name?: string
}

export interface CreateThreadResponse {
  thread: DiscussionThread
  message: DiscussionMessage
}

export interface ThreadListResponse {
  threads: DiscussionThread[]
  total: number
}

export interface MessageListResponse {
  messages: DiscussionMessage[]
  total: number
}

// Request types
export interface CreateThreadRequest {
  title: string
  content: string
}

export interface CreateMessageRequest {
  content: string
}

/**
 * Create a new discussion thread for a submission
 */
export async function createThread(
  conferenceId: number,
  submissionId: number,
  req: CreateThreadRequest,
): Promise<CreateThreadResponse> {
  const { data } = await apiFetch<{ data: CreateThreadResponse }>(
    `/api/v1/conferences/${conferenceId}/submissions/${submissionId}/threads`,
    {
      method: "POST",
      body: JSON.stringify(req),
    },
  )
  return data.data
}

/**
 * Get all discussion threads for a submission
 */
export async function getThreads(
  conferenceId: number,
  submissionId: number,
): Promise<ThreadListResponse> {
  const { data } = await apiFetch<{ data: ThreadListResponse }>(
    `/api/v1/conferences/${conferenceId}/submissions/${submissionId}/threads`,
  )
  return data.data
}

/**
 * Get a specific thread by ID
 */
export async function getThread(threadId: number): Promise<DiscussionThread> {
  const { data } = await apiFetch<{ data: DiscussionThread }>(`/api/v1/threads/${threadId}`)
  return data.data
}

/**
 * Add a message to a thread
 */
export async function createMessage(
  threadId: number,
  req: CreateMessageRequest,
): Promise<DiscussionMessage> {
  const { data } = await apiFetch<{ data: DiscussionMessage }>(
    `/api/v1/threads/${threadId}/messages`,
    {
      method: "POST",
      body: JSON.stringify(req),
    },
  )
  return data.data
}

/**
 * Get all messages in a thread
 */
export async function getMessages(threadId: number): Promise<MessageListResponse> {
  const { data } = await apiFetch<{ data: MessageListResponse }>(
    `/api/v1/threads/${threadId}/messages`,
  )
  return data.data
}
