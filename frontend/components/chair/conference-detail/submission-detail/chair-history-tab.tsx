"use client"

import { cn } from "@/lib/utils"

// --- Types ---
type HistoryEventType =
  | "review_submitted"
  | "reviewers_assigned"
  | "coi_updated"
  | "submission_uploaded"
  | "submission_created"
  | "status_changed"
  | "decision_made"

interface HistoryActor {
  id: string
  name: string
  role: string
  avatar?: string
  avatarColor?: string
  initials?: string
}

interface HistoryEvent {
  id: string
  type: HistoryEventType
  title: string
  description: string
  actor: HistoryActor
  timestamp: string
  metadata?: Record<string, string>
}

// --- Mock Data ---
const MOCK_HISTORY: HistoryEvent[] = [
  {
    id: "h1",
    type: "review_submitted",
    title: "Review Submitted",
    description: "Reviewer 3 submitted their review with a score of",
    actor: {
      id: "r3",
      name: "Reviewer 3",
      role: "Reviewer",
      avatarColor: "bg-pink-100 text-pink-700",
      initials: "R3",
    },
    timestamp: "May 16, 2024, 14:30",
    metadata: { score: "Weak Accept (7)", scoreColor: "text-yellow-600" },
  },
  {
    id: "h2",
    type: "review_submitted",
    title: "Review Submitted",
    description: "Reviewer 2 submitted their review with a score of",
    actor: {
      id: "r2",
      name: "Reviewer 2",
      role: "Reviewer",
      avatarColor: "bg-purple-100 text-purple-700",
      initials: "R2",
    },
    timestamp: "May 15, 2024, 09:15",
    metadata: { score: "Accept (8)", scoreColor: "text-green-600" },
  },
  {
    id: "h3",
    type: "review_submitted",
    title: "Review Submitted",
    description: "Reviewer 1 submitted their review with a score of",
    actor: {
      id: "r1",
      name: "Reviewer 1",
      role: "Reviewer",
      avatarColor: "bg-indigo-100 text-indigo-700",
      initials: "R1",
    },
    timestamp: "May 14, 2024, 16:45",
    metadata: { score: "Accept (8)", scoreColor: "text-green-600" },
  },
  {
    id: "h4",
    type: "reviewers_assigned",
    title: "Reviewers Assigned",
    description: "Submission manually assigned to 3 reviewers (R1, R2, R3).",
    actor: {
      id: "chair-1",
      name: "Dr. Sarah Smith",
      role: "Chair Admin",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuA5iIJaVXGl0D1HRG3ULOT9C9PhH3RzOrp1kkDzHq0PPgJZA7JRRy8rzybBj0yFIbH5x3p1874q8ycWP2t2BVTvpiek9xtcV-_Qis1U-RgxUhh7KhKGqL35gKl8yCY5bslazmwRf3jQgFnlXqMOH_EOto3_Xmr4XznnGPFh0PVfLTEfGDK3tjF5LIS0hSWBTiEWnh6QbDfdZ1BjLYSoVjXYvNLLHkgb9M9Qcgn7K-SqRhiTfnd5rJ6HkUFewGdO61rtUSkm5rtu",
    },
    timestamp: "May 01, 2024, 10:00",
  },
  {
    id: "h5",
    type: "coi_updated",
    title: "Conflict of Interest Updated",
    description: 'Added "Google DeepMind" to organizational conflicts.',
    actor: {
      id: "author-1",
      name: "Dr. Alex Chen",
      role: "Author",
      avatarColor: "bg-emerald-100 text-emerald-700",
      initials: "AC",
    },
    timestamp: "Apr 28, 2024, 11:20",
  },
  {
    id: "h6",
    type: "submission_uploaded",
    title: "Submission Uploaded (v2)",
    description: "Uploaded revised manuscript",
    actor: {
      id: "author-1",
      name: "Dr. Alex Chen",
      role: "Author",
      avatarColor: "bg-emerald-100 text-emerald-700",
      initials: "AC",
    },
    timestamp: "Apr 25, 2024, 23:55",
    metadata: { fileName: "Main_Submission_v2.pdf" },
  },
  {
    id: "h7",
    type: "submission_created",
    title: "Submission Created",
    description: "Initial abstract and metadata registered.",
    actor: {
      id: "author-1",
      name: "Dr. Alex Chen",
      role: "Author",
      avatarColor: "bg-emerald-100 text-emerald-700",
      initials: "AC",
    },
    timestamp: "Apr 25, 2024, 18:30",
  },
]

