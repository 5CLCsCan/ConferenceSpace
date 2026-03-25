"use client"

import { useState, useEffect, useMemo } from "react"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { cva } from "class-variance-authority"
import {
  getMyScheduleEvents,
  type ScheduleEvent,
  type ConferenceTimeline,
  type EventType,
} from "@/lib/api/schedules"
import { downloadAllSchedulesICS } from "@/lib/utils/ics-calendar"
import type { UserRole } from "@/lib/types"

// ============================================================================
// VARIANTS
// ============================================================================

const eventTypeVariants = cva(
  "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider",
  {
    variants: {
      type: {
        deadline: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        milestone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        event: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      },
    },
  },
)

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const isSameDay = (d1: Date, d2: Date) =>
  d1.getDate() === d2.getDate() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getFullYear() === d2.getFullYear()

const getDaysUntil = (date: Date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

const formatCountdown = (days: number) => {
  if (days < 0) return "Passed"
  if (days === 0) return "Today"
  if (days === 1) return "Tomorrow"
  if (days < 7) return `${days} days`
  if (days < 30) return `${Math.floor(days / 7)} weeks`
  return `${Math.floor(days / 30)} months`
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function QuickStatCard({
  label,
  value,
  sublabel,
  urgent,
}: {
  label: string
  value: string | number
  sublabel?: string
  urgent?: boolean
}) {
  return (
    <div className="bg-white dark:bg-slate-900 px-4 pt-3 pb-2.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p
            className={cn(
              "text-xl font-bold mt-0.5",
              urgent ? "text-red-600 dark:text-red-400" : "text-[#1B3C53] dark:text-white",
            )}
          >
            {value}
          </p>
          {sublabel && <p className="text-[10px] font-medium text-slate-400 mt-0.5">{sublabel}</p>}
        </div>
      </div>
    </div>
  )
}

function EventCard({ event, compact = false }: { event: ScheduleEvent; compact?: boolean }) {
  const daysUntil = getDaysUntil(event.date)
  const isToday = daysUntil === 0
  const isPast = daysUntil < 0

  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700",
        compact ? "px-3 py-2" : "px-4 py-3",
        !isPast && "hover:bg-slate-50 dark:hover:bg-slate-700/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={eventTypeVariants({ type: event.type })}>{event.type}</span>
            <span className="text-[10px] font-medium text-slate-400">
              {event.conferenceAcronym}
            </span>
            {event.isUrgent && (
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <h4
            className={cn(
              "font-medium text-[#1B3C53] dark:text-white leading-tight",
              compact ? "text-[11px]" : "text-xs",
            )}
          >
            {event.title}
          </h4>
          {!compact && event.description && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
              {event.description}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <span
            className={cn(
              "text-xs font-bold block font-mono",
              isToday && event.type === "deadline"
                ? "text-red-600 dark:text-red-400"
                : isPast
                  ? "text-slate-400"
                  : "text-[#1B3C53] dark:text-white",
            )}
          >
            {event.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          {!compact && (
            <span
              className={cn(
                "text-[10px] font-medium block mt-0.5",
                isToday && event.type === "deadline" ? "text-red-500" : "text-slate-400",
              )}
            >
              {formatCountdown(daysUntil)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function AgendaPanel({
  selectedDate,
  events,
  upcomingDeadlines,
}: {
  selectedDate: Date
  events: ScheduleEvent[]
  upcomingDeadlines: ScheduleEvent[]
}) {
  const selectedEvents = events.filter((e) => isSameDay(e.date, selectedDate))

  return (
    <div className="space-y-4">
      {/* Selected Date Events */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </h3>
          <p className="text-[10px] text-slate-400">
            {selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="p-3">
          {selectedEvents.length > 0 ? (
            <div className="space-y-2">
              {selectedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <span
                className="material-symbols-outlined text-slate-300 dark:text-slate-600 mb-2"
                style={{ fontSize: "32px" }}
              >
                event_available
              </span>
              <p className="text-xs text-slate-400">No events scheduled</p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
            Upcoming Deadlines
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">Next 7 days</span>
        </div>
        <div className="p-3 space-y-2">
          {upcomingDeadlines.length > 0 ? (
            upcomingDeadlines.map((event) => <EventCard key={event.id} event={event} compact />)
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">
              No deadlines in the next 7 days
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function TimelineView({ events }: { events: ScheduleEvent[] }) {
  const sortedEvents = [...events]
    .filter((e) => getDaysUntil(e.date) >= -7)
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const groupedByDate = sortedEvents.reduce(
    (acc, event) => {
      const dateKey = event.date.toDateString()
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(event)
      return acc
    },
    {} as Record<string, ScheduleEvent[]>,
  )

  const dateGroups = Object.entries(groupedByDate)

  if (dateGroups.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <span
          className="material-symbols-outlined text-slate-300 dark:text-slate-600 mb-3 block"
          style={{ fontSize: "48px" }}
        >
          event_busy
        </span>
        <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming events found</p>
        <p className="text-xs text-slate-400 mt-1">
          Events will appear here when conferences have deadlines configured
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
          Event Timeline
        </h3>
        <p className="text-[10px] text-slate-400 mt-0.5">{sortedEvents.length} upcoming events</p>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {dateGroups.map(([dateKey, dayEvents]) => {
          const date = new Date(dateKey)
          const daysUntil = getDaysUntil(date)
          const isToday = daysUntil === 0
          const isPast = daysUntil < 0

          return (
            <div key={dateKey} className="flex">
              {/* Date Column */}
              <div
                className={cn(
                  "w-20 shrink-0 px-4 py-4 border-r border-slate-100 dark:border-slate-800",
                  isToday && "bg-[#1B3C53]/5 dark:bg-slate-800",
                )}
              >
                <div
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    isToday
                      ? "text-[#1B3C53] dark:text-white"
                      : isPast
                        ? "text-slate-300 dark:text-slate-600"
                        : "text-slate-400",
                  )}
                >
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div
                  className={cn(
                    "text-xl font-bold font-mono",
                    isToday
                      ? "text-[#1B3C53] dark:text-white"
                      : isPast
                        ? "text-slate-300 dark:text-slate-600"
                        : "text-[#1B3C53] dark:text-white",
                  )}
                >
                  {date.getDate()}
                </div>
                <div
                  className={cn(
                    "text-[10px] font-medium",
                    isPast ? "text-slate-300 dark:text-slate-600" : "text-slate-400",
                  )}
                >
                  {date.toLocaleDateString("en-US", { month: "short" })}
                </div>
              </div>

              {/* Events Column */}
              <div className="flex-1 p-3 space-y-2">
                {dayEvents.map((event) => (
                  <EventCard key={event.id} event={event} compact />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SchedulesPageContentProps {
  role: Extract<UserRole, "author" | "reviewer" | "chair">
}

export function SchedulesPageContent({ role }: SchedulesPageContentProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<"calendar" | "timeline">("calendar")
  const [selectedConference, setSelectedConference] = useState<string>("all")
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [conferences, setConferences] = useState<ConferenceTimeline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSchedules() {
      setLoading(true)
      setError(null)
      const result = await getMyScheduleEvents(role)
      if (result.error) {
        setError(result.error)
      }
      setEvents(result.events)
      setConferences(result.conferences)
      setLoading(false)
    }
    void fetchSchedules()
  }, [role])

  // Filter events by conference
  const filteredEvents = useMemo(() => {
    if (selectedConference === "all") return events
    return events.filter((e) => e.conferenceAcronym === selectedConference)
  }, [selectedConference, events])

  // Calculate upcoming deadlines (next 7 days)
  const upcomingDeadlines = useMemo(() => {
    return filteredEvents
      .filter(
        (e) => e.type === "deadline" && getDaysUntil(e.date) >= 0 && getDaysUntil(e.date) <= 7,
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [filteredEvents])

  // Find next deadline
  const nextDeadline = useMemo(() => {
    return filteredEvents
      .filter((e) => e.type === "deadline" && getDaysUntil(e.date) >= 0)
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0]
  }, [filteredEvents])

  // Get dates with events for calendar indicators
  const eventDates = useMemo(() => {
    const dateMap = new Map<string, EventType[]>()
    filteredEvents.forEach((event) => {
      const key = event.date.toDateString()
      if (!dateMap.has(key)) {
        dateMap.set(key, [])
      }
      dateMap.get(key)!.push(event.type)
    })
    return dateMap
  }, [filteredEvents])

  const conferenceOptions = ["all", ...new Set(events.map((e) => e.conferenceAcronym))]

  const handleExportAll = () => {
    const exportEvents = filteredEvents.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date.toISOString(),
      description: e.description || e.title,
      type: e.type === "milestone" ? ("event" as const) : e.type,
      conferenceAcronym: e.conferenceAcronym,
    }))
    downloadAllSchedulesICS(exportEvents)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-slate-400">Loading schedules...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load schedules: {error}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#1B3C53] dark:text-white leading-[1.1]">
            Schedules
          </h1>
          <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Conference deadlines, milestones, and events at a glance
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Export Button */}
          {filteredEvents.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleExportAll}
                  className="h-8 px-3 text-[11px] font-medium rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B3C53] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    calendar_add_on
                  </span>
                  Export .ics
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={8}
                className="border-0 rounded-xl text-[10px] text-slate-500 dark:text-slate-300"
              >
                Download calendar file for import
              </TooltipContent>
            </Tooltip>
          )}

          {/* Conference Filter */}
          {conferenceOptions.length > 2 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <select
                  value={selectedConference}
                  onChange={(e) => setSelectedConference(e.target.value)}
                  className="h-8 px-3 text-[11px] font-medium rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B3C53] dark:text-white focus:ring-1 focus:ring-[#1B3C53] cursor-pointer"
                >
                  {conferenceOptions.map((conf) => (
                    <option key={conf} value={conf}>
                      {conf === "all" ? "All Conferences" : conf}
                    </option>
                  ))}
                </select>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={8}
                className="border-0 rounded-xl text-[10px] text-slate-500 dark:text-slate-300"
              >
                Filter events by conference
              </TooltipContent>
            </Tooltip>
          )}

          {/* View Toggle */}
          <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg flex gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={cn(
                    "w-8 h-8 rounded flex items-center justify-center transition-all",
                    viewMode === "calendar"
                      ? "bg-white dark:bg-slate-700 shadow-sm text-[#1B3C53] dark:text-white"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                  )}
                  aria-label="Switch to calendar view"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    calendar_month
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={8}
                className="border-0 rounded-xl text-[10px] text-slate-500 dark:text-slate-300"
              >
                Calendar view
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setViewMode("timeline")}
                  className={cn(
                    "w-8 h-8 rounded flex items-center justify-center transition-all",
                    viewMode === "timeline"
                      ? "bg-white dark:bg-slate-700 shadow-sm text-[#1B3C53] dark:text-white"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                  )}
                  aria-label="Switch to timeline view"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    view_timeline
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={8}
                className="border-0 rounded-xl text-[10px] text-slate-500 dark:text-slate-300"
              >
                Timeline view
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <QuickStatCard
          label="Next Deadline"
          value={nextDeadline ? formatCountdown(getDaysUntil(nextDeadline.date)) : "None"}
          sublabel={nextDeadline?.title}
          urgent={!!nextDeadline && getDaysUntil(nextDeadline.date) <= 3}
        />
        <QuickStatCard
          label="Active Conferences"
          value={conferences.length}
          sublabel="Currently tracking"
        />
        <QuickStatCard
          label="Upcoming Events"
          value={
            filteredEvents.filter((e) => getDaysUntil(e.date) >= 0 && getDaysUntil(e.date) <= 30)
              .length
          }
          sublabel="Next 30 days"
        />
        <QuickStatCard
          label="Deadlines This Week"
          value={upcomingDeadlines.length}
          sublabel={
            upcomingDeadlines.length > 0
              ? `Next: ${upcomingDeadlines[0]?.conferenceAcronym}`
              : "All clear"
          }
          urgent={upcomingDeadlines.length > 2}
        />
      </div>

      {/* Empty State */}
      {events.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <span
            className="material-symbols-outlined text-slate-300 dark:text-slate-600 mb-3 block"
            style={{ fontSize: "48px" }}
          >
            calendar_month
          </span>
          <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white mb-1">
            No schedules yet
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {role === "chair"
              ? "Create a conference and configure deadlines to see your schedule here."
              : "Join a conference to see important deadlines and events here."}
          </p>
        </div>
      ) : viewMode === "calendar" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="w-full [--cell-size:clamp(3.1rem,6.5vw,5rem)]"
                classNames={{
                  today:
                    "text-amber-500 font-semibold rounded-md data-[selected=true]:rounded-none dark:text-amber-300",
                }}
                components={{
                  DayButton: ({ day, modifiers, className, ...props }) => {
                    const types = eventDates.get(day.date.toDateString())
                    const hasEvents = types && types.length > 0

                    return (
                      <CalendarDayButton
                        day={day}
                        modifiers={modifiers}
                        className={cn(
                          className,
                          "relative mx-0 w-full min-w-0 max-w-none h-[calc(var(--cell-size)*1.05)]",
                          modifiers.selected &&
                            "bg-[#1B3C53] text-white hover:bg-[#1B3C53] hover:text-white",
                        )}
                        {...props}
                      >
                        <span>{day.date.getDate()}</span>
                        {hasEvents && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                            {types.includes("deadline") && (
                              <span className="w-1 h-1 rounded-full bg-red-500" />
                            )}
                            {types.includes("event") && (
                              <span className="w-1 h-1 rounded-full bg-blue-500" />
                            )}
                            {types.includes("milestone") && (
                              <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            )}
                          </div>
                        )}
                      </CalendarDayButton>
                    )
                  },
                }}
              />

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-0 pt-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[10px] font-medium text-slate-500">Deadline</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-medium text-slate-500">Event</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-medium text-slate-500">Milestone</span>
                </div>
              </div>
            </div>
          </div>

          {/* Agenda Sidebar */}
          <div>
            <AgendaPanel
              selectedDate={selectedDate}
              events={filteredEvents}
              upcomingDeadlines={upcomingDeadlines}
            />
          </div>
        </div>
      ) : (
        <TimelineView events={filteredEvents} />
      )}
    </div>
  )
}
