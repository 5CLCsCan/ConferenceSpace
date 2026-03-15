"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { getConferenceById, getConferenceStats } from "@/lib/api/conferences"
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
    reviewCompleted: 0,
    reviewPending: 0,
    acceptanceRate: 0,
    daysToSubmissionDeadline: 0,
    hasSubmissionDeadline: false,
  })
  const [status, setStatus] = useState<string | undefined>(undefined)

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true)
      setError(null)

      try {
        const [conferenceResponse, statsResponse] = await Promise.all([
          getConferenceById(conferenceId),
          getConferenceStats(conferenceId),
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

        const s = statsResponse.data
        setStats({
          totalSubmissions: s?.total_submissions ?? 0,
          acceptedSubmissions: Math.round(
            ((s?.acceptance_rate ?? 0) / 100) * (s?.total_submissions ?? 0),
          ),
          reviewCompleted: s?.review_progress.completed ?? 0,
          reviewPending: s?.review_progress.pending ?? 0,
          acceptanceRate: s?.acceptance_rate ?? 0,
          daysToSubmissionDeadline,
          hasSubmissionDeadline,
        })
        setStatus(conference.status)
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
              value={String(stats.reviewCompleted)}
              icon="rate_review"
              subtext={`${stats.reviewPending} pending`}
            />
            <DashboardStatsCard
              label={t(
                "runtime.components.chair.conference-detail.conference-detail-dashboard.text_acceptance_rate",
              )}
              value={`${stats.acceptanceRate.toFixed(1)}%`}
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
            conferenceStatus={status as any}
            onNavigateToAssignments={onNavigateToAssignments}
          />
        </div>
      </div>
    </div>
  )
}
