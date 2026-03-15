"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ActionCard,
  ActionCardList,
  MetricCard,
  SectionHeader,
  type ActionPriority,
} from "./action-card"
import { ROUTES } from "@/lib/routes"
import { listConferences } from "@/lib/api/conferences"
import { getConferenceSubmissions } from "@/lib/api/submissions"
import type { Conference } from "@/lib/types"
import { useTranslation } from "@/lib/i18n/translation-context"

interface DashboardMetrics {
  totalSubmissions: number
  reviewsCompleted: number
  reviewsConferences: number
  avgAcceptance: number
  activeConferences: number
  totalConferences: number
}

interface DashboardAction {
  id: string
  conference: string
  conferenceName: string
  year: string
  priority: ActionPriority
  title: string
  description: string
  dueLabel?: string
  dueDate?: string
  statusLabel?: string
  statusDate?: string
  buttonLabel: string
  isOverdue?: boolean
}

const EMPTY_METRICS: DashboardMetrics = {
  totalSubmissions: 0,
  reviewsCompleted: 0,
  reviewsConferences: 0,
  avgAcceptance: 0,
  activeConferences: 0,
  totalConferences: 0,
}

function formatDueDate(value: string | undefined, locale: string): string | undefined {
  if (!value) return undefined
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed.toLocaleDateString(locale, { month: "short", day: "2-digit" })
}

function daysUntil(value?: string): number | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  const now = new Date()
  const delta = parsed.getTime() - now.getTime()
  return Math.ceil(delta / (1000 * 60 * 60 * 24))
}

function buildAction(
  conference: Conference,
  submissionTotal: number,
  t: (key: string, values?: Record<string, string | number>) => string,
  locale: string,
): DashboardAction {
  const dueInDays = daysUntil(conference.submission_deadline)
  const isOverdue = typeof dueInDays === "number" && dueInDays < 0
  const priority: ActionPriority = isOverdue
    ? "urgent"
    : typeof dueInDays === "number" && dueInDays <= 3
      ? "high"
      : "medium"

  return {
    id: conference.id,
    conference: conference.acronym || conference.name,
    conferenceName: conference.name,
    year: String(conference.year),
    priority,
    title: t("runtime.components.chair.chair-dashboard.prop_title_monitor_submissions_reviews"),
    description:
      submissionTotal === 1
        ? t("runtime.components.chair.chair-dashboard.text_submission_count_description_one")
        : t("runtime.components.chair.chair-dashboard.text_submission_count_description", {
            count: submissionTotal,
          }),
    dueLabel:
      dueInDays === null
        ? undefined
        : isOverdue
          ? Math.abs(dueInDays) === 1
            ? t("runtime.components.chair.chair-dashboard.text_days_late_one")
            : t("runtime.components.chair.chair-dashboard.text_days_late", {
                count: Math.abs(dueInDays),
              })
          : dueInDays === 1
            ? t("runtime.components.chair.chair-dashboard.text_due_in_days_one")
            : t("runtime.components.chair.chair-dashboard.text_due_in_days", {
                count: dueInDays,
              }),
    dueDate: formatDueDate(conference.submission_deadline, locale),
    statusLabel: isOverdue ? t("runtime.components.chair.chair-dashboard.text_overdue") : undefined,
    statusDate: isOverdue ? formatDueDate(conference.submission_deadline, locale) : undefined,
    buttonLabel: t("runtime.components.chair.chair-dashboard.text_open_conference"),
    isOverdue,
  }
}

