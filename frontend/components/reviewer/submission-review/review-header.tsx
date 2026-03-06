"use client"

import type { SubmissionDetails } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"

// =============================================================================
// Review Header Component - Breadcrumbs and Deadline Bar
// =============================================================================

interface ReviewHeaderBarProps {
  submission: SubmissionDetails
}

export function ReviewHeaderBar({ submission }: ReviewHeaderBarProps) {
  const { t } = useTranslation()
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 xl:px-12 py-2 flex items-center justify-between">
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <a href="#" className="hover:text-[#2563eb] transition-colors">
          {submission.conference.acronym}
        </a>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: "16px",
            width: "16px",
            height: "16px",
            maxWidth: "16px",
            maxHeight: "16px",
            minWidth: "16px",
            minHeight: "16px",
            lineHeight: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transform: "none",
            boxSizing: "border-box",
          }}
        >
          chevron_right
        </span>
        <a href="#" className="hover:text-[#2563eb] transition-colors">
          {t("runtime.components.reviewer.submission-review.review-header.text_my_reviews")}{" "}</a>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: "16px",
            width: "16px",
            height: "16px",
            maxWidth: "16px",
            maxHeight: "16px",
            minWidth: "16px",
            minHeight: "16px",
            lineHeight: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transform: "none",
            boxSizing: "border-box",
          }}
        >
          chevron_right
        </span>
        <span className="text-slate-900 font-medium">{t("runtime.components.reviewer.submission-review.review-header.text_paper")}{submission.id}</span>
      </nav>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2 text-[8px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full bg-slate-100 text-slate-700">
          <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
          {t("runtime.components.reviewer.submission-review.review-header.text_deadline")}{" "}{submission.daysLeft} {t("runtime.components.reviewer.submission-review.review-header.text_days_left")}{" "}</span>
        <div className="h-6 w-px bg-slate-200" />
        <button className="text-slate-500 hover:text-slate-900 transition-colors">
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "16px",
              width: "16px",
              height: "16px",
              maxWidth: "16px",
              maxHeight: "16px",
              minWidth: "16px",
              minHeight: "16px",
              lineHeight: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transform: "none",
              boxSizing: "border-box",
            }}
          >
            help
          </span>
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
  const { t } = useTranslation()
  return (
    <section className="mb-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3 max-w-4xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              {t("runtime.components.reviewer.submission-review.review-header.text_paper")}{submission.id}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[9px] font-semibold uppercase tracking-widest border border-slate-200">
              {t("runtime.components.reviewer.submission-review.review-header.text_under_review")}{" "}</span>
            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[9px] font-semibold uppercase tracking-widest border border-slate-200">
              {t("runtime.components.reviewer.submission-review.review-header.text_track")}{" "}{submission.track}
            </span>
          </div>
          <h1 className="text-[32px] font-bold text-slate-900 tracking-tight leading-tight">
            {submission.title}
          </h1>
          <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "16px",
                width: "16px",
                height: "16px",
                maxWidth: "16px",
                maxHeight: "16px",
                minWidth: "16px",
                minHeight: "16px",
                lineHeight: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transform: "none",
                boxSizing: "border-box",
              }}
            >
              person_off
            </span>
            <span>{t("runtime.components.reviewer.submission-review.review-header.text_anonymous_authors")}</span>
          </div>
        </div>
        <div className="flex-shrink-0 flex gap-3">
          <button className="flex items-center gap-2 h-9 px-4 bg-white border border-slate-200 rounded-md text-[11px] font-bold tracking-wider hover:bg-slate-50 transition-all duration-200 shadow-sm">
            <span
              className="material-symbols-outlined text-red-500"
              style={{
                fontSize: "16px",
                width: "16px",
                height: "16px",
                maxWidth: "16px",
                maxHeight: "16px",
                minWidth: "16px",
                minHeight: "16px",
                lineHeight: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transform: "none",
                boxSizing: "border-box",
              }}
            >
              picture_as_pdf
            </span>
            {t("runtime.components.reviewer.submission-review.review-header.text_download_pdf")}{" "}</button>
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
  const { t } = useTranslation()
  return (
    <div className="flex items-center border-b border-slate-200 mb-4 overflow-x-auto">
      <button
        onClick={() => onTabChange("review")}
        className={`flex items-center gap-2 px-4 py-1.5 text-[11px] font-semibold tracking-wider transition-all duration-200 ${
          activeTab === "review"
            ? "text-[#456882] border-b-2 border-[#456882] bg-[#f7f7f7]"
            : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <span
          className={`material-symbols-outlined ${activeTab === "review" ? "filled" : ""}`}
          style={{
            fontSize: "16px",
            width: "16px",
            height: "16px",
            maxWidth: "16px",
            maxHeight: "16px",
            minWidth: "16px",
            minHeight: "16px",
            lineHeight: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transform: "none",
            boxSizing: "border-box",
          }}
        >
          rate_review
        </span>
        {t("runtime.components.reviewer.submission-review.review-header.text_review_form")}{" "}</button>
      <button
        onClick={() => onTabChange("discussion")}
        className={`flex items-center gap-2 px-4 py-1.5 text-[11px] font-semibold tracking-wider transition-all duration-200 ${
          activeTab === "discussion"
            ? "text-[#456882] border-b-2 border-[#456882] bg-[#f7f7f7]"
            : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: "16px",
            width: "16px",
            height: "16px",
            maxWidth: "16px",
            maxHeight: "16px",
            minWidth: "16px",
            minHeight: "16px",
            lineHeight: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transform: "none",
            boxSizing: "border-box",
          }}
        >
          forum
        </span>
        {t("runtime.components.reviewer.submission-review.review-header.text_discussion")}{" "}<span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-[8px] font-black uppercase tracking-widest text-slate-700">
          {discussionCount}
        </span>
      </button>
      <button
        onClick={() => onTabChange("rebuttal")}
        className={`flex items-center gap-2 px-4 py-1.5 text-[11px] font-semibold tracking-wider transition-all duration-200 ${
          activeTab === "rebuttal"
            ? "text-[#456882] border-b-2 border-[#456882] bg-[#f7f7f7]"
            : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: "16px",
            width: "16px",
            height: "16px",
            maxWidth: "16px",
            maxHeight: "16px",
            minWidth: "16px",
            minHeight: "16px",
            lineHeight: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transform: "none",
            boxSizing: "border-box",
          }}
        >
          reply_all
        </span>
        {t("runtime.components.reviewer.submission-review.review-header.text_rebuttal")}{" "}</button>
    </div>
  )
}
