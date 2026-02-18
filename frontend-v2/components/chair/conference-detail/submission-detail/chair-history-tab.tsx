"use client"

import { useState, useMemo, useEffect } from "react"
import { cn } from "@/lib/utils"

// --- Types ---
type HistoryEventCategory = "review" | "assignment" | "submission" | "status" | "decision" | "coi"

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
  initials?: string
}

interface HistoryEvent {
  id: string
  type: HistoryEventType
  category: HistoryEventCategory
  title: string
  description: string
  actor: HistoryActor
  timestamp: string
  relativeTime?: string
  metadata?: Record<string, string>
}

// --- Category Configuration ---
const CATEGORY_CONFIG: Record<
  HistoryEventCategory,
  { label: string; icon: string; borderColor: string; iconColor: string; bgColor: string }
> = {
  review: {
    label: "Review",
    icon: "rate_review",
    borderColor: "border-l-blue-400",
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  assignment: {
    label: "Assignment",
    icon: "group_add",
    borderColor: "border-l-orange-400",
    iconColor: "text-orange-500",
    bgColor: "bg-orange-50",
  },
  submission: {
    label: "Submission",
    icon: "upload_file",
    borderColor: "border-l-slate-400",
    iconColor: "text-slate-500",
    bgColor: "bg-slate-100",
  },
  status: {
    label: "Status",
    icon: "sync",
    borderColor: "border-l-purple-400",
    iconColor: "text-purple-500",
    bgColor: "bg-purple-50",
  },
  decision: {
    label: "Decision",
    icon: "gavel",
    borderColor: "border-l-emerald-400",
    iconColor: "text-emerald-500",
    bgColor: "bg-emerald-50",
  },
  coi: {
    label: "COI",
    icon: "shield",
    borderColor: "border-l-rose-400",
    iconColor: "text-rose-500",
    bgColor: "bg-rose-50",
  },
}

// --- Mock Data ---
const MOCK_HISTORY: HistoryEvent[] = [
  {
    id: "h1",
    type: "review_submitted",
    category: "review",
    title: "Review Submitted",
    description: "Submitted review",
    actor: { id: "r3", name: "Reviewer 3", role: "Reviewer", initials: "R3" },
    timestamp: "May 16, 2024",
    relativeTime: "2d ago",
    metadata: { score: "Weak Accept (7)", scoreColor: "text-amber-600" },
  },
  {
    id: "h2",
    type: "review_submitted",
    category: "review",
    title: "Review Submitted",
    description: "Submitted review",
    actor: { id: "r2", name: "Reviewer 2", role: "Reviewer", initials: "R2" },
    timestamp: "May 15, 2024",
    relativeTime: "3d ago",
    metadata: { score: "Accept (8)", scoreColor: "text-emerald-600" },
  },
  {
    id: "h3",
    type: "review_submitted",
    category: "review",
    title: "Review Submitted",
    description: "Submitted review",
    actor: { id: "r1", name: "Reviewer 1", role: "Reviewer", initials: "R1" },
    timestamp: "May 14, 2024",
    relativeTime: "4d ago",
    metadata: { score: "Accept (8)", scoreColor: "text-emerald-600" },
  },
  {
    id: "h4",
    type: "reviewers_assigned",
    category: "assignment",
    title: "Reviewers Assigned",
    description: "Assigned to 3 reviewers (R1, R2, R3)",
    actor: {
      id: "chair-1",
      name: "Dr. Sarah Smith",
      role: "Chair",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuA5iIJaVXGl0D1HRG3ULOT9C9PhH3RzOrp1kkDzHq0PPgJZA7JRRy8rzybBj0yFIbH5x3p1874q8ycWP2t2BVTvpiek9xtcV-_Qis1U-RgxUhh7KhKGqL35gKl8yCY5bslazmwRf3jQgFnlXqMOH_EOto3_Xmr4XznnGPFh0PVfLTEfGDK3tjF5LIS0hSWBTiEWnh6QbDfdZ1BjLYSoVjXYvNLLHkgb9M9Qcgn7K-SqRhiTfnd5rJ6HkUFewGdO61rtUSkm5rtu",
    },
    timestamp: "May 01, 2024",
    relativeTime: "17d ago",
  },
  {
    id: "h5",
    type: "coi_updated",
    category: "coi",
    title: "COI Updated",
    description: 'Added "Google DeepMind" to conflicts',
    actor: { id: "author-1", name: "Dr. Alex Chen", role: "Author", initials: "AC" },
    timestamp: "Apr 28, 2024",
    relativeTime: "20d ago",
  },
  {
    id: "h6",
    type: "submission_uploaded",
    category: "submission",
    title: "File Uploaded",
    description: "Uploaded revised manuscript (v2)",
    actor: { id: "author-1", name: "Dr. Alex Chen", role: "Author", initials: "AC" },
    timestamp: "Apr 25, 2024",
    relativeTime: "23d ago",
    metadata: { fileName: "Main_Submission_v2.pdf" },
  },
  {
    id: "h7",
    type: "submission_created",
    category: "submission",
    title: "Submission Created",
    description: "Initial submission registered",
    actor: { id: "author-1", name: "Dr. Alex Chen", role: "Author", initials: "AC" },
    timestamp: "Apr 25, 2024",
    relativeTime: "23d ago",
  },
]

// --- Filter Pill Component ---
type FilterOption = "all" | HistoryEventCategory

function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all",
        active
          ? "bg-[#1B3C53] text-white"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700",
      )}
    >
      {label}
      <span
        className={cn(
          "ml-1.5 px-1 py-0.5 rounded text-[8px] font-bold",
          active ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700",
        )}
      >
        {count}
      </span>
    </button>
  )
}

