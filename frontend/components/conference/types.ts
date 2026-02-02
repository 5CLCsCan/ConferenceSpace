// Conference Types

export type ConferenceStatus = "active" | "planning" | "draft" | "completed"

export interface ConferenceReviewProgress {
  label: string
  value: number
  submissions: number
  daysLeft: number
}

export interface ConferenceSetupStatus {
  phase: string
  progress: number
  actionRequired?: boolean
}

export interface Conference {
  id: string
  name: string
  acronym?: string
  role: string
  track?: string
  location?: string
  dates?: string
  status: ConferenceStatus
  reviewProgress?: ConferenceReviewProgress
  setupStatus?: ConferenceSetupStatus
  draftSavedDaysAgo?: number
  acceptedPapers?: number
}

export type TabType = "my-conferences" | "explore" | "archived"
export type ViewMode = "grid" | "list"
