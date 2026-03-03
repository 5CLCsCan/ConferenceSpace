import type { UIMessage } from "ai"
import type { ChatConversation } from "@/components/chatbot/types"

type SessionListItemApi = {
  thread_id: string
  title: string
  started_at: string
  last_activity_at: string
  turn_count: number
  model: string
  status: string
}

type SessionListApiResponse = {
  items: SessionListItemApi[]
  next_cursor: string | null
}

type SessionHistoryApiResponse = {
  thread_id: string
  messages: UIMessage[]
  rolling_summary: string | null
  session_meta: {
    title: string
    started_at: string
    last_activity_at: string
    turn_count: number
    model: string
    trace_id: string
  }
}

export async function listConversations(params?: {
  limit?: number
  cursor?: string
}): Promise<{ conversations: ChatConversation[]; nextCursor: string | null }> {
  const search = new URLSearchParams()
  if (params?.limit) {
    search.set("limit", String(params.limit))
  }
  if (params?.cursor) {
    search.set("cursor", params.cursor)
  }

  const query = search.toString()
  const response = await fetch(`/api/chat/sessions${query ? `?${query}` : ""}`, {
    method: "GET",
    cache: "no-store",
  })
  const payload = await parseJson<SessionListApiResponse>(response)
  if (!response.ok) {
    throw new Error(readErrorMessage(payload, "Failed to list conversations"))
  }

  return {
    conversations: (payload?.items ?? []).map(toConversationSummary),
    nextCursor: payload?.next_cursor ?? null,
  }
}

export async function getConversationHistory(threadId: string): Promise<ChatConversation> {
  const encodedThreadId = encodeURIComponent(threadId)
  const response = await fetch(`/api/chat/sessions/${encodedThreadId}`, {
    method: "GET",
    cache: "no-store",
  })
  const payload = await parseJson<SessionHistoryApiResponse>(response)
  if (!response.ok || !payload) {
    throw new Error(readErrorMessage(payload, "Failed to load conversation history"))
  }

  return {
    id: payload.thread_id,
    title: payload.session_meta.title || "New Conversation",
    messages: Array.isArray(payload.messages) ? payload.messages : [],
    createdAt: toDate(payload.session_meta.started_at),
    updatedAt: toDate(payload.session_meta.last_activity_at),
    turnCount: payload.session_meta.turn_count,
    model: payload.session_meta.model,
    status: "active",
  }
}

export async function deleteConversation(threadId: string): Promise<void> {
  const encodedThreadId = encodeURIComponent(threadId)
  const response = await fetch(`/api/chat/sessions/${encodedThreadId}`, {
    method: "DELETE",
    cache: "no-store",
  })
  if (!response.ok && response.status !== 404) {
    const payload = await parseJson<{ detail?: string; error?: string }>(response)
    throw new Error(readErrorMessage(payload, "Failed to delete conversation"))
  }
}

function toConversationSummary(item: SessionListItemApi): ChatConversation {
  return {
    id: item.thread_id,
    title: item.title || "New Conversation",
    messages: [],
    createdAt: toDate(item.started_at),
    updatedAt: toDate(item.last_activity_at),
    turnCount: item.turn_count,
    model: item.model,
    status: item.status,
  }
}

function toDate(raw: string | undefined): Date {
  const parsed = new Date(raw ?? "")
  if (Number.isNaN(parsed.getTime())) {
    return new Date()
  }
  return parsed
}

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

function readErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback
  }
  if ("detail" in payload && typeof payload.detail === "string") {
    return payload.detail
  }
  if ("error" in payload && typeof payload.error === "string") {
    return payload.error
  }
  if ("details" in payload && typeof payload.details === "string") {
    return payload.details
  }
  return fallback
}
