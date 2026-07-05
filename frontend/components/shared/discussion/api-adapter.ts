import { formatDistanceToNow } from "date-fns"
import { tStatic } from "@/lib/i18n/static-translate"
import type {
  DiscussionThread as ApiDiscussionThread,
  DiscussionMessage as ApiDiscussionMessage,
} from "@/lib/api/discussions"
import type {
  ConferenceSettings,
  DiscussionMessage,
  DiscussionThread,
  MessageVisibility,
  Participant,
  ParticipantRole,
  ReviewMode,
  ThreadCategory,
} from "./types"

export type DiscussionActorRole = "author" | "reviewer" | "chair"
export interface DiscussionConfigAdapter {
  review_type?: string
  discussion_settings?: {
    allow_author_response?: boolean
    start_at?: string
    end_at?: string
  }
}

function toRelativeTime(value?: string): string {
  if (!value) return tStatic("common.time.justNow")
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true })
  } catch {
    return tStatic("common.time.justNow")
  }
}

function participantFromApiMessage(
  message: ApiDiscussionMessage,
  currentUserEmail?: string,
): Participant {
  const first = message.author_first_name || ""
  const last = message.author_last_name || ""
  const fallbackName = message.author_email || `User #${message.author_id}`
  const displayName = `${first} ${last}`.trim() || fallbackName

  const normalizedRole: ParticipantRole =
    message.author_email && message.author_email.includes("chair")
      ? "area_chair"
      : message.author_email && message.author_email.includes("author")
        ? "author"
        : "reviewer"

  return {
    id: String(message.author_id),
    displayName,
    role: normalizedRole,
    anonymousId: normalizedRole === "reviewer" ? `Reviewer #${message.author_id}` : undefined,
    realName: displayName,
    isCurrentUser: !!(currentUserEmail && message.author_email === currentUserEmail),
  }
}

function threadVisibilityForRole(role: DiscussionActorRole): MessageVisibility {
  if (role === "author") return "authors"
  if (role === "chair") return "committee"
  return "reviewers"
}

function threadCategoryFromTitle(title: string): ThreadCategory {
  const normalized = title.toLowerCase()
  if (normalized.includes("method")) return "methodology"
  if (normalized.includes("result")) return "results"
  if (normalized.includes("ethic")) return "ethics"
  if (normalized.includes("meta")) return "meta_review"
  return "general"
}

function threadCreator(
  thread: ApiDiscussionThread,
  role: DiscussionActorRole,
  currentUserEmail?: string,
): Participant {
  const first = thread.reviewer_first_name || ""
  const last = thread.reviewer_last_name || ""
  const fallbackName = thread.reviewer_email || `Reviewer #${thread.reviewer_id}`
  const reviewerName = `${first} ${last}`.trim() || fallbackName

  const participantRole: ParticipantRole = role === "chair" ? "area_chair" : "reviewer"

  return {
    id: String(thread.reviewer_id),
    displayName: reviewerName,
    role: participantRole,
    anonymousId: role === "author" ? `Reviewer #${thread.reviewer_id}` : undefined,
    realName: role === "author" ? undefined : reviewerName,
    isCurrentUser: !!(currentUserEmail && thread.reviewer_email === currentUserEmail),
  }
}

export function buildDiscussionThreads(
  role: DiscussionActorRole,
  threads: ApiDiscussionThread[],
  messagesByThread: Record<number, ApiDiscussionMessage[]>,
  currentUserEmail?: string,
): DiscussionThread[] {
  return threads.map((thread) => {
    const messages = (messagesByThread[thread.id] || []).map<DiscussionMessage>((message) => ({
      id: String(message.id),
      author: participantFromApiMessage(message, currentUserEmail),
      content: message.content,
      timestamp: message.created_at,
      relativeTime: toRelativeTime(message.created_at),
    }))

    return {
      id: String(thread.id),
      title: thread.title,
      visibility: (thread.visibility as MessageVisibility) || threadVisibilityForRole(role),
      status: "open",
      category: threadCategoryFromTitle(thread.title),
      createdBy: threadCreator(thread, role, currentUserEmail),
      createdAt: thread.created_at,
      lastActivity: toRelativeTime(thread.last_message_at || thread.created_at),
      messageCount: thread.message_count || messages.length,
      messages,
    }
  })
}

export function buildDiscussionSettings(
  role: DiscussionActorRole,
  config?: DiscussionConfigAdapter,
): ConferenceSettings {
  const reviewMode: ReviewMode =
    config?.review_type === "single-blind" ? "single_blind" : "double_blind"
  const phase = "discussion"

  return {
    reviewMode,
    allowAuthorResponse: config?.discussion_settings?.allow_author_response ?? role !== "reviewer",
    discussionDeadline: config?.discussion_settings?.end_at || "",
    currentPhase: phase,
  }
}

export function buildCurrentUser(
  role: DiscussionActorRole,
  email?: string,
  name?: string,
): Participant {
  if (role === "author") {
    return {
      id: email || "author",
      displayName: name || "Author",
      role: "author",
      realName: name || "Author",
      isCurrentUser: true,
    }
  }

  if (role === "chair") {
    return {
      id: email || "chair",
      displayName: name || "Chair",
      role: "area_chair",
      realName: name || "Chair",
      isCurrentUser: true,
    }
  }

  return {
    id: email || "reviewer",
    displayName: name || "Reviewer",
    role: "reviewer",
    anonymousId: "Reviewer",
    realName: name || "Reviewer",
    isCurrentUser: true,
  }
}
