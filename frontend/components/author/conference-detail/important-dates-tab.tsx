"use client"

import { cn } from "@/lib/utils"
import type { DatesTabProps, ImportantDate } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { getNextMajorDeadline } from "@/lib/conference-timeline"
import {
  CONFERENCE_START_DATE_ID,
  getDateLocale,
  localizeImportantDate,
  localizeImportantDates,
  phaseNameKey,
  phaseStatusKey,
  PHASE_EVENT_IDS,
} from "@/lib/important-date-i18n"
import { downloadICS } from "@/lib/utils/ics-calendar"

// Consistent icon styling for 16px material symbols
const iconStyle = {
  fontSize: "16px",
  width: "16px",
  height: "16px",
  maxWidth: "16px",
  maxHeight: "16px",
  minWidth: "16px",
  minHeight: "16px",
  lineHeight: "1",
  display: "flex" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  flexShrink: 0,
  transform: "none",
  boxSizing: "border-box" as const,
}

type PhaseStatus = "completed" | "in-progress" | "upcoming"

interface Phase {
  id: string
  name: string
  status: PhaseStatus
  period: string
  events: ImportantDate[]
}

function buildTimelinePhases(
  dates: ImportantDate[],
  dateLocale: string,
  t: (key: string) => string,
): Phase[] {
  const conferenceStart = dates.find((d) => d.id === CONFERENCE_START_DATE_ID)
  const groupedDates = dates.filter((d) => d.id !== CONFERENCE_START_DATE_ID)

  const phases = Object.keys(PHASE_EVENT_IDS)
    .map((categoryId) => {
      const categoryEventIds = new Set(PHASE_EVENT_IDS[categoryId])
      const events = groupedDates
        .filter((d) => categoryEventIds.has(d.id))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      const allPast = events.length > 0 && events.every((e) => e.isPast)
      const inProgress = events.some((e) => !e.isPast) && events.some((e) => e.isPast)

      let status: PhaseStatus = "upcoming"
      if (allPast) status = "completed"
      else if (inProgress || events.some((e) => !e.isPast)) status = "in-progress"

      const eventDates = events.map((e) => new Date(e.date))
      const sortedDates = eventDates.sort((a, b) => a.getTime() - b.getTime())
      const period =
        sortedDates.length > 0
          ? `${sortedDates[0].toLocaleString(dateLocale, { month: "short" })} ${sortedDates[sortedDates.length - 1].getFullYear()}`
          : ""

      return {
        id: categoryId,
        name: t(phaseNameKey(categoryId)),
        status,
        period,
        events,
      }
    })
    .filter((p) => p.events.length > 0)

  if (!conferenceStart) {
    return phases
  }

  const startDate = new Date(conferenceStart.date)
  const startPhase: Phase = {
    id: "conference-start",
    name: t(phaseNameKey("conference")),
    status: conferenceStart.isPast ? "completed" : "in-progress",
    period: startDate.toLocaleString(dateLocale, { month: "short", year: "numeric" }),
    events: [conferenceStart],
  }

  return [startPhase, ...phases]
}

