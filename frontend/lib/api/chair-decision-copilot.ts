import { apiFetch } from "./client"

export type ChairDecisionCopilotStatus = "idle" | "generating" | "ready" | "stale" | "failed"

export interface ChairDecisionCopilotCache {
  hit: boolean
  evidence_fingerprint: string
  is_stale: boolean
  stale_reasons: string[]
}

export interface ChairDecisionCopilotEvidenceSummary {
  overview: string
  evidence_basis: string[]
}

export interface ChairDecisionCopilotReviewFeedbackSynthesis {
  summary: string
  strengths: string[]
  weaknesses: string[]
  questions: string[]
}

export interface ChairDecisionCopilotCountMetric {
  label: string
  count: number
}

export interface ChairDecisionCopilotReviewAnalytics {
  review_distribution: ChairDecisionCopilotCountMetric[]
  confidence_mix: ChairDecisionCopilotCountMetric[]
  strongest_criteria: string[]
  weakest_criteria: string[]
  review_coverage_completeness: string
  score_changes_after_rebuttal?: string | null
}

export interface ChairDecisionCopilotDiscussionSignals {
  summary: string
  thread_count: number
  message_count: number
  last_activity_at?: string | null
}

export interface ChairDecisionCopilotRebuttalSignals {
  status: "available" | "not_applicable"
  summary: string
}

export interface ChairDecisionCopilotDisagreementMap {
  areas_of_agreement: string[]
  areas_of_disagreement: string[]
  unresolved_concerns: string[]
  confidence_limits: string[]
}

export interface ChairDecisionCopilotArtifact {
  evidence_summary: ChairDecisionCopilotEvidenceSummary
  review_feedback_synthesis: ChairDecisionCopilotReviewFeedbackSynthesis
  review_analytics: ChairDecisionCopilotReviewAnalytics
  discussion_signals: ChairDecisionCopilotDiscussionSignals
  rebuttal_signals: ChairDecisionCopilotRebuttalSignals
  disagreement_map: ChairDecisionCopilotDisagreementMap
  suggested_chair_note: string
  evidence_fingerprint: string
  generated_at: string
}

export interface ChairDecisionCopilotResponse {
  status: ChairDecisionCopilotStatus
  run_id?: string | null
  cache: ChairDecisionCopilotCache
  artifact?: ChairDecisionCopilotArtifact | null
  error?: {
    code: string
    message: string
  } | null
}

async function resolveChairDecisionCopilot(
  conferenceId: string,
  submissionId: string,
  action?: "generate" | "regenerate",
): Promise<{ data: ChairDecisionCopilotResponse | null; error: string | null; status: number }> {
  const endpoint = action
    ? `/api/v1/conferences/${conferenceId}/submissions/${submissionId}/decision-copilot/${action}`
    : `/api/v1/conferences/${conferenceId}/submissions/${submissionId}/decision-copilot`

  try {
    const result = action
      ? await apiFetch<{ data: ChairDecisionCopilotResponse }>(endpoint, { method: "POST" })
      : await apiFetch<{ data: ChairDecisionCopilotResponse }>(endpoint)

    const { data, response } = result

    return { data: data.data || null, error: null, status: response.status }
  } catch (error: any) {
    return {
      data: null,
      error: error.message || "Failed to resolve chair decision copilot",
      status: error.status || 500,
    }
  }
}

export function getChairDecisionCopilot(conferenceId: string, submissionId: string) {
  return resolveChairDecisionCopilot(conferenceId, submissionId)
}

export function generateChairDecisionCopilot(conferenceId: string, submissionId: string) {
  return resolveChairDecisionCopilot(conferenceId, submissionId, "generate")
}

export function regenerateChairDecisionCopilot(conferenceId: string, submissionId: string) {
  return resolveChairDecisionCopilot(conferenceId, submissionId, "regenerate")
}
