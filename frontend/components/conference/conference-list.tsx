"use client"

import type { Conference, ConferenceStatus } from "./types"
import { StatusBadge } from "./status-badge"

// -------------------------------------------------------------------------
// Types & Constants
// -------------------------------------------------------------------------

const ACTION_LABELS: Record<ConferenceStatus, { primary: string; secondary?: string }> = {
  active: { primary: "Dashboard", secondary: "Settings" },
  planning: { primary: "Setup", secondary: "Edit" },
  draft: { primary: "Continue" },
  completed: { primary: "Archive" },
}

// -------------------------------------------------------------------------
// Conference List Container
// -------------------------------------------------------------------------

interface ConferenceListProps {
  conferences: Conference[]
  onNavigate: (id: string) => void
  /** Pagination props */
  currentPage?: number
  totalPages?: number
  totalItems?: number
  itemsPerPage?: number
  onPageChange?: (page: number) => void
}

export function ConferenceList({
  conferences,
  onNavigate,
  currentPage = 1,
  totalPages = 1,
  totalItems,
  itemsPerPage = 5,
  onPageChange,
}: ConferenceListProps) {
  const showPagination = totalPages > 1 || totalItems !== undefined

  const handlePrevPage = () => {
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages && onPageChange) {
      onPageChange(currentPage + 1)
    }
  }

  // Calculate display range
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || conferences.length)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header Row */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_150px_90px_150px_minmax(120px,240px)_88px] border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Conference
        </div>
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Role
        </div>
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Status
        </div>
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Dates
        </div>
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Progress
        </div>
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right">
          Actions
        </div>
      </div>

      {/* List Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {conferences.map((conference) => (
          <ConferenceListRow key={conference.id} conference={conference} onNavigate={onNavigate} />
        ))}
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          {/* Left: Item count */}
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {totalItems !== undefined ? (
              <>
                Showing{" "}
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {startItem}-{endItem}
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-700 dark:text-slate-300">{totalItems}</span>{" "}
                conferences
              </>
            ) : (
              <>{conferences.length} conferences</>
            )}
          </div>

          {/* Right: Page navigation */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-[#1B3C53] dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "16px", width: "16px", height: "16px", lineHeight: "1" }}
                >
                  chevron_left
                </span>
              </button>

              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 min-w-[80px] text-center">
                Page <span className="font-bold">{currentPage}</span> of{" "}
                <span className="font-bold">{totalPages}</span>
              </span>

              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-[#1B3C53] dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "16px", width: "16px", height: "16px", lineHeight: "1" }}
                >
                  chevron_right
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// -------------------------------------------------------------------------
// Conference List Row
// -------------------------------------------------------------------------

interface ConferenceListRowProps {
  conference: Conference
  onNavigate: (id: string) => void
}

function ConferenceListRow({ conference, onNavigate }: ConferenceListRowProps) {
  const isCompleted = conference.status === "completed"
  const actionLabels = ACTION_LABELS[conference.status]

  return (
    <div
      onClick={() => onNavigate(conference.id)}
      className={`group cursor-pointer transition-all duration-150 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
        isCompleted ? "opacity-70 hover:opacity-100" : ""
      }`}
    >
      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_150px_90px_150px_minmax(120px,240px)_88px] items-center min-h-[60px]">
        {/* Conference (Acronym + Full Name) */}
        <div className="px-4 py-3">
          <h3
            className={`text-[13px] font-bold leading-[1.3] tracking-tight line-clamp-1 transition-colors ${
              isCompleted
                ? "text-slate-600 dark:text-slate-400 group-hover:text-[#1B3C53] dark:group-hover:text-white"
                : "text-[#1B3C53] dark:text-white group-hover:text-[#234C6A] dark:group-hover:text-slate-200"
            }`}
          >
            {conference.acronym || conference.name}
          </h3>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
            {conference.acronym ? conference.name : ""}
          </p>
        </div>

        {/* Role + Track */}
        <div className="px-4 py-3">
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
            {conference.role}
          </span>
          {conference.track && (
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
              {conference.track}
            </p>
          )}
        </div>

        {/* Status */}
        <div className="px-4 py-3">
          <StatusBadge status={conference.status} />
        </div>

        {/* Dates */}
        <div className="px-4 py-3">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {conference.dates || "-"}
          </span>
        </div>

        {/* Progress */}
        <div className="px-4 py-3">
          <ProgressIndicator conference={conference} />
        </div>

        {/* Actions */}
        <div className="px-2 py-3 flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation()
            }}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-[#1B3C53] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "18px",
                width: "18px",
                height: "18px",
                lineHeight: "1",
              }}
            >
              more_horiz
            </span>
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <StatusBadge status={conference.status} />
          <button
            onClick={(e) => {
              e.stopPropagation()
            }}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-[#1B3C53] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all shrink-0"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "18px",
                width: "18px",
                height: "18px",
                lineHeight: "1",
              }}
            >
              more_horiz
            </span>
          </button>
        </div>

        <h3
          className={`text-[13px] font-bold leading-[1.3] tracking-tight mb-0.5 ${
            isCompleted ? "text-slate-600 dark:text-slate-400" : "text-[#1B3C53] dark:text-white"
          }`}
        >
          {conference.acronym || conference.name}
        </h3>
        {conference.acronym && (
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 line-clamp-1 mb-1">
            {conference.name}
          </p>
        )}

        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2">
          {conference.role}
          {conference.track && (
            <span className="text-slate-300 dark:text-slate-600"> | {conference.track}</span>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 dark:text-slate-500">
          {conference.location && (
            <span className="flex items-center gap-1">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "12px", width: "12px", height: "12px" }}
              >
                location_on
              </span>
              {conference.location}
            </span>
          )}
          {conference.dates && (
            <span className="flex items-center gap-1">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "12px", width: "12px", height: "12px" }}
              >
                calendar_today
              </span>
              {conference.dates}
            </span>
          )}
        </div>

        {/* Mobile Progress */}
        {(conference.reviewProgress || conference.setupStatus) && (
          <div className="mt-3">
            <ProgressIndicator conference={conference} />
          </div>
        )}
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------
// Progress Indicator - Compact inline progress display
// -------------------------------------------------------------------------

