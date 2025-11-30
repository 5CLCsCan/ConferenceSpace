import { apiFetch } from "./client"
import type { AssignedPaper } from "@/lib/types"

/**
 * Get all completed papers for a reviewer across all conferences (optimized single call)
 */
export async function getCompletedPapers(
  reviewerEmail: string,
  params?: {
    limit?: number
    offset?: number
    search?: string
  },
): Promise<{
  data: AssignedPaper[] | null
  total: number
  limit: number
  offset: number
  error: string | null
  status: number
}> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.offset) queryParams.append("offset", params.offset.toString())
    if (params?.search) queryParams.append("search", params.search)

    const queryString = queryParams.toString()
    const url = `/api/v1/reviewer/${encodeURIComponent(reviewerEmail)}/completed-papers${queryString ? `?${queryString}` : ""}`

    const { data, response } = await apiFetch<{
      data: { papers: AssignedPaper[]; total: number; limit: number; offset: number }
    }>(url)

    return {
      data: data.data?.papers || [],
      total: data.data?.total || 0,
      limit: data.data?.limit || params?.limit || 20,
      offset: data.data?.offset || params?.offset || 0,
      error: null,
      status: response.status,
    }
  } catch (error: any) {
    return {
      data: [],
      total: 0,
      limit: params?.limit || 20,
      offset: params?.offset || 0,
      error: error.message || "Failed to fetch completed papers",
      status: error.status || 500,
    }
  }
}

/**
 * Get papers assigned to a reviewer in a specific conference with optional filters
 */
export async function getConferencePapers(
  reviewerEmail: string,
  conferenceId: string,
  params?: {
    limit?: number
    offset?: number
    search?: string
    status?: string
  },
): Promise<{
  data: AssignedPaper[] | null
  total: number
  limit: number
  offset: number
  error: string | null
  status: number
}> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.offset) queryParams.append("offset", params.offset.toString())
    if (params?.search) queryParams.append("search", params.search)
    if (params?.status) queryParams.append("status", params.status)

    const queryString = queryParams.toString()
    const url = `/api/v1/reviewer/${encodeURIComponent(reviewerEmail)}/conferences/${conferenceId}/papers${queryString ? `?${queryString}` : ""}`

    const { data, response } = await apiFetch<{
      data: { papers: AssignedPaper[]; total: number; limit: number; offset: number }
    }>(url)

    return {
      data: data.data?.papers || [],
      total: data.data?.total || 0,
      limit: data.data?.limit || params?.limit || 20,
      offset: data.data?.offset || params?.offset || 0,
      error: null,
      status: response.status,
    }
  } catch (error: any) {
    return {
      data: [],
      total: 0,
      limit: params?.limit || 20,
      offset: params?.offset || 0,
      error: error.message || "Failed to fetch conference papers",
      status: error.status || 500,
    }
  }
}

/**
 * @deprecated Prefer getConferencePapers per-conference. Kept for compatibility.
 */
export async function getCompletedReviews(
  reviewerEmail: string,
  params?: { limit?: number; offset?: number; search?: string; conferenceId?: string },
): Promise<{
  data: AssignedPaper[] | null
  total: number
  limit: number
  offset: number
  error: string | null
  status: number
}> {
  // If conferenceId provided, delegate to getConferencePapers
  if (params?.conferenceId) {
    return getConferencePapers(reviewerEmail, params.conferenceId, {
      limit: params.limit,
      offset: params.offset,
      search: params.search,
      status: "completed",
    })
  }

  // Use the completed-papers endpoint for all conferences
  return getCompletedPapers(reviewerEmail, {
    limit: params?.limit,
    offset: params?.offset,
    search: params?.search,
  })
}

// ================== Review Assignment APIs ==================

export interface ReviewData {
  criteria: {
    originality: number
    technical_quality: number
    clarity: number
    significance: number
    methodology: number
  }
  feedback: {
    strengths: string
    weaknesses?: string
    questions?: string
  }
  recommendation:
    | "strong_accept"
    | "accept"
    | "weak_accept"
    | "borderline"
    | "weak_reject"
    | "reject"
    | "strong_reject"
  confidence: "high" | "medium" | "low"
}

export interface AssignmentReview {
  id: number
  conference_id: number
  submission_id: number
  reviewer_id: number
  review_status?: "draft" | "submitted"
  review_score?: number
  review_data?: ReviewData
  review_submitted_at?: string
  created_at: string
  updated_at: string
}

/**
 * Get review for a specific assignment
 * Backend endpoint: GET /api/v1/conferences/:conference_id/assignments/:assignment_id/review
 */
export async function getAssignmentReview(
  conferenceId: string,
  assignmentId: string,
): Promise<{ data: AssignmentReview | null; error: string | null; status: number }> {
  try {
    const endpoint = `/api/v1/conferences/${conferenceId}/assignments/${assignmentId}/review`
    const { data, response } = await apiFetch<{ data: AssignmentReview }>(endpoint)
    return { data: data.data || null, error: null, status: response.status }
  } catch (error: any) {
    return {
      data: null,
      error: error.message || "Failed to fetch review",
      status: error.status || 500,
    }
  }
}

/**
 * Save or submit review for a specific assignment
 * Backend endpoint: PUT /api/v1/conferences/:conference_id/assignments/:assignment_id/review
 */
export async function saveAssignmentReview(
  conferenceId: string,
  assignmentId: string,
  payload: {
    review_score?: number
    review_data?: ReviewData
    status: "draft" | "submitted"
  },
  method: "POST" | "PUT" = "POST",
): Promise<{ data: AssignmentReview | null; error: string | null; status: number }> {
  try {
    const endpoint = `/api/v1/conferences/${conferenceId}/assignments/${assignmentId}/review`
    const { data, response } = await apiFetch<{ data: AssignmentReview }>(endpoint, {
      method,
      body: JSON.stringify(payload),
    })
    return { data: data.data || null, error: null, status: response.status }
  } catch (error: any) {
    return {
      data: null,
      error: error.message || "Failed to save review",
      status: error.status || 500,
    }
  }
}
