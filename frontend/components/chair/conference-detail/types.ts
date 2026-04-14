// Conference Detail Types

export interface ConferenceInfo {
  id: string
  acronym: string
  fullName: string
  location: string
  startDate: string
  endDate: string
  year: string
  userRole?: string
}

export interface ConferenceStat {
  label: string
  value: string | number
  icon?: string
  trend?: {
    value: string
    direction: "up" | "down" | "neutral"
    comparison?: string
  }
  progress?: {
    current: number
    total: number
    percentage: number
  }
  badge?: {
    label: string
    variant: "default" | "success" | "warning" | "info"
  }
  subtext?: string
}

export interface PendingDecision {
  id: string
  title: string
  score: number
  status: string
  scoreVariant: "high" | "medium" | "low"
}

export interface TrackProgress {
  name: string
  percentage: number
}

export interface ActivityItem {
  id: string
  user: {
    name: string
    avatar?: string
  }
  action: string
  target?: string
  timestamp: string
}

export type TabId =
  | "dashboard"
  | "overview"
  | "cfp"
  | "dates"
  | "committee"
  | "submissions"
  | "assignments"
  | "coi"
  | "rebuttal"

export interface TabItem {
  id: TabId
  label: string
  icon: string
  badge?: number
}