interface ProgressIndicatorProps {
  conference: Conference
}

function ProgressIndicator({ conference }: ProgressIndicatorProps) {
  // Active: Show review progress (stacked layout)
  if (conference.status === "active" && conference.reviewProgress) {
    const { value, daysLeft, label } = conference.reviewProgress
    return (
      <div className="flex flex-col gap-1">
        {/* Row 1: Label */}
        <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">{label}</span>
        {/* Row 2: Progress bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-[#1B3C53] dark:bg-slate-300 h-1.5 rounded-full transition-all"
            style={{ width: `${value}%` }}
          />
        </div>
        {/* Row 3: Percentage + time */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-[#1B3C53] dark:text-white">{value}%</span>
          {daysLeft > 0 && (
            <span className="text-[9px] font-medium text-slate-400">{daysLeft}d left</span>
          )}
        </div>
      </div>
    )
  }

  // Planning: Show setup progress (stacked layout)
  if (conference.status === "planning" && conference.setupStatus) {
    const { progress, phase, actionRequired } = conference.setupStatus
    return (
      <div className="flex flex-col gap-1">
        {/* Row 1: Phase */}
        <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">{phase}</span>
        {/* Row 2: Progress bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-blue-500 dark:bg-blue-400 h-1.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Row 3: Percentage + action */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
            {progress}%
          </span>
          {actionRequired && (
            <span className="text-[8px] font-black text-orange-600 uppercase tracking-wider">
              Action
            </span>
          )}
        </div>
      </div>
    )
  }

  // Draft: Show last saved
  if (conference.status === "draft" && conference.draftSavedDaysAgo !== undefined) {
    return (
      <span className="text-[10px] font-medium text-slate-400 italic">
        Saved {conference.draftSavedDaysAgo}d ago
      </span>
    )
  }

  // Completed: Show accepted papers
  if (conference.status === "completed" && conference.acceptedPapers) {
    return (
      <span className="text-[10px] font-medium text-slate-500">
        <strong className="text-slate-600 dark:text-slate-400">
          {conference.acceptedPapers.toLocaleString()}
        </strong>{" "}
        papers
      </span>
    )
  }

  return <span className="text-[10px] text-slate-300">-</span>
}
