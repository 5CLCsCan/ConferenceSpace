"use client"

import { useState } from "react"
import type { SubmissionDetails } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { downloadPaperFile } from "@/lib/api/papers"

// =============================================================================
// Review Header Component - Breadcrumbs and Deadline Bar
// =============================================================================

interface ReviewHeaderBarProps {
  submission: SubmissionDetails
}

export function ReviewHeaderBar({ submission }: ReviewHeaderBarProps) {
  const { t } = useTranslation()
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border-strong)] bg-white px-4 py-2 md:px-8 xl:px-12">
      <div className="flex items-center justify-between gap-4">
        <nav className="text-ui-meta flex items-center gap-2">
          <a href="#" className="transition-colors hover:text-[var(--color-primary-ink)]">
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
          <a href="#" className="transition-colors hover:text-[var(--color-primary-ink)]">
            {t("runtime.components.reviewer.submission-review.review-header.text_my_reviews")}{" "}
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
          <span className="font-[600] text-[var(--color-primary-ink)]">
            {t("runtime.components.reviewer.submission-review.review-header.text_paper")}
            {submission.id}
          </span>
        </nav>
        <div className="flex items-center gap-4">
          <span className="badge-neutral text-tiny-label flex items-center gap-2 px-3 py-1.5 text-[var(--color-neutral-text)]">
            <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
            {t("runtime.components.reviewer.submission-review.review-header.text_deadline")}{" "}
            {submission.daysLeft}{" "}
            {t("runtime.components.reviewer.submission-review.review-header.text_days_left")}{" "}
          </span>
          <div className="h-6 w-px bg-slate-200" />
          <button className="transition-colors text-[var(--color-neutral-text)] hover:text-[var(--color-primary-ink)]">
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
  const [downloading, setDownloading] = useState(false)

  const handleDownloadPdf = async () => {
    if (downloading) return
    setDownloading(true)
    try {
      const response = await downloadPaperFile(submission.submissionId, submission.conference.id)
      if (response.error || !response.data) {
        console.error("Download failed:", response.error)
        return
      }
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement("a")
      link.href = url
      link.download = response.filename || "paper.pdf"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Failed to download PDF:", err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <section className="mb-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3 max-w-4xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-ui-meta uppercase tracking-[0.08em]">
              {t("runtime.components.reviewer.submission-review.review-header.text_paper")}
              {submission.id}
            </span>
            <span className="badge-neutral text-tiny-label rounded-[var(--radius-button)]">
              {t(
                "runtime.components.reviewer.submission-review.review-header.text_under_review",
              )}{" "}
            </span>
            <span className="badge-neutral text-tiny-label rounded-[var(--radius-button)]">
              {t("runtime.components.reviewer.submission-review.review-header.text_track")}{" "}
              {submission.track}
            </span>
          </div>
          <h1 className="text-detail-title text-[var(--color-text-strong)]">{submission.title}</h1>
          <div className="text-meta flex items-center gap-2">
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
            <span>
              {t(
                "runtime.components.reviewer.submission-review.review-header.text_anonymous_authors",
              )}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="button-secondary control-dense flex items-center gap-2 px-4 text-ui-meta disabled:opacity-50"
          >
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
            {t(
              "runtime.components.reviewer.submission-review.review-header.text_download_pdf",
            )}{" "}
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
  const { t } = useTranslation()
  return (
    <div className="mb-4 flex items-center overflow-x-auto border-b border-[var(--color-border-soft)]">
      <button
        onClick={() => onTabChange("review")}
        className={`text-ui-meta flex items-center gap-2 border-b-2 px-4 py-[var(--space-standard)] transition-colors ${
          activeTab === "review"
            ? "border-[var(--color-primary-ink)] text-[var(--color-primary-ink)]"
            : "border-transparent hover:text-[var(--color-primary-ink)]"
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
        {t("runtime.components.reviewer.submission-review.review-header.text_review_form")}{" "}
      </button>
      <button
        onClick={() => onTabChange("discussion")}
        className={`text-ui-meta flex items-center gap-2 border-b-2 px-4 py-[var(--space-standard)] transition-colors ${
          activeTab === "discussion"
            ? "border-[var(--color-primary-ink)] text-[var(--color-primary-ink)]"
            : "border-transparent hover:text-[var(--color-primary-ink)]"
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
        {t("runtime.components.reviewer.submission-review.review-header.text_discussion")}{" "}
        <span className="badge-neutral text-tiny-label ml-1">{discussionCount}</span>
      </button>
      <button
        onClick={() => onTabChange("rebuttal")}
        className={`text-ui-meta flex items-center gap-2 border-b-2 px-4 py-[var(--space-standard)] transition-colors ${
          activeTab === "rebuttal"
            ? "border-[var(--color-primary-ink)] text-[var(--color-primary-ink)]"
            : "border-transparent hover:text-[var(--color-primary-ink)]"
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
        {t("runtime.components.reviewer.submission-review.review-header.text_rebuttal")}{" "}
      </button>
    </div>
  )
}
