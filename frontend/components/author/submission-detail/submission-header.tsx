"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import type { Submission } from "@/lib/api/submissions"
import type { Conference } from "@/lib/types"
import { ROUTES } from "@/lib/routes"
import { useTranslation } from "@/lib/i18n/translation-context"
import { tStatic as t } from "@/lib/i18n/static-translate"

// Scholar-Compact status badge matching chair role design
const statusConfig: Record<string, { label: string; className: string }> = {
  draft: {
    label: t("runtime.components.author.submission-detail.submission-header.prop_label_draft"),
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  published: {
    label: t("runtime.components.author.submission-detail.submission-header.prop_label_published"),
    className: "bg-blue-50 text-blue-700 border-blue-100",
  },
  reviewing: {
    label: t(
      "runtime.components.author.submission-detail.submission-header.prop_label_under_review",
    ),
    className: "bg-yellow-50 text-yellow-700 border-yellow-100",
  },
  under_review: {
    label: t(
      "runtime.components.author.submission-detail.submission-header.prop_label_under_review",
    ),
    className: "bg-yellow-50 text-yellow-700 border-yellow-100",
  },
  accepted: {
    label: t("runtime.components.author.submission-detail.submission-header.prop_label_accepted"),
    className: "bg-green-50 text-green-700 border-green-100",
  },
  rejected: {
    label: t("runtime.components.author.submission-detail.submission-header.prop_label_rejected"),
    className: "bg-red-50 text-red-700 border-red-100",
  },
  pending_decision: {
    label: t(
      "runtime.components.author.submission-detail.submission-header.prop_label_pending_decision",
    ),
    className: "bg-purple-50 text-purple-700 border-purple-100",
  },
  withdrawn: {
    label: t("runtime.components.author.submission-detail.submission-header.prop_label_withdrawn"),
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  revision_requested: {
    label: t(
      "runtime.components.author.submission-detail.submission-header.prop_label_revision_requested",
    ),
    className: "bg-amber-50 text-amber-700 border-amber-100",
  },
}

function SubmissionStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const config = statusConfig[status] || {
    label: status,
    className: "bg-slate-100 text-slate-600 border-slate-200",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
        config.className,
      )}
    >
      {config.label}
    </span>
  )
}

type TabId = "overview" | "discussion" | "rebuttal"

const TABS: { id: TabId; label: string }[] = [
  {
    id: "overview",
    label: t("runtime.components.author.submission-detail.submission-header.prop_label_overview"),
  },
  {
    id: "discussion",
    label: t("runtime.components.author.submission-detail.submission-header.prop_label_discussion"),
  },
  {
    id: "rebuttal",
    label: t("runtime.components.author.submission-detail.submission-header.prop_label_rebuttal"),
  },
]

interface SubmissionHeaderProps {
  submission: Submission
  conferenceId: string
  conferenceName?: string
  conference?: Conference | null
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  className?: string
}

export function SubmissionHeader({
  submission,
  conferenceId,
  conferenceName,
  conference,
  activeTab,
  onTabChange,
  className,
}: SubmissionHeaderProps) {
  const router = useRouter()
  const { user } = useAuth()
  const isAuthor = user?.email === submission.author
  const submissionDeadline = conference?.configurations?.full_paper_submission_deadline
    ? new Date(conference.configurations.full_paper_submission_deadline)
    : null
  const isDeadlinePassed = submissionDeadline !== null && new Date() > submissionDeadline
  const canEditSubmission =
    isAuthor &&
    !isDeadlinePassed &&
    submission.status !== "accepted" &&
    submission.status !== "rejected"

  return (
    <header
      className={cn(
        "bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30",
        className,
      )}
    >
      {/* Title Section */}
      <div className="px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
            <button
              onClick={() => router.push(ROUTES.AUTHOR.SUBMISSIONS)}
              className="hover:text-[#1B3C53] dark:hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                description
              </span>
              <span>
                {t(
                  "runtime.components.author.submission-detail.submission-header.text_my_submissions",
                )}
              </span>
            </button>
            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
              chevron_right
            </span>
            <button
              onClick={() => router.push(ROUTES.AUTHOR.CONFERENCE_DETAIL(conferenceId))}
              className="font-semibold text-[#1B3C53] dark:text-white hover:underline"
            >
              {conferenceName || "Conference"}
            </button>
            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
              chevron_right
            </span>
            <span className="font-semibold text-[#1B3C53] dark:text-white">
              {t("runtime.components.author.submission-detail.submission-header.text_submission")}
              {submission.id}
            </span>
          </div>

          {/* Title */}
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[#1B3C53] dark:text-white tracking-tight truncate">
              {submission.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              {submission.information?.track_name && (
                <span>
                  {t("runtime.components.author.submission-detail.submission-header.text_track")}{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {submission.information.track_name}
                  </strong>
                </span>
              )}
              <SubmissionStatusBadge status={submission.status} />
              <span className="text-[10px] text-slate-400">#{submission.id}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canEditSubmission && (
            <button
              type="button"
              onClick={() =>
                router.push(
                  `${ROUTES.AUTHOR.SUBMISSION_EDIT(String(submission.id))}?conferenceId=${conferenceId}`,
                )
              }
              className="h-8 px-3 bg-white border border-slate-200 text-slate-600 font-medium text-[11px] rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                edit_document
              </span>
              {t("runtime.components.author.submission-detail.submission-header.text_edit")}{" "}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
        <div className="flex space-x-6 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "py-3 border-b-2 font-medium text-[11px] tracking-wider transition-colors",
                activeTab === tab.id
                  ? "border-[#1B3C53] text-[#1B3C53] dark:border-white dark:text-white"
                  : "border-transparent text-slate-400 hover:text-[#1B3C53] dark:hover:text-white",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}

export type { TabId }
