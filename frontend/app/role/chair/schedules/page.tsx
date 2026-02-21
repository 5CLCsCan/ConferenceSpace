"use client"

import { useState, useMemo } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useNotifications } from "@/hooks/use-notifications"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { cva } from "class-variance-authority"
import { getSidebarMenuItems } from "@/lib/navigation"

// ============================================================================
// TYPES
// ============================================================================

type EventType = "deadline" | "meeting" | "milestone" | "reminder"
type ConferencePhase =
  | "planning"
  | "submission"
  | "review"
  | "rebuttal"
  | "decision"
  | "camera_ready"
  | "completed"

interface ScheduleEvent {
  id: string
  title: string
  conference: string
  conferenceAcronym: string
  date: Date
  time: string
  type: EventType
  description?: string
  isUrgent?: boolean
}

interface ConferenceTimeline {
  id: string
  acronym: string
  name: string
  year: string
  currentPhase: ConferencePhase
  phases: {
    phase: ConferencePhase
    label: string
    startDate: Date
    endDate: Date
    isCurrent?: boolean
  }[]
}

// ============================================================================
// MOCK DATA
// ============================================================================

const currentDate = new Date()
const getDate = (daysOffset: number) => {
  const d = new Date(currentDate)
  d.setDate(d.getDate() + daysOffset)
  return d
}

const MOCK_EVENTS: ScheduleEvent[] = [
  // Today
  {
    id: "1",
    title: "Abstract Submission Deadline",
    conference: "AAAI Conference on Artificial Intelligence",
    conferenceAcronym: "AAAI",
    date: getDate(0),
    time: "23:59",
    type: "deadline",
    description: "Final deadline for abstract submissions",
    isUrgent: true,
  },
  {
    id: "2",
    title: "PC Meeting",
    conference: "AAAI Conference on Artificial Intelligence",
    conferenceAcronym: "AAAI",
    date: getDate(0),
    time: "14:00",
    type: "meeting",
    description: "Program committee sync call",
  },
  // Tomorrow
  {
    id: "3",
    title: "Review Assignment Opens",
    conference: "Computer Vision and Pattern Recognition",
    conferenceAcronym: "CVPR",
    date: getDate(1),
    time: "09:00",
    type: "milestone",
    description: "Bidding phase begins for reviewers",
  },
  // In 3 days
  {
    id: "4",
    title: "Full Paper Deadline",
    conference: "AAAI Conference on Artificial Intelligence",
    conferenceAcronym: "AAAI",
    date: getDate(3),
    time: "23:59",
    type: "deadline",
    isUrgent: true,
  },
  {
    id: "5",
    title: "Area Chair Briefing",
    conference: "AAAI Conference on Artificial Intelligence",
    conferenceAcronym: "AAAI",
    date: getDate(3),
    time: "10:00",
    type: "meeting",
  },
  // In 5 days
  {
    id: "6",
    title: "Reviewer Bidding Deadline",
    conference: "Computer Vision and Pattern Recognition",
    conferenceAcronym: "CVPR",
    date: getDate(5),
    time: "23:59",
    type: "deadline",
  },
  // In 7 days
  {
    id: "7",
    title: "Review Period Begins",
    conference: "AAAI Conference on Artificial Intelligence",
    conferenceAcronym: "AAAI",
    date: getDate(7),
    time: "00:00",
    type: "milestone",
  },
  // In 10 days
  {
    id: "8",
    title: "Meta-Review Deadline",
    conference: "Neural Information Processing Systems",
    conferenceAcronym: "NeurIPS",
    date: getDate(10),
    time: "23:59",
    type: "deadline",
  },
  // In 14 days
  {
    id: "9",
    title: "Author Notification",
    conference: "Neural Information Processing Systems",
    conferenceAcronym: "NeurIPS",
    date: getDate(14),
    time: "09:00",
    type: "milestone",
  },
  // In 21 days
  {
    id: "10",
    title: "Rebuttal Period Opens",
    conference: "AAAI Conference on Artificial Intelligence",
    conferenceAcronym: "AAAI",
    date: getDate(21),
    time: "00:00",
    type: "milestone",
  },
  // In 28 days
  {
    id: "11",
    title: "Camera Ready Deadline",
    conference: "Neural Information Processing Systems",
    conferenceAcronym: "NeurIPS",
    date: getDate(28),
    time: "23:59",
    type: "deadline",
  },
  // Past events
  {
    id: "12",
    title: "Submission Portal Opened",
    conference: "AAAI Conference on Artificial Intelligence",
    conferenceAcronym: "AAAI",
    date: getDate(-14),
    time: "00:00",
    type: "milestone",
  },
  {
    id: "13",
    title: "Call for Papers Released",
    conference: "Computer Vision and Pattern Recognition",
    conferenceAcronym: "CVPR",
    date: getDate(-30),
    time: "09:00",
    type: "milestone",
  },
]

