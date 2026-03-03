"use client"

import { useState } from "react"
import type { ReviewerConference } from "@/lib/types"

type TabType = "my-conferences" | "explore"
type ViewMode = "list" | "compact"

interface ReviewerConferencesProps {
  conferences: ReviewerConference[]
  exploreConferences?: ReviewerConference[]
  onSelectConference: (conferenceId: number) => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
  currentPage?: number
  totalPages?: number
  totalItems?: number
  pageSize?: number
  onPageChange?: (page: number) => void
}

// Progress ring component for visual stats
function ProgressRing({
  progress,
  size = 36,
  strokeWidth = 3,
}: {
  progress: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        className="text-slate-100 dark:text-slate-700"
        strokeWidth={strokeWidth}
        stroke="currentColor"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className="text-[#1B3C53] dark:text-slate-300 transition-all duration-500"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        stroke="currentColor"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
    </svg>
  )
}

// My Conferences Row - Compact table-like design
function MyConferenceRow({
  conference,
  onSelect,
}: {
  conference: ReviewerConference
  onSelect: () => void
}) {
  const reviewed = conference.reviewed_papers || 0
  const total = conference.total_papers || 0
  const pending = total - reviewed
  const progress = total > 0 ? Math.round((reviewed / total) * 100) : 0
  const isCompleted = pending === 0 && reviewed > 0
  const isArchived = conference.status === "completed" || conference.status === "closed"

  // Calculate urgency based on mock deadline logic
  const getUrgency = () => {
    if (isCompleted || isArchived) return "done"
    if (pending > 0 && pending <= 2) return "critical"
    if (pending > 0) return "pending"
    return "normal"
  }
  const urgency = getUrgency()

  // Mock deadline logic
  const getDeadline = () => {
    if (isArchived) return "Closed"
    if (urgency === "critical") return "2 days"
    return "Nov 15"
  }

  return (
    <div
      onClick={onSelect}
      className={`group grid grid-cols-[minmax(160px,280px)_1fr_100px_120px_60px_70px] items-center gap-4 px-4 py-2.5 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-750 cursor-pointer transition-colors duration-150 ${isArchived ? "opacity-60 hover:opacity-100" : ""}`}
    >
      {/* Conference */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[13px] font-bold tracking-tight text-[#1B3C53] dark:text-white truncate group-hover:text-[#234C6A] dark:group-hover:text-slate-200 transition-colors">
            {conference.acronym || conference.name}
          </h3>
          {urgency === "critical" && (
            <span className="shrink-0 flex items-center gap-0.5 px-1 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded text-[8px] font-black uppercase tracking-widest">
              Urgent
            </span>
          )}
          {isArchived && (
            <span className="shrink-0 px-1 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded text-[7px] font-black uppercase tracking-widest">
              Archived
            </span>
          )}
        </div>
        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">
          {conference.name}
        </p>
      </div>

      {/* Track */}
      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
        {conference.domain || "Computer Vision"}
      </div>

      {/* Deadline */}
      <div
        className={`text-[11px] font-bold tabular-nums ${urgency === "critical" ? "text-amber-600 dark:text-amber-500" : "text-slate-500 dark:text-slate-400"}`}
      >
        {getDeadline()}
      </div>

      {/* Progress - compact bar */}
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1B3C53] dark:bg-slate-300 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[11px] font-bold text-[#1B3C53] dark:text-white tabular-nums shrink-0">
          {reviewed}/{total}
        </span>
      </div>

      {/* Pending */}
      <div className="text-center">
        <span
          className={`text-[11px] font-bold tabular-nums ${
            pending > 0
              ? "text-amber-600 dark:text-amber-500"
              : "text-slate-300 dark:text-slate-600"
          }`}
        >
          {pending}
        </span>
      </div>

      {/* Action */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        className="flex items-center justify-end gap-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-[#1B3C53] dark:hover:text-white transition-all"
      >
        {isCompleted || isArchived ? "View" : "Review"}
        <span className="material-symbols-outlined text-[11px] group-hover:translate-x-0.5 transition-transform">
          chevron_right
        </span>
      </button>
    </div>
  )
}

// My Conferences Card - Grid view variant
function MyConferenceCard({
  conference,
  onSelect,
}: {
  conference: ReviewerConference
  onSelect: () => void
}) {
  const reviewed = conference.reviewed_papers || 0
  const total = conference.total_papers || 0
  const pending = total - reviewed
  const progress = total > 0 ? Math.round((reviewed / total) * 100) : 0
  const isCompleted = pending === 0 && reviewed > 0
  const isArchived = conference.status === "completed" || conference.status === "closed"

  const getUrgency = () => {
    if (isCompleted || isArchived) return "done"
    if (pending > 0 && pending <= 2) return "critical"
    if (pending > 0) return "pending"
    return "normal"
  }
  const urgency = getUrgency()

  const getDeadline = () => {
    if (isArchived) return "Closed"
    if (urgency === "critical") return "2 days left"
    return "Nov 15, 2024"
  }

  return (
    <div
      onClick={onSelect}
      className={`group relative bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-[#1B3C53]/40 dark:hover:border-slate-600 hover:shadow-md cursor-pointer transition-all duration-200 ${isArchived ? "opacity-60 hover:opacity-100" : ""}`}
    >
      {/* Accent line */}
      {urgency === "critical" && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500" />
      )}

      <div className="px-4 pt-4 pb-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold leading-tight tracking-tight text-[#1B3C53] dark:text-white truncate group-hover:text-[#234C6A] transition-colors">
              {conference.acronym || conference.name}
            </h3>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate mt-0.5">
              {conference.name}
            </p>
          </div>
          {urgency === "critical" && (
            <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded text-[9px] font-black uppercase tracking-widest">
              <span className="w-[5px] h-[5px] rounded-full bg-amber-500 animate-pulse" />
              Urgent
            </span>
          )}
          {isArchived && (
            <span className="shrink-0 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded text-[9px] font-black uppercase tracking-widest">
              Archived
            </span>
          )}
        </div>

        {/* Progress Section */}
        <div className="flex items-center gap-3 py-3 border-t border-b border-slate-100 dark:border-slate-700">
          <ProgressRing progress={progress} size={40} strokeWidth={3} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-[#1B3C53] dark:text-white tabular-nums">
                {reviewed}
              </span>
              <span className="text-xs text-slate-400">/ {total}</span>
            </div>
            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
              Papers Reviewed
            </div>
          </div>
          <div className="text-right">
            <div
              className={`text-lg font-bold tabular-nums ${pending > 0 ? "text-amber-600 dark:text-amber-500" : "text-slate-300"}`}
            >
              {pending}
            </div>
            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
              Pending
            </div>
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 py-3">
          <div>
            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
              Track
            </div>
            <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate">
              {conference.domain || "Computer Vision"}
            </div>
          </div>
          <div>
            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
              Deadline
            </div>
            <div
              className={`text-[10px] font-bold ${urgency === "critical" ? "text-amber-600 dark:text-amber-500" : "text-slate-600 dark:text-slate-400"}`}
            >
              {getDeadline()}
            </div>
          </div>
        </div>

        {/* Action */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          className="w-full flex items-center justify-center gap-1.5 h-8 mt-1 rounded bg-slate-50 dark:bg-slate-700/50 hover:bg-[#1B3C53] dark:hover:bg-slate-600 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:text-white transition-all"
        >
          {isCompleted || isArchived ? "View Papers" : "Review Papers"}
          <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
        </button>
      </div>
    </div>
  )
}

// Explore Conference Card - More visual for discovery
function ExploreConferenceCard({
  conference,
  index,
}: {
  conference: ReviewerConference
  index: number
}) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "TBA"
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div
      className="group relative bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-[#1B3C53]/40 dark:hover:border-slate-600 hover:shadow-md transition-all duration-200"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#1B3C53] via-[#234C6A] to-[#456882] opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="px-4 pt-4 pb-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold leading-tight tracking-tight text-[#1B3C53] dark:text-white truncate">
              {conference.acronym || conference.name}
            </h3>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate mt-0.5">
              {conference.name}
            </p>
          </div>
          <span className="shrink-0 px-1.5 py-0.5 bg-[#1B3C53]/5 dark:bg-slate-700 text-[#1B3C53] dark:text-slate-300 rounded text-[8px] font-black uppercase tracking-widest">
            Open
          </span>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 py-2 border-t border-b border-slate-100 dark:border-slate-700">
          <div>
            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
              Deadline
            </div>
            <div className="text-xs font-bold text-[#1B3C53] dark:text-white">
              {formatDate(conference.review_deadline)}
            </div>
          </div>
          <div>
            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
              Papers
            </div>
            <div className="text-xs font-bold text-[#1B3C53] dark:text-white">
              {conference.total_papers || "~50"}
            </div>
          </div>
          <div>
            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
              Location
            </div>
            <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate">
              {conference.location || "Virtual"}
            </div>
          </div>
          <div>
            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
              Domain
            </div>
            <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate">
              {conference.domain || "AI/ML"}
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-[9px] font-medium text-slate-400">Seeking reviewers</span>
          <button className="flex items-center gap-1.5 h-7 px-2.5 bg-[#1B3C53] dark:bg-white text-white dark:text-[#1B3C53] rounded text-[10px] font-bold uppercase tracking-wider hover:bg-[#234C6A] dark:hover:bg-slate-200 transition-colors">
            Apply
            <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Empty state component
function EmptyState({ type }: { type: "my-conferences" | "explore" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-[24px] text-slate-400">
          {type === "my-conferences" ? "folder_open" : "explore"}
        </span>
      </div>
      <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white mb-1">
        {type === "my-conferences" ? "No conferences yet" : "No conferences available"}
      </h3>
      <p className="text-[10px] font-medium text-slate-400 text-center max-w-xs">
        {type === "my-conferences"
          ? "You haven't joined any conferences as a reviewer. Explore and apply to review for upcoming conferences."
          : "There are no conferences seeking reviewers at this time. Check back later."}
      </p>
    </div>
  )
}

export function ReviewerConferences({
  conferences,
  exploreConferences,
  onSelectConference,
  searchQuery = "",
  onSearchChange,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
}: ReviewerConferencesProps) {
  const [activeTab, setActiveTab] = useState<TabType>("my-conferences")
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  // Stats for summary
  const totalPending = conferences.reduce(
    (acc, c) => acc + ((c.total_papers || 0) - (c.reviewed_papers || 0)),
    0,
  )
  const totalReviewed = conferences.reduce((acc, c) => acc + (c.reviewed_papers || 0), 0)
  const activeConferences = totalItems

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = []
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage <= 3) {
        for (let i = 2; i <= 4; i++) pages.push(i)
        pages.push("ellipsis")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push("ellipsis")
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push("ellipsis")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push("ellipsis")
        pages.push(totalPages)
      }
    }
    return pages
  }

  return (
    <div className="flex flex-col">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[32px] font-bold tracking-tight text-[#1B3C53] dark:text-white leading-none">
              Conferences
            </h1>
            <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400 mt-2 max-w-lg">
              Track your review assignments across conferences and discover new opportunities.
            </p>
          </div>

          {/* Quick stats - only for my-conferences */}
          {activeTab === "my-conferences" && conferences.length > 0 && (
            <div className="flex items-center gap-6 py-2 px-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-[#1B3C53] dark:text-white tabular-nums">
                  {activeConferences}
                </div>
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  Total
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
              <div className="text-center">
                <div className="text-lg font-bold text-amber-600 dark:text-amber-500 tabular-nums">
                  {totalPending}
                </div>
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  Pending
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
              <div className="text-center">
                <div className="text-lg font-bold text-[#1B3C53] dark:text-slate-300 tabular-nums">
                  {totalReviewed}
                </div>
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  Done
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar: Tabs + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTab("my-conferences")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
                activeTab === "my-conferences"
                  ? "bg-white dark:bg-slate-700 text-[#1B3C53] dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              My Conferences
              {conferences.length > 0 && (
                <span className="ml-1.5 text-[9px] font-bold text-slate-400">
                  {conferences.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("explore")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
                activeTab === "explore"
                  ? "bg-white dark:bg-slate-700 text-[#1B3C53] dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Explore
            </button>
          </div>

          {/* Search + Filters */}
          <div className="flex items-center gap-2">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1B3C53] transition-colors text-[14px]">
                search
              </span>
              <input
                className="w-full sm:w-56 h-8 pl-8 pr-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B3C53]/20 focus:border-[#1B3C53] transition-all"
                placeholder="Search conferences..."
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
            {activeTab === "my-conferences" && (
              <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center justify-center w-7 h-7 rounded transition-all ${
                    viewMode === "list"
                      ? "bg-white dark:bg-slate-700 shadow-sm text-[#1B3C53] dark:text-white"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                  title="List view"
                >
                  <span className="material-symbols-outlined text-[14px]">view_list</span>
                </button>
                <button
                  onClick={() => setViewMode("compact")}
                  className={`flex items-center justify-center w-7 h-7 rounded transition-all ${
                    viewMode === "compact"
                      ? "bg-white dark:bg-slate-700 shadow-sm text-[#1B3C53] dark:text-white"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                  title="Compact view"
                >
                  <span className="material-symbols-outlined text-[14px]">view_module</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === "my-conferences" ? (
          conferences.length === 0 ? (
            <EmptyState type="my-conferences" />
          ) : viewMode === "list" ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              {/* Table header */}
              <div className="grid grid-cols-[minmax(160px,280px)_1fr_100px_120px_60px_70px] items-center gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Conference
                </div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Track
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  Deadline
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  Progress
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center">
                  Queue
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">
                  Action
                </div>
              </div>

              {/* Conference rows */}
              {conferences.map((conference) => (
                <MyConferenceRow
                  key={conference.id}
                  conference={conference}
                  onSelect={() => onSelectConference(Number(conference.id))}
                />
              ))}
            </div>
          ) : (
            // Card view
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {conferences.map((conference) => (
                <MyConferenceCard
                  key={conference.id}
                  conference={conference}
                  onSelect={() => onSelectConference(Number(conference.id))}
                />
              ))}
            </div>
          )
        ) : (exploreConferences || conferences).length === 0 ? (
          <EmptyState type="explore" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(exploreConferences || conferences).map((conference, index) => (
              <ExploreConferenceCard key={conference.id} conference={conference} index={index} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {activeTab === "my-conferences" && totalItems > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Showing{" "}
              <span className="font-bold text-[#1B3C53] dark:text-white">
                {Math.min((currentPage - 1) * pageSize + 1, totalItems)}–{Math.min(currentPage * pageSize, totalItems)}
              </span>{" "}
              of <span className="font-bold text-[#1B3C53] dark:text-white">{totalItems}</span> conferences
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                Previous
              </button>
              {getPageNumbers().map((page, idx) =>
                page === "ellipsis" ? (
                  <span key={`e-${idx}`} className="px-1 text-slate-400 text-xs">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => onPageChange?.(page)}
                    className={`h-8 min-w-[32px] rounded-md text-[11px] font-bold transition-colors ${
                      currentPage === page
                        ? "bg-[#1B3C53] text-white"
                        : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
