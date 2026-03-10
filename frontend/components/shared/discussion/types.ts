// =============================================================================
// Discussion Component Types
// Shared across reviewer, author, and chair roles
// =============================================================================

export type ReviewMode = "double_blind" | "single_blind" | "open"

export type MessageVisibility = "committee" | "reviewers" | "authors" | "public"

export type ParticipantRole = "reviewer" | "area_chair" | "senior_pc" | "author" | "system"

export type ThreadStatus = "open" | "resolved" | "flagged" | "pinned"

export type ThreadCategory =
  | "methodology"
  | "results"
  | "clarity"
  | "ethics"
  | "general"
  | "meta_review"

export interface Participant {
  id: string
  displayName: string
  role: ParticipantRole
  anonymousId?: string // e.g., "Reviewer #2"
  realName?: string // Only visible in open review or to chairs
  avatar?: string
  isCurrentUser?: boolean
}

export interface Attachment {
  id: string
  type: "paper_reference" | "figure" | "equation" | "file"
  label: string
  reference?: string // e.g., "Section 3.2" or "Figure 4"
}

export interface DiscussionMessage {
  id: string
  author: Participant
  content: string
  timestamp: string
  relativeTime: string
  attachments?: Attachment[]
  reactions?: { emoji: string; count: number; reacted: boolean }[]
  editedAt?: string
  isDeleted?: boolean
}

export interface DiscussionThread {
  id: string
  title: string
  visibility: MessageVisibility
  status: ThreadStatus
  category: ThreadCategory
  createdBy: Participant
  createdAt: string
  lastActivity: string
  messageCount: number
  messages: DiscussionMessage[]
  isCollapsed?: boolean
  linkedSection?: string // e.g., "Abstract", "Section 3.2"
}

export interface ConferenceSettings {
  reviewMode: ReviewMode
  allowAuthorResponse: boolean
  discussionDeadline: string
  currentPhase: "review" | "discussion" | "rebuttal" | "decision"
}

// =============================================================================
// Data Transfer Interfaces
// =============================================================================

/** Data submitted when creating a new thread (from modal) */
export interface CreateThreadData {
  title: string
  content: string
  visibility: MessageVisibility
  category: ThreadCategory
  linkedSection?: string
}

// =============================================================================
// Component Props Interfaces
// =============================================================================

export interface DiscussionPanelProps {
  threads: DiscussionThread[]
  settings: ConferenceSettings
  currentUser: Participant
  onCreateThread?: (data: CreateThreadData) => void
  onReplyToThread?: (threadId: string, content: string, attachments?: Attachment[]) => void
  onToggleThreadStatus?: (threadId: string, status: ThreadStatus) => void
  onToggleThreadCollapse?: (threadId: string) => void
  readOnly?: boolean
  availableVisibilities?: MessageVisibility[]
  className?: string
}

export interface MessageItemProps {
  message: DiscussionMessage
  isFirst: boolean
  reviewMode: ReviewMode
  onReact?: (messageId: string, emoji: string) => void
  onQuote?: (messageId: string) => void
  onDelete?: (messageId: string) => void
}

export interface ThreadCardProps {
  thread: DiscussionThread
  reviewMode: ReviewMode
  currentUser: Participant
  onToggleCollapse?: () => void
  onReply?: (content: string, attachments?: Attachment[]) => void
  onStatusChange?: (status: ThreadStatus) => void
  readOnly?: boolean
}

export interface NewThreadModalProps {
  isOpen: boolean
  onClose: () => void
  reviewMode: ReviewMode
  onSubmit?: (data: CreateThreadData) => void
  availableVisibilities?: MessageVisibility[]
}
