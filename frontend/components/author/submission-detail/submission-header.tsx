"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import type { Submission } from "@/lib/api/submissions"
import { ROUTES } from "@/lib/routes"

// Scholar-Compact status badge matching chair role design
const statusConfig: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  published: {
    label: "Published",
    className: "bg-blue-50 text-blue-700 border-blue-100",
  },
  under_review: {
    label: "Under Review",
    className: "bg-yellow-50 text-yellow-700 border-yellow-100",
  },
  accepted: {
    label: "Accepted",
    className: "bg-green-50 text-green-700 border-green-100",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 border-red-100",
  },
  pending_decision: {
    label: "Pending Decision",
    className: "bg-purple-50 text-purple-700 border-purple-100",
  },
  withdrawn: {
    label: "Withdrawn",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  revision_requested: {
    label: "Revision Requested",
    className: "bg-amber-50 text-amber-700 border-amber-100",
  },
}

function SubmissionStatusBadge({ status }: { status: string }) {
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
  { id: "overview", label: "Overview" },
  { id: "discussion", label: "Discussion" },
  { id: "rebuttal", label: "Rebuttal" },
]

interface SubmissionHeaderProps {
  submission: Submission
  conferenceId: string
  conferenceName?: string
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  className?: string
}

export function SubmissionHeader({
  submission,
  conferenceId,
  conferenceName,
  activeTab,
  onTabChange,
  className,
}: SubmissionHeaderProps) {
  const router = useRouter()
  const { user } = useAuth()
  const isAuthor = user?.email === submission.author

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
              <span>My Submissions</span>
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
              Submission #{submission.id}
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
                  Track:{" "}
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
          {isAuthor && submission.status === "draft" && (
            <Link
              href={`${ROUTES.AUTHOR.SUBMISSION_EDIT(String(submission.id))}?conferenceId=${conferenceId}`}
              className="h-8 px-3 bg-white border border-slate-200 text-slate-600 font-medium text-[11px] rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                edit_document
              </span>
              Edit
            </Link>
          )}
          <button className="h-8 px-3 bg-[#1B3C53] text-white font-medium text-[11px] rounded-md hover:bg-[#234C6A] transition-colors flex items-center gap-1.5">
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              upload
            </span>
            Upload Revision
          </button>
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