const MOCK_CONFERENCES: ConferenceTimeline[] = [
  {
    id: "1",
    acronym: "AAAI",
    name: "AAAI Conference on Artificial Intelligence",
    year: "2025",
    currentPhase: "submission",
    phases: [
      { phase: "planning", label: "Planning", startDate: getDate(-60), endDate: getDate(-30) },
      {
        phase: "submission",
        label: "Submission",
        startDate: getDate(-30),
        endDate: getDate(7),
        isCurrent: true,
      },
      { phase: "review", label: "Review", startDate: getDate(7), endDate: getDate(35) },
      { phase: "rebuttal", label: "Rebuttal", startDate: getDate(35), endDate: getDate(42) },
      { phase: "decision", label: "Decision", startDate: getDate(42), endDate: getDate(56) },
      {
        phase: "camera_ready",
        label: "Camera Ready",
        startDate: getDate(56),
        endDate: getDate(70),
      },
    ],
  },
  {
    id: "2",
    acronym: "CVPR",
    name: "Computer Vision and Pattern Recognition",
    year: "2025",
    currentPhase: "planning",
    phases: [
      {
        phase: "planning",
        label: "Planning",
        startDate: getDate(-45),
        endDate: getDate(5),
        isCurrent: true,
      },
      { phase: "submission", label: "Submission", startDate: getDate(5), endDate: getDate(45) },
      { phase: "review", label: "Review", startDate: getDate(45), endDate: getDate(90) },
      { phase: "decision", label: "Decision", startDate: getDate(90), endDate: getDate(105) },
    ],
  },
  {
    id: "3",
    acronym: "NeurIPS",
    name: "Neural Information Processing Systems",
    year: "2024",
    currentPhase: "decision",
    phases: [
      { phase: "planning", label: "Planning", startDate: getDate(-180), endDate: getDate(-150) },
      { phase: "submission", label: "Submission", startDate: getDate(-150), endDate: getDate(-90) },
      { phase: "review", label: "Review", startDate: getDate(-90), endDate: getDate(-30) },
      { phase: "rebuttal", label: "Rebuttal", startDate: getDate(-30), endDate: getDate(-14) },
      {
        phase: "decision",
        label: "Decision",
        startDate: getDate(-14),
        endDate: getDate(14),
        isCurrent: true,
      },
      {
        phase: "camera_ready",
        label: "Camera Ready",
        startDate: getDate(14),
        endDate: getDate(35),
      },
    ],
  },
]

// ============================================================================
// VARIANTS
// ============================================================================

const eventTypeVariants = cva(
  "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider",
  {
    variants: {
      type: {
        deadline: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        meeting: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        milestone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        reminder: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      },
    },
  },
)

const phaseVariants = cva("h-1.5 rounded-full transition-all", {
  variants: {
    status: {
      completed: "bg-[#1B3C53] dark:bg-slate-300",
      current: "bg-[#1B3C53] dark:bg-white",
      upcoming: "bg-slate-200 dark:bg-slate-700",
    },
  },
})

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
// COMPONENTS
// ============================================================================

