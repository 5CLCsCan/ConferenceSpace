/**
 * Schedule API - Aggregates conference deadlines across all user's conferences
 * into a unified calendar view. Data is derived from conference configurations.
 */

import { listConferences, type ImportantDate } from "@/lib/api/conferences"
import { tStatic } from "@/lib/i18n/static-translate"
import type { Conference, UserRole } from "@/lib/types"

export type EventType = "deadline" | "milestone" | "event"

export interface ScheduleEvent {
  id: string
  title: string
  conference: string
  conferenceAcronym: string
  conferenceId: string
  date: Date
  type: EventType
  description?: string
  isUrgent?: boolean
}

export interface ConferenceTimeline {
  id: string
  acronym: string
  name: string
  year: string
  status: string
  dates: ImportantDate[]
}

function scheduleText(key: string, values?: Record<string, string | number>) {
  return tStatic(`common.importantDates.${key}`, values)
}

/**
 * Extracts schedule events from a conference's configurations
 */
function extractEventsFromConference(conf: Conference): ScheduleEvent[] {
  const events: ScheduleEvent[] = []
  const config = conf.configurations
  if (!config) return events

  const now = new Date()

  const addEvent = (
    id: string,
    title: string,
    dateStr: string | undefined,
    type: EventType,
    description: string,
  ) => {
    if (!dateStr) return
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return

    const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    events.push({
      id: `${conf.id}-${id}`,
      title,
      conference: conf.name,
      conferenceAcronym: conf.acronym,
      conferenceId: conf.id,
      date,
      type,
      description,
      isUrgent: type === "deadline" && daysUntil >= 0 && daysUntil <= 3,
    })
  }

  addEvent(
    "abstract-deadline",
    scheduleText("abstractSubmissionDeadlineTitle"),
    config.abstract_submission_deadline,
    "deadline",
    scheduleText("abstractSubmissionDeadlineFor", { acronym: conf.acronym }),
  )

  addEvent(
    "paper-deadline",
    scheduleText("paperSubmissionDeadlineTitle"),
    config.full_paper_submission_deadline,
    "deadline",
    scheduleText("paperSubmissionDeadlineFor", { acronym: conf.acronym }),
  )

  addEvent(
    "camera-ready",
    scheduleText("cameraReadyDeadlineTitle"),
    config.camera_ready_deadline,
    "deadline",
    scheduleText("cameraReadyDeadlineFor", { acronym: conf.acronym }),
  )

  addEvent(
    "conf-start",
    scheduleText("conferenceBeginsTitle"),
    config.start_date,
    "event",
    scheduleText("conferenceBeginsDescription", { name: conf.name }),
  )

  addEvent(
    "conf-end",
    scheduleText("conferenceEndsTitle"),
    config.end_date,
    "event",
    scheduleText("conferenceEndsDescription", { name: conf.name }),
  )

  // Discussion period dates
  if (config.discussion_settings?.start_at) {
    addEvent(
      "discussion-start",
      scheduleText("discussionPeriodOpensTitle"),
      config.discussion_settings.start_at,
      "milestone",
      scheduleText("discussionPeriodOpensFor", { acronym: conf.acronym }),
    )
  }
  if (config.discussion_settings?.end_at) {
    addEvent(
      "discussion-end",
      scheduleText("discussionPeriodClosesTitle"),
      config.discussion_settings.end_at,
      "deadline",
      scheduleText("discussionPeriodClosesFor", { acronym: conf.acronym }),
    )
  }

  // Rebuttal period dates
  if (config.rebuttal_settings?.start_at) {
    addEvent(
      "rebuttal-start",
      scheduleText("rebuttalPeriodOpensTitle"),
      config.rebuttal_settings.start_at,
      "milestone",
      scheduleText("rebuttalPeriodOpensFor", { acronym: conf.acronym }),
    )
  }
  if (config.rebuttal_settings?.end_at) {
    addEvent(
      "rebuttal-end",
      scheduleText("rebuttalSubmissionDeadlineTitle"),
      config.rebuttal_settings.end_at,
      "deadline",
      scheduleText("rebuttalSubmissionDeadlineFor", { acronym: conf.acronym }),
    )
  }

  return events
}

/**
 * Fetches all schedule events for the current user based on their role
 */
export async function getMyScheduleEvents(
  role: Extract<UserRole, "author" | "reviewer" | "chair">,
): Promise<{ events: ScheduleEvent[]; conferences: ConferenceTimeline[]; error: string | null }> {
  const response = await listConferences({
    myConferences: true,
    role,
    limit: 100,
  })

  if (response.error || !response.data) {
    return { events: [], conferences: [], error: response.error || "Failed to fetch conferences" }
  }

  const allEvents: ScheduleEvent[] = []
  const timelines: ConferenceTimeline[] = []

  for (const conf of response.data.conferences) {
    const events = extractEventsFromConference(conf)
    allEvents.push(...events)

    const config = conf.configurations
    const dates: ImportantDate[] = []
    const now = new Date()

    const addDate = (
      id: string,
      title: string,
      dateStr: string | undefined,
      type: "deadline" | "notification" | "event",
      desc: string,
    ) => {
      if (!dateStr) return
      dates.push({
        id,
        title,
        date: dateStr,
        description: desc,
        type,
        isPast: new Date(dateStr) < now,
      })
    }

    if (config) {
      addDate(
        "abstract",
        scheduleText("abstractSubmissionTitle"),
        config.abstract_submission_deadline,
        "deadline",
        scheduleText("abstractSubmissionDeadlineDescription"),
      )
      addDate(
        "paper",
        scheduleText("paperSubmissionTitle"),
        config.full_paper_submission_deadline,
        "deadline",
        scheduleText("paperSubmissionDeadlineForTimeline"),
      )
      addDate(
        "camera",
        scheduleText("cameraReadyTitle"),
        config.camera_ready_deadline,
        "deadline",
        scheduleText("cameraReadyDeadlineDescription"),
      )
      addDate(
        "start",
        scheduleText("conferenceStartTitle"),
        config.start_date,
        "event",
        scheduleText("conferenceBeginsTitle"),
      )
      addDate(
        "end",
        scheduleText("conferenceEndTitle"),
        config.end_date,
        "event",
        scheduleText("conferenceEndsTitle"),
      )
    }

    dates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    timelines.push({
      id: conf.id,
      acronym: conf.acronym,
      name: conf.name,
      year: String(conf.year),
      status: conf.status,
      dates,
    })
  }

  allEvents.sort((a, b) => a.date.getTime() - b.date.getTime())

  return { events: allEvents, conferences: timelines, error: null }
}