export default function ChairDashboard() {
  const { locale, t } = useTranslation()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics>(EMPTY_METRICS)
  const [actions, setActions] = useState<DashboardAction[]>([])

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true)
      setError(null)

      try {
        const conferencesResponse = await listConferences({
          limit: 200,
          role: "chair",
          myConferences: true,
        })
        const conferences = conferencesResponse.data?.conferences || []

        const totals = await Promise.all(
          conferences.map(async (conference) => {
            const [allSubmissions, acceptedSubmissions] = await Promise.all([
              getConferenceSubmissions(conference.id, { limit: 1, offset: 0 }),
              getConferenceSubmissions(conference.id, { status: "accepted", limit: 1, offset: 0 }),
            ])

            return {
              conference,
              total: allSubmissions.data?.total || 0,
              accepted: acceptedSubmissions.data?.total || 0,
            }
          }),
        )

        const totalSubmissions = totals.reduce((sum, item) => sum + item.total, 0)
        const totalAccepted = totals.reduce((sum, item) => sum + item.accepted, 0)
        const activeConferences = conferences.filter((conf) => conf.status !== "completed").length
        const avgAcceptance =
          totalSubmissions > 0 ? Number(((totalAccepted / totalSubmissions) * 100).toFixed(1)) : 0

        /*
        BACKEND REQUEST: <Implement GET /api/v1/conferences/:conference_id/stats; chair dashboard and conference analytics in frontend currently require synthetic/derived fallback metrics without an authoritative stats contract; return stable aggregates (submission totals, review progress, acceptance metrics, track/time breakdowns) with explicit field schema and empty-state behavior for new conferences.>
        */
        setMetrics({
          totalSubmissions,
          reviewsCompleted: 0,
          reviewsConferences: conferences.length,
          avgAcceptance,
          activeConferences,
          totalConferences: conferences.length,
        })

        setActions(
          totals
            .map((item) =>
              buildAction(item.conference, item.total, t, locale === "vi" ? "vi-VN" : "en-US"),
            )
            .sort((a, b) => {
              const aOverdue = a.isOverdue ? 0 : 1
              const bOverdue = b.isOverdue ? 0 : 1
              if (aOverdue !== bOverdue) return aOverdue - bOverdue
              return (a.dueDate || "").localeCompare(b.dueDate || "")
            })
            .slice(0, 5),
        )
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard")
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [locale, t])

  const lastUpdated = useMemo(
    () => new Date().toLocaleTimeString(locale === "vi" ? "vi-VN" : "en-US"),
    [locale],
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#1B3C53] dark:text-white leading-[1.1]">
            {t("runtime.components.chair.chair-dashboard.text_chair_dashboard")}{" "}
          </h1>
          <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            {t(
              "runtime.components.chair.chair-dashboard.text_overview_amp_management_across_your_conferences",
            )}{" "}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
            {t("runtime.components.chair.chair-dashboard.text_last_updated")} {lastUpdated}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">
          {t("runtime.components.chair.chair-dashboard.text_loading_dashboard")}
        </div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {t("runtime.components.chair.chair-dashboard.text_failed_to_load_dashboard")} {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <MetricCard
              label={t("runtime.components.chair.chair-dashboard.text_total_submissions")}
              value={metrics.totalSubmissions}
            />
            <MetricCard
              label={t("runtime.components.chair.chair-dashboard.text_reviews_completed")}
              value={metrics.reviewsCompleted}
              subtext={t("runtime.components.chair.chair-dashboard.text_across_conferences", {
                count: metrics.reviewsConferences,
              })}
            />
            <MetricCard
              label={t("runtime.components.chair.chair-dashboard.text_avg_acceptance")}
              value={`${metrics.avgAcceptance}%`}
            />
            <MetricCard
              label={t("runtime.components.chair.chair-dashboard.text_active_conferences")}
              value={metrics.activeConferences}
              suffix={`/ ${metrics.totalConferences}`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <SectionHeader
              title={t("runtime.components.chair.chair-dashboard.title_actions_required")}
              actionLabel={t("runtime.components.chair.chair-dashboard.text_view_all")}
              onAction={() => router.push(ROUTES.CHAIR.CONFERENCES)}
            />

            <ActionCardList>
              {actions.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-500">
                  {t(
                    "runtime.components.chair.chair-dashboard.text_no_conference_actions_found",
                  )}{" "}
                </div>
              ) : (
                actions.map((action) => (
                  <ActionCard
                    key={action.id}
                    id={Number(action.id)}
                    conference={action.conference}
                    conferenceName={action.conferenceName}
                    year={action.year}
                    priority={action.priority}
                    title={action.title}
                    description={action.description}
                    dueLabel={action.dueLabel}
                    dueDate={action.dueDate}
                    statusLabel={action.statusLabel}
                    statusDate={action.statusDate}
                    isOverdue={action.isOverdue}
                    buttonLabel={action.buttonLabel}
                    onAction={() => router.push(ROUTES.CHAIR.CONFERENCE_DETAIL(action.id))}
                    onClick={() => router.push(ROUTES.CHAIR.CONFERENCE_DETAIL(action.id))}
                  />
                ))
              )}
            </ActionCardList>
          </div>
        </>
      )}
    </div>
  )
}
