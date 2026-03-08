"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { SubmissionDetail, ReviewerDecision } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { tStatic as t } from "@/lib/i18n/static-translate"

// --- Types ---
interface ReviewerScore {
  id: string
  anonymousId: string
  originalScore: number
  currentScore: number
  updated: boolean
  recommendation: "accept" | "weak_accept" | "borderline" | "weak_reject" | "reject"
}

interface RebuttalPoint {
  id: string
  reviewerId: string
  category: "weakness" | "question" | "suggestion"
  section?: string
  originalComment: string
  authorResponse?: string
  status: "pending_review" | "addressed" | "partially_addressed" | "not_addressed"
  reviewerAcknowledgment?: {
    acknowledged: boolean
    satisfactory: boolean
    note?: string
  }
}

// --- Mock Data ---
const MOCK_REVIEWER_SCORES: ReviewerScore[] = [
  {
    id: "r1",
    anonymousId: "Reviewer #1",
    originalScore: 6,
    currentScore: 6,
    updated: false,
    recommendation: "weak_accept",
  },
  {
    id: "r2",
    anonymousId: "Reviewer #2",
    originalScore: 5,
    currentScore: 7,
    updated: true,
    recommendation: "accept",
  },
  {
    id: "r3",
    anonymousId: "Reviewer #3",
    originalScore: 7,
    currentScore: 7,
    updated: false,
    recommendation: "accept",
  },
]

const MOCK_REBUTTAL_POINTS: RebuttalPoint[] = [
  {
    id: "p1",
    reviewerId: "r1",
    category: "weakness",
    section: "Methodology",
    originalComment:
      "The experimental setup lacks sufficient detail for reproducibility. What hyperparameters were used?",
    authorResponse:
      "We have added **Appendix B** with complete hyperparameter tables and training configurations.",
    status: "addressed",
    reviewerAcknowledgment: { acknowledged: true, satisfactory: true },
  },
  {
    id: "p2",
    reviewerId: "r1",
    category: "question",
    originalComment: "How does the method scale to larger datasets?",
    authorResponse:
      "Added scalability analysis in Section 5.3. Results show linear scaling up to 10M samples.",
    status: "addressed",
    reviewerAcknowledgment: { acknowledged: true, satisfactory: true },
  },
  {
    id: "p3",
    reviewerId: "r2",
    category: "weakness",
    section: "Related Work",
    originalComment: "Missing comparison with recent transformer-based approaches from 2023.",
    authorResponse: "Added comparison with [Reference A] and [Reference B] in Table 2.",
    status: "partially_addressed",
    reviewerAcknowledgment: {
      acknowledged: true,
      satisfactory: false,
      note: "Would prefer more in-depth analysis",
    },
  },
  {
    id: "p4",
    reviewerId: "r3",
    category: "suggestion",
    originalComment: "Consider adding ablation studies for each component.",
    authorResponse:
      "Added comprehensive ablation study in Section 6.2 with 5 additional experiments.",
    status: "addressed",
    reviewerAcknowledgment: { acknowledged: true, satisfactory: true },
  },
  {
    id: "p5",
    reviewerId: "r2",
    category: "weakness",
    originalComment: "The novelty claim seems overstated compared to prior work.",
    authorResponse: "Revised claims in Section 1. Added detailed comparison table in Section 2.3.",
    status: "pending_review",
  },
]

// --- Helper functions ---
const CATEGORY_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  weakness: {
    icon: "warning",
    color: "text-amber-500",
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_weakness",
    ),
  },
  question: {
    icon: "help",
    color: "text-blue-500",
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_question",
    ),
  },
  suggestion: {
    icon: "lightbulb",
    color: "text-purple-500",
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_suggestion",
    ),
  },
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending_review: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_pending",
    ),
    bg: "bg-slate-100",
    text: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_text_text_slate_600",
    ),
  },
  addressed: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_addressed",
    ),
    bg: "bg-emerald-50",
    text: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_text_text_emerald_600",
    ),
  },
  partially_addressed: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_partial",
    ),
    bg: "bg-amber-50",
    text: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_text_text_amber_600",
    ),
  },
  not_addressed: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_not_addressed",
    ),
    bg: "bg-red-50",
    text: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_text_text_red_600",
    ),
  },
}

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

