"use client"

import type { ReactNode } from "react"
import type { Conference, ConferenceStatus } from "./types"
import { StatusBadge } from "./status-badge"
import { useTranslation } from "@/lib/i18n/translation-context"
import { cn } from "@/lib/utils"

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
  renderMoreMenu?: (conference: Conference) => ReactNode
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
  renderMoreMenu,
  currentPage = 1,
  totalPages = 1,
  totalItems,
  itemsPerPage = 5,
  onPageChange,
}: ConferenceListProps) {
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

  // Calculate display range
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
    <div className="surface-table table-standard">
      {/* Header Row */}
      <div className="hidden border-b border-[var(--color-border-soft)] bg-[var(--color-fill-quiet)] lg:grid lg:grid-cols-[1fr_190px_130px_190px_minmax(120px,240px)_88px]">
        <div className="text-table-header px-3 py-[10px]">
          {t("runtime.components.conference.conference-list.text_conference")}{" "}
        </div>
        <div className="text-table-header px-3 py-[10px]">
          {t("runtime.components.conference.conference-list.text_role")}{" "}
        </div>
        <div className="text-table-header px-3 py-[10px]">
          {t("runtime.components.conference.conference-list.text_status")}{" "}
        </div>
        <div className="text-table-header px-3 py-[10px]">
          {t("runtime.components.conference.conference-list.text_dates")}{" "}
        </div>
        <div className="text-table-header px-3 py-[10px]">
          {t("runtime.components.conference.conference-list.text_progress")}{" "}
        </div>
        <div className="text-table-header px-3 py-[10px] text-right">
          {t("runtime.components.conference.conference-list.text_actions")}{" "}
        </div>
      </div>

      {/* List Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {conferences.map((conference) => (
          <ConferenceListRow
            key={conference.id}
            conference={conference}
            onNavigate={onNavigate}
            renderMoreMenu={renderMoreMenu}
          />
        ))}
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between border-t border-[var(--color-border-strong)] px-[var(--space-card)] py-[var(--space-standard)]">
          {/* Left: Item count */}
          <div className="text-ui-meta">
            {t("runtime.components.conference.conference-list.text_showing")}{" "}
            <span className="font-[700] text-[var(--color-primary-ink)]">
              {startItem}-{endItem}
            </span>{" "}
            of{" "}
            <span className="font-[700] text-[var(--color-primary-ink)]">
              {(totalItems || conferences.length).toLocaleString()}
            </span>{" "}
            conferences
          </div>

          {/* Right: Page navigation */}
          {totalPages > 1 && (
            <div className="flex gap-1">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="button-secondary text-table-header min-h-[28px] rounded-[var(--radius-button)] px-2.5 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("runtime.components.conference.conference-list.text_previous")}{" "}
              </button>

              {getPageNumbers().map((page, idx) => {
                if (page === "ellipsis") {
                  return (
                    <span key={`ellipsis-${idx}`} className="text-table-header px-1.5">
                      ...
                    </span>
                  )
                }

                const isActive = page === currentPage
                return (
                  <button
                    key={page}
                    onClick={() => handlePageClick(page)}
                    className={cn("text-table-header min-h-[28px] rounded-[var(--radius-button)] px-2.5 py-1", {
                      isActive
                        ? "button-primary"
                        : "button-secondary",
                    })}
                  >
                    {page}
                  </button>
                )
              })}

              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="button-secondary text-table-header min-h-[28px] rounded-[var(--radius-button)] px-2.5 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("runtime.components.conference.conference-list.text_next")}{" "}
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
  renderMoreMenu?: (conference: Conference) => ReactNode
}

function ConferenceListRow({ conference, onNavigate, renderMoreMenu }: ConferenceListRowProps) {
  const isCompleted = conference.status === "completed"
  const actionLabels = ACTION_LABELS[conference.status]

  return (
    <div
      onClick={() => onNavigate(conference.id)}
      className={cn("group cursor-pointer transition-colors duration-150 hover:bg-[var(--color-fill-quiet)]", {
        "opacity-70 hover:opacity-100": isCompleted,
      })}
    >
      {/* Desktop Layout */}
      <div className="hidden min-h-[72px] items-center lg:grid lg:grid-cols-[1fr_190px_130px_190px_minmax(120px,240px)_88px]">
        {/* Conference (Acronym + Full Name) */}
        <div className="px-3 py-[14px]">
          <h3 className="text-card-title line-clamp-1 transition-colors group-hover:text-[var(--color-primary-hover)]">
            {conference.acronym || conference.name}
          </h3>
          <p className="text-meta mt-0.5">
            {conference.acronym ? conference.name : ""}
          </p>
        </div>

        {/* Role + Track */}
        <div className="px-3 py-[14px]">
          <span className="text-ui-meta">
            {conference.role}
          </span>
          {conference.track && (
            <p className="text-meta mt-0.5">
              {conference.track}
            </p>
          )}
        </div>

        {/* Status */}
        <div className="px-4 py-3">
          <StatusBadge status={conference.status} />
        </div>

        {/* Dates */}
        <div className="px-3 py-[14px]">
          <span className="text-ui-meta">
            {conference.dates || "-"}
          </span>
        </div>

        {/* Progress */}
        <div className="px-3 py-[14px]">
          <ProgressIndicator conference={conference} />
        </div>

        {/* Actions */}
        <div className="flex justify-center px-2 py-[14px]">
          {renderMoreMenu?.(conference) ?? (
            <button
              onClick={(e) => {
                e.stopPropagation()
              }}
              className="button-secondary h-7 w-7 px-0 text-[var(--color-text-meta)] hover:text-[var(--color-primary-ink)]"
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
          )}
        </div>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="p-[var(--space-card)] lg:hidden">
        <div className="flex items-start justify-between gap-3 mb-2">
          <StatusBadge status={conference.status} />
          {renderMoreMenu?.(conference) ?? (
            <button
              onClick={(e) => {
                e.stopPropagation()
              }}
              className="button-secondary h-7 w-7 shrink-0 px-0 text-[var(--color-text-meta)] hover:text-[var(--color-primary-ink)]"
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
          )}
        </div>

        <h3 className="text-card-title mb-0.5">
          {conference.acronym || conference.name}
        </h3>
        {conference.acronym && (
          <p className="text-meta mb-1 line-clamp-1">
            {conference.name}
          </p>
        )}

        <p className="text-meta mb-2">
          {conference.role}
          {conference.track && (
            <span className="text-[var(--color-text-meta)]"> | {conference.track}</span>
          )}
        </p>

        <div className="text-meta flex flex-wrap items-center gap-x-4 gap-y-1">
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
  const { t } = useTranslation()
  // Active: Show review progress (stacked layout)
  if (conference.status === "active" && conference.reviewProgress) {
    const { value, daysLeft, label } = conference.reviewProgress
    return (
      <div className="flex flex-col gap-1">
        {/* Row 1: Label */}
        <span className="text-meta">{label}</span>
        {/* Row 2: Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border-strong)]">
          <div
            className="h-1.5 rounded-full bg-[var(--color-primary-ink)] transition-all"
            style={{ width: `${value}%` }}
          />
        </div>
        {/* Row 3: Percentage + time */}
        <div className="flex items-center gap-2">
          <span className="text-meta font-[700] text-[var(--color-primary-ink)]">{value}%</span>
          {daysLeft > 0 && (
            <span className="text-meta">
              {daysLeft}
              {t("runtime.components.conference.conference-list.text_d_left")}
            </span>
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
        <span className="text-meta">{phase}</span>
        {/* Row 2: Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border-strong)]">
          <div
            className="h-1.5 rounded-full bg-[var(--color-secondary-accent)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Row 3: Percentage + action */}
        <div className="flex items-center gap-2">
          <span className="text-meta font-[700] text-[var(--color-primary-ink)]">
            {progress}%
          </span>
          {actionRequired && (
            <span className="text-kicker text-[var(--color-warning-text)]">
              {t("runtime.components.conference.conference-list.text_action")}{" "}
            </span>
          )}
        </div>
      </div>
    )
  }

  // Draft: Show last saved
  if (conference.status === "draft" && conference.draftSavedDaysAgo !== undefined) {
    return (
      <span className="text-meta italic">
        {t("runtime.components.conference.conference-list.text_saved")}{" "}
        {conference.draftSavedDaysAgo}
        {t("runtime.components.conference.conference-list.text_d_ago")}{" "}
      </span>
    )
  }

  // Completed: Show accepted papers
  if (conference.status === "completed" && conference.acceptedPapers) {
    return (
      <span className="text-meta">
        <strong className="font-[700] text-[var(--color-primary-ink)]">
          {conference.acceptedPapers.toLocaleString()}
        </strong>{" "}
        papers
      </span>
    )
  }

  return <span className="text-meta">-</span>
}
