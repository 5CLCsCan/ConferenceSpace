"use client"

import { useState } from "react"
import { useReviewerData } from "@/hooks/use-reviewer-data"
import { ReviewerSidebar } from "./reviewer-sidebar"
import { ReviewerOverview } from "./reviewer-overview"
import { ReviewerConferences } from "./reviewer-conferences"
import { ReviewerInvitations } from "./reviewer-invitations"
import { ConferencePapers } from "./conference-papers"
import { PaperReview } from "./paper-review"
import { getReviewerPapersForConference } from "@/lib/api/reviewer"
import { mockPapers, mockReviewAssignments } from "@/lib/mock-data"
import type { Paper } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

type View = "overview" | "conferences" | "invitations" | "conference-papers" | "paper-review"

export function ReviewerDashboard() {
  const { user } = useAuth()
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
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null)
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
    setSelectedPaperId(paperId)
    setActiveNav("paper-review")
  }

  const handleBackToConferences = () => {
    setSelectedConferenceId(null)
    setActiveNav("conferences")
  }

  const handleBackToPapers = () => {
    setSelectedPaperId(null)
    setActiveNav("conference-papers")
  }

  const renderContent = () => {
    if (loading) {
      return <div>Loading...</div> // TODO: Add a proper loader/skeleton component
    }
    if (error) {
      return (
        <div className="text-red-500">
          <p>Error loading dashboard data:</p>
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
          return <div>Loading papers...</div>
        }
        return (
          <ConferencePapers
            papers={conferencePapers}
            conferenceName={selectedConference?.name || ""}
            onBack={handleBackToConferences}
            onSelectPaper={handleSelectPaper}
          />
        )
      case "paper-review":
        // In a real app, you'd fetch the full paper details here
        const selectedPaper = mockPapers.find((p) => p.id === selectedPaperId)
        if (!selectedPaper) return <div>Paper not found</div>
        return <PaperReview paper={selectedPaper} onBack={handleBackToPapers} />
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
          setSelectedPaperId(null)
        }}
      />
      <div className="flex-1 p-8 space-y-8">{renderContent()}</div>
    </div>
  )
}