// --- Decision Making Panel (Sidebar) ---
function DecisionMakingPanel({
  currentDecision,
  onDecision,
  reviewers,
}: {
  currentDecision?: string
  onDecision: (decision: string) => void
  reviewers: ReviewerScore[]
}) {
  const { t } = useTranslation()
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isNotesExpanded, setIsNotesExpanded] = useState(false)

  const decisions = [
    {
      key: "accept",
      label: t(
        "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_accept",
      ),
      icon: "check_circle",
      description: t(
        "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_description_ready_for_publication",
      ),
      activeStyle: "bg-emerald-600 text-white border-emerald-600",
      inactiveStyle:
        "bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400",
    },
    {
      key: "minor",
      label: t(
        "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_minor_revision",
      ),
      icon: "edit_note",
      description: t(
        "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_description_small_changes_needed",
      ),
      activeStyle: "bg-sky-600 text-white border-sky-600",
      inactiveStyle: "bg-white hover:bg-sky-50 text-sky-700 border-sky-200 hover:border-sky-400",
    },
    {
      key: "major",
      label: t(
        "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_major_revision",
      ),
      icon: "rate_review",
      description: t(
        "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_description_significant_changes_required",
      ),
      activeStyle: "bg-amber-600 text-white border-amber-600",
      inactiveStyle:
        "bg-white hover:bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400",
    },
    {
      key: "reject",
      label: t(
        "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_reject",
      ),
      icon: "cancel",
      description: t(
        "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_description_does_not_meet_standards",
      ),
      activeStyle: "bg-red-600 text-white border-red-600",
      inactiveStyle: "bg-white hover:bg-red-50 text-red-600 border-red-200 hover:border-red-400",
    },
  ]

  const handleSubmit = () => {
    if (!currentDecision) return
    setIsSubmitting(true)
    // TODO: API call to submit decision
    console.log("[Submit decision]", { decision: currentDecision, notes })
    setTimeout(() => setIsSubmitting(false), 1000)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden sticky top-0">
      {/* Decision Options */}
      <div className="p-4 space-y-2">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          {t(
            "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_select_decision",
          )}{" "}
        </div>
        {decisions.map((d) => {
          const isActive = currentDecision === d.key
          return (
            <button
              key={d.key}
              onClick={() => onDecision(d.key)}
              className={cn(
                "w-full px-3 py-2.5 rounded-lg border transition-all flex items-center gap-3 text-left",
                isActive ? d.activeStyle : d.inactiveStyle,
                isActive && "shadow-sm",
              )}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                {d.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className={cn("text-[11px] font-bold", isActive ? "" : "")}>{d.label}</div>
                <div className={cn("text-[9px]", isActive ? "text-white/70" : "text-slate-400")}>
                  {d.description}
                </div>
              </div>
              {isActive && (
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  check
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 dark:border-slate-700" />

      {/* Private Notes */}
      <div className="p-4">
        <button
          onClick={() => setIsNotesExpanded(!isNotesExpanded)}
          className="w-full text-left text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between gap-1 hover:text-slate-600 transition-colors"
        >
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
              lock
            </span>
            {t(
              "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_private_notes",
            )}{" "}
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
            {isNotesExpanded ? "expand_less" : "expand_more"}
          </span>
        </button>
        {isNotesExpanded && (
          <>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] focus:border-[#1B3C53] focus:ring-1 focus:ring-[#1B3C53]/20 resize-none h-20 placeholder:text-slate-300 bg-white dark:bg-slate-800 p-2.5"
              placeholder={t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.placeholder_internal_notes_visible_only_to_chairs",
              )}
            />
            <div className="text-[9px] text-slate-400 mt-1">
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_these_notes_are_private_and_will",
              )}{" "}
            </div>
          </>
        )}
      </div>

      {/* Submit Button */}
      <div className="p-4 pt-0">
        <button
          onClick={handleSubmit}
          disabled={!currentDecision || isSubmitting}
          className={cn(
            "w-full h-10 rounded-lg text-[10px] font-medium uppercase tracking-wider transition-all flex items-center justify-center gap-2",
            currentDecision
              ? "bg-[#1B3C53] hover:bg-[#234C6A] text-white shadow-sm"
              : "bg-slate-100 text-slate-400 cursor-not-allowed",
          )}
        >
          {isSubmitting ? (
            <>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: "16px" }}>
                progress_activity
              </span>
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_submitting",
              )}{" "}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                send
              </span>
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_submit_decision",
              )}{" "}
            </>
          )}
        </button>
        {!currentDecision && (
          <div className="text-[9px] text-slate-400 text-center mt-2">
            {t(
              "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_select_a_decision_above_to_continue",
            )}{" "}
          </div>
        )}
      </div>
    </div>
  )
}

