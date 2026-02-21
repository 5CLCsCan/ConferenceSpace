import type { Submission } from "@/lib/api/submissions"

// Discussion types
export interface DiscussionMessage {
  id: string
  threadId: string
  threadTitle: string
  author: {
    name: string
    role: "reviewer" | "author" | "chair"
    avatar?: string
    initials: string
  }
  content: string
  timestamp: string
  replies?: DiscussionMessage[]
}

// Rebuttal types
export interface ReviewerReview {
  id: string
  reviewerNum: number
  confidence: string
  confidenceLevel: "High" | "Medium" | "Low"
  score: number
  scoreLabel: string
  scoreColor: "green" | "yellow" | "neutral"
  summary: string
  questions?: string[]
  weaknesses?: string[]
  isExpanded: boolean
}

// Props types
export interface SubmissionDetailViewProps {
  submission: Submission
  conferenceId: string
  conferenceName?: string
}

export type TabId = "overview" | "discussion" | "rebuttal"

// Status step type for timeline
export interface StatusStep {
  id: string
  label: string
  date: string
  completed?: boolean
  current?: boolean
  pending?: boolean
}
