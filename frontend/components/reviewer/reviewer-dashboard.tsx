"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
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
<<<<<<< HEAD
import { Progress } from "@/components/ui/progress"
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingUp,
  Sparkles,
  Calendar,
} from "lucide-react"
import { mockReviewAssignments, mockPapers, mockConference } from "@/lib/mock-data"
import { formatDate, daysUntilDeadline } from "@/lib/utils"
import Link from "next/link"
import type { ReviewAssignment, Paper } from "@/lib/types"
import { useTranslation } from "@/lib/i18n/translation-context"

export function ReviewerDashboard() {
  const { t } = useTranslation()
  const currentReviewerId = "user-2"
  const assignments = mockReviewAssignments.filter((a) => a.reviewer_id === currentReviewerId)
=======
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { ReviewerConference } from "@/lib/types"

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

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading papers</AlertTitle>
        <AlertDescription>
          <p className="mb-4">{error}</p>
          <Button onClick={onBack} variant="outline" size="sm">
            Back to Conferences
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
  // Convert user.id to string, fallback to "1" for development
  const currentReviewerId = user?.id || "1"
>>>>>>> main

  const [activeNav, setActiveNav] = useState<View>("overview")
  const [selectedConferenceId, setSelectedConferenceId] = useState<string | null>(null)
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
  } = useReviewerDashboard(currentReviewerId, {
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
          const newItems = dashboard.conferences.filter(c => !existingIds.has(c.id))
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
          const newItems = dashboard.invitations.filter(inv => !existingIds.has(inv.id))
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
          const newItems = dashboard.recent_assignments.filter(a => !existingIds.has(a.assignment_id))
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
    // Just navigate - papers will be loaded by ConferencePapers component with SWR
    setSelectedConferenceId(conferenceId)
    setActiveNav("conference-papers")
  }

  const handleSelectPaper = (paperId: string, conferenceId?: string) => {
    // Use provided conferenceId or fall back to selectedConferenceId
    const cid = conferenceId || selectedConferenceId
    const conferenceParam = cid ? `?conference_id=${cid}` : ''
    router.push(`/dashboard/reviewer/papers/${paperId}${conferenceParam}`)
  }

  const handleBackToConferences = () => {
    setSelectedConferenceId(null)
    setActiveNav("conferences")
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
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("dashboard.roles.reviewer.review.errors.loadFailed")}</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">{error}</p>
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
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data</AlertTitle>
          <AlertDescription>
            {t("dashboard.roles.reviewer.review.errors.noData")}
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
            reviewerId={currentReviewerId}
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
            reviewerId={currentReviewerId}
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
<<<<<<< HEAD
    <div className="space-y-8">
      {/* Deadline Banner */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">{t("dashboard.reviewer.dashboard.deadlineApproaching")}</h2>
              <p className="text-muted-foreground mb-4">
                {t("dashboard.reviewer.dashboard.completeBefore")} {formatDate(mockConference.review_deadline)}
              </p>
              <Badge variant="outline" className="gap-1">
                <Calendar className="size-3" />
                {daysUntilDeadline(mockConference.review_deadline)} {t("dashboard.reviewer.dashboard.daysRemaining")}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold mb-2">
                {stats.completed}/{stats.total}
              </div>
              <p className="text-sm text-muted-foreground">{t("dashboard.reviewer.dashboard.reviewsCompleted")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.reviewer.dashboard.totalAssigned")}
            </CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.reviewer.dashboard.pending")}</CardTitle>
            <AlertCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.reviewer.dashboard.inProgress")}</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.reviewer.dashboard.completionRate")}
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Review Progress */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.reviewer.dashboard.overallProgress")}</CardTitle>
          <CardDescription>{t("dashboard.reviewer.dashboard.trackCompletion")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{t("dashboard.reviewer.dashboard.completedReviews")}</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-3" />
          </div>
          <div className="grid md:grid-cols-3 gap-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="size-3 rounded-full bg-destructive" />
              <div className="text-sm">
                <div className="font-medium">{stats.pending}</div>
                <div className="text-muted-foreground">{t("dashboard.reviewer.dashboard.pending")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-3 rounded-full bg-warning" />
              <div className="text-sm">
                <div className="font-medium">{stats.inProgress}</div>
                <div className="text-muted-foreground">{t("dashboard.reviewer.dashboard.inProgress")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-3 rounded-full bg-success" />
              <div className="text-sm">
                <div className="font-medium">{stats.completed}</div>
                <div className="text-muted-foreground">{t("dashboard.reviewer.dashboard.completed")}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Papers */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.reviewer.dashboard.assignedPapers")}</CardTitle>
          <CardDescription>{t("dashboard.reviewer.dashboard.papersWaiting")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignments.map((assignment) => {
            const paper = mockPapers.find((p) => p.id === assignment.paper_id)
            if (!paper) return null
            return <AssignedPaperCard key={assignment.id} assignment={assignment} paper={paper} />
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function AssignedPaperCard({ assignment, paper }: { assignment: ReviewAssignment; paper: Paper }) {
  const daysLeft = daysUntilDeadline(assignment.due_date)
  const isUrgent = daysLeft <= 7

  const { t } = useTranslation()
  
  const statusConfig = {
    pending: {
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      label: t("dashboard.reviewer.dashboard.notStarted"),
    },
    in_progress: {
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
      label: t("dashboard.reviewer.dashboard.inProgress"),
    },
    completed: {
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
      label: t("dashboard.reviewer.dashboard.completed"),
    },
  }

  const config = statusConfig[assignment.status]
  const StatusIcon = config.icon

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${config.bgColor}`}>
                <StatusIcon className={`size-5 ${config.color}`} />
              </div>
              <div className="flex-1">
                <Link href={`/reviewer/papers/${paper.id}`} className="hover:underline">
                  <h3 className="font-semibold text-lg mb-2">{paper.title}</h3>
                </Link>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{paper.abstract}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{t("dashboard.reviewer.dashboard.due")} {formatDate(assignment.due_date)}</span>
                  {isUrgent && (
                    <>
                      <span>•</span>
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="size-3" />
                        {daysLeft} {t("dashboard.reviewer.dashboard.daysLeft")}
                      </Badge>
                    </>
                  )}
                  {assignment.ai_match_score && (
                    <>
                      <span>•</span>
                      <Badge variant="secondary" className="gap-1">
                        <Sparkles className="size-3" />
                        {assignment.ai_match_score}% {t("dashboard.reviewer.dashboard.match")}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={config.color}>
                {config.label}
              </Badge>
              {paper.keywords.slice(0, 3).map((keyword) => (
                <Badge key={keyword} variant="outline">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          <Button
            variant={assignment.status === "completed" ? "outline" : "default"}
            size="sm"
            asChild
          >
            <Link href={`/reviewer/papers/${paper.id}`}>
              {assignment.status === "completed" ? t("dashboard.reviewer.dashboard.viewReview") : t("dashboard.reviewer.dashboard.startReview")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
=======
    <div className="flex min-h-screen bg-background">
      <ReviewerSidebar
        activeNav={activeNav}
        setActiveNav={(nav) => {
          setActiveNav(nav as View)
          setSelectedConferenceId(null)
        }}
      />
      <div className="flex-1 p-8 space-y-8">{renderContent()}</div>
    </div>
  )
}
>>>>>>> main
