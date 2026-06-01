import type { ImportantDate } from "@/lib/api/conferences"
import { humanizeTranslationFallback } from "@/lib/i18n/fallback-key"

export const CONFERENCE_START_DATE_ID = "conference-start-date"

export const PHASE_EVENT_IDS: Record<string, string[]> = {
  submission: ["abstract-submission-deadline", "submission-deadline"],
  review: ["notification-date", "rebuttal-period-start", "rebuttal-period-end"],
  event: ["camera-ready-deadline", "conference-end-date"],
}

/** Submission and review milestones shown as the next major author deadline. */
export const MAJOR_DEADLINE_IDS = new Set([
  "abstract-submission-deadline",
  "submission-deadline",
  "notification-date",
  "rebuttal-period-start",
  "rebuttal-period-end",
])

const I18N_BASE = "runtime.components.author.conference-detail.important-dates-tab"

export function getDateLocale(locale: string): string {
  return locale === "vi" ? "vi-VN" : "en-US"
}

export function eventTitleKey(eventId: string): string {
  return `${I18N_BASE}.events.${eventId}.title`
}

export function eventDescriptionKey(eventId: string): string {
  return `${I18N_BASE}.events.${eventId}.description`
}

export function phaseNameKey(phaseId: string): string {
  return `${I18N_BASE}.phases.${phaseId}`
}

export function phaseStatusKey(status: "completed" | "in-progress" | "upcoming"): string {
  switch (status) {
    case "completed":
      return `${I18N_BASE}.text_completed`
    case "in-progress":
      return `${I18N_BASE}.text_in_progress`
    default:
      return `${I18N_BASE}.text_upcoming`
  }
}

function translateField(t: (key: string) => string, key: string, fallback: string): string {
  const translated = t(key)
  return translated === humanizeTranslationFallback(key) ? fallback : translated
}

export function localizeImportantDate(
  date: ImportantDate,
  t: (key: string) => string,
): ImportantDate {
  return {
    ...date,
    title: translateField(t, eventTitleKey(date.id), date.title),
    description: translateField(t, eventDescriptionKey(date.id), date.description),
  }
}

export function localizeImportantDates(
  dates: ImportantDate[],
  t: (key: string) => string,
): ImportantDate[] {
  return dates.map((date) => localizeImportantDate(date, t))
}
