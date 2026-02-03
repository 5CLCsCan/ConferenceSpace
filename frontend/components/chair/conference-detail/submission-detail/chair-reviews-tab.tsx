"use client"

import { cn } from "@/lib/utils"
import type { SubmissionDetail, ReviewerDecision } from "./types"

// --- Mock Data for Reviews Tab ---
interface ReviewDetail {
  id: string
  reviewerId: string
  reviewerLabel: string
  avatarColor: string
  submittedDate: string
  score: number
  decision: ReviewerDecision
  confidence: number
  maxConfidence: number
  summary?: string
  strengths?: string[]
  weaknesses?: string[]
  detailedComments?: string
}

interface AuthorRebuttal {
  submittedDate: string
  responses: { reviewerId: string; response: string }[]
}

const MOCK_REVIEWS: ReviewDetail[] = [
  {
    id: "review-1",
    reviewerId: "R1",
    reviewerLabel: "Reviewer 1",
    avatarColor: "bg-indigo-100 text-indigo-700",
    submittedDate: "Jan 12, 2024",
    score: 8,
    decision: "accept",
    confidence: 5,
    maxConfidence: 5,
    summary:
      "The paper proposes a new method for handling sparse data in transformer models by modifying the attention mechanism. The authors claim a 40% reduction in compute with negligible accuracy loss.",
    strengths: [
      "Novel architectural modification that is theoretically sound.",
      "Extensive benchmarking across multiple datasets.",
      "Clear and well-structured writing.",
    ],
    weaknesses: [
      "The ablation study could be more detailed regarding the specific sparsity thresholds.",
      "Comparison with the very latest SOTA (e.g., SparseFormer-V2) is missing.",
    ],
    detailedComments: `The proposed method is quite interesting. I particularly appreciate the detailed mathematical derivation in Section 3. However, I would like to see how this performs on extremely long sequences (e.g., 8k+ tokens). The current evaluation stops at 4k tokens.
Also, could the authors clarify the training overhead? Is the sparsity mask pre-computed or learned dynamically? The text is slightly ambiguous in Section 4.2.`,
  },
  {
    id: "review-2",
    reviewerId: "R2",
    reviewerLabel: "Reviewer 2",
    avatarColor: "bg-purple-100 text-purple-700",
    submittedDate: "Jan 14, 2024",
    score: 8,
    decision: "accept",
    confidence: 3,
    maxConfidence: 5,
    summary:
      "This work addresses computational efficiency in transformers via sparsity-aware attention. Results are strong.",
    detailedComments:
      "Solid paper. The idea is simple yet effective. The empirical results support the claims well. I have a minor concern about the reproducibility of the baseline implementations, but the provided code in the supplementary material seems comprehensive. I recommend acceptance.",
  },
  {
    id: "review-3",
    reviewerId: "R3",
    reviewerLabel: "Reviewer 3",
    avatarColor: "bg-pink-100 text-pink-700",
    submittedDate: "Jan 15, 2024",
    score: 7,
    decision: "weak_accept",
    confidence: 4,
    maxConfidence: 5,
    summary:
      "The paper presents good results, but I am not entirely convinced about the novelty. Similar approaches have been tried in vision transformers (ViT). The authors should discuss the relationship with [Reference A] and [Reference B].",
    detailedComments:
      "That said, the application to NLP sparse data specifically is well-executed, so I lean towards acceptance.",
  },
]

const MOCK_REBUTTAL: AuthorRebuttal = {
  submittedDate: "Jan 20, 2024",
  responses: [
    {
      reviewerId: "R1",
      response:
        "Thank you for the insightful comments. Regarding the long sequences, we have added Appendix C with experiments on 8k token sequences, showing consistent performance. Regarding training overhead, the sparsity mask is learned dynamically; we have clarified Section 4.2.",
    },
    {
      reviewerId: "R3",
      response:
        "We appreciate the references. We have added a discussion comparing our method to [Reference A] in the Related Work section. Our method differs by...",
    },
  ],
}

// --- Helper Functions ---
function getDecisionLabel(decision: ReviewerDecision, score: number): string {
  switch (decision) {
    case "accept":
      return `Accept (${score})`
    case "weak_accept":
      return `Weak Accept (${score})`
    case "borderline":
      return `Borderline (${score})`
    case "weak_reject":
      return `Weak Reject (${score})`
    case "reject":
      return `Reject (${score})`
    default:
      return `Score: ${score}`
  }
}

function getDecisionColor(decision: ReviewerDecision): string {
  switch (decision) {
    case "accept":
      return "bg-green-50 text-green-700 border-green-100"
    case "weak_accept":
      return "bg-yellow-50 text-yellow-700 border-yellow-100"
    case "borderline":
      return "bg-slate-50 text-slate-700 border-slate-200"
    case "weak_reject":
      return "bg-orange-50 text-orange-700 border-orange-100"
    case "reject":
      return "bg-red-50 text-red-700 border-red-100"
    default:
      return "bg-slate-50 text-slate-700 border-slate-200"
  }
}

