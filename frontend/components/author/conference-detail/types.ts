import type { Conference, ImportantDate } from "@/lib/api/conferences"

export type TabType = "overview" | "cfp" | "dates" | "committee"

export interface AuthorConferenceDetailProps {
  conferenceId: string
}

export interface TabProps {
  conference: Conference
}

export interface DatesTabProps {
  dates: ImportantDate[]
  conferenceAcronym?: string
  conferenceName?: string
}

export type { Conference, ImportantDate }
