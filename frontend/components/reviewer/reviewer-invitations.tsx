"use client"

import { useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import type { ReviewRequest } from "@/lib/types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { respondToReviewRequest } from "@/lib/api/reviewer"
import { useToast } from "@/hooks/use-toast"

// Extended invitation type to match the new design
interface EnhancedInvitation extends ReviewRequest {
  track_name?: string
  respond_by?: string
  deadline?: string
  accepted_on?: string
  declined_on?: string
  rejected_on?: string
  assignments_count?: number
}

interface ReviewerInvitationsProps {
  invitations: EnhancedInvitation[]
  onInvitationHandled: () => void
  reviewerId: string
  onStatusFilterChange?: (status: string) => void
  currentStatusFilter?: string
  currentPage?: number
  totalPages?: number
  totalItems?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  statusCounts?: { all: number; pending: number; accepted: number; rejected: number }
  isRefreshing?: boolean
}

type StatusFilter = "all" | "pending" | "accepted" | "rejected"
type SortOption = "deadline" | "invited" | "conference"

export function ReviewerInvitations({
  invitations,
  onInvitationHandled,
  reviewerId,
  onStatusFilterChange,
  currentStatusFilter = "all",
  currentPage = 1,
  totalPages = 1,
  totalItems,
  pageSize = 5,
  onPageChange,
  statusCounts: externalStatusCounts,
  isRefreshing = false,
}: ReviewerInvitationsProps) {
  const { locale, t } = useTranslation()
  const { toast } = useToast()
  const [handling, setHandling] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("deadline")
  // Use DB-accurate counts from parent when available; fall back to current page counts
  const counts = externalStatusCounts ?? {
    all: totalItems ?? invitations.length,
    pending: invitations.filter((i) => i.status === "pending").length,
    accepted: invitations.filter((i) => i.status === "accepted").length,
    rejected: invitations.filter((i) => i.status === "rejected").length,
  }

  // Generate page numbers with ellipsis
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

  const handleResponse = async (
    conferenceId: string,
    invitationId: string,
    status: "accepted" | "rejected",
  ) => {
    setHandling(invitationId)
    const apiResponse = await respondToReviewRequest(conferenceId, invitationId, status)
    if (apiResponse.data) {
      toast({
        title: t("dashboard.roles.reviewer.invitations.toast.successTitle"),
        description: t("dashboard.roles.reviewer.invitations.toast.successDescription", {
          action: status === "accepted" ? t("common.actions.accept") : t("common.actions.decline"),
        }),
      })
      onInvitationHandled()
    } else {
      toast({
        variant: "destructive",
        title: t("dashboard.roles.reviewer.invitations.toast.errorTitle"),
        description:
          apiResponse.error || t("dashboard.roles.reviewer.invitations.toast.errorDescription"),
      })
    }
    setHandling(null)
  }

  const handleFilterChange = (filter: StatusFilter) => {
    onStatusFilterChange?.(filter)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const sortedInvitations = useMemo(() => {
    const parseTimestamp = (value?: string) => {
      if (!value) {
        return null
      }

      const timestamp = new Date(value).getTime()
      return Number.isNaN(timestamp) ? null : timestamp
    }

    return [...invitations].sort((left, right) => {
      if (sortBy === "conference") {
        return left.conference_name.localeCompare(right.conference_name)
      }

      if (sortBy === "invited") {
        return (
          (parseTimestamp(right.requested_at) ?? Number.NEGATIVE_INFINITY) -
          (parseTimestamp(left.requested_at) ?? Number.NEGATIVE_INFINITY)
        )
      }

      const leftDeadline = parseTimestamp(left.respond_by || left.deadline)
      const rightDeadline = parseTimestamp(right.respond_by || right.deadline)

      if (leftDeadline === null && rightDeadline === null) {
        return (
          (parseTimestamp(right.requested_at) ?? Number.NEGATIVE_INFINITY) -
          (parseTimestamp(left.requested_at) ?? Number.NEGATIVE_INFINITY)
        )
      }

      if (leftDeadline === null) {
        return 1
      }

      if (rightDeadline === null) {
        return -1
      }

      return leftDeadline - rightDeadline
    })
  }, [invitations, sortBy])

  const renderPendingCard = (invitation: EnhancedInvitation) => {
    const isUrgent = invitation.respond_by
      ? new Date(invitation.respond_by) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      : false

    return (
      <div
        key={invitation.id}
        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden relative group"
      >
        <div className="px-4 pt-4 pb-3 flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            {/* Conference badge + Track */}
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded border border-slate-200 dark:border-slate-600">
                {invitation.conference_acronym || invitation.conference_name}
              </span>
              {invitation.track_name && (
                <span className="text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase tracking-widest">
                  {invitation.track_name}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-sm font-bold leading-[1.2] tracking-tight text-[#1B3C53] dark:text-white mb-1 group-hover:text-[#234C6A] dark:group-hover:text-slate-300 transition-colors">
              {invitation.conference_name}
            </h3>

            {/* Description */}
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed max-w-2xl mb-4">
              {t(
                "runtime.components.reviewer.reviewer-invitations.text_you_have_been_invited_to_serve",
              )}{" "}
            </p>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span>
                  {t("runtime.components.reviewer.reviewer-invitations.text_invited")}{" "}
                  <span className="font-semibold text-[#1B3C53] dark:text-white">
                    {formatDate(invitation.requested_at)}
                  </span>
                </span>
              </div>
              {invitation.respond_by && (
                <div className="flex items-center gap-2">
                  <span>
                    {t("runtime.components.reviewer.reviewer-invitations.text_respond_by")}{" "}
                    <span
                      className={`font-semibold ${isUrgent ? "text-amber-600" : "text-[#1B3C53] dark:text-white"}`}
                    >
                      {formatDate(invitation.respond_by)}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-row lg:flex-col items-center justify-center gap-3 w-full lg:w-40 lg:border-l border-slate-100 dark:border-slate-700 lg:pl-4 pt-4 lg:pt-0 border-t lg:border-t-0">
            <button
              onClick={() => handleResponse(invitation.conference_id, invitation.id, "accepted")}
              disabled={handling === invitation.id}
              className="w-full h-8 px-3 rounded-full bg-[#141414] dark:bg-white text-white dark:text-[#141414] font-medium text-[11px] shadow hover:bg-[#2e2e2e] dark:hover:bg-slate-200 transition-all flex items-center justify-center gap-2 border disabled:opacity-50"
            >
              {handling === invitation.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
              )}
              {t("runtime.components.reviewer.reviewer-invitations.text_accept")}{" "}
            </button>
            <button
              onClick={() => handleResponse(invitation.conference_id, invitation.id, "rejected")}
              disabled={handling === invitation.id}
              className="w-full h-8 px-3 rounded-full border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium text-[11px] hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-transparent disabled:opacity-50"
            >
              {t("runtime.components.reviewer.reviewer-invitations.text_decline")}{" "}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderAcceptedCard = (invitation: EnhancedInvitation) => {
    return (
      <div
        key={invitation.id}
        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-200 overflow-hidden relative"
      >
        <div className="px-4 pt-4 pb-3 flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            {/* Conference badge + Status */}
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded border border-slate-200 dark:border-slate-600">
                {invitation.conference_acronym || invitation.conference_name}
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px] !font-bold">
                  check_circle
                </span>
                {t("runtime.components.reviewer.reviewer-invitations.text_accepted")}{" "}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-sm font-bold leading-[1.2] tracking-tight text-[#1B3C53] dark:text-white mb-1">
              {invitation.conference_name}
            </h3>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-slate-500 dark:text-slate-400 mt-2">
              <div className="flex items-center gap-2">
                <span>
                  {t("runtime.components.reviewer.reviewer-invitations.text_accepted_on")}{" "}
                  <span className="font-semibold text-[#1B3C53] dark:text-white">
                    {formatDate(invitation.accepted_on || invitation.requested_at)}
                  </span>
                </span>
              </div>
              {invitation.assignments_count !== undefined && (
                <div className="flex items-center gap-2">
                  <span>
                    {t("runtime.components.reviewer.reviewer-invitations.text_assignments")}{" "}
                    <span className="font-semibold text-[#1B3C53] dark:text-white">
                      {invitation.assignments_count}{" "}
                      {invitation.assignments_count === 1 ? "Paper" : "Papers"}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-row lg:flex-col items-center justify-center gap-3 w-full lg:w-40 lg:border-l border-slate-100 dark:border-slate-700 lg:pl-4 pt-4 lg:pt-0 border-t lg:border-t-0">
            <button className="w-full h-9 px-4 rounded-md bg-[#1B3C53] dark:bg-white text-white dark:text-[#1B3C53] font-medium text-[11px] hover:bg-[#234C6A] dark:hover:bg-slate-200 transition-all flex items-center justify-center">
              {t("runtime.components.reviewer.reviewer-invitations.text_go_to_dashboard")}{" "}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderRejectedCard = (invitation: EnhancedInvitation) => {
    return (
      <div
        key={invitation.id}
        className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-200 overflow-hidden relative"
      >
        <div className="px-4 pt-4 pb-3 flex flex-col lg:flex-row gap-4 opacity-80 hover:opacity-100 transition-opacity">
          <div className="flex-1">
            {/* Conference badge + Status */}
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded">
                {invitation.conference_acronym || invitation.conference_name}
              </span>
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[12px]">cancel</span>
                {t("runtime.components.reviewer.reviewer-invitations.text_declined")}{" "}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-sm font-bold leading-[1.2] tracking-tight text-slate-700 dark:text-slate-300 mb-1">
              {invitation.conference_name}
            </h3>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-slate-500 dark:text-slate-400 mt-2">
              <div className="flex items-center gap-2">
                <span>
                  {t("runtime.components.reviewer.reviewer-invitations.text_declined_on")}{" "}
                  <span className="font-medium">
                    {formatDate(
                      invitation.rejected_on || invitation.declined_on || invitation.requested_at,
                    )}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* No actions */}
          <div className="flex flex-row lg:flex-col items-center justify-center gap-3 w-full lg:w-40 lg:border-l border-slate-200 dark:border-slate-700 lg:pl-4 pt-4 lg:pt-0 border-t lg:border-t-0">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium">
              {t("runtime.components.reviewer.reviewer-invitations.text_no_actions_available")}{" "}
            </span>
          </div>
        </div>
      </div>
    )
  }

  const renderInvitationCard = (invitation: EnhancedInvitation) => {
    switch (invitation.status) {
      case "accepted":
        return renderAcceptedCard(invitation)
      case "rejected":
        return renderRejectedCard(invitation)
      default:
        return renderPendingCard(invitation)
    }
  }

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
      <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-6">
        <span className="material-symbols-outlined text-5xl text-slate-400 dark:text-slate-500">
          mail
        </span>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[#1B3C53] dark:text-white">
          {t("dashboard.roles.reviewer.invitations.empty.title")}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
          {t("dashboard.roles.reviewer.invitations.empty.description")}
        </p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#1B3C53] dark:text-white">
            {t("runtime.components.reviewer.reviewer-invitations.text_reviewer_invitations")}{" "}
          </h1>
          <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            {t(
              "runtime.components.reviewer.reviewer-invitations.text_review_and_respond_to_conference_invitations",
            )}{" "}
          </p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tab Filters */}
        <div className="flex flex-wrap gap-1 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg self-start shadow-sm">
          <button
            onClick={() => handleFilterChange("all")}
            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              currentStatusFilter === "all" || currentStatusFilter === ""
                ? "bg-[#1B3C53] text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-[#1B3C53] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {t("runtime.components.reviewer.reviewer-invitations.text_all")}{" "}
            <span className="opacity-70 ml-0.5 text-[9px]">{counts.all}</span>
          </button>
          <button
            onClick={() => handleFilterChange("pending")}
            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              currentStatusFilter === "pending"
                ? "bg-[#1B3C53] text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-[#1B3C53] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {t("runtime.components.reviewer.reviewer-invitations.text_pending")}{" "}
            <span className="opacity-70 ml-0.5 text-[9px]">{counts.pending}</span>
          </button>
          <button
            onClick={() => handleFilterChange("accepted")}
            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              currentStatusFilter === "accepted"
                ? "bg-[#1B3C53] text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-[#1B3C53] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {t("runtime.components.reviewer.reviewer-invitations.text_accepted")}{" "}
            <span className="opacity-70 ml-0.5 text-[9px]">{counts.accepted}</span>
          </button>
          <button
            onClick={() => handleFilterChange("rejected")}
            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              currentStatusFilter === "rejected"
                ? "bg-[#1B3C53] text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-[#1B3C53] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {t("runtime.components.reviewer.reviewer-invitations.text_declined")}{" "}
            <span className="opacity-70 ml-0.5 text-[9px]">{counts.rejected}</span>
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 tracking-wider">
          {isRefreshing && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
          <span className="material-symbols-outlined text-[16px]">filter_list</span>
          <span className="text-[10px] normal-case">
            {t("runtime.components.reviewer.reviewer-invitations.text_sort_by")}
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-transparent border-none text-[#1B3C53] dark:text-white font-semibold uppercase tracking-wider focus:ring-0 p-0 cursor-pointer text-[10px] pr-8"
          >
            <option value="deadline">
              {t("runtime.components.reviewer.reviewer-invitations.text_deadline_earliest")}
            </option>
            <option value="invited">
              {t("runtime.components.reviewer.reviewer-invitations.text_date_invited_newest")}
            </option>
            <option value="conference">
              {t("runtime.components.reviewer.reviewer-invitations.text_conference_name")}
            </option>
          </select>
        </div>
      </div>

      {/* Invitations List */}
      <div className="space-y-6 pb-12">
        {sortedInvitations.length === 0
          ? renderEmptyState()
          : sortedInvitations.map((invitation) => renderInvitationCard(invitation))}

        {/* Pagination */}
        {totalItems !== undefined && totalItems > 0 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {t("runtime.components.reviewer.reviewer-invitations.text_showing")}{" "}
              <span className="font-bold text-[#1B3C53] dark:text-white">
                {Math.min((currentPage - 1) * pageSize + 1, totalItems)}-
                {Math.min(currentPage * pageSize, totalItems)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-[#1B3C53] dark:text-white">
                {totalItems.toLocaleString()}
              </span>{" "}
              {t("runtime.components.reviewer.reviewer-invitations.text_invitations")}
            </div>

            {totalPages > 1 && (
              <div className="flex gap-1">
                <button
                  onClick={() => onPageChange?.(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("runtime.components.reviewer.reviewer-invitations.text_previous")}
                </button>

                {getPageNumbers().map((page, idx) =>
                  page === "ellipsis" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1.5 text-slate-400 text-[10px] flex items-center"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => onPageChange?.(page)}
                      className={`px-2.5 py-1 rounded text-[10px] ${
                        page === currentPage
                          ? "bg-[#1B3C53] text-white hover:bg-[#234C6A]"
                          : "border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  onClick={() => onPageChange?.(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("runtime.components.reviewer.reviewer-invitations.text_next")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
