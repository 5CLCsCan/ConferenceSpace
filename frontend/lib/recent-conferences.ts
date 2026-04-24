import type { UserRole } from "@/lib/types"

export interface RecentConferenceRecord {
  id: string
  name: string
  acronym?: string
  year?: number
  role: Exclude<UserRole, "admin">
  href: string
  viewedAt: string
}

interface RecentConferenceKey {
  userKey: string
  role: UserRole | null | undefined
}

interface RecordRecentConferenceInput extends RecentConferenceKey {
  conference: RecentConferenceRecord
}

const MAX_RECENT_CONFERENCES = 5

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage)
}

function storageKey({ userKey, role }: RecentConferenceKey) {
  return `recent-conferences:${userKey}:${role || "none"}`
}

function isRecentConferenceRecord(value: unknown): value is RecentConferenceRecord {
  if (!value || typeof value !== "object") {
    return false
  }

  const record = value as Partial<RecentConferenceRecord>
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.role === "string" &&
    typeof record.href === "string" &&
    typeof record.viewedAt === "string"
  )
}

export function getRecentConferences(key: RecentConferenceKey): RecentConferenceRecord[] {
  if (!canUseStorage()) {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey(key))
    if (!rawValue) {
      return []
    }

    const parsed = JSON.parse(rawValue)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter(isRecentConferenceRecord)
      .sort((left, right) => Date.parse(right.viewedAt) - Date.parse(left.viewedAt))
      .slice(0, MAX_RECENT_CONFERENCES)
  } catch {
    return []
  }
}

export function recordRecentConference({ userKey, role, conference }: RecordRecentConferenceInput) {
  if (!canUseStorage() || !role || role === "admin") {
    return
  }

  const current = getRecentConferences({ userKey, role })
  const next = [conference, ...current.filter((item) => item.id !== conference.id)].slice(
    0,
    MAX_RECENT_CONFERENCES,
  )

  window.localStorage.setItem(storageKey({ userKey, role }), JSON.stringify(next))
}