function getDecisionTextColor(decision: ReviewerDecision): string {
  switch (decision) {
    case "accept":
      return "text-green-600"
    case "weak_accept":
      return "text-yellow-600"
    case "borderline":
      return "text-slate-600"
    case "weak_reject":
      return "text-orange-600"
    case "reject":
      return "text-red-600"
    default:
      return "text-slate-600"
  }
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 4) return "High Confidence"
  if (confidence >= 2) return "Medium Confidence"
  return "Low Confidence"
}

// --- Review Summary Card ---
function ReviewSummaryCard({
  reviews,
  maxScore = 10,
}: {
  reviews: ReviewDetail[]
  maxScore?: number
}) {
  const avgScore = reviews.reduce((acc, r) => acc + r.score, 0) / reviews.length
  const avgConfidence = reviews.reduce((acc, r) => acc + r.confidence, 0) / reviews.length

  const getRecommendation = () => {
    if (avgScore >= 7) return { label: "Accept", color: "text-green-600" }
    if (avgScore >= 5) return { label: "Borderline", color: "text-yellow-600" }
    return { label: "Reject", color: "text-red-600" }
  }

  const recommendation = getRecommendation()
  const confidenceLabel = avgConfidence >= 4 ? "High" : avgConfidence >= 2 ? "Medium" : "Low"

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm px-4 pt-4 pb-3">
      <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white mb-4 tracking-tight">
        Review Summary
      </h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Average Score
          </span>
          <span className="text-lg font-bold text-[#1B3C53] dark:text-white">
            {avgScore.toFixed(1)}{" "}
            <span className="text-[10px] text-slate-400 font-normal">/ {maxScore}</span>
          </span>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Confidence
          </span>
          <span className="text-lg font-bold text-[#1B3C53] dark:text-white">
            {confidenceLabel}
          </span>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Recommendation
          </span>
          <span className={cn("text-lg font-bold", recommendation.color)}>
            {recommendation.label}
          </span>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Score Breakdown
        </h4>
        <div className="space-y-2">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
              onClick={() => {
                document.getElementById(review.id)?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold",
                    review.avatarColor,
                  )}
                >
                  {review.reviewerId}
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {review.reviewerLabel}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-xs font-bold", getDecisionTextColor(review.decision))}>
                  {getDecisionLabel(review.decision, review.score)}
                </span>
                <span className="text-[10px] text-slate-400">
                  {getConfidenceLabel(review.confidence)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Individual Review Card ---
function ReviewCard({ review }: { review: ReviewDetail }) {
  return (
    <div
      id={review.id}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm px-4 pt-4 pb-3 scroll-mt-24"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
              review.avatarColor,
            )}
          >
            {review.reviewerId}
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1B3C53] dark:text-white">
              {review.reviewerLabel}
            </h4>
            <span className="text-[10px] text-slate-500">Submitted: {review.submittedDate}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
              getDecisionColor(review.decision),
            )}
          >
            {getDecisionLabel(review.decision, review.score)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1">
            Confidence: {review.confidence}/{review.maxConfidence}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
        {/* Summary */}
        {review.summary && (
          <div>
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Summary of Contributions
            </h5>
            <p className="leading-relaxed font-medium">{review.summary}</p>
          </div>
        )}

        {/* Strengths & Weaknesses */}
        {(review.strengths || review.weaknesses) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {review.strengths && review.strengths.length > 0 && (
              <div>
                <h5 className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                    add_circle
                  </span>
                  Strengths
                </h5>
                <ul className="list-disc pl-4 space-y-0.5 marker:text-green-500 font-medium">
                  {review.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {review.weaknesses && review.weaknesses.length > 0 && (
              <div>
                <h5 className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                    remove_circle
                  </span>
                  Weaknesses
                </h5>
                <ul className="list-disc pl-4 space-y-0.5 marker:text-red-500 font-medium">
                  {review.weaknesses.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Detailed Comments */}
        {review.detailedComments && (
          <div>
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Detailed Comments
            </h5>
            <p className="leading-relaxed whitespace-pre-line font-medium">
              {review.detailedComments}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <button className="h-7 px-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 hover:text-[#1B3C53] flex items-center gap-1.5 transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
            reply
          </span>
          Reply to Reviewer
        </button>
      </div>
    </div>
  )
}

// --- Author Rebuttal Card ---
function AuthorRebuttalCard({ rebuttal }: { rebuttal: AuthorRebuttal }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 px-4 pt-4 pb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-[#1B3C53] dark:text-slate-300"
            style={{ fontSize: "18px" }}
          >
            rate_review
          </span>
          <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
            Author Rebuttal
          </h3>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">
          Submitted: {rebuttal.submittedDate}
        </span>
      </div>
      <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
        <p className="italic text-slate-500 text-[10px]">
          The authors have responded to the reviewers' comments.
        </p>
        {rebuttal.responses.map((r) => (
          <p key={r.reviewerId} className="leading-relaxed font-medium">
            <strong className="text-[#1B3C53] dark:text-white">Response to {r.reviewerId}:</strong>{" "}
            {r.response}
          </p>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
        <button className="text-[11px] font-bold text-[#1B3C53] dark:text-white hover:underline">
          View Full Rebuttal PDF
        </button>
      </div>
    </div>
  )
}

// --- Sidebar Components ---
function SubmissionMetaSidebar({
  authors,
  conflictsOfInterest,
}: {
  authors: SubmissionDetail["authors"]
  conflictsOfInterest: string[]
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm px-4 pt-4 pb-3">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
        Submission Meta
      </h3>
      <div className="space-y-4">
        {/* Authors */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">
            Author(s)
          </h4>
          <div className="space-y-2">
            {authors.map((author) => (
              <div key={author.id} className="flex items-center gap-2.5">
                {author.avatar ? (
                  <div
                    className="w-7 h-7 rounded-full bg-cover bg-center flex-shrink-0"
                    style={{ backgroundImage: `url("${author.avatar}")` }}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                    {author.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-[#1B3C53] dark:text-white truncate">
                    {author.name}
                    {author.isCorresponding && " (Corr.)"}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate">{author.affiliation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conflicts of Interest */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Conflicts of Interest
          </h4>
          <p className="text-xs text-[#1B3C53] dark:text-white font-medium">
            {conflictsOfInterest.join(", ")}
          </p>
        </div>
      </div>
    </div>
  )
}

function ReviewerAssignmentsSidebar({ reviews }: { reviews: ReviewDetail[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm px-4 pt-4 pb-3">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Reviewer Assignments
        </h3>
        <button className="text-[10px] font-bold text-[#1B3C53] hover:text-[#456882] transition-colors">
          Manage
        </button>
      </div>
      <div className="space-y-2">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded transition-colors"
            onClick={() => {
              document.getElementById(review.id)?.scrollIntoView({ behavior: "smooth" })
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold",
                  review.avatarColor,
                )}
              >
                {review.reviewerId}
              </div>
              <span className="text-xs text-slate-700 group-hover:text-[#1B3C53] dark:text-slate-300 font-medium">
                {review.reviewerLabel.replace("Reviewer ", "R. ")}
              </span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">
              Completed
            </span>
          </div>
        ))}
        <button className="w-full mt-1 h-8 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 text-[10px] font-medium hover:border-[#1B3C53] hover:text-[#1B3C53] dark:hover:border-slate-400 dark:hover:text-white transition-colors flex items-center justify-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
            add
          </span>
          Assign Additional Reviewer
        </button>
      </div>
    </div>
  )
}

function DecisionToolsSidebar() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm px-4 pt-4 pb-3 sticky top-24">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
        Decision Tools
      </h3>
      <div className="space-y-2">
        <button className="w-full h-8 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
            check_circle
          </span>
          Accept Submission
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button className="h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-[10px] font-medium transition-colors">
            Minor Revision
          </button>
          <button className="h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-[10px] font-medium transition-colors">
            Major Revision
          </button>
        </div>
        <button className="w-full h-8 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-[10px] font-medium transition-colors flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
            cancel
          </span>
          Reject Submission
        </button>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>Current Phase:</span>
          <span className="font-bold text-[#1B3C53] dark:text-white">Decision Pending</span>
        </div>
        <div className="mt-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
            Private Chair Notes
          </label>
          <textarea
            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:border-[#1B3C53] focus:ring-0 resize-none h-16 placeholder:text-slate-300 bg-white dark:bg-slate-800 p-2"
            placeholder="Type internal notes here..."
          />
        </div>
      </div>
    </div>
  )
}

// --- Main Export ---
interface ChairReviewsTabProps {
  submission: SubmissionDetail
}

export function ChairReviewsTab({ submission }: ChairReviewsTabProps) {
  const reviews = MOCK_REVIEWS
  const rebuttal = MOCK_REBUTTAL

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main Content (2/3) */}
      <div className="lg:col-span-2 space-y-4">
        <ReviewSummaryCard reviews={reviews} />
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
        <AuthorRebuttalCard rebuttal={rebuttal} />
      </div>

      {/* Sidebar (1/3) */}
      <div className="space-y-4">
        <SubmissionMetaSidebar
          authors={submission.authors}
          conflictsOfInterest={submission.conflictsOfInterest}
        />
        <ReviewerAssignmentsSidebar reviews={reviews} />
        <DecisionToolsSidebar />
      </div>
    </div>
  )
}