function QuickStatCard({
  label,
  value,
  sublabel,
  urgent,
  expandable,
  isExpanded,
  onToggle,
}: {
  label: string
  value: string | number
  sublabel?: string
  urgent?: boolean
  expandable?: boolean
  isExpanded?: boolean
  onToggle?: () => void
}) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 px-4 pt-3 pb-2.5 rounded-xl border transition-all duration-300 ease-in-out",
        expandable && "cursor-pointer hover:shadow-md hover:scale-[1.02]",
        isExpanded
          ? "border-[#1B3C53] dark:border-white shadow-md"
          : "border-slate-200 dark:border-slate-800",
      )}
      onClick={expandable ? onToggle : undefined}
    >
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
        {expandable && (
          <span
            className={cn(
              "material-symbols-outlined text-slate-400 transition-transform duration-300 ease-in-out",
              isExpanded && "rotate-180 text-[#1B3C53] dark:text-white",
            )}
            style={{ fontSize: "18px" }}
          >
            expand_more
          </span>
        )}
      </div>
    </div>
  )
}

function ConferencePhaseTimeline({ conferences }: { conferences: ConferenceTimeline[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 px-4 pt-4 pb-3 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
          Conference Phases
        </h3>
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
          {conferences.length} Active
        </span>
      </div>

      <div className="space-y-4">
        {conferences.map((conf) => {
          const totalPhases = conf.phases.length
          const currentIndex = conf.phases.findIndex((p) => p.isCurrent)

          return (
            <div key={conf.id} className="group">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[11px] font-bold text-[#1B3C53] dark:text-white w-20 shrink-0">
                  {conf.acronym} {conf.year}
                </span>
                <div className="flex-1 flex gap-0.5">
                  {conf.phases.map((phase, idx) => {
                    const status =
                      idx < currentIndex
                        ? "completed"
                        : idx === currentIndex
                          ? "current"
                          : "upcoming"

                    return (
                      <div
                        key={phase.phase}
                        className={cn("flex-1 relative group/phase", phaseVariants({ status }))}
                        title={phase.label}
                      >
                        {phase.isCurrent && (
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#1B3C53] dark:bg-white border-2 border-white dark:border-slate-900" />
                        )}
                      </div>
                    )
                  })}
                </div>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 w-24 text-right">
                  {conf.phases.find((p) => p.isCurrent)?.label || "Completed"}
                </span>
              </div>
            </div>
          )
        })}
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
        !isPast && "hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={eventTypeVariants({ type: event.type })}>{event.type}</span>
            <span className="text-[10px] font-medium text-slate-400">
              {event.conferenceAcronym}
            </span>
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
            {event.time}
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
// MAIN PAGE
// ============================================================================

export default function ChairSchedulesPage() {
  const { unreadCount } = useNotifications({ limit: 1 })
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<"calendar" | "timeline">("calendar")
  const [selectedConference, setSelectedConference] = useState<string>("all")
  const [isActiveConferencesExpanded, setIsActiveConferencesExpanded] = useState(false)

  // Filter events by conference
  const filteredEvents = useMemo(() => {
    if (selectedConference === "all") return MOCK_EVENTS
    return MOCK_EVENTS.filter((e) => e.conferenceAcronym === selectedConference)
  }, [selectedConference])

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

  const conferences = ["all", ...new Set(MOCK_EVENTS.map((e) => e.conferenceAcronym))]

  return (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={getSidebarMenuItems("chair", unreadCount)} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 md:px-12 py-6 md:py-8 w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[32px] font-bold tracking-tight text-[#1B3C53] dark:text-white leading-[1.1]">
                Schedules
              </h1>
              <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                Conference deadlines, milestones, and meetings at a glance.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Conference Filter */}
              <select
                value={selectedConference}
                onChange={(e) => setSelectedConference(e.target.value)}
                className="h-8 px-3 text-[11px] font-medium rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B3C53] dark:text-white focus:ring-1 focus:ring-[#1B3C53] cursor-pointer"
              >
                {conferences.map((conf) => (
                  <option key={conf} value={conf}>
                    {conf === "all" ? "All Conferences" : conf}
                  </option>
                ))}
              </select>

              {/* View Toggle */}
              <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg flex gap-0.5">
                <button
                  onClick={() => setViewMode("calendar")}
                  className={cn(
                    "w-8 h-8 rounded flex items-center justify-center transition-all",
                    viewMode === "calendar"
                      ? "bg-white dark:bg-slate-700 shadow-sm text-[#1B3C53] dark:text-white"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                  )}
                  title="Calendar View"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    calendar_month
                  </span>
                </button>
                <button
                  onClick={() => setViewMode("timeline")}
                  className={cn(
                    "w-8 h-8 rounded flex items-center justify-center transition-all",
                    viewMode === "timeline"
                      ? "bg-white dark:bg-slate-700 shadow-sm text-[#1B3C53] dark:text-white"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                  )}
                  title="Timeline View"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    view_timeline
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <QuickStatCard
              label="Next Deadline"
              value={nextDeadline ? formatCountdown(getDaysUntil(nextDeadline.date)) : "None"}
              sublabel={nextDeadline?.title}
              urgent={nextDeadline && getDaysUntil(nextDeadline.date) <= 3}
            />
            <QuickStatCard
              label="Active Conferences"
              value={MOCK_CONFERENCES.length}
              sublabel="Currently tracking"
              expandable
              isExpanded={isActiveConferencesExpanded}
              onToggle={() => setIsActiveConferencesExpanded(!isActiveConferencesExpanded)}
            />
            <QuickStatCard
              label="Upcoming Events"
              value={
                filteredEvents.filter(
                  (e) => getDaysUntil(e.date) >= 0 && getDaysUntil(e.date) <= 30,
                ).length
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

          {/* Conference Phase Timeline - Expandable */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
              isActiveConferencesExpanded
                ? "max-h-[1000px] opacity-100 translate-y-0 mb-6"
                : "max-h-0 opacity-0 -translate-y-2 mb-0",
            )}
          >
            <div className="transition-opacity duration-400 ease-in-out">
              <ConferencePhaseTimeline conferences={MOCK_CONFERENCES} />
            </div>
          </div>

          {/* Main Content */}
          {viewMode === "calendar" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="w-full"
                    modifiers={{
                      hasDeadline: (date) => {
                        const types = eventDates.get(date.toDateString())
                        return types?.includes("deadline") || false
                      },
                      hasMeeting: (date) => {
                        const types = eventDates.get(date.toDateString())
                        return types?.includes("meeting") || false
                      },
                      hasMilestone: (date) => {
                        const types = eventDates.get(date.toDateString())
                        return types?.includes("milestone") || false
                      },
                    }}
                    modifiersStyles={{
                      hasDeadline: {
                        position: "relative",
                      },
                      hasMeeting: {
                        position: "relative",
                      },
                      hasMilestone: {
                        position: "relative",
                      },
                    }}
                    components={{
                      DayButton: ({ day, modifiers, ...props }) => {
                        const types = eventDates.get(day.date.toDateString())
                        const hasEvents = types && types.length > 0

                        return (
                          <button
                            {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
                            className={cn(
                              "flex flex-col items-center justify-center w-full h-full min-h-[40px] rounded-md transition-colors relative",
                              modifiers.selected && "bg-[#1B3C53] text-white",
                              modifiers.today &&
                                !modifiers.selected &&
                                "bg-slate-100 dark:bg-slate-800",
                              !modifiers.selected && "hover:bg-slate-50 dark:hover:bg-slate-800",
                            )}
                          >
                            <span
                              className={cn(
                                "text-xs font-medium",
                                modifiers.outside && "text-slate-300 dark:text-slate-600",
                              )}
                            >
                              {day.date.getDate()}
                            </span>
                            {hasEvents && (
                              <div className="flex gap-0.5 mt-0.5">
                                {types.includes("deadline") && (
                                  <span className="w-1 h-1 rounded-full bg-red-500" />
                                )}
                                {types.includes("meeting") && (
                                  <span className="w-1 h-1 rounded-full bg-blue-500" />
                                )}
                                {types.includes("milestone") && (
                                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                )}
                              </div>
                            )}
                          </button>
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
                      <span className="text-[10px] font-medium text-slate-500">Meeting</span>
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
      </main>
    </div>
  )
}

