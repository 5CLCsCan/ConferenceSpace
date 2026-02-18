// Submission Detail Types

export type SubmissionDetailStatus =
  | "under_review"
  | "accepted"
  | "pending_decision"
  | "rejected"
  | "withdrawn"
  | "revision_requested"

export type ReviewerDecision = "accept" | "weak_accept" | "borderline" | "weak_reject" | "reject"

export type ConfidenceLevel = "high" | "medium" | "low"

export type ReviewerAssignmentStatus = "completed" | "pending" | "in_progress" | "declined"

export interface Author {
  id: string
  name: string
  email?: string
  affiliation: string
  avatar?: string
  isCorresponding?: boolean
}

export interface SubmissionFile {
  id: string
  name: string
  size: string
  type: "pdf" | "zip" | "doc" | "other"
  uploadedAt?: string
}

export interface ReviewScore {
  reviewerId: string
  reviewerName: string
  avatarColor: string
  decision: ReviewerDecision
  score: number
  confidence: ConfidenceLevel
}

export interface ReviewerAssignment {
  id: string
  name: string
  avatar?: string
  status: ReviewerAssignmentStatus
}

export interface SubmissionDetail {
  id: string
  displayId: string
  title: string
  abstract: string
  track: string
  status: SubmissionDetailStatus
  keywords: string[]
  authors: Author[]
  conflictsOfInterest: string[]
  files: SubmissionFile[]
  coverLetter?: string
  lastUpdated: string
  reviewOverview: {
    averageScore: number
    maxScore: number
    confidence: ConfidenceLevel
    status: string
    individualScores: ReviewScore[]
  }
  reviewerAssignments: ReviewerAssignment[]
}

export type SubmissionSubTab = "overview" | "reviews" | "discussion" | "history"
