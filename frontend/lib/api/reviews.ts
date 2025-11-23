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
