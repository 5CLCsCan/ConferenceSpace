"use client"

import Link from "next/link"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useReviewerDashboard } from "@/hooks/use-reviewer-dashboard"
import { ROUTES } from "@/lib/routes"
import { useTranslation } from "@/lib/i18n/translation-context"

function StatCard({ label, value }: { label: string; value: number | string }) {
  const { t } = useTranslation()
  return (
    <div className="bg-white dark:bg-slate-800 px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
      <div className="text-3xl font-bold text-[#1B3C53] dark:text-white mt-2">{value}</div>
    </div>
  )
}

export function ReviewerDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const reviewerEmail = user?.email || null
  const { dashboard, isLoading, error } = useReviewerDashboard(reviewerEmail, {
    conferenceLimit: 10,
    conferenceOffset: 0,
    invitationLimit: 10,
    invitationOffset: 0,
    recentAssignmentLimit: 10,
    recentAssignmentOffset: 0,
  })

  if (!user) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
        <Loader2 className="size-5 animate-spin" />
        {t("runtime.components.reviewer.reviewer-dashboard.text_loading_reviewer_dashboard")}{" "}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
        {t("runtime.components.reviewer.reviewer-dashboard.text_failed_to_load_reviewer_dashboard")}{" "}
        {error}
      </div>
    )
  }

  const stats = dashboard?.stats
  const recentAssignments = (dashboard?.recent_assignments || []).filter(
    (a) => a.status !== "suggested",
  )

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-[32px] font-bold tracking-tight text-[#1B3C53] dark:text-white">
          {t("runtime.components.reviewer.reviewer-dashboard.text_reviewer_dashboard")}{" "}
        </h1>
        <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
          {t(
            "runtime.components.reviewer.reviewer-dashboard.text_track_your_review_workload_and_quickly",
          )}{" "}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t("runtime.components.reviewer.reviewer-dashboard.text_total_assigned")}
          value={(stats?.pending || 0) + (stats?.in_progress || 0) + (stats?.completed || 0)}
        />
        <StatCard label={t("runtime.components.reviewer.reviewer-dashboard.text_pending")} value={stats?.pending || 0} />
        <StatCard label={t("runtime.components.reviewer.reviewer-dashboard.text_in_progress")} value={stats?.in_progress || 0} />
        <StatCard label={t("runtime.components.reviewer.reviewer-dashboard.text_completed")} value={stats?.completed || 0} />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-bold tracking-wide text-[#1B3C53] dark:text-white uppercase">
            {t("runtime.components.reviewer.reviewer-dashboard.text_recent_assignments")}{" "}
          </h2>
        </div>
        {recentAssignments.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
            {t("runtime.components.reviewer.reviewer-dashboard.text_no_recent_assignments")}{" "}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {recentAssignments.map((assignment) => (
              <div
                key={assignment.assignment_id}
                className="px-4 py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {assignment.paper_title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {assignment.conference_name}{" "}
                    {t("runtime.components.reviewer.reviewer-dashboard.text_status")}{" "}
                    {assignment.status}
                  </div>
                </div>
                <Link
                  href={`${ROUTES.REVIEWER.ASSIGNMENT(String(assignment.assignment_id))}?conferenceId=${assignment.conference_id}`}
                  className="inline-flex items-center h-8 px-3 rounded-md bg-[#1B3C53] hover:bg-[#234C6A] text-white text-xs font-semibold whitespace-nowrap"
                >
                  {t("runtime.components.reviewer.reviewer-dashboard.text_open")}{" "}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
