"use client"

import { useRef, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import type { ReviewRequest } from "@/lib/types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { respondToReviewRequest } from "@/lib/api/reviewer"
import { useToast } from "@/hooks/use-toast"

// Extended invitation type to match the new design
interface EnhancedInvitation extends ReviewRequest {
  track_name?: string
  respond_by?: string
  accepted_on?: string
  declined_on?: string
  assignments_count?: number
}

interface ReviewerInvitationsProps {
  invitations: EnhancedInvitation[]
  onInvitationHandled: () => void
  reviewerId: string
  onStatusFilterChange?: (status: string) => void
  currentStatusFilter?: string
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
}

type StatusFilter = "all" | "pending" | "accepted" | "declined"
type SortOption = "deadline" | "invited" | "conference"

export function ReviewerInvitations({
  invitations,
  onInvitationHandled,
  reviewerId,
  onStatusFilterChange,
  currentStatusFilter = "all",
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: ReviewerInvitationsProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [handling, setHandling] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("deadline")
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Calculate counts for tabs
  const counts = {
    all: invitations.length,
    pending: invitations.filter((i) => i.status === "pending").length,
    accepted: invitations.filter((i) => i.status === "accepted").length,
    declined: invitations.filter((i) => i.status === "declined").length,
  }

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return

    const options = {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    }

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        onLoadMore()
      }
    }, options)

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observerRef.current.observe(currentRef)
    }

    return () => {
      if (observerRef.current && currentRef) {
        observerRef.current.unobserve(currentRef)
      }
    }
  }, [onLoadMore, hasMore, isLoadingMore])

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
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

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
              You have been invited to serve as a reviewer. The program committee values your
              expertise. Please indicate your availability.
            </p>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span>
                  Invited:{" "}
                  <span className="font-semibold text-[#1B3C53] dark:text-white">
                    {formatDate(invitation.requested_at)}
                  </span>
                </span>
              </div>
              {invitation.respond_by && (
                <div className="flex items-center gap-2">
                  <span>
                    Respond by:{" "}
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
              Accept
            </button>
            <button
              onClick={() => handleResponse(invitation.conference_id, invitation.id, "rejected")}
              disabled={handling === invitation.id}
              className="w-full h-8 px-3 rounded-full border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium text-[11px] hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-transparent disabled:opacity-50"
            >
              Decline
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
                Accepted
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
                  Accepted on:{" "}
                  <span className="font-semibold text-[#1B3C53] dark:text-white">
                    {formatDate(invitation.accepted_on || invitation.requested_at)}
                  </span>
                </span>
              </div>
              {invitation.assignments_count !== undefined && (
                <div className="flex items-center gap-2">
                  <span>
                    Assignments:{" "}
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
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderDeclinedCard = (invitation: EnhancedInvitation) => {
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
                Declined
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
                  Declined on:{" "}
                  <span className="font-medium">
                    {formatDate(invitation.declined_on || invitation.requested_at)}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* No actions */}
          <div className="flex flex-row lg:flex-col items-center justify-center gap-3 w-full lg:w-40 lg:border-l border-slate-200 dark:border-slate-700 lg:pl-4 pt-4 lg:pt-0 border-t lg:border-t-0">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium">
              No actions available
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
      case "declined":
        return renderDeclinedCard(invitation)
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
            Reviewer Invitations
          </h1>
          <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Review and respond to conference invitations requesting your expertise.
          </p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tab Filters */}
        <div className="flex gap-1 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg self-start shadow-sm">
          <button
            onClick={() => handleFilterChange("all")}
            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              currentStatusFilter === "all" || currentStatusFilter === ""
                ? "bg-[#1B3C53] text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-[#1B3C53] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            All <span className="opacity-70 ml-0.5 text-[9px]">{counts.all}</span>
          </button>
          <button
            onClick={() => handleFilterChange("pending")}
            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              currentStatusFilter === "pending"
                ? "bg-[#1B3C53] text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-[#1B3C53] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            Pending <span className="opacity-70 ml-0.5 text-[9px]">{counts.pending}</span>
          </button>
          <button
            onClick={() => handleFilterChange("accepted")}
            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              currentStatusFilter === "accepted"
                ? "bg-[#1B3C53] text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-[#1B3C53] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            Accepted <span className="opacity-70 ml-0.5 text-[9px]">{counts.accepted}</span>
          </button>
          <button
            onClick={() => handleFilterChange("declined")}
            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              currentStatusFilter === "declined"
                ? "bg-[#1B3C53] text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-[#1B3C53] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            Declined <span className="opacity-70 ml-0.5 text-[9px]">{counts.declined}</span>
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <span className="material-symbols-outlined text-[16px]">filter_list</span>
          <span className="text-[10px]">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-transparent border-none text-[#1B3C53] dark:text-white font-black uppercase tracking-wider focus:ring-0 p-0 cursor-pointer text-[10px] pr-8"
          >
            <option value="deadline">Deadline (Earliest)</option>
            <option value="invited">Date Invited (Newest)</option>
            <option value="conference">Conference Name</option>
          </select>
        </div>
      </div>

      {/* Invitations List */}
      <div className="space-y-6 pb-12">
        {invitations.length === 0
          ? renderEmptyState()
          : invitations.map((invitation) => renderInvitationCard(invitation))}

        {/* Infinite scroll sentinel and loading indicator */}
        {hasMore && (
          <div ref={loadMoreRef} className="py-8 flex items-center justify-center">
            {isLoadingMore && (
              <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1B3C53] dark:border-white" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Loading...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
