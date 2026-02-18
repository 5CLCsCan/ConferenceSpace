"use client"

import { useEffect, useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { ReviewerInvitations } from "@/components/reviewer/reviewer-invitations"
import { useNotifications } from "@/hooks/use-notifications"
import { useReviewerDashboard } from "@/hooks/use-reviewer-dashboard"
import { useAuth } from "@/lib/auth-context"
import { InvitationsSkeleton } from "@/components/reviewer/loading-skeletons"
import { getReviewerMenuItems } from "@/components/reviewer/menu-items"

export default function ReviewerInvitationsPage() {
  const { user } = useAuth()
  const { unreadCount } = useNotifications({ limit: 1 })
  const reviewerEmail = user?.email || ""

  const [invitationOffset, setInvitationOffset] = useState(0)
  const [invitationStatusFilter, setInvitationStatusFilter] = useState("")
  const [allInvitations, setAllInvitations] = useState<any[]>([])

  const { dashboard, isLoading, refresh } = useReviewerDashboard(reviewerEmail, {
    invitationStatus: invitationStatusFilter,
    invitationLimit: 20,
    invitationOffset,
    conferenceLimit: 1,
    conferenceOffset: 0,
  })

  useEffect(() => {
    if (!dashboard?.invitations) {
      return
    }

    if (invitationOffset === 0) {
      setAllInvitations(dashboard.invitations)
      return
    }

    setAllInvitations((prev) => {
      const existingIds = new Set(prev.map((invitation) => invitation.id))
      const newItems = dashboard.invitations.filter((invitation: any) => !existingIds.has(invitation.id))
      return [...prev, ...newItems]
    })
  }, [dashboard?.invitations, invitationOffset])

  useEffect(() => {
    setInvitationOffset(0)
    setAllInvitations([])
  }, [invitationStatusFilter])

  if (!user) {
    return null
  }

  const hasMoreInvitations = dashboard?.total_invitations
    ? allInvitations.length < dashboard.total_invitations
    : false

  return (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={getReviewerMenuItems(unreadCount)} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto py-8 px-12 w-full">
          {isLoading && allInvitations.length === 0 ? (
            <InvitationsSkeleton />
          ) : (
            <ReviewerInvitations
              invitations={allInvitations}
              onInvitationHandled={async () => {
                await refresh()
              }}
              reviewerId={reviewerEmail}
              onStatusFilterChange={(status) => {
                setInvitationStatusFilter(status === "all" ? "" : status)
                setInvitationOffset(0)
                setAllInvitations([])
              }}
              currentStatusFilter={invitationStatusFilter || "all"}
              onLoadMore={() => {
                if (!isLoading && hasMoreInvitations) {
                  setInvitationOffset((prev) => prev + 20)
                }
              }}
              hasMore={hasMoreInvitations}
              isLoadingMore={isLoading && invitationOffset > 0}
            />
          )}
        </div>
      </main>
    </div>
  )
}
