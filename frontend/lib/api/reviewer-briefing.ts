import { apiFetch } from "./client"

export type ReviewerBriefingStatus = "idle" | "ready" | "stale" | "failed"

export interface ReviewerBriefingGuardrails {
  no_recommendation: boolean
  no_score: boolean
  bias_notice: string
}

export interface ReviewerBriefingSubmissionSnapshot {
  title: string
  abstract_summary: string
  manuscript_overview: string
  keywords: string[]
  track?: string | null
}

export interface ReviewerBriefingContribution {
  label: string
  evidence: string[]
  source?: "submission" | "derived"
}

export interface ReviewerBriefingReadinessSignal {
  label: string
  status: "present" | "partial" | "not_found" | "not_applicable"
  detail: string
  source?: "submission" | "derived"
}

export interface ReviewerBriefingNotableElement {
  label: string
  detail: string
  source?: "submission" | "derived"
}

export interface ReviewerBriefingAttentionPoint {
  focus: string
  reason?: string | null
  source?: "submission" | "derived"
}

export interface ReviewerBriefingScopeLimitation {
  label: string
  detail: string
  source?: "submission" | "derived"
}

export interface ReviewerBriefingArtifact {
  submission_snapshot: ReviewerBriefingSubmissionSnapshot
  review_readiness_signals?: ReviewerBriefingReadinessSignal[]
  claimed_contributions: ReviewerBriefingContribution[]
  notable_elements: ReviewerBriefingNotableElement[]
  reviewer_attention_points: ReviewerBriefingAttentionPoint[]
  stated_scope_and_limitations: ReviewerBriefingScopeLimitation[]
  guardrails: ReviewerBriefingGuardrails
}

export interface ReviewerBriefingResponse {
  status: ReviewerBriefingStatus
  run_id?: string | null
  cache: {
    hit: boolean
    submission_state_fingerprint: string
  }
  artifact?: ReviewerBriefingArtifact | null
  error?: {
    code: string
    message: string
  } | null
}

export async function getAssignmentBriefing(
  conferenceId: string,
  assignmentId: string,
): Promise<{ data: ReviewerBriefingResponse | null; error: string | null; status: number }> {
  try {
    const endpoint = `/api/v1/conferences/${conferenceId}/assignments/${assignmentId}/briefing`
    const { data, response } = await apiFetch<{ data: ReviewerBriefingResponse }>(endpoint)
    return { data: data.data || null, error: null, status: response.status }
  } catch (error: any) {
    return {
      data: null,
      error: error.message || "Failed to fetch reviewer briefing",
      status: error.status || 500,
    }
  }
}

export async function generateAssignmentBriefing(
  conferenceId: string,
  assignmentId: string,
): Promise<{ data: ReviewerBriefingResponse | null; error: string | null; status: number }> {
  try {
    const endpoint = `/api/v1/conferences/${conferenceId}/assignments/${assignmentId}/briefing/generate`
    const { data, response } = await apiFetch<{ data: ReviewerBriefingResponse }>(endpoint, {
      method: "POST",
    })
    return { data: data.data || null, error: null, status: response.status }
  } catch (error: any) {
    return {
      data: null,
      error: error.message || "Failed to generate reviewer briefing",
      status: error.status || 500,
    }
  }
}
