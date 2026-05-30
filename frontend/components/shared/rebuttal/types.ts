// =============================================================================
// Rebuttal Component Types
// Shared across reviewer, author, and chair roles
// =============================================================================

export type RebuttalPhase = "awaiting" | "submitted" | "discussion" | "finalized"

export type ResponseStatus =
  | "addressed"
  | "partially_addressed"
  | "not_addressed"
  | "pending_review"

export type PointCategory = "weakness" | "question" | "clarification" | "suggestion"

export type UserRole = "reviewer" | "author" | "chair"

export type AttachmentType = "revised_manuscript" | "supplementary" | "response_letter"

// =============================================================================
// Core Interfaces
// =============================================================================

export interface ReviewerInfo {
  id: string
  anonymousId: string // e.g., "Reviewer #2"
  isCurrentUser: boolean
  rebuttalStatus?: string // "none" | "submitted" | "acknowledged"
  scores: {
    original: number
    current: number
    updated: boolean
  }
  recommendation: {
    original: string
    current: string
    updated: boolean
  }
  confidence: number
}

export interface RebuttalPoint {
  id: string
  reviewerId: string
  category: PointCategory
  originalComment: string
  section?: string // e.g., "Weaknesses", "Questions to Authors"
  authorResponse?: string
  status: ResponseStatus
  reviewerAcknowledgment?: {
    acknowledged: boolean
    note?: string
    satisfactory?: boolean
  }
  characterCount?: number
}

export interface RebuttalAttachment {
  id: string
  name: string
  type: AttachmentType
  size: string
  uploadedAt: string
  version?: string
}

export interface RebuttalSubmission {
  id: string
  submittedAt: string
  generalResponse: {
    content: string
    wordCount: number
  }
  perReviewerResponses: {
    reviewerId: string
    characterCount: number
    characterLimit: number
  }[]
  attachments: RebuttalAttachment[]
}

export interface RebuttalSettings {
  phase: RebuttalPhase
  deadline: string
  daysRemaining: number
  characterLimitPerReview: number
  charLimitGeneral: number
  charLimitPerPoint: number
  allowRevisions: boolean
  allowNewResults: boolean
  requireResponseToAll: boolean
}

// =============================================================================
// Component Props Interfaces
// =============================================================================

export interface RebuttalPanelProps {
  settings: RebuttalSettings
  reviewers: ReviewerInfo[]
  points: RebuttalPoint[]
  submission: RebuttalSubmission | null
  userRole: UserRole
  currentUserId?: string
  onPointStatusChange?: (pointId: string, status: ResponseStatus, note?: string) => void
  onUpdateReview?: () => void
  onStartDiscussion?: () => void
  onSubmitRebuttal?: (data: RebuttalSubmissionData) => void
  readOnly?: boolean
  className?: string
}

export interface PhaseHeaderProps {
  settings: RebuttalSettings
  userRole?: UserRole
}

export interface ScoreSummaryPanelProps {
  reviewers: ReviewerInfo[]
  userRole?: UserRole
  showIndividualScores?: boolean
}

export interface ReviewerScoreCardProps {
  reviewer: ReviewerInfo
}

export interface PointCardProps {
  point: RebuttalPoint
  reviewer: ReviewerInfo
  userRole: UserRole
  onMarkStatus?: (status: ResponseStatus, note?: string) => void
  onAuthorResponseChange?: (response: string) => void
  readOnly?: boolean
}

export interface GeneralResponseSectionProps {
  submission: RebuttalSubmission
  userRole?: UserRole
  defaultExpanded?: boolean
}

export interface ReviewerResponseGroupProps {
  reviewer: ReviewerInfo
  points: RebuttalPoint[]
  userRole: UserRole
  onPointStatusChange: (pointId: string, status: ResponseStatus, note?: string) => void
  onAuthorResponseChange?: (pointId: string, response: string) => void
  defaultExpanded?: boolean
  readOnly?: boolean
}

export interface ActionBarProps {
  hasUpdates: boolean
  userRole: UserRole
  onUpdateReview?: () => void
  onSubmitRebuttal?: () => void
  onStartDiscussion?: () => void
}

export interface StatusBadgeProps {
  status: ResponseStatus
  size?: "sm" | "md"
}

// =============================================================================
// Data Transfer Interfaces
// =============================================================================

export interface RebuttalSubmissionData {
  generalResponse: string
  perReviewerResponses: {
    reviewerId: string
    content: string
  }[]
  attachments?: File[]
}
