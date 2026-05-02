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

export type TabType = "my-conferences" | "explore" | "drafts" | "archived"
export type ViewMode = "grid" | "list"

// Explore/Archived Conference Types
export type ExploreStatus =
  | "call-for-papers"
  | "registration-open"
  | "submission-closed"
  | "upcoming"
  | "workshop"

export interface ExploreConference {
  id: string
  name: string
  fullDescription: string
  location: string
  dates: string
  exploreStatus: ExploreStatus
  topics: string[]
  isVirtual?: boolean
}
