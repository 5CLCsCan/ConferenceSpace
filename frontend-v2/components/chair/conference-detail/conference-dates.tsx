"use client"

import { cn } from "@/lib/utils"

interface ConferenceDatesProps {
  conferenceId: string
  className?: string
}

type PhaseStatus = "completed" | "in-progress" | "upcoming"

interface DateEvent {
  id: string
  title: string
  description: string
  date: string
  month: string
  day: string
  status: "passed" | "done" | "upcoming"
  time?: string
  isHighlighted?: boolean
}

interface Phase {
  id: string
  name: string
  status: PhaseStatus
  period: string
  events: DateEvent[]
}

interface InternalDeadline {
  date: string
  label: string
}

// Mock data
const MOCK_PHASES: Phase[] = [
  {
    id: "submission",
    name: "Submission Phase",
    status: "completed",
    period: "Aug - Sep 2023",
    events: [
      {
        id: "abstract",
        title: "Abstract Submission Deadline",
        description: "Hard deadline for registering abstracts.",
        date: "August 15, 2023",
        month: "Aug",
        day: "15",
        status: "passed",
      },
      {
        id: "full-paper",
        title: "Full Paper Submission",
        description: "Main track full paper deadline.",
        date: "August 22, 2023",
        month: "Aug",
        day: "22",
        status: "passed",
      },
    ],
  },
  {
    id: "review",
    name: "Review & Decision",
    status: "in-progress",
    period: "Oct - Dec 2023",
    events: [
      {
        id: "review-deadline",
        title: "Review Submission Deadline",
        description: "All initial reviews due.",
        date: "October 10, 2023",
        month: "Oct",
        day: "10",
        status: "done",
      },
      {
        id: "notification",
        title: "Notification of Acceptance",
        description: "Authors notified of paper decisions.",
        date: "December 10, 2023",
        month: "Dec",
        day: "10",
        status: "upcoming",
        time: "23:59 AoE",
        isHighlighted: true,
      },
    ],
  },
  {
    id: "camera-ready",
    name: "Camera Ready & Registration",
    status: "upcoming",
    period: "Jan 2024",
    events: [
      {
        id: "camera-ready",
        title: "Camera-Ready Deadline",
        description: "Final version of papers due.",
        date: "January 15, 2024",
        month: "Jan",
        day: "15",
        status: "upcoming",
      },
    ],
  },
]

const MOCK_INTERNAL_DEADLINES: InternalDeadline[] = [
  { date: "Nov 28", label: "AC Recommendations Due" },
  { date: "Dec 05", label: "PC Chair Final Decisions" },
]

const NEXT_DEADLINE = {
  days: 14,
  label: "Until Notification",
  targetDate: "Dec 10, 2023",
  timezone: "AoE (UTC-12)",
}

// Icon helper for consistent sizing
function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn("material-symbols-outlined", className)}
      style={{
        fontSize: "16px",
        width: "16px",
        height: "16px",
        maxWidth: "16px",
        maxHeight: "16px",
        minWidth: "16px",
        minHeight: "16px",
        lineHeight: "1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transform: "none",
        boxSizing: "border-box",
      }}
    >
      {name}
    </span>
  )
}

