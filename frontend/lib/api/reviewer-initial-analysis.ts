import { apiFetch } from "./client"

export type ReviewerInitialAnalysisStatus = "idle" | "ready" | "stale" | "failed"

export type ReviewerInitialSource = "submission" | "derived"

export type ReviewerInitialReadinessStatus = "present" | "partial" | "not_found" | "not_applicable"

export type ReviewerInitialAnnotationCategory = "strength" | "weakness" | "suggestion" | "question"

export type ReviewerInitialAnnotationSeverity = "minor" | "moderate" | "major"

export interface ReviewerInitialSubmissionSnapshot {
  title: string
  abstract_summary: string
  manuscript_overview: string
  keywords: string[]
  track?: string | null
}

export interface ReviewerInitialReadinessSignal {
  label: string
  status: ReviewerInitialReadinessStatus
  detail: string
  source?: ReviewerInitialSource
}

export interface ReviewerInitialContribution {
  label: string
  evidence: string[]
  source?: ReviewerInitialSource
}

export interface ReviewerInitialNotableElement {
  label: string
  detail: string
  source?: ReviewerInitialSource
}

export interface ReviewerInitialAttentionPoint {
  focus: string
  reason?: string | null
  source?: ReviewerInitialSource
}

export interface ReviewerInitialScopeLimitation {
  label: string
  detail: string
  source?: ReviewerInitialSource
}

export interface ReviewerInitialBriefing {
  submission_snapshot: ReviewerInitialSubmissionSnapshot
  review_readiness_signals: ReviewerInitialReadinessSignal[]
  claimed_contributions: ReviewerInitialContribution[]
  notable_elements: ReviewerInitialNotableElement[]
  reviewer_attention_points: ReviewerInitialAttentionPoint[]
  stated_scope_and_limitations: ReviewerInitialScopeLimitation[]
}

export interface ReviewerInitialAnnotationItem {
  category: ReviewerInitialAnnotationCategory
  severity?: ReviewerInitialAnnotationSeverity | null
  quoted_passage: string
  commentary: string
  reviewer_hint?: string | null
}

export interface ReviewerInitialAnnotationSection {
  section_name: string
  summary: string
  annotations: ReviewerInitialAnnotationItem[]
}

export interface ReviewerInitialAnnotations {
  overall_impression: string
  domain_context?: string | null
  sections: ReviewerInitialAnnotationSection[]
}

export interface ReviewerInitialAnalysisArtifact {
  briefing: ReviewerInitialBriefing
  annotations: ReviewerInitialAnnotations
}

export interface ReviewerInitialAnalysisResponse {
  status: ReviewerInitialAnalysisStatus
  run_id?: string | null
  cache: {
    hit: boolean
    submission_state_fingerprint: string
  }
  artifact?: ReviewerInitialAnalysisArtifact | null
  error?: {
    code: string
    message: string
  } | null
}

export async function getReviewerInitialAnalysis(
  conferenceId: string,
  assignmentId: string,
): Promise<{ data: ReviewerInitialAnalysisResponse | null; error: string | null; status: number }> {
  try {
    const endpoint = `/api/v1/conferences/${conferenceId}/assignments/${assignmentId}/initial-analysis`
    const { data, response } = await apiFetch<{ data: ReviewerInitialAnalysisResponse }>(endpoint)
    return { data: data.data || null, error: null, status: response.status }
  } catch (error: any) {
    return {
      data: null,
      error: error.message || "Failed to fetch reviewer initial analysis",
      status: error.status || 500,
    }
  }
}

export async function generateReviewerInitialAnalysis(
  conferenceId: string,
  assignmentId: string,
): Promise<{ data: ReviewerInitialAnalysisResponse | null; error: string | null; status: number }> {
  try {
    const endpoint = `/api/v1/conferences/${conferenceId}/assignments/${assignmentId}/initial-analysis/generate`
    const { data, response } = await apiFetch<{ data: ReviewerInitialAnalysisResponse }>(endpoint, {
      method: "POST",
    })
    return { data: data.data || null, error: null, status: response.status }
  } catch (error: any) {
    return {
      data: null,
      error: error.message || "Failed to generate reviewer initial analysis",
      status: error.status || 500,
    }
  }
}