// --- Actor Badge ---
function ActorBadge({ actor }: { actor: HistoryActor }) {
  const roleColors: Record<string, string> = {
    Reviewer: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    Chair: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    Author: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  }

  return (
    <div className="flex items-center gap-1.5">
      {actor.avatar ? (
        <div
          className="w-4 h-4 rounded-full bg-cover bg-center flex-shrink-0 ring-1 ring-slate-200"
          style={{ backgroundImage: `url("${actor.avatar}")` }}
        />
      ) : (
        <div
          className={cn(
            "w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold flex-shrink-0",
            roleColors[actor.role] || "bg-slate-100 text-slate-600",
          )}
        >
          {actor.initials}
        </div>
      )}
      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[80px]">
        {actor.name}
      </span>
    </div>
  )
}

// --- Event Row Component ---
function EventRow({ event }: { event: HistoryEvent }) {
  const config = CATEGORY_CONFIG[event.category]

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2.5 px-3 border-l-2 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors",
        config.borderColor,
      )}
    >
      {/* Category Icon */}
      <div
        className={cn(
          "w-6 h-6 rounded flex items-center justify-center flex-shrink-0",
          config.bgColor,
          "dark:bg-slate-800",
        )}
      >
        <span
          className={cn("material-symbols-outlined", config.iconColor, "dark:text-slate-400")}
          style={{ fontSize: "14px" }}
        >
          {config.icon}
        </span>
      </div>

      {/* Event Content */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
          {event.description}
        </span>

        {/* Inline Metadata */}
        {event.metadata?.score && (
          <span
            className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 whitespace-nowrap",
              event.metadata.scoreColor,
            )}
          >
            {event.metadata.score}
          </span>
        )}
        {event.metadata?.fileName && (
          <span className="text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded truncate max-w-[120px]">
            {event.metadata.fileName}
          </span>
        )}
      </div>

      {/* Actor */}
      <ActorBadge actor={event.actor} />

      {/* Timestamp */}
      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2 w-16 text-right">
        {event.relativeTime || event.timestamp}
      </span>
    </div>
  )
}

// --- Summary Stats ---
function SummaryStats({ events }: { events: HistoryEvent[] }) {
  const stats = useMemo(() => {
    const counts: Record<HistoryEventCategory, number> = {
      review: 0,
      assignment: 0,
      submission: 0,
      status: 0,
      decision: 0,
      coi: 0,
    }
    events.forEach((e) => counts[e.category]++)
    return counts
  }, [events])

  const significantStats = Object.entries(stats)
    .filter(([, count]) => count > 0)
    .slice(0, 4) // Show max 4 categories

  return (
    <div className="flex items-center gap-2">
      {significantStats.map(([category, count]) => {
        const config = CATEGORY_CONFIG[category as HistoryEventCategory]
        return (
          <div
            key={category}
            className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400"
          >
            <span
              className={cn("material-symbols-outlined", config.iconColor)}
              style={{ fontSize: "12px" }}
            >
              {config.icon}
            </span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{count}</span>
            <span className="hidden sm:inline">{config.label.toLowerCase()}</span>
          </div>
        )
      })}
    </div>
  )
}

// --- Main Export ---
export function ChairHistoryTab() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const events = MOCK_HISTORY
  const ITEMS_PER_PAGE = 10

  // Compute category counts for filters
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: events.length }
    events.forEach((e) => {
      counts[e.category] = (counts[e.category] || 0) + 1
    })
    return counts
  }, [events])

  // Filter events
  const filteredEvents = useMemo(() => {
    if (activeFilter === "all") return events
    return events.filter((e) => e.category === activeFilter)
  }, [events, activeFilter])

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex)

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeFilter])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // Available filter options (only show categories with events)
  const filterOptions: { key: FilterOption; label: string }[] = [
    { key: "all", label: "All" },
    ...(Object.keys(CATEGORY_CONFIG) as HistoryEventCategory[])
      .filter((cat) => categoryCounts[cat] > 0)
      .map((cat) => ({ key: cat, label: CATEGORY_CONFIG[cat].label })),
  ]

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
              Activity Log
            </h3>
            <SummaryStats events={events} />
          </div>

          {/* Export Button */}
          <button className="h-7 px-2.5 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
              download
            </span>
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>

        {/* Filter Pills */}
        {filterOptions.length > 2 && (
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {filterOptions.map((opt) => (
              <FilterPill
                key={opt.key}
                label={opt.label}
                count={categoryCounts[opt.key] || 0}
                active={activeFilter === opt.key}
                onClick={() => setActiveFilter(opt.key)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Events List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {paginatedEvents.length > 0 ? (
          paginatedEvents.map((event) => <EventRow key={event.id} event={event} />)
        ) : (
          <div className="px-4 py-8 text-center">
            <span
              className="material-symbols-outlined text-slate-300 dark:text-slate-600 mb-2"
              style={{ fontSize: "32px" }}
            >
              history
            </span>
            <p className="text-xs text-slate-400 dark:text-slate-500">No events in this category</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredEvents.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Showing <span className="font-bold text-[#1B3C53] dark:text-white">{startIndex + 1}-{Math.min(endIndex, filteredEvents.length)}</span> of{" "}
            <span className="font-bold text-[#1B3C53] dark:text-white">{filteredEvents.length}</span> events
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first, last, current, and adjacent pages
              if (
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={cn(
                      "px-2.5 py-1 rounded text-[10px]",
                      page === currentPage
                        ? "bg-[#1B3C53] text-white hover:bg-[#234C6A]"
                        : "border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    {page}
                  </button>
                )
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="px-1.5 text-slate-400 dark:text-slate-500 text-[10px]">
                    ...
                  </span>
                )
              }
              return null
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
