"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { MOCK_REVIEWS } from "./mock-data"

// --- Types ---
interface ReviewerScore {
  id: string
  anonymousId: string
  originalScore: number
  currentScore: number
  updated: boolean
  recommendation: "accept" | "weak_accept" | "borderline" | "weak_reject" | "reject"
}

// Mock reviewer scores
const MOCK_REVIEWER_SCORES: ReviewerScore[] = [
  {
    id: "R1",
    anonymousId: "Reviewer #1",
    originalScore: 6,
    currentScore: 6,
    updated: false,
    recommendation: "weak_accept",
  },
  {
    id: "R2",
    anonymousId: "Reviewer #2",
    originalScore: 5,
    currentScore: 5,
    updated: false,
    recommendation: "borderline",
  },
]

// --- Helper functions ---
function getRecommendationLabel(rec: string): string {
  const labels: Record<string, string> = {
    accept: "Accept",
    weak_accept: "Weak Accept",
    borderline: "Borderline",
    weak_reject: "Weak Reject",
    reject: "Reject",
  }
  return labels[rec] || rec
}

function getRecommendationColor(rec: string): string {
  const colors: Record<string, string> = {
    accept: "text-emerald-600",
    weak_accept: "text-lime-600",
    borderline: "text-slate-500",
    weak_reject: "text-orange-500",
    reject: "text-red-500",
  }
  return colors[rec] || "text-slate-500"
}

