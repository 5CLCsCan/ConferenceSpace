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
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
      <div className="px-8 py-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
            {conference.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
              {conference.location || "Online"}
            </span>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              {formatDateRange(conference.conference_date, conference.conference_end_date)}
            </span>
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full border text-xs font-bold uppercase",
                  status.color,
                )}
              >
                {status.label}
              </span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => {
              if (hasSubmission) {
                router.push(`/dashboard/author/submissions?conference=${conferenceId}`)
              } else {
                router.push(`/dashboard/author/submit?conference=${conferenceId}`)
              }
            }}
            className="px-4 py-2 bg-primary text-white font-medium text-sm rounded-lg hover:bg-slate-800 transition-colors shadow-sm shadow-primary/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            {hasSubmission ? "View submission" : "Submit new paper"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 border-t border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <div className="flex space-x-8 min-w-max">
          <TabButton
            active={activeTab === "overview"}
            onClick={() => onTabChange("overview")}
            icon="info"
            label="Overview"
          />
          <TabButton
            active={activeTab === "cfp"}
            onClick={() => onTabChange("cfp")}
            icon="campaign"
            label="Call for Papers"
          />
          <TabButton
            active={activeTab === "dates"}
            onClick={() => onTabChange("dates")}
            icon="event"
            label="Important Dates"
          />
          <TabButton
            active={activeTab === "committee"}
            onClick={() => onTabChange("committee")}
            icon="groups"
            label="Committee"
          />
        </div>
      </div>
    </header>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: string
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "py-4 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors",
        active
          ? "border-navy-900 text-navy-900 dark:border-white dark:text-white"
          : "border-transparent text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white font-medium",
      )}
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
      {label}
    </button>
  )
}