// --- Reviewer Scores Panel (Same design as reviewer's, adapted for chair) ---
function ReviewerScoresPanel({ reviewers }: { reviewers: ReviewerScore[] }) {
  const avgOriginal = reviewers.reduce((sum, r) => sum + r.originalScore, 0) / reviewers.length
  const avgCurrent = reviewers.reduce((sum, r) => sum + r.currentScore, 0) / reviewers.length
  const scoreChanged = avgOriginal !== avgCurrent
  const updatedCount = reviewers.filter((r) => r.updated).length

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {t(
            "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_reviewer_scores",
          )}{" "}
        </h3>
        {updatedCount > 0 && (
          <span className="text-[9px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {updatedCount} score{updatedCount > 1 ? "s" : ""} updated
          </span>
        )}
      </div>

      {/* Average Score Display */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-black text-[#1B3C53] leading-none">
            {avgCurrent.toFixed(1)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {t(
              "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_avg_score",
            )}
          </span>
        </div>
      </div>

      {/* Individual Reviewers */}
      <div className="space-y-2">
        {reviewers.map((reviewer) => (
          <div
            key={reviewer.id}
            className="flex items-center gap-3 p-2 bg-slate-50/80 rounded-lg border border-slate-100"
          >
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
              {reviewer.anonymousId.replace("Reviewer #", "R")}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[12px] font-medium text-slate-700">{reviewer.anonymousId}</span>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">
                {t(
                  "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_score",
                )}
              </div>
              <div className="text-[12px] font-bold text-[#1B3C53]">
                {reviewer.updated ? (
                  <>
                    <span className="text-slate-400 line-through mr-1">
                      {reviewer.originalScore}
                    </span>
                    <span className="text-slate-400 mx-0.5">→</span>
                    <span>{reviewer.currentScore}</span>
                  </>
                ) : (
                  reviewer.currentScore
                )}
              </div>
            </div>
            <div className="text-right w-24">
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">
                {t(
                  "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_rec",
                )}
              </div>
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

// --- Point Card (Read-only for chair) ---
function PointCard({ point, reviewerLabel }: { point: RebuttalPoint; reviewerLabel: string }) {
  const category = CATEGORY_CONFIG[point.category]
  const statusConfig = STATUS_CONFIG[point.status]

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header: Original Comment */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <span
              className={cn("material-symbols-outlined mt-0.5", category.color)}
              style={{ fontSize: "16px" }}
            >
              {category.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  {point.section || category.label}
                </span>
                <span className="text-[9px] text-slate-400">from {reviewerLabel}</span>
                <span
                  className={cn(
                    "text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                    statusConfig.bg,
                    statusConfig.text,
                  )}
                >
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{point.originalComment}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Author Response */}
      {point.authorResponse && (
        <div className="px-4 py-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <span className="text-[9px] font-bold">
                {t(
                  "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_a",
                )}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-slate-500">
                  {t(
                    "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_author_response",
                  )}
                </span>
              </div>
              <p
                className="text-xs text-slate-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: point.authorResponse.replace(
                    /\*\*(.*?)\*\*/g,
                    '<strong class="text-emerald-600">$1</strong>',
                  ),
                }}
              />
            </div>
          </div>

          {/* Reviewer Acknowledgment */}
          {point.reviewerAcknowledgment?.acknowledged && (
            <div className="mt-3 ml-9 pl-3 border-l-2 border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  {t(
                    "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_reviewer_response",
                  )}{" "}
                </span>
                {point.reviewerAcknowledgment.satisfactory && (
                  <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {t(
                      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_satisfied",
                    )}{" "}
                  </span>
                )}
                {point.reviewerAcknowledgment.satisfactory === false && (
                  <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    {t(
                      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_concerns_remain",
                    )}{" "}
                  </span>
                )}
              </div>
              {point.reviewerAcknowledgment.note && (
                <p className="text-[11px] text-slate-600 italic">
                  {point.reviewerAcknowledgment.note}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// --- Reviewer Response Group (Collapsible, read-only for chair) ---
function ReviewerResponseGroup({
  reviewerId,
  reviewerLabel,
  points,
}: {
  reviewerId: string
  reviewerLabel: string
  points: RebuttalPoint[]
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const addressedCount = points.filter((p) => p.status === "addressed").length
  const pendingCount = points.filter((p) => p.status === "pending_review").length

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between transition-colors bg-slate-50/80 hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
            {reviewerLabel.replace("Reviewer #", "R")}
          </div>
          <div className="text-left">
            <div className="text-[12px] font-bold text-slate-700">
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_response_to",
              )}{" "}
              {reviewerLabel}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] text-slate-500">{points.length} points</span>
              {addressedCount === points.length && (
                <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {t(
                    "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_all_addressed",
                  )}{" "}
                </span>
              )}
              {pendingCount > 0 && (
                <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                  {pendingCount} pending
                </span>
              )}
            </div>
          </div>
        </div>
        <span className="material-symbols-outlined text-slate-400" style={{ fontSize: "16px" }}>
          {isExpanded ? "expand_less" : "expand_more"}
        </span>
      </button>

      {/* Points */}
      {isExpanded && (
        <div className="p-4 space-y-3 bg-white">
          {points.map((point) => (
            <PointCard key={point.id} point={point} reviewerLabel={reviewerLabel} />
          ))}
        </div>
      )}
    </div>
  )
}

// --- Point-by-Point Responses Section ---
function PointByPointSection({
  points,
  reviewers,
}: {
  points: RebuttalPoint[]
  reviewers: ReviewerScore[]
}) {
  // Group points by reviewer
  const groupedPoints = reviewers
    .map((reviewer) => ({
      reviewerId: reviewer.id,
      reviewerLabel: reviewer.anonymousId,
      points: points.filter((p) => p.reviewerId === reviewer.id),
    }))
    .filter(({ points }) => points.length > 0)

  const totalPoints = points.length
  const addressedPoints = points.filter((p) => p.status === "addressed").length
  const pendingPoints = points.filter((p) => p.status === "pending_review").length

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {t(
            "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_point_by_point_responses",
          )}{" "}
        </h3>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-slate-500">
            <span className="font-bold text-[#1B3C53]">{totalPoints}</span> total
          </span>
          <span className="text-slate-500">
            <span className="font-bold text-emerald-600">{addressedPoints}</span> addressed
          </span>
          {pendingPoints > 0 && (
            <span className="text-slate-500">
              <span className="font-bold text-amber-600">{pendingPoints}</span> pending
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {groupedPoints.map(({ reviewerId, reviewerLabel, points }) => (
          <ReviewerResponseGroup
            key={reviewerId}
            reviewerId={reviewerId}
            reviewerLabel={reviewerLabel}
            points={points}
          />
        ))}
      </div>
    </div>
  )
}

// --- Main Export ---
interface ChairReviewsTabProps {
  submission: SubmissionDetail
}

export function ChairReviewsTab({ submission }: ChairReviewsTabProps) {
  const [currentDecision, setCurrentDecision] = useState<string | undefined>()
  const reviewers = MOCK_REVIEWER_SCORES
  const points = MOCK_REBUTTAL_POINTS

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-[7] min-w-0">
        {/* Reviewer Scores Panel */}
        <ReviewerScoresPanel reviewers={reviewers} />

        {/* Point-by-Point Responses */}
        <PointByPointSection points={points} reviewers={reviewers} />
      </div>

      {/* Sidebar - Decision Making */}
      <div className="flex-[3] hidden lg:block">
        <DecisionMakingPanel
          currentDecision={currentDecision}
          onDecision={setCurrentDecision}
          reviewers={reviewers}
        />
      </div>
    </div>
  )
}
