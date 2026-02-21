"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/routes"
import type { ConferenceInfo } from "./types"
import type { SubmissionSubTab, SubmissionDetailStatus } from "./submission-detail/types"
import { SubmissionStatusBadge } from "./submission-detail/components"

const SUB_TABS: { id: SubmissionSubTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "reviews", label: "Reviews & Feedback" },
  { id: "discussion", label: "Discussion" },
  { id: "history", label: "History" },
]

interface SubmissionDetailHeaderProps {
  conference: ConferenceInfo
  conferenceId: string
  submissionTitle: string
  submissionDisplayId: string
  submissionTrack: string
  submissionStatus: SubmissionDetailStatus
  activeTab: SubmissionSubTab
  onTabChange: (tab: SubmissionSubTab) => void
  className?: string
}

export function SubmissionDetailHeader({
  conference,
  conferenceId,
  submissionTitle,
  submissionDisplayId,
  submissionTrack,
  submissionStatus,
  activeTab,
  onTabChange,
  className,
}: SubmissionDetailHeaderProps) {
  const router = useRouter()

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
              onClick={() => router.push(ROUTES.CHAIR.CONFERENCES)}
              className="hover:text-[#1B3C53] dark:hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                folder_open
              </span>
              <span>Conferences</span>
            </button>
            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
              chevron_right
            </span>
            <button
              onClick={() => router.push(ROUTES.CHAIR.CONFERENCE_DETAIL(conferenceId))}
              className="font-semibold text-[#1B3C53] dark:text-white hover:underline"
            >
              {conference.acronym} {conference.year}
            </button>
            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
              chevron_right
            </span>
            <button
              onClick={() => router.push(ROUTES.CHAIR.CONFERENCE_SUBMISSIONS(conferenceId))}
              className="hover:text-[#1B3C53] dark:hover:text-white transition-colors"
            >
              Submissions
            </button>
            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
              chevron_right
            </span>
            <span className="font-semibold text-[#1B3C53] dark:text-white">
              Submission {submissionDisplayId}
            </span>
          </div>

          {/* Title */}
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[#1B3C53] dark:text-white tracking-tight truncate">
              {submissionTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span>
                Track:{" "}
                <strong className="text-slate-700 dark:text-slate-300">{submissionTrack}</strong>
              </span>
              <SubmissionStatusBadge status={submissionStatus} />
              <span className="text-[10px] text-slate-400">{submissionDisplayId}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="h-8 px-3 bg-white border border-slate-200 text-slate-600 font-medium text-[11px] rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-1.5">
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              settings
            </span>
            Settings
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
        <div className="flex space-x-6 min-w-max">
          {SUB_TABS.map((tab) => (
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
