"use client"

import { useState, useCallback } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { ReviewerInvitations } from "@/components/reviewer/reviewer-invitations"
import { useNotifications } from "@/hooks/use-notifications"
import { useReviewerDashboard } from "@/hooks/use-reviewer-dashboard"
import { useAuth } from "@/lib/auth-context"
import { InvitationsSkeleton } from "@/components/reviewer/loading-skeletons"
import { getSidebarMenuItems } from "@/lib/navigation"

const PAGE_SIZE = 5

export default function ReviewerInvitationsPage() {
  const { user } = useAuth()
  const { unreadCount } = useNotifications({ limit: 1 })
  const reviewerEmail = user?.email || ""

  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")

  const { dashboard, isLoading, refresh } = useReviewerDashboard(reviewerEmail, {
    invitationStatus: statusFilter,
    invitationLimit: PAGE_SIZE,
    invitationOffset: (currentPage - 1) * PAGE_SIZE,
    conferenceLimit: 1,
    conferenceOffset: 0,
  })

  // Lightweight calls to get per-status totals for tab badges (invitationLimit: 1 → minimal data transfer)
  const { dashboard: pendingCountDash } = useReviewerDashboard(reviewerEmail, {
    invitationStatus: "pending",
    invitationLimit: 1,
    invitationOffset: 0,
    conferenceLimit: 1,
    conferenceOffset: 0,
  })
  const { dashboard: acceptedCountDash } = useReviewerDashboard(reviewerEmail, {
    invitationStatus: "accepted",
    invitationLimit: 1,
    invitationOffset: 0,
    conferenceLimit: 1,
    conferenceOffset: 0,
  })
  const { dashboard: declinedCountDash } = useReviewerDashboard(reviewerEmail, {
    invitationStatus: "declined",
    invitationLimit: 1,
    invitationOffset: 0,
    conferenceLimit: 1,
    conferenceOffset: 0,
  })

  const pendingCount = pendingCountDash?.total_invitations ?? 0
  const acceptedCount = acceptedCountDash?.total_invitations ?? 0
  const declinedCount = declinedCountDash?.total_invitations ?? 0
  const statusCounts = {
    all: pendingCount + acceptedCount + declinedCount,
    pending: pendingCount,
    accepted: acceptedCount,
    declined: declinedCount,
  }

  const invitations = dashboard?.invitations || []
  const total = dashboard?.total_invitations ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page)
      }
    },
    [totalPages],
  )

  const handleStatusFilterChange = useCallback((status: string) => {
    setStatusFilter(status === "all" ? "" : status)
    setCurrentPage(1)
  }, [])

  if (!user) {
    return null
  }

  return (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={getSidebarMenuItems("reviewer", unreadCount)} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto py-8 px-12 w-full">
          {isLoading && invitations.length === 0 ? (
            <InvitationsSkeleton />
          ) : (
            <ReviewerInvitations
              invitations={invitations}
              onInvitationHandled={refresh}
              reviewerId={reviewerEmail}
              onStatusFilterChange={handleStatusFilterChange}
              currentStatusFilter={statusFilter || "all"}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
              statusCounts={statusCounts}
            />
          )}
        </div>
      </main>
    </div>
  )
}
