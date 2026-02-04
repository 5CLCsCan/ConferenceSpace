"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Conference, TabType } from "./types"
import { formatDateRange, getConferenceStatus } from "./utils"

interface ConferenceHeaderProps {
  conference: Conference
  conferenceId: string
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  hasSubmission: boolean
}

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "info" },
  { id: "cfp", label: "Call for Papers", icon: "campaign" },
  { id: "dates", label: "Important Dates", icon: "event" },
  { id: "committee", label: "Committee", icon: "groups" },
]

export function ConferenceHeader({
  conference,
  conferenceId,
  activeTab,
  onTabChange,
  hasSubmission,
}: ConferenceHeaderProps) {
  const router = useRouter()
  const status = getConferenceStatus(conference)

  return (
    <header
      className={cn(
        "bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30",
      )}
    >
      {/* Title Section */}
      <div className="px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              folder_open
            </span>
            <span>Conferences</span>
            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
              chevron_right
            </span>
            <span className="font-semibold text-[#1B3C53] dark:text-white">
              {conference.acronym} {conference.year}
            </span>
          </div>

          {/* Title */}
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[#1B3C53] dark:text-white tracking-tight">
              {conference.name}
            </h1>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-tight">
              {conference.acronym} {conference.year}
            </span>
          </div>

          {/* Meta */}
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                location_on
              </span>
              {conference.location || "Online"}
            </span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                calendar_month
              </span>
              {formatDateRange(conference.conference_date, conference.conference_end_date)}
            </span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span
              className={cn(
                "px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider",
                status.color,
              )}
            >
              {status.label}
            </span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (hasSubmission) {
                router.push(`/dashboard/author/submissions?conference=${conferenceId}`)
              } else {
                router.push(`/dashboard/author/submit?conference=${conferenceId}`)
              }
            }}
            className="h-8 px-3 bg-[#1B3C53] text-white font-medium text-[11px] rounded-md hover:bg-[#234C6A] transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              {hasSubmission ? "description" : "add_circle"}
            </span>
            {hasSubmission ? "View Submission" : "Submit Paper"}
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
                "py-3 border-b-2 font-medium text-[11px] tracking-wider transition-colors flex items-center gap-1.5",
                activeTab === tab.id
                  ? "border-[#1B3C53] text-[#1B3C53] dark:border-white dark:text-white"
                  : "border-transparent text-slate-400 hover:text-[#1B3C53] dark:hover:text-white",
              )}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
