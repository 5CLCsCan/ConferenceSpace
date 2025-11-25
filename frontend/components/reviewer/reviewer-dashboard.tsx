"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useReviewerDashboard } from "@/hooks/use-reviewer-dashboard"
import { useConferencePapers } from "@/hooks/use-conference-papers"
import { useDebounce } from "@/hooks/use-debounce"
import { ReviewerSidebar } from "./reviewer-sidebar"
import { ReviewerOverview } from "./reviewer-overview"
import { ReviewerConferences } from "./reviewer-conferences"
import { ReviewerInvitations } from "./reviewer-invitations"
import { ConferencePapers } from "./conference-papers"
import { DashboardSkeleton, ConferencesSkeleton, InvitationsSkeleton, PapersSkeleton } from "./loading-skeletons"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { ReviewerConference } from "@/lib/types"
import { typography, spacing, iconSizes } from "@/lib/typography"

type View = "overview" | "conferences" | "invitations" | "conference-papers"

// Wrapper component to handle papers with SWR
function ConferencePapersWithSWR({
  reviewerId,
  conferenceId,
  conferences,
  onBack,
  onSelectPaper,
}: {
  reviewerId: string
  conferenceId: string
  conferences: ReviewerConference[]
  onBack: () => void
  onSelectPaper: (paperId: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 500)

  const { papers, isLoading, error } = useConferencePapers(
    reviewerId,
    conferenceId,
    {
      search: debouncedSearch,
      status: statusFilter,
      limit: 20,
    }
  )

  const selectedConference = conferences.find((c) => c.id === conferenceId)

  const { t } = useTranslation()

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className={iconSizes.sm} />
        <AlertTitle className={typography.h6}>
          {t("dashboard.roles.reviewer.review.errors.loadFailed")}
        </AlertTitle>
        <AlertDescription>
          <p className={`mb-4 ${typography.body}`}>{error}</p>
          <Button onClick={onBack} variant="outline" size="sm">
            {t("common.actions.goBack")}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return <PapersSkeleton />
  }

  return (
    <ConferencePapers
      papers={papers}
      conferenceName={selectedConference?.name || ""}
      onBack={onBack}
      onSelectPaper={onSelectPaper}
    />
  )
}
export function ReviewerDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  // Use email for reviewer endpoints
  const currentReviewerEmail = user?.email || ""

  // Read initial state from URL
  const initialTab = (searchParams.get("tab") as View) || "overview"
  const initialConferenceId = searchParams.get("conference_id") || null

  const [activeNav, setActiveNav] = useState<View>(initialTab)
  const [selectedConferenceId, setSelectedConferenceId] = useState<string | null>(initialConferenceId)
  const [invitationStatusFilter, setInvitationStatusFilter] = useState<string>("")
  const [conferenceSearch, setConferenceSearch] = useState<string>("")
  
  // Pagination states for infinite scroll
  const [conferenceOffset, setConferenceOffset] = useState(0)
  const [invitationOffset, setInvitationOffset] = useState(0)
  const [assignmentOffset, setAssignmentOffset] = useState(0)
  const [allConferences, setAllConferences] = useState<any[]>([])
  const [allInvitations, setAllInvitations] = useState<any[]>([])
  const [allAssignments, setAllAssignments] = useState<any[]>([])

  // Debounce search to avoid excessive API calls
  const debouncedConferenceSearch = useDebounce(conferenceSearch, 500)
  
  // Reset offsets when search/filter changes
  useEffect(() => {
    setConferenceOffset(0)
    setAllConferences([])
  }, [debouncedConferenceSearch])
  
  useEffect(() => {
    setInvitationOffset(0)
    setAllInvitations([])
  }, [invitationStatusFilter])
  
  // Reset assignments when switching to overview (optional, for fresh data)
  useEffect(() => {
    if (activeNav === 'overview') {
      setAssignmentOffset(0)
      setAllAssignments([])
    }
  }, [activeNav])

  // Use SWR hook with caching for dashboard data
  const {
    dashboard,
    isLoading,
    error,
    refresh,
    updateOptimistic,
  } = useReviewerDashboard(currentReviewerEmail, {
    conferenceSearch: debouncedConferenceSearch,
    invitationStatus: invitationStatusFilter,
    conferenceLimit: 20, // Load 20 at a time for infinite scroll
    conferenceOffset: conferenceOffset,
    invitationLimit: 20, // Load 20 at a time for infinite scroll
    invitationOffset: invitationOffset,
    recentAssignmentLimit: 20, // Load 20 at a time for infinite scroll
    recentAssignmentOffset: assignmentOffset,
  })
  
  // Accumulate conferences for infinite scroll
  useEffect(() => {
    if (dashboard?.conferences) {
      if (conferenceOffset === 0) {
        // First load or reset
        setAllConferences(dashboard.conferences)
      } else {
        // Append new items, filter out duplicates by ID
        setAllConferences(prev => {
          const existingIds = new Set(prev.map(c => c.id))
          const newItems = dashboard.conferences.filter((c: any) => !existingIds.has(c.id))
          return [...prev, ...newItems]
        })
      }
    }
  }, [dashboard?.conferences, conferenceOffset])
  
  // Accumulate invitations for infinite scroll
  useEffect(() => {
    if (dashboard?.invitations) {
      if (invitationOffset === 0) {
        // First load or reset
        setAllInvitations(dashboard.invitations)
      } else {
        // Append new items, filter out duplicates by ID
        setAllInvitations(prev => {
          const existingIds = new Set(prev.map(inv => inv.id))
          const newItems = dashboard.invitations.filter((inv: any) => !existingIds.has(inv.id))
          return [...prev, ...newItems]
        })
      }
    }
  }, [dashboard?.invitations, invitationOffset])
  
  // Accumulate assignments for infinite scroll
  useEffect(() => {
    if (dashboard?.recent_assignments) {
      if (assignmentOffset === 0) {
        // First load or reset
        setAllAssignments(dashboard.recent_assignments)
      } else {
        // Append new items, filter out duplicates by assignment ID
        setAllAssignments(prev => {
          const existingIds = new Set(prev.map(a => a.assignment_id))
          const newItems = dashboard.recent_assignments.filter((a: any) => !existingIds.has(a.assignment_id))
          return [...prev, ...newItems]
        })
      }
    }
  }, [dashboard?.recent_assignments, assignmentOffset])
  
  // Calculate if there's more data to load based on total counts
  const hasMoreConferences = dashboard?.total_conferences ? allConferences.length < dashboard.total_conferences : false
  const hasMoreInvitations = dashboard?.total_invitations ? allInvitations.length < dashboard.total_invitations : false
  const hasMoreAssignments = dashboard?.total_assignments ? allAssignments.length < dashboard.total_assignments : false
  
  // Load more functions
  const loadMoreConferences = useCallback(() => {
    if (!isLoading && hasMoreConferences) {
      setConferenceOffset(prev => prev + 20)
    }
  }, [isLoading, hasMoreConferences])
  
  const loadMoreInvitations = useCallback(() => {
    if (!isLoading && hasMoreInvitations) {
      setInvitationOffset(prev => prev + 20)
    }
  }, [isLoading, hasMoreInvitations])
  
  const loadMoreAssignments = useCallback(() => {
    if (!isLoading && hasMoreAssignments) {
      setAssignmentOffset(prev => prev + 20)
    }
  }, [isLoading, hasMoreAssignments])

  const handleSelectConference = (conferenceId: string) => {
    setSelectedConferenceId(conferenceId)
    setActiveNav("conference-papers")
    // Update URL for back/refresh
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "conference-papers")
    params.set("conference_id", conferenceId)
    router.replace(`?${params.toString()}`)
  }

  const handleSelectPaper = (paperId: string, conferenceId?: string) => {
    // Use provided conferenceId or fall back to selectedConferenceId
    const cid = conferenceId || selectedConferenceId
    // Track the current tab and conference context for back navigation
    const params = new URLSearchParams()
    if (cid) params.set('conference_id', cid)
    // If currently viewing conference-papers, set from=conference-papers, else from=activeNav
    if (activeNav === 'conference-papers' && cid) {
      params.set('from', 'conference-papers')
      params.set('from_conference_id', cid)
    } else {
      params.set('from', activeNav)
    }
    router.push(`/dashboard/reviewer/papers/${paperId}?${params.toString()}`)
  }

  const handleBackToConferences = () => {
    setSelectedConferenceId(null)
    setActiveNav("conferences")
    // Update URL for back/refresh
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "conferences")
    params.delete("conference_id")
    router.replace(`?${params.toString()}`)
  }

  // Optimistic update for invitation response
  const handleInvitationResponse = async () => {
    // Revalidate after API call completes in the child component
    await refresh()
  }

  const renderContent = () => {
    // Error state with retry button
    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className={iconSizes.sm} />
          <AlertTitle className={typography.h6}>
            {t("dashboard.roles.reviewer.review.errors.loadFailed")}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className={`mb-4 ${typography.body}`}>{error}</p>
            <Button onClick={() => refresh()} variant="outline" size="sm">
              {t("common.actions.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      )
    }

    // Loading state with skeleton
    if (isLoading) {
      switch (activeNav) {
        case "conferences":
          return <ConferencesSkeleton />
        case "invitations":
          return <InvitationsSkeleton />
        default:
          return <DashboardSkeleton />
      }
    }

    // No data
    if (!dashboard) {
      return (
        <Alert>
          <AlertCircle className={iconSizes.sm} />
          <AlertTitle className={typography.h6}>{t("common.messages.noData")}</AlertTitle>
          <AlertDescription className={typography.body}>
            {t("common.messages.noData")}
          </AlertDescription>
        </Alert>
      )
    }

    const { stats, recent_assignments } = dashboard

    switch (activeNav) {
      case "overview":
        return (
          <ReviewerOverview
            stats={stats}
            assignments={allAssignments}
            conferenceCount={dashboard?.total_conferences ?? allConferences.length}
            onSelectPaper={handleSelectPaper}
            onLoadMore={loadMoreAssignments}
            hasMore={hasMoreAssignments}
            isLoadingMore={isLoading && assignmentOffset > 0}
          />
        )
      case "conferences":
        return (
          <ReviewerConferences
            conferences={allConferences}
            onSelectConference={(id) => handleSelectConference(String(id))}
            onLoadMore={loadMoreConferences}
            hasMore={hasMoreConferences}
            isLoadingMore={isLoading && conferenceOffset > 0}
            searchQuery={conferenceSearch}
            onSearchChange={setConferenceSearch}
          />
        )
      case "invitations":
        return (
          <ReviewerInvitations
            invitations={allInvitations}
            onInvitationHandled={handleInvitationResponse}
            reviewerId={currentReviewerEmail}
            onStatusFilterChange={(status) => setInvitationStatusFilter(status === "all" ? "" : status)}
            currentStatusFilter={invitationStatusFilter || "all"}
            onLoadMore={loadMoreInvitations}
            hasMore={hasMoreInvitations}
            isLoadingMore={isLoading && invitationOffset > 0}
          />
        )
      case "conference-papers":
        if (!selectedConferenceId) return null
        return (
          <ConferencePapersWithSWR
            reviewerId={currentReviewerEmail}
            conferenceId={selectedConferenceId}
            conferences={allConferences}
            onBack={handleBackToConferences}
            onSelectPaper={handleSelectPaper}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <ReviewerSidebar
        activeNav={activeNav}
        setActiveNav={(nav) => {
          setActiveNav(nav as View)
          setSelectedConferenceId(null)
          // Update URL for tab switch
          const params = new URLSearchParams(searchParams.toString())
          params.set("tab", nav)
          params.delete("conference_id")
          router.replace(`?${params.toString()}`)
        }}
      />
      <div className={`flex-1 ${spacing.padding.cardLarge} ${spacing.section}`}>
        {renderContent()}
      </div>
    </div>
  )
}