function DateEventCard({ event, phaseStatus }: { event: ImportantDate; phaseStatus: PhaseStatus }) {
  const { t, locale } = useTranslation()
  const dateLocale = getDateLocale(locale)
  const d = new Date(event.date)
  const month = d.toLocaleString(dateLocale, { month: "short" })
  const day = d.getDate()
  const isPassed = event.isPast
  const isUpcoming = !event.isPast && phaseStatus === "in-progress"

  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 border rounded-lg transition-all group",
        isUpcoming
          ? "border-2 border-slate-200 dark:border-slate-700 shadow-md p-4 relative overflow-hidden"
          : "border-slate-200 dark:border-slate-800 p-3",
        isPassed && "opacity-60 hover:opacity-100",
        phaseStatus === "upcoming" && "border-dashed hover:border-solid hover:border-slate-300",
      )}
    >
      {/* Gradient overlay for highlighted event */}
      {isUpcoming && (
        <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-blue-50 dark:from-slate-800 to-transparent -mr-8 -mt-8 rounded-full pointer-events-none" />
      )}

      <div className="flex items-start gap-3 relative z-10">
        {/* Date Box */}
        <div
          className={cn(
            "rounded-md w-12 h-12 flex flex-col items-center justify-center shrink-0",
            isUpcoming
              ? "bg-[#1B3C53] dark:bg-blue-600 text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-800",
          )}
        >
          <span
            className={cn(
              "text-[8px] uppercase font-bold",
              isUpcoming ? "opacity-80" : "text-slate-500",
            )}
          >
            {month}
          </span>
          <span
            className={cn(
              "text-sm font-bold",
              isUpcoming ? "" : "text-slate-700 dark:text-slate-300",
            )}
          >
            {day}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h4
              className={cn(
                "font-bold tracking-tight",
                isUpcoming
                  ? "text-sm text-[#1B3C53] dark:text-white"
                  : "text-[13px] text-[#1B3C53] dark:text-white",
              )}
            >
              {event.title}
            </h4>
            {isUpcoming && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
          </div>
          <p
            className={cn(
              "text-[11px]",
              isUpcoming
                ? "text-slate-600 dark:text-slate-300"
                : "text-slate-500 dark:text-slate-400",
            )}
          >
            {event.description}
          </p>

          {/* Time for highlighted event */}
          {isUpcoming && (
            <div className="flex items-center gap-3 mt-2">
              <span className="inline-flex items-center text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded gap-1">
                <span
                  className="material-symbols-outlined"
                  style={{ ...iconStyle, fontSize: "12px", width: "12px", height: "12px" }}
                >
                  schedule
                </span>
                {t(
                  "runtime.components.author.conference-detail.important-dates-tab.text_23_59_aoe",
                )}{" "}
              </span>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="text-right shrink-0 flex items-center gap-2">
          {isPassed && (
            <span className="inline-block px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-bold rounded uppercase">
              {t(
                "runtime.components.author.conference-detail.important-dates-tab.text_passed",
              )}{" "}
            </span>
          )}
          {isUpcoming && (
            <span className="inline-block px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-[#1B3C53] dark:text-blue-200 text-[9px] font-bold rounded-full border border-blue-100 dark:border-blue-900/50 uppercase">
              {t(
                "runtime.components.author.conference-detail.important-dates-tab.text_upcoming",
              )}{" "}
            </span>
          )}
          {!isPassed && !isUpcoming && phaseStatus !== "completed" && (
            <span className="inline-block px-1.5 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[9px] font-bold rounded uppercase">
              {t("runtime.components.author.conference-detail.important-dates-tab.text_open")}{" "}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function TimelinePhase({ phase }: { phase: Phase }) {
  const { t } = useTranslation()
  const isCompleted = phase.status === "completed"
  const isInProgress = phase.status === "in-progress"
  const isUpcoming = phase.status === "upcoming"
  const statusLabel = t(phaseStatusKey(phase.status))

  return (
    <div
      className={cn(
        "relative pl-6 border-l-2",
        isCompleted && "border-slate-200 dark:border-slate-800",
        isInProgress && "border-[#1B3C53] dark:border-white",
        isUpcoming && "border-slate-200 dark:border-slate-800 border-dashed",
      )}
    >
      {/* Timeline Dot */}
      <span
        className={cn(
          "absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900",
          isCompleted && "bg-slate-300 dark:bg-slate-600",
          isInProgress && "bg-[#1B3C53] dark:bg-white ring-4 ring-blue-50 dark:ring-slate-700",
          isUpcoming && "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700",
        )}
      />

      {/* Phase Header */}
      <div className="mb-4">
        <h3
          className={cn(
            "text-sm font-bold",
            isCompleted && "text-slate-400 dark:text-slate-500",
            isInProgress && "text-[#1B3C53] dark:text-white",
            isUpcoming && "text-slate-500 dark:text-slate-500",
          )}
        >
          {phase.name}
        </h3>
        <p
          className={cn(
            "text-[10px] uppercase tracking-wider font-medium mt-0.5",
            isCompleted && "text-slate-400 dark:text-slate-600",
            isInProgress && "text-blue-600 dark:text-blue-400 font-bold",
            isUpcoming && "text-slate-400 dark:text-slate-600",
          )}
        >
          {statusLabel}
          {phase.period && (
            <>
              {" "}
              {t("runtime.components.author.conference-detail.important-dates-tab.text_text")}{" "}
              {phase.period}
            </>
          )}
        </p>
      </div>

      {/* Events */}
      <div className="space-y-3 pb-8">
        {phase.events.map((event) => (
          <DateEventCard key={event.id} event={event} phaseStatus={phase.status} />
        ))}
      </div>
    </div>
  )
}

function NextDeadlineCard({
  nextDeadline,
  daysUntil,
}: {
  nextDeadline: ImportantDate
  daysUntil: number
}) {
  const { t, locale } = useTranslation()
  const dateLocale = getDateLocale(locale)
  const localizedDeadline = localizeImportantDate(nextDeadline, t)
  return (
    <div className="bg-[#1B3C53] dark:bg-slate-800 text-white rounded-lg p-4 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none" />

      <h3 className="text-[10px] font-medium text-slate-300 uppercase tracking-wider mb-1.5">
        {t(
          "runtime.components.author.conference-detail.important-dates-tab.text_next_major_deadline",
        )}{" "}
      </h3>
      <div className="text-3xl font-bold mb-0.5">
        {daysUntil}{" "}
        <span className="text-sm font-normal text-slate-400">
          {t("runtime.components.author.conference-detail.important-dates-tab.text_days")}
        </span>
      </div>
      <p className="text-sm font-normal text-white mb-4">
        {t("runtime.components.author.conference-detail.important-dates-tab.text_until")}{" "}
        {localizedDeadline.title}
      </p>

      <div className="space-y-2 pt-3 border-t border-white/10">
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-300 font-light">
            {t("runtime.components.author.conference-detail.important-dates-tab.text_target_date")}
          </span>
          <span className="font-light">
            {new Date(nextDeadline.date).toLocaleDateString(dateLocale, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-300 font-light">
            {t("runtime.components.author.conference-detail.important-dates-tab.text_timezone")}
          </span>
          <span className="font-light">
            {t("runtime.components.author.conference-detail.important-dates-tab.text_aoe_utc_12")}
          </span>
        </div>
      </div>
    </div>
  )
}

export function ImportantDatesTab({ dates, conferenceAcronym, conferenceName }: DatesTabProps) {
  const { t, locale } = useTranslation()
  const now = new Date()
  const dateLocale = getDateLocale(locale)
  const localizedDates = localizeImportantDates(dates, t)

  const phases = buildTimelinePhases(localizedDates, dateLocale, t)

  const nextDeadline = getNextMajorDeadline(dates, now)
  const daysUntil = nextDeadline
    ? Math.ceil((new Date(nextDeadline.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#1B3C53] dark:text-white tracking-tight">
            {t(
              "runtime.components.author.conference-detail.important-dates-tab.text_conference_timeline",
            )}{" "}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {t(
              "runtime.components.author.conference-detail.important-dates-tab.text_keep_track_of_important_deadlines_for",
            )}{" "}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (dates.length > 0) {
                downloadICS(dates, conferenceAcronym || "CONF", conferenceName || "Conference")
              }
            }}
            disabled={dates.length === 0}
            className="px-3 py-2 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined" style={iconStyle}>
              calendar_add_on
            </span>
            {t(
              "runtime.components.author.conference-detail.important-dates-tab.text_sync_to_calendar",
            )}{" "}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Timeline - Left Column */}
        <div className="lg:col-span-2 space-y-0">
          {phases.map((phase) => (
            <TimelinePhase key={phase.id} phase={phase} />
          ))}
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-4">
          {nextDeadline && daysUntil !== null && (
            <NextDeadlineCard nextDeadline={nextDeadline} daysUntil={daysUntil} />
          )}
        </div>
      </div>
    </div>
  )
}
