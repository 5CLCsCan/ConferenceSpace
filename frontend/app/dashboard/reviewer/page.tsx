"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ReviewerDashboard } from "@/components/reviewer/reviewer-dashboard"
import { ReviewerConferences } from "@/components/reviewer/reviewer-conferences"
import { ReviewerInvitations } from "@/components/reviewer/reviewer-invitations"
import { useReviewerDashboard } from "@/hooks/use-reviewer-dashboard"
import { useAuth } from "@/lib/auth-context"
import { useDebounce } from "@/hooks/use-debounce"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useNotifications } from "@/hooks/use-notifications"
import { ConferencesSkeleton, InvitationsSkeleton } from "@/components/reviewer/loading-skeletons"
import {
  MOCK_MY_CONFERENCES,
  MOCK_EXPLORE_CONFERENCES,
} from "@/components/reviewer/reviewer-mock-data"

type TabView = "conferences" | "invitations"

export default function ReviewerPage() {
  const { isAuthenticated, user } = useAuth()
  const { unreadCount } = useNotifications({ limit: 1 })
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authChecked, setAuthChecked] = useState(false)

  // Get current tab from URL
  const currentTab = searchParams.get("tab") as TabView | null

  // State for conferences and invitations
  const [conferenceSearch, setConferenceSearch] = useState("")
  const [conferenceOffset, setConferenceOffset] = useState(0)
  const [invitationOffset, setInvitationOffset] = useState(0)
  const [invitationStatusFilter, setInvitationStatusFilter] = useState("")
  const [allConferences, setAllConferences] = useState<any[]>([])
  const [allInvitations, setAllInvitations] = useState<any[]>([])

  const debouncedConferenceSearch = useDebounce(conferenceSearch, 500)
  const currentReviewerEmail = user?.email || ""

  // Fetch dashboard data for conferences/invitations tabs
  const { dashboard, isLoading, refresh } = useReviewerDashboard(currentReviewerEmail, {
    conferenceSearch: debouncedConferenceSearch,
    invitationStatus: invitationStatusFilter,
    conferenceLimit: 20,
    conferenceOffset,
    invitationLimit: 20,
    invitationOffset,
  })

  // Auth check
  useEffect(() => {
    const timer = setTimeout(() => setAuthChecked(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      router.push("/login")
    }
  }, [authChecked, isAuthenticated, router])

  // Accumulate conferences
  useEffect(() => {
    if (dashboard?.conferences) {
      if (conferenceOffset === 0) {
        setAllConferences(dashboard.conferences)
      } else {
        setAllConferences((prev) => {
          const existingIds = new Set(prev.map((c) => c.id))
          const newItems = dashboard.conferences.filter((c: any) => !existingIds.has(c.id))
          return [...prev, ...newItems]
        })
      }
    }
  }, [dashboard?.conferences, conferenceOffset])

  // Accumulate invitations
  useEffect(() => {
    if (dashboard?.invitations) {
      if (invitationOffset === 0) {
        setAllInvitations(dashboard.invitations)
      } else {
        setAllInvitations((prev) => {
          const existingIds = new Set(prev.map((inv) => inv.id))
          const newItems = dashboard.invitations.filter((inv: any) => !existingIds.has(inv.id))
          return [...prev, ...newItems]
        })
      }
    }
  }, [dashboard?.invitations, invitationOffset])

  // Reset on search change
  useEffect(() => {
    setConferenceOffset(0)
    setAllConferences([])
  }, [debouncedConferenceSearch])

  useEffect(() => {
    setInvitationOffset(0)
    setAllInvitations([])
  }, [invitationStatusFilter])

  if (!authChecked || !isAuthenticated || !user) {
    return null
  }

  const hasMoreConferences = dashboard?.total_conferences
    ? allConferences.length < dashboard.total_conferences
    : false
  const hasMoreInvitations = dashboard?.total_invitations
    ? allInvitations.length < dashboard.total_invitations
    : false

  const handleSelectConference = (conferenceId: number) => {
    // Navigate to conference-specific assigned papers route
    router.push(`/dashboard/conference/${conferenceId}/reviewer/assigned`)
  }

  const reviewerMenuItems = [
    { label: "Dashboard", href: "/dashboard/reviewer", icon: "grid_view" },
    { label: "Conferences", href: "/dashboard/reviewer?tab=conferences", icon: "calendar_month" },
    { label: "Invitations", href: "/dashboard/reviewer?tab=invitations", icon: "mail" },
    { label: "Notifications", href: "/notifications", icon: "notifications", badge: unreadCount },
  ]

  // Render content based on tab
  const renderContent = () => {
    if (currentTab === "conferences") {
      if (isLoading && allConferences.length === 0) {
        return <ConferencesSkeleton />
      }
      return (
        <ReviewerConferences
          conferences={allConferences.length > 0 ? allConferences : MOCK_MY_CONFERENCES}
          exploreConferences={MOCK_EXPLORE_CONFERENCES}
          onSelectConference={handleSelectConference}
          onLoadMore={() => {
            if (!isLoading && hasMoreConferences) {
              setConferenceOffset((prev) => prev + 20)
            }
          }}
          hasMore={hasMoreConferences}
          isLoadingMore={isLoading && conferenceOffset > 0}
          searchQuery={conferenceSearch}
          onSearchChange={setConferenceSearch}
        />
      )
    }

    if (currentTab === "invitations") {
      if (isLoading && allInvitations.length === 0) {
        return <InvitationsSkeleton />
      }
      return (
        <ReviewerInvitations
          invitations={allInvitations}
          onInvitationHandled={async () => await refresh()}
          reviewerId={currentReviewerEmail}
          onStatusFilterChange={(status) =>
            setInvitationStatusFilter(status === "all" ? "" : status)
          }
          currentStatusFilter={invitationStatusFilter || "all"}
          onLoadMore={() => {
            if (!isLoading && hasMoreInvitations) {
              setInvitationOffset((prev) => prev + 20)
            }
          }}
          hasMore={hasMoreInvitations}
          isLoadingMore={isLoading && invitationOffset > 0}
        />
      )
    }

    // No tab = show main dashboard
    return <ReviewerDashboard />
  }

  return (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={reviewerMenuItems} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto px-10 md:px-16 py-8 md:py-12 w-full">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-slate-400">
                Loading...
              </div>
            }
          >
            {renderContent()}
          </Suspense>
        </div>
      </main>
    </div>
  )
}
