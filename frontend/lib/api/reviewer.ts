import { apiFetch } from "./client"
import type { ReviewRequest } from "@/lib/types"
import type {
  ReviewerStats,
  AssignmentWithPaper,
  ReviewerConference,
  ReviewerDashboardData,
  AssignedPaper,
} from "@/lib/types"

// ================== Backend Response Types ==================

// Backend response type (before mapping to frontend format)
interface BackendReviewerConference {
  id: number
  title: string
  acronym: string
  description: string
  chair: string
  primary_contact: number
  area_chair: number
  domain: string
  configurations: any
  created_at: string
  updated_at: string
  status?: string
  reviewed_papers: number
  total_papers: number
}

// Backend dashboard response type (before mapping)
interface BackendDashboardResponse {
  conferences: BackendReviewerConference[]
  stats: ReviewerStats
  invitations: ReviewRequest[]
  recent_assignments: AssignmentWithPaper[]
}

// ================== API Functions ==================

/**
 * Get complete reviewer dashboard data
 * Fetches conferences, stats, invitations, and recent assignments in one call
 */
export async function getReviewerDashboard(
  reviewerId: string,
): Promise<{ data: ReviewerDashboardData | null; error: string | null; status: number }> {
  try {
    const { data, response } = await apiFetch<{ data: BackendDashboardResponse }>(
      `/api/v1/reviewer/${reviewerId}/dashboard`,
    )
    
    // Handle case where backend returns { data: null }
    if (!data.data) {
      return {
        data: null,
        error: "No data returned from server",
        status: response.status,
      }
    }
    
    // Map backend conferences to frontend format
    const mappedConferences: ReviewerConference[] = data.data.conferences.map((conf) => {
      return {
        id: conf.id.toString(),
        name: conf.title,
        acronym: conf.acronym,
        year: new Date(conf.configurations?.start_date || conf.created_at).getFullYear(),
        description: conf.description,
        submission_deadline: conf.configurations?.full_paper_submission_deadline || "",
        review_deadline: "",
        camera_ready_deadline: conf.configurations?.camera_ready_deadline || "",
        notification_date: "",
        conference_date: conf.configurations?.start_date || conf.created_at || "",
        location: "",
        website: "",
        status: (conf.status as "upcoming" | "active" | "completed" | "open" | "closed") || "active",
        tracks: [],
        chair: conf.chair,
        primary_contact: conf.primary_contact,
        area_chair: conf.area_chair,
        userRole: "reviewer",
        reviewed_papers: conf.reviewed_papers,
        total_papers: conf.total_papers,
        domain: conf.domain,
      }
    })
    
    return {
      data: {
        conferences: mappedConferences,
        stats: data.data.stats,
        invitations: data.data.invitations,
        recent_assignments: data.data.recent_assignments,
      },
      error: null,
      status: response.status,
    }
  } catch (error: any) {
    console.error("Failed to fetch reviewer dashboard:", error)
    return {
      data: null,
      error: error.message || "Failed to fetch reviewer dashboard",
      status: error.status || 500,
    }
  }
}

/**
 * Get conferences where user is a reviewer (reuses dashboard API for consistency)
 */
export async function getReviewerConferences(
  reviewerId: string,
): Promise<{ data: ReviewerConference[] | null; error: string | null; status: number }> {
  try {
    const dashboardResponse = await getReviewerDashboard(reviewerId)
    if (dashboardResponse.error || !dashboardResponse.data) {
      return {
        data: null,
        error: dashboardResponse.error || "No dashboard data available",
        status: dashboardResponse.status,
      }
    }

    return {
      data: dashboardResponse.data.conferences || [],
      error: null,
      status: 200,
    }
  } catch (error: any) {
    console.error("Failed to fetch reviewer conferences:", error)
    return {
      data: null,
      error: error.message || "Failed to fetch reviewer conferences",
      status: error.status || 500,
    }
  }
}

/**
 * Get reviewer statistics
 */
export async function getReviewerStats(
  reviewerId: string,
): Promise<{ data: ReviewerStats | null; error: string | null; status: number }> {
  try {
    const dashboardResponse = await getReviewerDashboard(reviewerId)
    if (dashboardResponse.error || !dashboardResponse.data) {
      return {
        data: null,
        error: dashboardResponse.error || "No dashboard data available",
        status: dashboardResponse.status,
      }
    }

    return {
      data: dashboardResponse.data.stats || null,
      error: null,
      status: 200,
    }
  } catch (error: any) {
    console.error("Failed to fetch reviewer stats:", error)
    return {
      data: null,
      error: error.message || "Failed to fetch reviewer stats",
      status: error.status || 500,
    }
  }
}

