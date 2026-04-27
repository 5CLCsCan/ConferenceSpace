import { apiFetch } from "./client"

export type PaperAnnotationStatus = "idle" | "ready" | "stale" | "failed"

export type AnnotationCategory = "strength" | "weakness" | "suggestion" | "question"

export type AnnotationSeverity = "minor" | "moderate" | "major"

export interface PaperAnnotationItem {
  category: AnnotationCategory
  severity?: AnnotationSeverity | null
  quoted_passage: string
  commentary: string
  reviewer_hint?: string | null
}

export interface PaperAnnotationSection {
  section_name: string
  summary: string
  annotations: PaperAnnotationItem[]
}

export interface PaperAnnotationGuardrails {
  advisory_only: boolean
  no_recommendation: boolean
  bias_notices: string[]
}

export interface PaperAnnotationArtifact {
  overall_impression: string
  domain_context?: string | null
  sections: PaperAnnotationSection[]
  guardrails: PaperAnnotationGuardrails
}

export interface PaperAnnotationResponse {
  status: PaperAnnotationStatus
  run_id?: string | null
  cache: {
    hit: boolean
    submission_state_fingerprint: string
  }
  artifact?: PaperAnnotationArtifact | null
  error?: {
    code: string
    message: string
  } | null
}

export async function getPaperAnnotation(
  conferenceId: string,
  assignmentId: string,
): Promise<{ data: PaperAnnotationResponse | null; error: string | null; status: number }> {
  try {
    const endpoint = `/api/v1/conferences/${conferenceId}/assignments/${assignmentId}/paper-annotation`
    const { data, response } = await apiFetch<{ data: PaperAnnotationResponse }>(endpoint)
    return { data: data.data || null, error: null, status: response.status }
  } catch (error: any) {
    return {
      data: null,
      error: error.message || "Failed to fetch paper annotation",
      status: error.status || 500,
    }
  }
}

export async function generatePaperAnnotation(
  conferenceId: string,
  assignmentId: string,
): Promise<{ data: PaperAnnotationResponse | null; error: string | null; status: number }> {
  try {
    const endpoint = `/api/v1/conferences/${conferenceId}/assignments/${assignmentId}/paper-annotation/generate`
    const { data, response } = await apiFetch<{ data: PaperAnnotationResponse }>(endpoint, {
      method: "POST",
    })
    return { data: data.data || null, error: null, status: response.status }
  } catch (error: any) {
    return {
      data: null,
      error: error.message || "Failed to generate paper annotation",
      status: error.status || 500,
    }
  }
}
