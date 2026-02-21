"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/routes"
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
  const canSubmit = conference.status === "open"
  const showSubmitBlocked = !hasSubmission && !canSubmit

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
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "17.5px",
                width: "17.5px",
                height: "17.5px",
                maxWidth: "17.5px",
                maxHeight: "17.5px",
                minWidth: "17.5px",
                minHeight: "17.5px",
                lineHeight: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transform: "none",
                boxSizing: "border-box",
              }}
            >
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
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            disabled={showSubmitBlocked}
            onClick={() => {
              if (hasSubmission) {
                router.push(`${ROUTES.AUTHOR.SUBMISSIONS}?conferenceId=${conferenceId}`)
              } else if (canSubmit) {
                router.push(`${ROUTES.AUTHOR.NEW_SUBMISSION}?conferenceId=${conferenceId}`)
              }
            }}
            className={cn(
              "h-8 px-3 font-medium text-[11px] rounded-md transition-colors flex items-center gap-1.5",
              showSubmitBlocked
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : "bg-[#1B3C53] text-white hover:bg-[#234C6A]",
            )}
            title={
              showSubmitBlocked
                ? `Submissions are closed. Conference status is '${conference.status}'.`
                : undefined
            }
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "17.5px",
                width: "17.5px",
                height: "17.5px",
                maxWidth: "17.5px",
                maxHeight: "17.5px",
                minWidth: "17.5px",
                minHeight: "17.5px",
                lineHeight: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transform: "none",
                boxSizing: "border-box",
              }}
            >
              {hasSubmission ? "description" : "add_circle"}
            </span>
            {hasSubmission ? "View Submission" : "Submit Paper"}
          </button>
          {showSubmitBlocked && (
            <span className="text-[10px] text-slate-500">
              Submissions are closed for this conference.
            </span>
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
                "py-3 border-b-2 font-medium text-[11px] tracking-wider transition-colors flex items-center gap-1.5",
                activeTab === tab.id
                  ? "border-[#1B3C53] text-[#1B3C53] dark:border-white dark:text-white"
                  : "border-transparent text-slate-400 hover:text-[#1B3C53] dark:hover:text-white",
              )}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: "17.5px",
                  width: "17.5px",
                  height: "17.5px",
                  maxWidth: "17.5px",
                  maxHeight: "17.5px",
                  minWidth: "17.5px",
                  minHeight: "17.5px",
                  lineHeight: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transform: "none",
                  boxSizing: "border-box",
                }}
              >
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
