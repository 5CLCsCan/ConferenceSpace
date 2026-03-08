"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { getConferenceSubmissions } from "@/lib/api/submissions"
import { getConferenceById } from "@/lib/api/conferences"
import { DashboardStatsCard, DashboardStatsGrid } from "./dashboard-stats-card"
import { ChairActionsPanel } from "./chair-actions-panel"
import { useTranslation } from "@/lib/i18n/translation-context"

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
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    acceptedSubmissions: 0,
    reviewingSubmissions: 0,
    daysToSubmissionDeadline: 0,
    hasSubmissionDeadline: false,
  })

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true)
      setError(null)

      try {
        const [conferenceResponse, totalResponse, acceptedResponse, reviewingResponse] =
          await Promise.all([
            getConferenceById(conferenceId),
            getConferenceSubmissions(conferenceId, { limit: 1, offset: 0 }),
            getConferenceSubmissions(conferenceId, { status: "accepted", limit: 1, offset: 0 }),
            getConferenceSubmissions(conferenceId, { status: "reviewing", limit: 1, offset: 0 }),
          ])

        if (conferenceResponse.error || !conferenceResponse.data) {
          setError(
            conferenceResponse.error ||
              t(
                "runtime.components.chair.conference-detail.conference-detail-dashboard.text_failed_to_load_conference_dashboard",
              ),
          )
          return
        }

        const conference = conferenceResponse.data
        const submissionDeadline = conference.submission_deadline
          ? new Date(conference.submission_deadline)
          : null
        const hasSubmissionDeadline =
          !!submissionDeadline && !Number.isNaN(submissionDeadline.getTime())
        const daysToSubmissionDeadline = hasSubmissionDeadline
          ? Math.ceil((submissionDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : 0

        setStats({
          totalSubmissions: totalResponse.data?.total || 0,
          acceptedSubmissions: acceptedResponse.data?.total || 0,
          reviewingSubmissions: reviewingResponse.data?.total || 0,
          daysToSubmissionDeadline,
          hasSubmissionDeadline,
        })
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : t(
                "runtime.components.chair.conference-detail.conference-detail-dashboard.text_failed_to_load_conference_dashboard",
              ),
        )
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [conferenceId, t])

  if (loading) {
    return (
      <div className="text-xs text-slate-500">
        {t(
          "runtime.components.chair.conference-detail.conference-detail-dashboard.text_loading_dashboard",
        )}
      </div>
    )
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
  const isSubmissionDeadlineOverdue =
    stats.hasSubmissionDeadline && stats.daysToSubmissionDeadline < 0
  const deadlineValue = stats.hasSubmissionDeadline
    ? String(Math.abs(stats.daysToSubmissionDeadline))
    : "—"
  const deadlineSubtext = !stats.hasSubmissionDeadline
    ? t(
        "runtime.components.chair.conference-detail.conference-detail-dashboard.text_no_submission_deadline_configured",
      )
    : isSubmissionDeadlineOverdue
      ? t(
          "runtime.components.chair.conference-detail.conference-detail-dashboard.text_submission_deadline_has_passed",
        )
      : t(
          "runtime.components.chair.conference-detail.conference-detail-dashboard.text_until_submission_deadline",
        )

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <DashboardStatsGrid>
            <DashboardStatsCard
              label={t(
                "runtime.components.chair.conference-detail.conference-detail-dashboard.text_total_submissions",
              )}
              value={String(stats.totalSubmissions)}
              icon="description"
              subtext={t(
                "runtime.components.chair.conference-detail.conference-detail-dashboard.text_live_submissions_count",
              )}
            />
            <DashboardStatsCard
              label={t(
                "runtime.components.chair.conference-detail.conference-detail-dashboard.text_under_review",
              )}
              value={String(stats.reviewingSubmissions)}
              icon="rate_review"
              subtext={t(
                "runtime.components.chair.conference-detail.conference-detail-dashboard.text_current_reviewing_workload",
              )}
            />
            <DashboardStatsCard
              label={t(
                "runtime.components.chair.conference-detail.conference-detail-dashboard.text_acceptance_rate",
              )}
              value={`${acceptanceRate}%`}
              icon="verified"
              subtext={t(
                "runtime.components.chair.conference-detail.conference-detail-dashboard.text_accepted_count",
                {
                  count: stats.acceptedSubmissions,
                },
              )}
            />
            <DashboardStatsCard
              label={t(
                "runtime.components.chair.conference-detail.conference-detail-dashboard.text_days_to_deadline",
              )}
              value={deadlineValue}
              icon="event"
              subtext={deadlineSubtext}
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
        {t(
          "runtime.components.chair.conference-detail.conference-detail-dashboard.text_advanced_analytics_review_progress_timelines_track",
        )}{" "}
      </div>
    </div>
  )
}
