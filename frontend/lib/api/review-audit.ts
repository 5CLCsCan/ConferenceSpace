import { apiFetch, ApiError } from "./client"
import type { ReviewData } from "./reviews"

export type ReviewAuditMode = "draft_save" | "submit_preflight" | "submit_enforcement"

export interface ReviewAuditFinding {
  code: string
  severity: "warning" | "blocking"
  field: string
  rationale: string
  message: string
  suggestion: string
  condition_fingerprint: string
}

export interface ReviewAuditEvaluation {
  summary: string
  evidence_engagement: string
  consistency_assessment: string
  improvement_focus: string
}

export interface ReviewAuditResponse {
  status: "pass" | "warn" | "block"
  run_id?: string
  evaluation?: ReviewAuditEvaluation
  active_findings: ReviewAuditFinding[]
  dismissed_findings: ReviewAuditFinding[]
}

export interface ReviewAuditDismissalState {
  dismissed_warnings: Array<{
    code: string
    condition_fingerprint: string
    dismissed_at: string
  }>
}

export async function runReviewAudit(
  conferenceId: string,
  assignmentId: string,
  payload: {
    mode: ReviewAuditMode
    review_score?: number
    review_data: ReviewData
  },
): Promise<{
  data: ReviewAuditResponse | null
  error: string | null
  status: number
  errorData?: unknown
}> {
  try {
    const endpoint = `/api/v1/conferences/${conferenceId}/assignments/${assignmentId}/review-audit`
    const { data, response } = await apiFetch<{ data: ReviewAuditResponse }>(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return { data: data.data || null, error: null, status: response.status }
  } catch (error: any) {
    return {
      data: null,
      error: error.message || "Failed to run review audit",
      status: error.status || 500,
      errorData: error instanceof ApiError ? error.body : undefined,
    }
  }
}

export async function updateReviewAuditDismissal(
  conferenceId: string,
  assignmentId: string,
  payload: {
    action: "dismiss" | "undismiss"
    finding: {
      code: string
      severity: "warning" | "blocking"
      field: string
      condition_fingerprint: string
    }
  },
): Promise<{
  data: ReviewAuditDismissalState | null
  error: string | null
  status: number
  errorData?: unknown
}> {
  try {
    const endpoint = `/api/v1/conferences/${conferenceId}/assignments/${assignmentId}/review-audit/dismissals`
    const { data, response } = await apiFetch<{ data: { state: ReviewAuditDismissalState } }>(
      endpoint,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    )
    return { data: data.data?.state || null, error: null, status: response.status }
  } catch (error: any) {
    return {
      data: null,
      error: error.message || "Failed to update audit dismissal",
      status: error.status || 500,
      errorData: error instanceof ApiError ? error.body : undefined,
    }
  }
}