// --- Reviewer Scores Panel (Scholar-Compact) ---
function ReviewerScoresPanel({ reviewers }: { reviewers: ReviewerScore[] }) {
  const avgScore = reviewers.reduce((sum, r) => sum + r.currentScore, 0) / reviewers.length

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Reviewer Scores
        </h3>
      </div>

      {/* Average Score Display */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-black text-[#1B3C53] dark:text-white leading-none">
            {avgScore.toFixed(1)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">avg. score</span>
        </div>
      </div>

      {/* Individual Reviewers */}
      <div className="space-y-2">
        {reviewers.map((reviewer) => (
          <div
            key={reviewer.id}
            className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700"
          >
            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold">
              {reviewer.anonymousId.replace("Reviewer #", "R")}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[12px] font-medium text-slate-700 dark:text-slate-300">
                {reviewer.anonymousId}
              </span>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">Score</div>
              <div className="text-[12px] font-bold text-[#1B3C53] dark:text-white">
                {reviewer.currentScore}
              </div>
            </div>
            <div className="text-right w-24">
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">Rec.</div>
              <div
                className={cn(
                  "text-[11px] font-bold",
                  getRecommendationColor(reviewer.recommendation),
                )}
              >
                {getRecommendationLabel(reviewer.recommendation)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Deadline Warning (Scholar-Compact) ---
function DeadlineWarning() {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 flex items-start gap-3 mb-5">
      <div
        className="bg-amber-100 dark:bg-amber-800/50 text-amber-600 dark:text-amber-400 rounded-full p-1 shrink-0"
        style={{ width: "24px", height: "24px" }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
          timer
        </span>
      </div>
      <div>
        <h3 className="text-xs font-bold text-amber-900 dark:text-amber-300">
          Rebuttal Phase Ending Soon
        </h3>
        <p
          className="text-xs text-amber-800 dark:text-amber-400/80 mt-1 leading-relaxed"
          style={{ fontSize: "10px" }}
        >
          The rebuttal period closes on <strong>May 15, 2024 at 11:59 PM PST</strong>. You have 3
          days remaining to submit your responses.
        </p>
      </div>
    </div>
  )
}

// --- Reviewer Response Card (Scholar-Compact) ---
function ReviewerResponseCard({
  review,
  idx,
  isExpanded,
  onToggle,
  response,
  onResponseChange,
}: {
  review: (typeof MOCK_REVIEWS)[0]
  idx: number
  isExpanded: boolean
  onToggle: () => void
  response: string
  onResponseChange: (value: string) => void
}) {
  const reviewerColors = [
    "bg-indigo-100 text-indigo-700 border-indigo-200",
    "bg-orange-100 text-orange-700 border-orange-200",
    "bg-purple-100 text-purple-700 border-purple-200",
  ]

  const scoreColorClasses = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    yellow: "bg-amber-50 text-amber-700 border-amber-200",
    neutral: "bg-slate-100 text-slate-600 border-slate-200",
  }

  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden",
        !isExpanded && "opacity-60",
      )}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 p-4 flex justify-between items-center text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "size-9 rounded-full flex items-center justify-center font-bold text-[11px] border shadow-sm",
              reviewerColors[idx % reviewerColors.length],
            )}
          >
            R{review.reviewerNum}
          </div>
          <div>
            <h3 className="font-bold text-[#1B3C53] dark:text-white text-sm">
              Reviewer #{review.reviewerNum}
            </h3>
            <p className="text-[10px] text-slate-500">
              Confidence: {review.confidence} ({review.confidenceLevel})
            </p>
          </div>
          <span
            className={cn(
              "ml-2 px-2.5 py-1 rounded-full text-[9px] font-bold border uppercase tracking-wider",
              scoreColorClasses[review.scoreColor],
            )}
          >
            {review.scoreLabel} ({review.score})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded && (
            <span className="text-[10px] text-slate-400 font-medium">
              Word Count: {response.split(/\s+/).filter(Boolean).length}/1500
            </span>
          )}
          <span className="material-symbols-outlined text-slate-400" style={{ fontSize: "20px" }}>
            {isExpanded ? "expand_less" : "expand_more"}
          </span>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <>
          {/* Review Content */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="prose prose-sm max-w-none">
              <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Review Summary
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                {review.summary}
              </p>

              {review.questions && review.questions.length > 0 && (
                <>
                  <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Questions for Rebuttal
                  </h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {review.questions.map((q, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-400">
                        {q}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {review.weaknesses && review.weaknesses.length > 0 && (
                <>
                  <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-4">
                    Weaknesses
                  </h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {review.weaknesses.map((w, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-400">
                        {w}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* Response Area */}
          <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30">
            <label className="block text-sm font-bold text-[#1B3C53] dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                edit_note
              </span>
              Your Response to Reviewer #{review.reviewerNum}
            </label>
            <div className="relative bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-[#1B3C53]/20 focus-within:border-[#1B3C53] transition-all">
              {/* Toolbar */}
              <div className="absolute top-0 left-0 right-0 h-10 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 rounded-t-lg flex items-center px-2 gap-1 text-slate-500 z-10">
                <button
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors hover:text-[#1B3C53]"
                  title="Bold"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    format_bold
                  </span>
                </button>
                <button
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors hover:text-[#1B3C53]"
                  title="Italic"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    format_italic
                  </span>
                </button>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1" />
                <button
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors hover:text-[#1B3C53]"
                  title="List"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    format_list_bulleted
                  </span>
                </button>
                <button
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors hover:text-[#1B3C53]"
                  title="Quote"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    format_quote
                  </span>
                </button>
              </div>
              <textarea
                className="w-full rounded-lg border-0 bg-transparent text-xs pt-12 p-4 h-40 resize-none focus:ring-0 dark:text-slate-200 placeholder:text-slate-400"
                placeholder="Write your response here. You can use Markdown formatting."
                value={response}
                onChange={(e) => onResponseChange(e.target.value)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// --- Confidential Comments Section (Scholar-Compact) ---
function ConfidentialCommentsSection() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 p-4 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-500" style={{ fontSize: "18px" }}>
            lock
          </span>
          <h3 className="font-bold text-[#1B3C53] dark:text-white text-sm">
            Confidential Comments to Area Chair
          </h3>
        </div>
        <span className="material-symbols-outlined text-slate-400" style={{ fontSize: "20px" }}>
          {isExpanded ? "expand_less" : "expand_more"}
        </span>
      </button>
      {isExpanded && (
        <div className="p-4">
          <p className="text-[10px] text-slate-500 mb-3">
            These comments are only visible to the Area Chair and Program Chairs. Use this space to
            raise concerns about conflicts of interest or reviewer misconduct if necessary.
          </p>
          <textarea
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:border-[#1B3C53] focus:ring-1 focus:ring-[#1B3C53]/20 text-xs p-3 h-24 resize-none placeholder:text-slate-400"
            placeholder="Optional confidential remarks..."
          />
        </div>
      )}
    </div>
  )
}

// --- General Response Section (Scholar-Compact) ---
function GeneralResponseSection({
  generalResponse,
  onGeneralResponseChange,
}: {
  generalResponse: string
  onGeneralResponseChange: (value: string) => void
}) {
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const wordCount = generalResponse.split(/\s+/).filter(Boolean).length

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header with visibility indicator */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-gradient-to-r from-[#1B3C53] to-[#234C6A] px-5 py-4 text-left hover:from-[#234C6A] hover:to-[#1B3C53] transition-all rounded-xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">General Response</h3>
              <p className="text-[10px] text-white/70 mt-0.5">
                Address all reviewers and committee members at once
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-white/60 font-medium">{wordCount}/500 words</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm">
              <span
                className="material-symbols-outlined text-emerald-300"
                style={{ fontSize: "12px" }}
              >
                visibility
              </span>
              <span className="text-[9px] font-bold text-white/90 uppercase tracking-wider">
                All Participants
              </span>
            </div>
            <span className="material-symbols-outlined text-white/80" style={{ fontSize: "20px" }}>
              {isExpanded ? "expand_less" : "expand_more"}
            </span>
          </div>
        </div>
      </button>

      {/* Content Area */}
      {isExpanded && (
        <div className="p-5 space-y-4">
          {/* Guidance text */}
          <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
            <span
              className="material-symbols-outlined text-slate-400 mt-0.5"
              style={{ fontSize: "16px" }}
            >
              info
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Use this section to address{" "}
              <strong className="text-slate-600 dark:text-slate-300">common concerns</strong> raised
              by multiple reviewers, summarize key changes to your manuscript, or provide context
              that applies to all feedback. This response will be visible to{" "}
              <strong className="text-slate-600 dark:text-slate-300">
                all reviewers and program committee members
              </strong>
              .
            </p>
          </div>

          {/* Rich Text Editor */}
          <div className="relative bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-[#1B3C53]/20 focus-within:border-[#1B3C53] transition-all overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 px-2 py-1.5 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
              <button
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
                title="Bold"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  format_bold
                </span>
              </button>
              <button
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
                title="Italic"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  format_italic
                </span>
              </button>
              <button
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
                title="Underline"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  format_underlined
                </span>
              </button>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1" />
              <button
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
                title="Bulleted List"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  format_list_bulleted
                </span>
              </button>
              <button
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
                title="Numbered List"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  format_list_numbered
                </span>
              </button>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1" />
              <button
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
                title="Quote"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  format_quote
                </span>
              </button>
              <button
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
                title="Insert Link"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  link
                </span>
              </button>
              <button
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
                title="Math Equation"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  functions
                </span>
              </button>
            </div>

            {/* Text Area */}
            <textarea
              value={generalResponse}
              onChange={(e) => onGeneralResponseChange(e.target.value)}
              className="w-full min-h-[180px] p-4 text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 bg-transparent border-0 resize-none focus:ring-0 focus:outline-none leading-relaxed"
              placeholder="Dear Reviewers and Committee Members,

Thank you for your valuable feedback on our submission. Below, we address the main concerns raised across reviews:

1. Common Concern #1: [Your response]
2. Common Concern #2: [Your response]

We have also attached a revised manuscript with tracked changes highlighting all modifications made in response to your feedback..."
            />
          </div>

          {/* File Attachment Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-slate-400"
                  style={{ fontSize: "18px" }}
                >
                  upload_file
                </span>
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Revised Manuscript (Optional)
                </p>
                <p className="text-[9px] text-slate-400">
                  Attach a PDF with tracked changes highlighting revisions
                </p>
              </div>
            </div>

            {attachedFile ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                <span
                  className="material-symbols-outlined text-red-500"
                  style={{ fontSize: "16px" }}
                >
                  picture_as_pdf
                </span>
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 max-w-[120px] truncate">
                  {attachedFile.name}
                </span>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                >
                  <span
                    className="material-symbols-outlined text-slate-400 hover:text-red-500"
                    style={{ fontSize: "14px" }}
                  >
                    close
                  </span>
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
                />
                <span className="inline-flex items-center gap-1.5 h-7 px-3 text-[10px] font-medium text-[#1B3C53] dark:text-white bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    attach_file
                  </span>
                  Attach File
                </span>
              </label>
            )}
          </div>

          {/* Save indicator */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span
                className="material-symbols-outlined text-emerald-500"
                style={{ fontSize: "14px" }}
              >
                check_circle
              </span>
              <span>Draft auto-saved</span>
            </div>
            <button className="h-8 px-4 text-[10px] font-bold text-white bg-[#1B3C53] hover:bg-[#234C6A] rounded-md transition-colors flex items-center gap-1.5 shadow-sm">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                save
              </span>
              Save Draft
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Main Component ---
export function RebuttalTab() {
  const [expandedReviewers, setExpandedReviewers] = useState<string[]>(["R1", "R2"])
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [generalResponse, setGeneralResponse] = useState("")

  const toggleExpand = (id: string) => {
    setExpandedReviewers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  return (
    <div className="space-y-5">
      {/* Deadline Warning */}
      <DeadlineWarning />

      {/* Reviewer Scores Overview */}
      <ReviewerScoresPanel reviewers={MOCK_REVIEWER_SCORES} />

      {/* General Response - Address all reviewers at once */}
      <GeneralResponseSection
        generalResponse={generalResponse}
        onGeneralResponseChange={setGeneralResponse}
      />

      {/* Reviewer Response Cards */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Point-by-Point Responses
        </h3>
        {MOCK_REVIEWS.map((review, idx) => (
          <ReviewerResponseCard
            key={review.id}
            review={review}
            idx={idx}
            isExpanded={expandedReviewers.includes(review.id)}
            onToggle={() => toggleExpand(review.id)}
            response={responses[review.id] || ""}
            onResponseChange={(value) => setResponses((prev) => ({ ...prev, [review.id]: value }))}
          />
        ))}
      </div>

      {/* Confidential Comments */}
      <ConfidentialCommentsSection />
    </div>
  )
}
