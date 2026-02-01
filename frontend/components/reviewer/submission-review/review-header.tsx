"use client"

import type { SubmissionDetails } from "./types"

// =============================================================================
// Review Header Component - Breadcrumbs and Deadline Bar
// =============================================================================

interface ReviewHeaderBarProps {
  submission: SubmissionDetails
}

export function ReviewHeaderBar({ submission }: ReviewHeaderBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <a href="#" className="hover:text-[#2563eb] transition-colors">
          {submission.conference.acronym}
        </a>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <a href="#" className="hover:text-[#2563eb] transition-colors">
          My Reviews
        </a>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-slate-900 font-medium">Paper #{submission.id}</span>
      </nav>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-800">
          <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          Deadline: {submission.daysLeft} Days Left
        </span>
        <div className="h-6 w-px bg-slate-200" />
        <button className="text-slate-500 hover:text-slate-900 transition-colors">
          <span className="material-symbols-outlined">help</span>
        </button>
      </div>
    </header>
  )
}

// =============================================================================
// Paper Header Component - Title, Badges, Metadata
// =============================================================================

interface PaperHeaderProps {
  submission: SubmissionDetails
}

export function PaperHeader({ submission }: PaperHeaderProps) {
  return (
    <section className="mb-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3 max-w-4xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Paper #{submission.id}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
              Under Review
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-100">
              Track: {submission.track}
            </span>
          </div>
          <h1 className="text-[32px] font-bold text-slate-900 tracking-tight leading-tight">
            {submission.title}
          </h1>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <span className="material-symbols-outlined text-[18px]">person_off</span>
            <span>Anonymous Authors</span>
          </div>
        </div>
        <div className="flex-shrink-0 flex gap-3">
          <button className="flex items-center gap-2 h-9 px-4 bg-white border border-slate-200 rounded-md text-[11px] font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px] text-red-500">
              picture_as_pdf
            </span>
            Download PDF
          </button>
        </div>
      </div>
    </section>
  )
}

// =============================================================================
// Tab Navigation Component
// =============================================================================

interface TabNavigationProps {
  activeTab: "review" | "discussion" | "rebuttal"
  onTabChange: (tab: "review" | "discussion" | "rebuttal") => void
  discussionCount: number
}

export function TabNavigation({ activeTab, onTabChange, discussionCount }: TabNavigationProps) {
  return (
    <div className="flex items-center border-b border-slate-200 mb-8 overflow-x-auto">
      <button
        onClick={() => onTabChange("review")}
        className={`flex items-center gap-2 px-6 py-3 text-[11px] font-bold transition-colors ${
          activeTab === "review"
            ? "text-[#2563eb] border-b-2 border-[#2563eb] bg-blue-50/50"
            : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <span
          className={`material-symbols-outlined text-[18px] ${
            activeTab === "review" ? "filled" : ""
          }`}
        >
          rate_review
        </span>
        Review Form
      </button>
      <button
        onClick={() => onTabChange("discussion")}
        className={`flex items-center gap-2 px-6 py-3 text-[11px] font-medium transition-colors ${
          activeTab === "discussion"
            ? "text-[#2563eb] border-b-2 border-[#2563eb] bg-blue-50/50"
            : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">forum</span>
        Discussion
        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-xs text-slate-600">
          {discussionCount}
        </span>
      </button>
      <button
        onClick={() => onTabChange("rebuttal")}
        className={`flex items-center gap-2 px-6 py-3 text-[11px] font-medium transition-colors ${
          activeTab === "rebuttal"
            ? "text-[#2563eb] border-b-2 border-[#2563eb] bg-blue-50/50"
            : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">reply_all</span>
        Rebuttal
      </button>
    </div>
  )
}