// --- Helper Functions ---
function getEventIcon(type: HistoryEventType): {
  icon: string
  bgColor: string
  textColor: string
} {
  switch (type) {
    case "review_submitted":
      return {
        icon: "rate_review",
        bgColor: "bg-blue-50 dark:bg-slate-800 border-blue-100 dark:border-slate-700",
        textColor: "text-blue-600 dark:text-blue-400",
      }
    case "reviewers_assigned":
      return {
        icon: "group_add",
        bgColor: "bg-orange-50 dark:bg-slate-800 border-orange-100 dark:border-slate-700",
        textColor: "text-orange-600 dark:text-orange-400",
      }
    case "coi_updated":
    case "status_changed":
      return {
        icon: "edit_document",
        bgColor: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
        textColor: "text-slate-500 dark:text-slate-400",
      }
    case "submission_uploaded":
      return {
        icon: "file_upload",
        bgColor: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
        textColor: "text-slate-500 dark:text-slate-400",
      }
    case "submission_created":
      return {
        icon: "add_circle",
        bgColor: "bg-green-50 dark:bg-slate-800 border-green-100 dark:border-slate-700",
        textColor: "text-green-600 dark:text-green-400",
      }
    case "decision_made":
      return {
        icon: "gavel",
        bgColor: "bg-purple-50 dark:bg-slate-800 border-purple-100 dark:border-slate-700",
        textColor: "text-purple-600 dark:text-purple-400",
      }
    default:
      return {
        icon: "info",
        bgColor: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
        textColor: "text-slate-500 dark:text-slate-400",
      }
  }
}

// --- Timeline Item Component ---
function TimelineItem({ event, isLast }: { event: HistoryEvent; isLast: boolean }) {
  const { icon, bgColor, textColor } = getEventIcon(event.type)

  return (
    <div className={cn("relative pl-7 group", !isLast && "pb-8")}>
      {/* Connecting Line */}
      {!isLast && (
        <div className="absolute left-[9px] top-2 h-full w-[2px] bg-slate-100 dark:bg-slate-800" />
      )}

      {/* Event Icon */}
      <div
        className={cn(
          "absolute left-0 top-1 h-5 w-5 rounded-full border flex items-center justify-center z-10",
          bgColor,
          textColor,
        )}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
          {icon}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#1B3C53] dark:text-white">{event.title}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium leading-relaxed">
            {event.description}
            {event.metadata?.score && (
              <span className={cn("font-bold ml-1", event.metadata.scoreColor)}>
                {event.metadata.score}
              </span>
            )}
            {event.metadata?.fileName && (
              <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 ml-1">
                {event.metadata.fileName}
              </span>
            )}
          </p>

          {/* Actor Info */}
          <div className="flex items-center gap-1.5 mt-1.5">
            {event.actor.avatar ? (
              <div
                className="w-4 h-4 rounded-full bg-cover bg-center flex-shrink-0"
                style={{ backgroundImage: `url("${event.actor.avatar}")` }}
              />
            ) : (
              <div
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0",
                  event.actor.avatarColor,
                )}
              >
                {event.actor.initials}
              </div>
            )}
            <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300">
              {event.actor.name}
            </span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="text-[10px] text-slate-400">{event.actor.role}</span>
          </div>
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
          {event.timestamp}
        </span>
      </div>
    </div>
  )
}

// --- Main Export ---
export function ChairHistoryTab() {
  const events = MOCK_HISTORY

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm px-4 pt-4 pb-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
          Activity Log
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              sort
            </span>
            <span>Newest first</span>
          </div>
          <button className="h-7 px-2.5 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              download
            </span>
            Export Log
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-2">
        {events.map((event, index) => (
          <TimelineItem key={event.id} event={event} isLast={index === events.length - 1} />
        ))}
      </div>
    </div>
  )
}
