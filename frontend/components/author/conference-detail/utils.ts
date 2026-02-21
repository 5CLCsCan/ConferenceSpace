import type { Conference } from "./types"

export function formatDateRange(start?: string, end?: string): string {
  if (!start) return "Dates TBD"
  const s = new Date(start)
  const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" }
  if (!end) return s.toLocaleDateString("en-US", { ...options, year: "numeric" })
  const e = new Date(end)
  return `${s.toLocaleDateString("en-US", options)} - ${e.toLocaleDateString("en-US", { ...options, year: "numeric" })}`
}

export function getConferenceStatus(conference: Conference): { label: string; color: string } {
  const now = new Date()
  const deadline = conference.submission_deadline ? new Date(conference.submission_deadline) : null
  const confEnd = conference.conference_end_date ? new Date(conference.conference_end_date) : null

  if (deadline && now < deadline)
    return { label: "Active", color: "bg-green-50 text-green-700 border-green-200" }
  if (confEnd && now >= confEnd)
    return { label: "Completed", color: "bg-slate-100 text-slate-600 border-slate-200" }
  return { label: "Registration Open", color: "bg-blue-50 text-blue-700 border-blue-200" }
}

export function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase()
  return "#" + "00000".substring(0, 6 - c.length) + c
}

export function getArtisticGradient(seed: string): string {
  const color1 = stringToColor(seed)
  const color2 = stringToColor(seed.split("").reverse().join(""))
  return `radial-gradient(circle at 30% 30%, ${color1} 0%, ${color2} 100%)`
}
