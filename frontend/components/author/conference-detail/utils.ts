import type { Conference } from "./types"
import { getSubmissionEligibility, type SubmissionLike } from "@/lib/submission-eligibility"
import { tStatic as t } from "@/lib/i18n/static-translate"

export function formatDateRange(start?: string, end?: string): string {
  if (!start) return "Dates TBD"
  const s = new Date(start)
  const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" }
  if (!end) return s.toLocaleDateString("en-US", { ...options, year: "numeric" })
  const e = new Date(end)
  return `${s.toLocaleDateString("en-US", options)} - ${e.toLocaleDateString("en-US", { ...options, year: "numeric" })}`
}

export function getConferenceStatus(
  conference: Conference,
  submission?: SubmissionLike | null,
): { label: string; color: string } {
  const now = new Date()
  const eligibility = getSubmissionEligibility({
    conferenceStatus: conference.status,
    fullPaperDeadline:
      conference.configurations?.full_paper_submission_deadline || conference.submission_deadline,
    submission,
    now,
  })
  const confEnd = conference.conference_end_date ? new Date(conference.conference_end_date) : null

  if (conference.status === "draft")
    return { label: "Draft", color: "bg-amber-50 text-amber-700 border-amber-200" }
  if (conference.status === "reviewing")
    return {
      label: "Under Review",
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    }
  if (conference.status === "completed" || (confEnd && now >= confEnd))
    return { label: "Completed", color: "bg-slate-100 text-slate-600 border-slate-200" }
  if (conference.status === "archived")
    return { label: "Archived", color: "bg-slate-100 text-slate-600 border-slate-200" }
  if (eligibility.publicStatus === "call-for-papers")
    return { label: "Active", color: "bg-green-50 text-green-700 border-green-200" }
  if (eligibility.publicStatus === "submission-closed")
    return {
      label: t(
        "runtime.components.author.conference-detail.conference-header.prop_label_submission_closed",
      ),
      color: "bg-slate-100 text-slate-600 border-slate-200",
    }
  return {
    label: t(
      "runtime.components.author.conference-detail.conference-header.prop_label_submission_closed",
    ),
    color: "bg-slate-100 text-slate-600 border-slate-200",
  }
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
