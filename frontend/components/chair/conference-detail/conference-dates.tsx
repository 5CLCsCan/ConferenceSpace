"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { getConferenceDates, getConferenceById, type ImportantDate } from "@/lib/api/conferences"
import { downloadICS } from "@/lib/utils/ics-calendar"
import { useTranslation } from "@/lib/i18n/translation-context"

interface ConferenceDatesProps {
  conferenceId: string
  className?: string
}

type PhaseStatus = "completed" | "in-progress" | "upcoming"

interface Phase {
  id: string
  name: string
  status: PhaseStatus
  period: string
  events: ImportantDate[]
}

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

const categories = [
  {
    id: "submission",
    name: "Submission Phase",
    pattern: /submission|abstract|paper/i,
  },
  {
    id: "review",
    name: "Review & Decision",
    pattern: /review|notification|rebuttal|acceptance/i,
  },
  {
    id: "event",
    name: "Camera Ready & Conference",
    pattern: /camera|conference|registration/i,
  },
]

function DateEventCard({ event, phaseStatus }: { event: ImportantDate; phaseStatus: PhaseStatus }) {
  const { t } = useTranslation()

  const eventDate = new Date(event.date)
  const month = eventDate.toLocaleString("en-US", { month: "short" })
  const day = eventDate.getDate()
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
      {isUpcoming && (
        <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-blue-50 dark:from-slate-800 to-transparent -mr-8 -mt-8 rounded-full pointer-events-none" />
      )}

      <div className="flex items-start gap-3 relative z-10">
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
        </div>

        <div className="text-right shrink-0 flex items-center gap-2">
          {isPassed && (
            <span className="inline-block px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-bold rounded uppercase">
              {t("runtime.components.chair.conference-detail.conference-dates.text_passed")}{" "}
            </span>
          )}
          {isUpcoming && (
            <span className="inline-block px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-[#1B3C53] dark:text-blue-200 text-[9px] font-bold rounded-full border border-blue-100 dark:border-blue-900/50 uppercase">
              {t("runtime.components.chair.conference-detail.conference-dates.text_upcoming")}{" "}
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

  return (
    <div
      className={cn(
        "relative pl-6 border-l-2",
        isCompleted && "border-slate-200 dark:border-slate-800",
        isInProgress && "border-[#1B3C53] dark:border-white",
        isUpcoming && "border-slate-200 dark:border-slate-800 border-dashed",
      )}
    >
      <span
        className={cn(
          "absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900",
          isCompleted && "bg-slate-300 dark:bg-slate-600",
          isInProgress && "bg-[#1B3C53] dark:bg-white ring-4 ring-blue-50 dark:ring-slate-700",
          isUpcoming && "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700",
        )}
      />

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
          {isCompleted && "Completed"}
          {isInProgress && "In Progress"}
          {isUpcoming && "Upcoming"}{" "}
          {t("runtime.components.chair.conference-detail.conference-dates.text_text")}{" "}
          {phase.period}
        </p>
      </div>

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
  const { t } = useTranslation()

  return (
    <div className="bg-[#1B3C53] dark:bg-slate-800 text-white rounded-lg p-4 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none" />

      <h3 className="text-[10px] font-medium text-slate-300 uppercase tracking-wider mb-1.5">
        {t(
          "runtime.components.chair.conference-detail.conference-dates.text_next_major_deadline",
        )}{" "}
      </h3>
      <div className="text-3xl font-bold mb-0.5">
        {daysUntil} <span className="text-sm font-normal text-slate-400">days</span>
      </div>
      <p className="text-sm font-normal text-white mb-4">
        {t("runtime.components.chair.conference-detail.conference-dates.text_until")}{" "}
        {nextDeadline.title}
      </p>

      <div className="space-y-2 pt-3 border-t border-white/10">
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-300 font-light">
            {t("runtime.components.chair.conference-detail.conference-dates.text_target_date")}
          </span>
          <span className="font-light">
            {new Date(nextDeadline.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-300 font-light">
            {t("runtime.components.chair.conference-detail.conference-dates.text_timezone")}
          </span>
          <span className="font-light">
            {t("runtime.components.chair.conference-detail.conference-dates.text_aoe_utc_12")}
          </span>
        </div>
      </div>
    </div>
  )
}

function SettingsCard() {
  const { t } = useTranslation()

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-4">
      <h3 className="font-bold text-[#1B3C53] dark:text-white mb-3 flex items-center gap-2 text-sm tracking-tight">
        <span className="material-symbols-outlined text-slate-400" style={iconStyle}>
          tune
        </span>
        {t("runtime.components.chair.conference-detail.conference-dates.text_settings")}{" "}
      </h3>
      <form className="space-y-3">
        <div>
          <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">
            {t(
              "runtime.components.chair.conference-detail.conference-dates.text_conference_timezone",
            )}{" "}
          </label>
          <select
            disabled
            className="w-full text-[11px] border border-[#E3E3E3] dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-md py-1.5 px-2 disabled:opacity-70"
          >
            <option>
              {t(
                "runtime.components.chair.conference-detail.conference-dates.text_anywhere_on_earth_aoe",
              )}
            </option>
          </select>
        </div>
        <div>
          <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">
            {t("runtime.components.chair.conference-detail.conference-dates.text_date_format")}{" "}
          </label>
          <select
            disabled
            className="w-full text-[11px] border border-[#E3E3E3] dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-md py-1.5 px-2 disabled:opacity-70"
          >
            <option>
              {t("runtime.components.chair.conference-detail.conference-dates.text_mmm_d_yyyy")}
            </option>
          </select>
        </div>
      </form>
    </div>
  )
}

function InternalDeadlinesCard({ dates }: { dates: ImportantDate[] }) {
  const { t } = useTranslation()

  const upcomingDates = dates.filter((date) => !date.isPast).slice(0, 2)

  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
      <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2.5 text-[13px] tracking-tight">
        {t(
          "runtime.components.chair.conference-detail.conference-dates.text_internal_deadlines",
        )}{" "}
      </h3>
      <ul className="space-y-2">
        {upcomingDates.length > 0 ? (
          upcomingDates.map((deadline) => (
            <li key={deadline.id} className="flex items-start gap-2 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
              <span className="text-slate-600 dark:text-slate-400">
                <span className="font-medium text-[#1B3C53] dark:text-white">
                  {new Date(deadline.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  :
                </span>{" "}
                {deadline.title}
              </span>
            </li>
          ))
        ) : (
          <li className="text-[11px] text-slate-500 dark:text-slate-400">
            {t(
              "runtime.components.chair.conference-detail.conference-dates.text_no_upcoming_dates",
            )}
          </li>
        )}
      </ul>
      <button
        type="button"
        className="mt-3 w-full py-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md"
      >
        {t(
          "runtime.components.chair.conference-detail.conference-dates.text_manage_internal_schedule",
        )}{" "}
      </button>
    </div>
  )
}

export function ConferenceDates({ conferenceId, className }: ConferenceDatesProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dates, setDates] = useState<ImportantDate[]>([])
  const [conferenceAcronym, setConferenceAcronym] = useState("")
  const [conferenceName, setConferenceName] = useState("")

  useEffect(() => {
    async function loadDates() {
      setLoading(true)
      setError(null)
      const [datesResponse, confResponse] = await Promise.all([
        getConferenceDates(conferenceId),
        getConferenceById(conferenceId),
      ])

      if (datesResponse.error || !datesResponse.data) {
        setError(datesResponse.error || "Failed to load dates")
        setLoading(false)
        return
      }

      setDates(datesResponse.data)
      if (confResponse.data) {
        setConferenceAcronym(confResponse.data.acronym || "")
        setConferenceName(confResponse.data.name || "")
      }
      setLoading(false)
    }

    void loadDates()
  }, [conferenceId])

  const phases = useMemo<Phase[]>(() => {
    return categories
      .map((category) => {
        const events = dates.filter((date) => category.pattern.test(date.title))
        const allPast = events.length > 0 && events.every((event) => event.isPast)
        const someFuture = events.some((event) => !event.isPast)
        const somePast = events.some((event) => event.isPast)

        let status: PhaseStatus = "upcoming"
        if (allPast) status = "completed"
        else if (someFuture || somePast) status = "in-progress"

        const sortedDates = [...events].sort(
          (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
        )
        const period =
          sortedDates.length > 0
            ? `${new Date(sortedDates[0].date).toLocaleString("en-US", {
                month: "short",
              })} - ${new Date(sortedDates[sortedDates.length - 1].date).toLocaleString("en-US", {
                month: "short",
                year: "numeric",
              })}`
            : ""

        return {
          id: category.id,
          name: category.name,
          status,
          period,
          events,
        }
      })
      .filter((phase) => phase.events.length > 0)
  }, [dates])

  const nextDeadline = useMemo(() => dates.find((date) => !date.isPast) || null, [dates])
  const daysUntil = useMemo(() => {
    if (!nextDeadline) return null
    const now = new Date()
    return Math.ceil(
      (new Date(nextDeadline.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    )
  }, [nextDeadline])

  if (loading) {
    return (
      <div className="text-xs text-slate-500">
        {t("runtime.components.chair.conference-detail.conference-dates.text_loading_timeline")}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#1B3C53] tracking-tight">
            {t(
              "runtime.components.chair.conference-detail.conference-dates.text_conference_timeline",
            )}{" "}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t(
              "runtime.components.chair.conference-detail.conference-dates.text_track_key_deadlines",
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              downloadICS(dates, conferenceAcronym || "CONF", conferenceName || "Conference")
            }
            disabled={dates.length === 0}
            className="px-3 py-2 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined" style={iconStyle}>
              calendar_add_on
            </span>
            {t(
              "runtime.components.chair.conference-detail.conference-dates.text_sync_to_calendar",
            )}{" "}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-0">
          {phases.length > 0 ? (
            phases.map((phase) => <TimelinePhase key={phase.id} phase={phase} />)
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-xs text-slate-500 shadow-sm">
              {t(
                "runtime.components.chair.conference-detail.conference-dates.text_no_schedule_dates_configured",
              )}{" "}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {nextDeadline && daysUntil !== null && daysUntil >= 0 && (
            <NextDeadlineCard nextDeadline={nextDeadline} daysUntil={daysUntil} />
          )}
          <SettingsCard />
          <InternalDeadlinesCard dates={dates} />
        </div>
      </div>
    </div>
  )
}
