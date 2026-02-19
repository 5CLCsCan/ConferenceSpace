import type { ReactNode } from "react"
import type { ConferenceReviewProgress, ConferenceSetupStatus } from "./types"

// -------------------------------------------------------------------------
// Progress Section - for active conferences with review progress
// -------------------------------------------------------------------------

interface ProgressSectionProps {
  progress: ConferenceReviewProgress
}

export function ProgressSection({ progress }: ProgressSectionProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-100 dark:border-slate-600">
      <div className="flex justify-between items-end mb-1.5">
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
          {progress.label}
        </span>
        <span className="text-xs font-bold text-[#1B3C53] dark:text-white">{progress.value}%</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1 mb-2 overflow-hidden">
        <div
          className="bg-[#1B3C53] dark:bg-slate-300 h-1 rounded-full transition-all duration-500"
          style={{ width: `${progress.value}%` }}
        />
      </div>
      <div className="flex justify-between items-center text-[10px] font-medium text-slate-400">
        {progress.submissions > 0 && (
          <span>
            <strong className="text-[#1B3C53] dark:text-white">
              {progress.submissions.toLocaleString()}
            </strong>{" "}
            Submissions
          </span>
        )}
        {progress.daysLeft > 0 && (
          <span>
            {progress.submissions === 0 && "Due in "}
            <strong className="text-[#1B3C53] dark:text-white">{progress.daysLeft}</strong>
            {progress.submissions > 0 ? " Days left" : " days"}
          </span>
        )}
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------
// Setup Status Section - for planning conferences
// -------------------------------------------------------------------------

interface SetupStatusSectionProps {
  setup: ConferenceSetupStatus
}

export function SetupStatusSection({ setup }: SetupStatusSectionProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-100 dark:border-slate-600">
      <div className="flex justify-between items-end mb-1.5">
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
          Setup Status
        </span>
        {setup.actionRequired && (
          <span className="text-[8px] font-black text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded border border-orange-100 dark:border-orange-800 uppercase tracking-widest">
            Action Required
          </span>
        )}
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1 mb-1.5 overflow-hidden">
        <div
          className="bg-blue-600 dark:bg-blue-400 h-1 rounded-full transition-all duration-500"
          style={{ width: `${setup.progress}%` }}
        />
      </div>
      <div className="text-right text-[10px] font-medium text-slate-400">Phase: {setup.phase}</div>
    </div>
  )
}

// -------------------------------------------------------------------------
// Draft Status Section - for draft conferences
// -------------------------------------------------------------------------

interface DraftStatusSectionProps {
  daysAgo: number
}

export function DraftStatusSection({ daysAgo }: DraftStatusSectionProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-100 dark:border-slate-600 flex flex-col justify-center items-center text-center h-[80px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
      <span className="material-symbols-outlined text-slate-300 dark:text-slate-500 text-[24px] mb-1 group-hover:text-[#1B3C53] dark:group-hover:text-white transition-colors">
        edit_document
      </span>
      <span className="text-[10px] font-medium text-slate-400">Draft saved {daysAgo} days ago</span>
    </div>
  )
}

// -------------------------------------------------------------------------
// Completed Stats Section - for completed/archived conferences
// -------------------------------------------------------------------------

interface CompletedStatsSectionProps {
  acceptedPapers: number
}

export function CompletedStatsSection({ acceptedPapers }: CompletedStatsSectionProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-100 dark:border-slate-600">
      <div className="flex justify-between items-center text-[10px] font-medium text-slate-400">
        <span>Accepted Papers</span>
        <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
          {acceptedPapers.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------
// Generic Event Section Wrapper - for custom dynamic content
// -------------------------------------------------------------------------

interface EventSectionProps {
  children: ReactNode
  className?: string
}

export function EventSection({ children, className = "" }: EventSectionProps) {
  return (
    <div
      className={`bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-100 dark:border-slate-600 ${className}`}
    >
      {children}
    </div>
  )
}
