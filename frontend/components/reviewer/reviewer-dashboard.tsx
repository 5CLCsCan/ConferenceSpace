"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useReviewerData } from "@/hooks/use-reviewer-data"
import { ReviewerSidebar } from "./reviewer-sidebar"
import { ReviewerOverview } from "./reviewer-overview"
import { ReviewerConferences } from "./reviewer-conferences"
import { ReviewerInvitations } from "./reviewer-invitations"
import { ConferencePapers } from "./conference-papers"
import { getReviewerPapersForConference } from "@/lib/api/reviewer"
import { mockReviewAssignments } from "@/lib/mock-data"
import type { Paper } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"

type View = "overview" | "conferences" | "invitations" | "conference-papers"

export function ReviewerDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const currentReviewerId = user?.id || "user-2" // Fallback for dev

  const {
    conferences,
    stats,
    invitations,
    loading,
    error,
    refetch: refetchData,
  } = useReviewerData(currentReviewerId)
  const [activeNav, setActiveNav] = useState<View>("overview")
  const [selectedConferenceId, setSelectedConferenceId] = useState<string | null>(null)
  const [conferencePapers, setConferencePapers] = useState<
    (Paper & { assignment_status: string; due_date: string })[]
  >([])
  const [isFetchingPapers, setIsFetchingPapers] = useState(false)

  const handleSelectConference = async (conferenceId: string) => {
    setIsFetchingPapers(true)
    const response = await getReviewerPapersForConference(currentReviewerId, conferenceId)
    if (response.data) {
      setConferencePapers(response.data)
      setSelectedConferenceId(conferenceId)
      setActiveNav("conference-papers")
    } else {
      // TODO: Handle error with a toast
      console.error(response.error)
    }
    setIsFetchingPapers(false)
  }

  const handleSelectPaper = (paperId: string) => {
    router.push(`/dashboard/reviewer/papers/${paperId}`)
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
            assignments={mockReviewAssignments} // This should be fetched if an endpoint is available
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
        const selectedConference = conferences.find((c) => c.id === selectedConferenceId)
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