"use client"

import type { AuthorConference, AuthorSubmissionStatus } from "./author-conference-cards"
import { AuthorStatusBadge } from "./author-conference-cards"
import { useTranslation } from "@/lib/i18n/translation-context"

// -------------------------------------------------------------------------
// Conference List Container
// -------------------------------------------------------------------------

interface AuthorConferenceListProps {
  conferences: AuthorConference[]
  onNavigate: (id: string) => void
  currentPage?: number
  totalPages?: number
  totalItems?: number
  itemsPerPage?: number
  onPageChange?: (page: number) => void
}

export function AuthorConferenceList({
  conferences,
  onNavigate,
  currentPage = 1,
  totalPages = 1,
  totalItems,
  itemsPerPage = 5,
  onPageChange,
}: AuthorConferenceListProps) {
  const { t } = useTranslation()
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

  const handlePageClick = (page: number) => {
    if (onPageChange && page >= 1 && page <= totalPages) {
      onPageChange(page)
    }
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || conferences.length)

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage <= 3) {
        // Near the start
        for (let i = 2; i <= 4; i++) {
          pages.push(i)
        }
        pages.push("ellipsis")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push("ellipsis")
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // In the middle
        pages.push("ellipsis")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push("ellipsis")
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header Row */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_200px_190px_200px_minmax(120px,200px)_96px] border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {t("runtime.components.author.author-conference-list.text_conference")}{" "}
        </div>
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {t("runtime.components.author.author-conference-list.text_paper_title")}{" "}
        </div>
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {t("runtime.components.author.author-conference-list.text_status")}{" "}
        </div>
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {t("runtime.components.author.author-conference-list.text_dates")}{" "}
        </div>
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {t("runtime.components.author.author-conference-list.text_deadline")}{" "}
        </div>
        <div className="px-4 py-3 pr-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right">
          {t("runtime.components.author.author-conference-list.text_actions")}{" "}
        </div>
      </div>

      {/* List Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {conferences.map((conference) => (
          <AuthorConferenceListRow
            key={conference.id}
            conference={conference}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {/* Left: Item count */}
          <div className="text-[11px] text-slate-500">
            {t("runtime.components.author.author-conference-list.text_showing")}{" "}
            <span className="font-bold text-[#1B3C53] dark:text-white">
              {startItem}-{endItem}
            </span>{" "}
            of{" "}
            <span className="font-bold text-[#1B3C53] dark:text-white">
              {(totalItems || conferences.length).toLocaleString()}
            </span>{" "}
            submissions
          </div>

          {/* Right: Page navigation */}
          {totalPages > 1 && (
            <div className="flex gap-1">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("runtime.components.author.author-conference-list.text_previous")}{" "}
              </button>

              {getPageNumbers().map((page, idx) => {
                if (page === "ellipsis") {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 text-[10px]">
                      ...
                    </span>
                  )
                }

                const isActive = page === currentPage
                return (
                  <button
                    key={page}
                    onClick={() => handlePageClick(page)}
                    className={`px-2.5 py-1 rounded text-[10px] ${
                      isActive
                        ? "bg-[#1B3C53] text-white hover:bg-[#234C6A]"
                        : "border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {page}
                  </button>
                )
              })}

              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("runtime.components.author.author-conference-list.text_next")}{" "}
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

interface AuthorConferenceListRowProps {
  conference: AuthorConference
  onNavigate: (id: string) => void
}

function AuthorConferenceListRow({ conference, onNavigate }: AuthorConferenceListRowProps) {
  const { t } = useTranslation()
  const isCompleted = conference.status === "accepted" || conference.status === "rejected"

  return (
    <div
      onClick={() => onNavigate(conference.id)}
      className={`group cursor-pointer transition-all duration-150 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
        isCompleted ? "opacity-70 hover:opacity-100" : ""
      }`}
    >
      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_200px_190px_200px_minmax(120px,200px)_96px] items-center min-h-[60px]">
        {/* Conference */}
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
          {conference.acronym && (
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
              {conference.name}
            </p>
          )}
        </div>

        {/* Paper Title */}
        <div className="px-4 py-3">
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 line-clamp-2">
            {conference.paperTitle || "-"}
          </span>
        </div>

        {/* Status */}
        <div className="px-4 py-3">
          <AuthorStatusBadge status={conference.status} />
        </div>

        {/* Dates */}
        <div className="px-4 py-3">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {conference.dates || "-"}
          </span>
        </div>

        {/* Deadline */}
        <div className="px-4 py-3">
          <DeadlineIndicator conference={conference} />
        </div>

        {/* Actions */}
        <div className="px-2 py-3 pr-4 flex justify-center">
          <button
            onClick={(e) => e.stopPropagation()}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-[#1B3C53] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "18px", width: "18px", height: "18px", lineHeight: "1" }}
            >
              more_horiz
            </span>
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <AuthorStatusBadge status={conference.status} />
          <button
            onClick={(e) => e.stopPropagation()}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-[#1B3C53] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all shrink-0"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "18px", width: "18px", height: "18px", lineHeight: "1" }}
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

        {conference.paperTitle && (
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">
            {t("runtime.components.author.author-conference-list.text_text")}
            {conference.paperTitle}
            {t("runtime.components.author.author-conference-list.text_text")}{" "}
          </p>
        )}

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
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------
// Deadline Indicator
// -------------------------------------------------------------------------

interface DeadlineIndicatorProps {
  conference: AuthorConference
}

function DeadlineIndicator({ conference }: DeadlineIndicatorProps) {
  const { t } = useTranslation()
  // Under review: Show progress
  if (conference.status === "under-review" && conference.reviewProgress !== undefined) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">
          {t("runtime.components.author.author-conference-list.text_review_progress")}{" "}
        </span>
        <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-yellow-500 dark:bg-yellow-400 h-1.5 rounded-full transition-all"
            style={{ width: `${conference.reviewProgress}%` }}
          />
        </div>
        <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400">
          {conference.reviewProgress}%
        </span>
      </div>
    )
  }

  // Revision requested: Show deadline
  if (conference.status === "revision-requested" && conference.fullPaperDeadline) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-[9px] font-medium text-orange-500">
          {t("runtime.components.author.author-conference-list.text_revision_due")}
        </span>
        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
          {conference.fullPaperDeadline}
        </span>
      </div>
    )
  }

  // Bookmarked: Show submission deadline
  if (conference.status === "bookmarked" && conference.submissionDeadline) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-[9px] font-medium text-slate-400">
          {t("runtime.components.author.author-conference-list.text_submission_due")}
        </span>
        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
          {conference.submissionDeadline}
        </span>
      </div>
    )
  }

  // Submitted: Show submitted date
  if (conference.status === "submitted" && conference.submissionDate) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-[9px] font-medium text-slate-400">
          {t("runtime.components.author.author-conference-list.text_submitted")}
        </span>
        <span className="text-[10px] font-medium text-slate-500">{conference.submissionDate}</span>
      </div>
    )
  }

  // Default
  return <span className="text-[10px] text-slate-300">-</span>
}
