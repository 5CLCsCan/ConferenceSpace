"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useReviewerData } from "@/hooks/use-reviewer-data"
import { ReviewerSidebar } from "./reviewer-sidebar"
import { ReviewerOverview } from "./reviewer-overview"
import { ReviewerConferences } from "./reviewer-conferences"
import { ReviewerInvitations } from "./reviewer-invitations"
import { ConferencePapers } from "./conference-papers"
import { getReviewerPapersForConference, getRecentAssignments } from "@/lib/api/reviewer"
import type { Paper } from "@/lib/types"
import type { AssignmentWithPaper } from "@/lib/api/reviewer"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"

type View = "overview" | "conferences" | "invitations" | "conference-papers"

export function ReviewerDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  // Convert user.id to string, fallback to "1" for development
  const currentReviewerId = user?.id || "1"

  const {
    conferences,
    stats,
    invitations,
    loading,
    error,
    refetch: refetchData,
  } = useReviewerData(currentReviewerId)
  const [activeNav, setActiveNav] = useState<View>("overview")
  const [selectedConferenceId, setSelectedConferenceId] = useState<number | null>(null)
  const [conferencePapers, setConferencePapers] = useState<
    (Paper & { assignment_status: string; due_date: string })[]
  >([])
  const [isFetchingPapers, setIsFetchingPapers] = useState(false)
  const [assignments, setAssignments] = useState<AssignmentWithPaper[]>([])

  // Fetch assignments on mount
  useEffect(() => {
    const fetchAssignments = async () => {
      const response = await getRecentAssignments(currentReviewerId)
      if (response.data) {
        setAssignments(response.data)
      }
    }
    fetchAssignments()
  }, [currentReviewerId])

  const handleSelectConference = async (conferenceId: number) => {
    setIsFetchingPapers(true)
    const response = await getReviewerPapersForConference(currentReviewerId, String(conferenceId))
    
    // API now always returns an array (empty or with papers)
    // Map papers and add due_date fallback
    const papers = (response.data || []).map((paper) => ({
      ...paper,
      due_date: paper.due_date || "",
    }))
    
    setConferencePapers(papers)
    setSelectedConferenceId(conferenceId)
    setActiveNav("conference-papers")
    setIsFetchingPapers(false)
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

  const renderContent = () => {
    if (loading) {
      return <div>{t("dashboard.roles.reviewer.review.loading")}</div> // TODO: Add a proper loader/skeleton component
    }
    if (error) {
      return (
        <div className="text-red-500">
          <p>{t("dashboard.roles.reviewer.review.errors.loadFailed")}</p>
          <pre>{error}</pre>
        </div>
      )
    }

    switch (activeNav) {
      case "overview":
        return (
          <ReviewerOverview
            stats={stats}
            assignments={assignments}
            conferenceCount={conferences.length}
            onSelectPaper={handleSelectPaper}
          />
        )
      case "conferences":
        return (
          <ReviewerConferences
            conferences={conferences}
            onSelectConference={handleSelectConference}
          />
        )
      case "invitations":
        return (
          <ReviewerInvitations
            invitations={invitations}
            onInvitationHandled={refetchData}
            reviewerId={currentReviewerId}
          />
        )
      case "conference-papers":
        const selectedConference = conferences.find((c) => Number(c.id) === selectedConferenceId)
        if (isFetchingPapers) {
          return <div>{t("dashboard.roles.reviewer.review.loading")}</div>
        }
        return (
          <ConferencePapers
            papers={conferencePapers}
            conferenceName={selectedConference?.name || ""}
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
        }}
      />
      <div className="flex-1 p-8 space-y-8">{renderContent()}</div>
    </div>
  )
}