/**
 * Get pending review invitations/requests
 */
export async function getReviewRequests(
  reviewerId: string,
): Promise<{ data: ReviewRequest[] | null; error: string | null; status: number }> {
  try {
    const dashboardResponse = await getReviewerDashboard(reviewerId)
    if (dashboardResponse.error || !dashboardResponse.data) {
      return {
        data: null,
        error: dashboardResponse.error || "No dashboard data available",
        status: dashboardResponse.status,
      }
    }

    return {
      data: dashboardResponse.data.invitations || [],
      error: null,
      status: 200,
    }
  } catch (error: any) {
    console.error("Failed to fetch review requests:", error)
    return {
      data: null,
      error: error.message || "Failed to fetch review requests",
      status: error.status || 500,
    }
  }
}

/**
 * Get papers assigned to reviewer in a specific conference (simple version for backward compatibility)
 */
export async function getReviewerPapersForConference(
  reviewerId: string,
  conferenceId: string,
): Promise<{ data: AssignedPaper[] | null; error: string | null; status: number }> {
  try {
    const { data, response } = await apiFetch<{
      data: { papers: AssignedPaper[]; total: number }
    }>(`/api/v1/reviewer/${reviewerId}/conferences/${conferenceId}/papers`)

    // Backend now returns { data: { papers: [...], total: X } }
    return {
      data: data.data?.papers || [],
      error: null,
      status: response.status,
    }
  } catch (error: any) {
    console.error("Failed to fetch reviewer papers:", error)
    // Return empty array instead of null for better UX
    return {
      data: [],
      error: error.message || "Failed to fetch reviewer papers",
      status: error.status || 500,
    }
  }
}

/**
 * Get papers assigned to reviewer in a specific conference with pagination and filters
 */
export async function getReviewerPapersWithPagination(
  reviewerId: string,
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
    // Build query string
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.offset) queryParams.append("offset", params.offset.toString())
    if (params?.search) queryParams.append("search", params.search)
    if (params?.status) queryParams.append("status", params.status)

    const queryString = queryParams.toString()
    const url = `/api/v1/reviewer/${reviewerId}/conferences/${conferenceId}/papers${queryString ? `?${queryString}` : ""}`

    const { data, response } = await apiFetch<{
      data: { papers: AssignedPaper[]; total: number; limit: number; offset: number }
    }>(url)

    // Backend returns { data: { papers: [...], total: X, limit: Y, offset: Z } }
    return {
      data: data.data?.papers || [],
      total: data.data?.total || 0,
      limit: data.data?.limit || params?.limit || 20,
      offset: data.data?.offset || params?.offset || 0,
      error: null,
      status: response.status,
    }
  } catch (error: any) {
    console.error("Failed to fetch reviewer papers:", error)
    return {
      data: [],
      total: 0,
      limit: params?.limit || 20,
      offset: params?.offset || 0,
      error: error.message || "Failed to fetch reviewer papers",
      status: error.status || 500,
    }
  }
}

/**
 * Respond to a review invitation (accept or decline)
 */
export async function respondToReviewRequest(
  conferenceId: string,
  reviewerId: string,
  status: "accepted" | "declined",
): Promise<{ data: any | null; error: string | null; status: number }> {
  try {
    const { data: responseData, response: httpResponse } = await apiFetch<{ data: any }>(
      `/api/v1/conferences/${conferenceId}/reviewers/${reviewerId}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      },
    )
    return {
      data: responseData.data,
      error: null,
      status: httpResponse.status,
    }
  } catch (error: any) {
    console.error("Failed to respond to review request:", error)
    return {
      data: null,
      error: error.message || "Failed to respond to review request",
      status: error.status || 500,
    }
  }
}

/**
 * Get recent assignments for reviewer dashboard
 */
export async function getRecentAssignments(
  reviewerId: string,
): Promise<{ data: AssignmentWithPaper[] | null; error: string | null; status: number }> {
  try {
    const dashboardResponse = await getReviewerDashboard(reviewerId)
    if (dashboardResponse.error || !dashboardResponse.data) {
      return {
        data: null,
        error: dashboardResponse.error || "No dashboard data available",
        status: dashboardResponse.status,
      }
    }

    return {
      data: dashboardResponse.data.recent_assignments || [],
      error: null,
      status: 200,
    }
  } catch (error: any) {
    console.error("Failed to fetch recent assignments:", error)
    return {
      data: null,
      error: error.message || "Failed to fetch recent assignments",
      status: error.status || 500,
    }
  }
}