function DateEventCard({ event, phaseStatus }: { event: DateEvent; phaseStatus: PhaseStatus }) {
  const isPassed = event.status === "passed"
  const isDone = event.status === "done"
  const isUpcoming = event.status === "upcoming" && event.isHighlighted

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
            {event.month}
          </span>
          <span
            className={cn(
              "text-sm font-bold",
              isUpcoming ? "" : "text-slate-700 dark:text-slate-300",
            )}
          >
            {event.day}
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

          {/* Time and Edit for highlighted event */}
          {isUpcoming && event.time && (
            <div className="flex items-center gap-3 mt-2">
              <span className="inline-flex items-center text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded gap-1">
                <Icon name="schedule" className="text-slate-400" />
                {event.time}
              </span>
              <button className="text-[10px] font-bold text-[#1B3C53] dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 flex items-center gap-0.5 transition-colors">
                Edit Details
                <Icon name="arrow_forward" className="text-current" />
              </button>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="text-right shrink-0 flex items-center gap-2">
          {isPassed && (
            <span className="inline-block px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-bold rounded uppercase">
              Passed
            </span>
          )}
          {isDone && (
            <span className="inline-block px-1.5 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[9px] font-bold rounded uppercase">
              Done
            </span>
          )}
          {isUpcoming && (
            <span className="inline-block px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-[#1B3C53] dark:text-blue-200 text-[9px] font-bold rounded-full border border-blue-100 dark:border-blue-900/50 uppercase">
              Upcoming
            </span>
          )}
          {phaseStatus !== "upcoming" && !isUpcoming && (
            <button className="text-slate-300 hover:text-[#1B3C53] dark:hover:text-white transition-colors invisible group-hover:visible">
              <Icon name="edit" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function TimelinePhase({ phase }: { phase: Phase }) {
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
          {isCompleted && "Completed"}
          {isInProgress && "In Progress"}
          {isUpcoming && "Upcoming"} &bull; {phase.period}
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

function NextDeadlineCard() {
  return (
    <div className="bg-[#1B3C53] dark:bg-slate-800 text-white rounded-lg p-4 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none" />

      <h3 className="text-[10px] font-medium text-slate-300 uppercase tracking-wider mb-1.5">
        Next Major Deadline
      </h3>
      <div className="text-3xl font-bold mb-0.5">
        {NEXT_DEADLINE.days} <span className="text-sm font-normal text-slate-400">days</span>
      </div>
      <p className="text-sm font-normal text-white mb-4">{NEXT_DEADLINE.label}</p>

      <div className="space-y-2 pt-3 border-t border-white/10">
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-300 font-light">Target Date</span>
          <span
            className="font-light"
            style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            {NEXT_DEADLINE.targetDate}
          </span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-300 font-light">Timezone</span>
          <span
            className="font-light"
            style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            {NEXT_DEADLINE.timezone}
          </span>
        </div>
      </div>
    </div>
  )
}

function SettingsCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-4">
      <h3 className="font-bold text-[#1B3C53] dark:text-white mb-3 flex items-center gap-2 text-sm tracking-tight">
        <Icon name="tune" className="text-slate-400" />
        Settings
      </h3>
      <form className="space-y-3">
        <div>
          <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">
            Conference Timezone
          </label>
          <select className="w-full text-[11px] border border-[#E3E3E3] dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-md focus:ring-[#1B3C53] focus:border-[#1B3C53] py-1.5 px-2">
            <option>Anywhere on Earth (AoE)</option>
            <option>Pacific Time (PT)</option>
            <option>UTC</option>
          </select>
        </div>
        <div>
          <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">
            Date Format
          </label>
          <select className="w-full text-[11px] border border-[#E3E3E3] dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-md focus:ring-[#1B3C53] focus:border-[#1B3C53] py-1.5 px-2">
            <option>MMM D, YYYY</option>
            <option>DD/MM/YYYY</option>
          </select>
        </div>
      </form>
    </div>
  )
}

function InternalDeadlinesCard() {
  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
      <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2.5 text-[13px] tracking-tight">
        Internal Deadlines
      </h3>
      <ul className="space-y-2">
        {MOCK_INTERNAL_DEADLINES.map((deadline, idx) => (
          <li key={idx} className="flex items-start gap-2 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400">
              <span className="font-medium text-[#1B3C53] dark:text-white">{deadline.date}:</span>{" "}
              {deadline.label}
            </span>
          </li>
        ))}
      </ul>
      <button className="mt-3 w-full py-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-[#1B3C53] dark:hover:text-white border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md transition-colors">
        Manage Internal Schedule
      </button>
    </div>
  )
}

export function ConferenceDates({ conferenceId, className }: ConferenceDatesProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#1B3C53] dark:text-white tracking-tight">
            Conference Timeline
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Manage deadlines and schedule events for AAAI 2024.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 text-[11px] font-medium text-white bg-[#1B3C53] dark:bg-blue-600 rounded-md hover:bg-[#234C6A] dark:hover:bg-blue-700 flex items-center gap-1.5 shadow-sm transition-all">
            <Icon name="edit" />
            Edit Timeline
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Timeline - Left Column */}
        <div className="lg:col-span-2 space-y-0">
          {MOCK_PHASES.map((phase) => (
            <TimelinePhase key={phase.id} phase={phase} />
          ))}
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-4">
          <NextDeadlineCard />
          <SettingsCard />
          <InternalDeadlinesCard />
        </div>
      </div>
    </div>
  )
}
