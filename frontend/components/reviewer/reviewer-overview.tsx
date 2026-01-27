"use client"

import { useTranslation } from "@/lib/i18n/translation-context"
import { daysUntilDeadline } from "@/lib/utils"
import { useEffect, useRef } from "react"
import type { ReviewerStats, AssignmentWithPaper } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface ReviewerOverviewProps {
  stats: ReviewerStats | null
  assignments: AssignmentWithPaper[]
  conferenceCount: number
  onSelectPaper: (paperId: string, conferenceId: string) => void
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
}

type ReviewStatus = "not_started" | "in_progress" | "completed"

function getStatusConfig(status: ReviewStatus) {
  switch (status) {
    case "completed":
      return {
        label: "Submitted",
        dotClass: "bg-green-500",
        badgeClass: "bg-green-50 text-green-700 border-green-200",
        cardBorder: "border-l-4 border-l-green-500",
        icon: "check",
      }
    case "in_progress":
      return {
        label: "Draft Saved",
        dotClass: "bg-amber-500",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        cardBorder: "border-l-4 border-l-amber-500",
        icon: null,
      }
    default:
      return {
        label: "Not Started",
        dotClass: "bg-slate-400",
        badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
        cardBorder: "",
        icon: null,
      }
  }
}

function PaperCard({
  assignment,
  onSelectPaper,
}: {
  assignment: AssignmentWithPaper
  onSelectPaper: (paperId: string, conferenceId: string) => void
}) {
  const status = (assignment.status as ReviewStatus) || "not_started"
  const config = getStatusConfig(status)
  const isCompleted = status === "completed"

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
  }

  const getButtonConfig = () => {
    switch (status) {
      case "completed":
        return {
          text: "View Review",
          icon: "visibility",
          className: "bg-slate-100 text-slate-600 hover:bg-slate-200",
        }
      case "in_progress":
        return {
          text: "Continue Review",
          icon: "edit_document",
          className: "bg-white border border-amber-500 text-amber-700 hover:bg-amber-50",
        }
      default:
        return {
          text: "Start Review",
          icon: "arrow_forward",
          className: "bg-[#1e3a8a] hover:bg-blue-900 text-white shadow-lg shadow-blue-900/10",
        }
    }
  }

  const buttonConfig = getButtonConfig()

  return (
    <div
      className={`group bg-white rounded-xl border border-slate-200 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_-5px_rgba(30,58,138,0.1)] hover:border-[#1e3a8a]/30 transition-all duration-300 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center relative overflow-hidden ${config.cardBorder}`}
    >
      <div
        className={`flex-1 space-y-3 ${isCompleted ? "opacity-80 group-hover:opacity-100 transition-opacity" : ""}`}
      >
        {/* Paper ID + Status Badge */}
        <div className="flex items-center gap-3 mb-1">
          <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
            ID: #{assignment.paper_id || assignment.assignment_id}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.badgeClass}`}
          >
            {config.icon ? (
              <span className="material-symbols-outlined text-[14px]">{config.icon}</span>
            ) : (
              <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
            )}
            {config.label}
          </span>
        </div>

        {/* Paper Title */}
        <h3 className="text-lg font-bold text-[#141414] group-hover:text-[#1e3a8a] transition-colors">
          {assignment.paper_title}
        </h3>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">library_books</span>
            <span>{assignment.conference_name}</span>
          </div>
          {assignment.due_date && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              <span>Due: {formatDate(assignment.due_date)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Section - Deadline/Completed + Action Button */}
      <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between gap-4 pl-0 md:pl-6 md:border-l border-slate-100">
        <div className="text-right hidden md:block">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            {isCompleted ? "Completed" : "Deadline"}
          </span>
          <div className={`text-sm font-bold ${isCompleted ? "text-green-600" : "text-slate-700"}`}>
            {formatDate(assignment.due_date)}
          </div>
        </div>
        <button
          onClick={() =>
            onSelectPaper(String(assignment.assignment_id), String(assignment.conference_id))
          }
          className={`w-full md:w-auto px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${buttonConfig.className}`}
        >
          {buttonConfig.text}
          <span className="material-symbols-outlined text-sm">{buttonConfig.icon}</span>
        </button>
      </div>
    </div>
  )
}

export function ReviewerOverview({
  stats,
  assignments,
  conferenceCount,
  onSelectPaper,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: ReviewerOverviewProps) {
  const { t } = useTranslation()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Infinite scroll observer
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore()
        }
      },
      { threshold: 0.1 },
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [onLoadMore, hasMore, isLoadingMore])

  const total = assignments.length
  const completed = stats?.completed ?? 0
  const pending = stats?.pending ?? 0

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col gap-6 mb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#141414] mb-2">
              Assigned Papers
            </h2>
            <p className="text-slate-500">{conferenceCount} conferences active</p>
          </div>

          {/* Status Badges */}
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 shadow-sm">
              Total: {total}
            </span>
            <span className="px-3 py-1 bg-green-50 border border-green-100 rounded-full text-xs font-semibold text-green-700 shadow-sm">
              Completed: {completed}
            </span>
            <span className="px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-xs font-semibold text-amber-700 shadow-sm">
              Pending: {pending}
            </span>
          </div>
        </div>
      </div>

      {/* Paper Cards */}
      <div className="flex flex-col gap-6">
        {assignments.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500">No assignments found</p>
          </div>
        ) : (
          assignments.map((assignment) => (
            <PaperCard
              key={assignment.assignment_id}
              assignment={assignment}
              onSelectPaper={onSelectPaper}
            />
          ))
        )}

        {/* Infinite scroll sentinel */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isLoadingMore && <Loader2 className="size-6 animate-spin text-slate-400" />}
          </div>
        )}
      </div>
    </div>
  )
}
