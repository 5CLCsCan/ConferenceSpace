"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { getConferenceSubmissions } from "@/lib/api/submissions"
import { getConferenceById } from "@/lib/api/conferences"
import { DashboardStatsCard, DashboardStatsGrid } from "./dashboard-stats-card"
import { ChairActionsPanel } from "./chair-actions-panel"

interface ConferenceDetailDashboardProps {
  conferenceId: string
  onNavigateToAssignments?: () => void
  className?: string
}

export function ConferenceDetailDashboard({
  conferenceId,
  onNavigateToAssignments,
  className,
}: ConferenceDetailDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    acceptedSubmissions: 0,
    reviewingSubmissions: 0,
    daysToSubmissionDeadline: 0,
  })

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true)
      setError(null)

      const [conferenceResponse, totalResponse, acceptedResponse, reviewingResponse] =
        await Promise.all([
          getConferenceById(conferenceId),
          getConferenceSubmissions(conferenceId, { limit: 1, offset: 0 }),
          getConferenceSubmissions(conferenceId, { status: "accepted", limit: 1, offset: 0 }),
          getConferenceSubmissions(conferenceId, { status: "reviewing", limit: 1, offset: 0 }),
        ])

      if (conferenceResponse.error || !conferenceResponse.data) {
        setError(conferenceResponse.error || "Failed to load conference dashboard")
        setLoading(false)
        return
      }

      const conference = conferenceResponse.data
      const submissionDeadline = conference.submission_deadline
        ? new Date(conference.submission_deadline)
        : null
      const daysToSubmissionDeadline =
        submissionDeadline && !Number.isNaN(submissionDeadline.getTime())
          ? Math.ceil((submissionDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : 0

      setStats({
        totalSubmissions: totalResponse.data?.total || 0,
        acceptedSubmissions: acceptedResponse.data?.total || 0,
        reviewingSubmissions: reviewingResponse.data?.total || 0,
        daysToSubmissionDeadline,
      })
      setLoading(false)
    }

    void loadDashboard()
  }, [conferenceId])

  if (loading) {
    return <div className="text-xs text-slate-500">Loading dashboard...</div>
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        {error}
      </div>
    )
  }

  const acceptanceRate =
    stats.totalSubmissions > 0
      ? ((stats.acceptedSubmissions / stats.totalSubmissions) * 100).toFixed(1)
      : "0.0"

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <DashboardStatsGrid>
            <DashboardStatsCard
              label="Total Submissions"
              value={String(stats.totalSubmissions)}
              icon="description"
              subtext="Live submissions count"
            />
            <DashboardStatsCard
              label="Under Review"
              value={String(stats.reviewingSubmissions)}
              icon="rate_review"
              subtext="Current reviewing workload"
            />
            <DashboardStatsCard
              label="Acceptance Rate"
              value={`${acceptanceRate}%`}
              icon="verified"
              subtext={`${stats.acceptedSubmissions} accepted`}
            />
            <DashboardStatsCard
              label="Days to Deadline"
              value={String(stats.daysToSubmissionDeadline)}
              icon="event"
              subtext="Until submission deadline"
            />
          </DashboardStatsGrid>
        </div>

        <div className="lg:col-span-1">
          <ChairActionsPanel
            conferenceId={conferenceId}
            onNavigateToAssignments={onNavigateToAssignments}
          />
        </div>
      </div>

      {/*
      BACKEND REQUEST: <Implement GET /api/v1/conferences/:conference_id/stats; chair dashboard and conference analytics in frontend currently require synthetic/derived fallback metrics without an authoritative stats contract; return stable aggregates (submission totals, review progress, acceptance metrics, track/time breakdowns) with explicit field schema and empty-state behavior for new conferences.>
      */}
      <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Advanced analytics (review progress timelines, track-level acceptance, and operational
        aggregates) require the backend conference stats contract and are intentionally shown as
        unavailable until that endpoint exists.
      </div>
    </div>
  )
}
