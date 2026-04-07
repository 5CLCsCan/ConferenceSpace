// =============================================================================
// Types for Submission Review
// =============================================================================

export interface SubmissionDetails {
  id: string
  submissionId: string
  title: string
  abstract: string
  keywords: string[]
  track: string
  status: "under_review" | "reviewed" | "pending"
  dueDate: string
  daysLeft: number
  supplementaryMaterial?: { name: string; size: string }
  conference: {
    id: string
    acronym: string
    name: string
  }
}

export interface ReviewFormData {
  originality: number
  technicalQuality: number
  clarity: number
  significance: number
  methodology: number
  summary: string
  strengths: string
  weaknesses: string
  questions: string
  recommendation: string
  confidence: number
  lastSaved?: string
}

export type TabType = "review" | "discussion" | "rebuttal"

/** Score descriptor labels for academic reviewing */
export const SCORE_DESCRIPTORS: Record<number, { labelKey: string; color: string }> = {
  1: {
    labelKey: "runtime.components.reviewer.submission-review.scoring-criteria.text_score_poor",
    color: "#dc2626",
  },
  2: {
    labelKey: "runtime.components.reviewer.submission-review.scoring-criteria.text_score_weak",
    color: "#ea580c",
  },
  3: {
    labelKey:
      "runtime.components.reviewer.submission-review.scoring-criteria.text_score_below_average",
    color: "#f59e0b",
  },
  4: {
    labelKey: "runtime.components.reviewer.submission-review.scoring-criteria.text_score_fair",
    color: "#eab308",
  },
  5: {
    labelKey:
      "runtime.components.reviewer.submission-review.scoring-criteria.text_score_borderline",
    color: "#a3a3a3",
  },
  6: {
    labelKey:
      "runtime.components.reviewer.submission-review.scoring-criteria.text_score_acceptable",
    color: "#84cc16",
  },
  7: {
    labelKey: "runtime.components.reviewer.submission-review.scoring-criteria.text_score_good",
    color: "#22c55e",
  },
  8: {
    labelKey: "runtime.components.reviewer.submission-review.scoring-criteria.text_score_strong",
    color: "#16a34a",
  },
  9: {
    labelKey:
      "runtime.components.reviewer.submission-review.scoring-criteria.text_score_excellent",
    color: "#059669",
  },
  10: {
    labelKey:
      "runtime.components.reviewer.submission-review.scoring-criteria.text_score_outstanding",
    color: "#0d9488",
  },
}

export const DEFAULT_REVIEW_SCORE = 5

export function normalizeReviewScore(raw: unknown, fallback = DEFAULT_REVIEW_SCORE): number {
  const value = typeof raw === "number" ? raw : Number(raw)
  if (!Number.isFinite(value)) {
    return fallback
  }

  const rounded = Math.round(value)
  if (rounded < 1) return 1
  if (rounded > 10) return 10
  return rounded
}

export function getScoreDescriptor(raw: unknown) {
  const normalized = normalizeReviewScore(raw)
  return SCORE_DESCRIPTORS[normalized] || SCORE_DESCRIPTORS[DEFAULT_REVIEW_SCORE]
}

/** Criterion metadata with icons and descriptions */
export const CRITERIA_META: Record<string, { icon: string; hintKey: string }> = {
  originality: {
    icon: "lightbulb",
    hintKey:
      "runtime.components.reviewer.submission-review.scoring-criteria.text_hint_originality",
  },
  technicalQuality: {
    icon: "precision_manufacturing",
    hintKey:
      "runtime.components.reviewer.submission-review.scoring-criteria.text_hint_technical_quality",
  },
  clarity: {
    icon: "edit_document",
    hintKey: "runtime.components.reviewer.submission-review.scoring-criteria.text_hint_clarity",
  },
  significance: {
    icon: "trending_up",
    hintKey:
      "runtime.components.reviewer.submission-review.scoring-criteria.text_hint_significance",
  },
  methodology: {
    icon: "science",
    hintKey:
      "runtime.components.reviewer.submission-review.scoring-criteria.text_hint_methodology",
  },
}

/** Recommendation options with visual metadata (CVPR/NeurIPS standard) */
export const RECOMMENDATION_OPTIONS = [
  {
    value: "strong_accept",
    label: "Strong Accept",
    shortLabel: "S.Accept",
    color: "#059669",
    description: "Crucial contribution, should definitely be accepted",
  },
  {
    value: "accept",
    label: "Accept",
    shortLabel: "Accept",
    color: "#16a34a",
    description: "Solid contribution, should be accepted",
  },
  {
    value: "weak_accept",
    label: "Weak Accept",
    shortLabel: "W.Accept",
    color: "#22c55e",
    description: "Good work, marginally above the threshold",
  },
  {
    value: "borderline",
    label: "Borderline",
    shortLabel: "Border",
    color: "#64748b",
    description: "Unsure, could go either way",
  },
  {
    value: "weak_reject",
    label: "Weak Reject",
    shortLabel: "W.Reject",
    color: "#f59e0b",
    description: "Marginally below the threshold",
  },
  {
    value: "reject",
    label: "Reject",
    shortLabel: "Reject",
    color: "#ea580c",
    description: "Clear rejection warranted",
  },
  {
    value: "strong_reject",
    label: "Strong Reject",
    shortLabel: "S.Reject",
    color: "#dc2626",
    description: "Significant flaws, definite rejection",
  },
] as const

export type RecommendationValue = (typeof RECOMMENDATION_OPTIONS)[number]["value"]

export const confidenceOptions = [
  { value: 5, label: "Expert", fullLabel: "You are an expert in the field" },
  { value: 4, label: "High", fullLabel: "You are very confident in your assessment" },
  { value: 3, label: "Medium", fullLabel: "You are fairly confident in your assessment" },
  { value: 2, label: "Low", fullLabel: "You are not very confident" },
  { value: 1, label: "None", fullLabel: "This is outside your area of expertise" },
]

export const INITIAL_FORM_DATA: ReviewFormData = {
  originality: 8,
  technicalQuality: 7,
  clarity: 9,
  significance: 6,
  methodology: 8,
  summary: "",
  strengths: "",
  weaknesses: "",
  questions: "",
  recommendation: "",
  confidence: 3,
  lastSaved: "3:42 PM",
}
