"use client"

/**
 * Conference Dashboard Component
 * Displays conference statistics and analytics
 * Role-based visibility: Chair sees all, Author/Reviewer see limited info
 *
 * Data Sources:
 * - Statistics: GET /api/conferences/:id/stats (aggregated from papers, reviews tables)
 */

import { useEffect, useState } from "react"
import type { ConferenceStats } from "@/lib/types"
import { getConferenceStats } from "@/lib/api/conferences"
import { Card } from "@/components/ui/card"
import { TrendingUp, FileText, Users, CheckCircle } from "lucide-react"
import { typography, spacing, iconSizes } from "@/lib/typography"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"

interface ConferenceDashboardProps {
  conferenceId: string
}

export function ConferenceDashboard({ conferenceId }: ConferenceDashboardProps) {
  const { t } = useTranslation()
  const { currentRole } = useAuth()
  const [stats, setStats] = useState<ConferenceStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      const response = await getConferenceStats(conferenceId)
      if (response.data) {
        setStats(response.data)
      }
      setLoading(false)
    }

    loadStats()
  }, [conferenceId])

  const chartColors = ["var(--chart-1)", "var(--chart-3)", "var(--chart-2)", "var(--chart-4)"]
  const axisTick = { fill: "var(--muted-foreground)", fontSize: 12 }

  const isChair = currentRole === "chair"
  const showFullStats = isChair
  const showCharts = isChair

  if (loading) {
    return (
      <div className={spacing.section}>
        <div className="flex items-center justify-center h-64">
          <p className={`${typography.body} text-muted-foreground`}>
            {t("dashboard.chair.createConference.dashboard.loading")}
          </p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className={spacing.section}>
        <div className="flex items-center justify-center h-64">
          <p className={`${typography.body} text-muted-foreground`}>
            {t("dashboard.chair.createConference.dashboard.noData")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={spacing.section}>
      {/* Header */}
      <div>
        <h1 className={typography.h1}>{t("dashboard.chair.createConference.dashboard.title")}</h1>
        <p className={`mt-1 ${typography.body} text-muted-foreground`}>
          {isChair
            ? t("dashboard.chair.createConference.dashboard.descriptionChair")
            : t("dashboard.chair.createConference.dashboard.descriptionOther")}
        </p>
      </div>

      {/* Key Metrics - Chair sees all, others see limited */}
      <div className={`grid ${spacing.gap.md} md:grid-cols-2 lg:grid-cols-4`}>
        <Card className={spacing.padding.card}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${typography.label} text-muted-foreground`}>
                {t("dashboard.chair.createConference.dashboard.totalSubmissions")}
              </p>
              <p className={`mt-1 ${typography.stats} text-foreground`}>
                {stats.total_submissions}
              </p>
            </div>
            <div className="rounded-lg bg-primary/10 p-2">
              <FileText className={`${iconSizes.md} text-primary`} />
            </div>
          </div>
        </Card>

        {showFullStats && (
          <>
            <Card className={spacing.padding.card}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${typography.label} text-muted-foreground`}>
                    {t("dashboard.chair.createConference.dashboard.totalReviews")}
                  </p>
                  <p className={`mt-1 ${typography.stats} text-foreground`}>
                    {stats.total_reviews}
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2">
                  <Users className={`${iconSizes.md} text-primary`} />
                </div>
              </div>
            </Card>

            <Card className={spacing.padding.card}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${typography.label} text-muted-foreground`}>
                    {t("dashboard.chair.createConference.dashboard.acceptanceRate")}
                  </p>
                  <p className={`mt-1 ${typography.stats} text-foreground`}>
                    {stats.acceptance_rate}%
                  </p>
                </div>
                <div className="rounded-lg bg-success/10 p-2">
                  <CheckCircle className={`${iconSizes.md} text-success`} />
                </div>
              </div>
            </Card>

            <Card className={spacing.padding.card}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${typography.label} text-muted-foreground`}>
                    {t("dashboard.chair.createConference.dashboard.avgReviewsPerPaper")}
                  </p>
                  <p className={`mt-1 ${typography.stats} text-foreground`}>
                    {stats.avg_reviews_per_paper.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2">
                  <TrendingUp className={`${iconSizes.md} text-primary`} />
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Charts Section - Only for Chair */}
      {showCharts && (
        <div className={`grid ${spacing.gap.md} lg:grid-cols-2`}>
          {/* Submissions by Track */}
          <Card className={spacing.padding.card}>
            <h3 className={typography.h5}>
              {t("dashboard.chair.createConference.dashboard.submissionsByTrack")}
            </h3>
            <p className={`mt-1 ${typography.caption}`}>
              {t("dashboard.chair.createConference.dashboard.submissionsByTrackDesc")}
            </p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.submissions_by_track}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="track" tick={axisTick} />
                  <YAxis tick={axisTick} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Review Progress */}
          <Card className={spacing.padding.card}>
            <h3 className={typography.h5}>
              {t("dashboard.chair.createConference.dashboard.reviewProgress")}
            </h3>
            <p className={`mt-1 ${typography.caption}`}>
              {t("dashboard.chair.createConference.dashboard.reviewProgressDesc")}
            </p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: t("dashboard.chair.createConference.dashboard.completed"),
                        value: stats.review_progress.completed,
                      },
                      {
                        name: t("dashboard.chair.createConference.dashboard.inProgress"),
                        value: stats.review_progress.in_progress,
                      },
                      {
                        name: t("dashboard.chair.createConference.dashboard.pending"),
                        value: stats.review_progress.pending,
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => {
                      const p = typeof percent === "number" ? percent : 0
                      return `${name}: ${(p * 100).toFixed(0)}%`
                    }}
                    outerRadius={100}
                    fill="var(--chart-1)"
                    dataKey="value"
                  >
                    {[0, 1, 2].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
