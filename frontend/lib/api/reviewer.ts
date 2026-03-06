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

// Backend dashboard response type (before mapping) - with pagination
interface BackendDashboardResponse {
  conferences: {
    data: BackendReviewerConference[]
    total: number
    limit: number
    offset: number
  }
  stats: {
    total_assigned: number
    pending: number
    in_progress: number
    completed: number
    pending_requests: number
  }
  invitations: {
    data: ReviewRequest[]
    total: number
    limit: number
    offset: number
  }
  recent_assignments: AssignmentWithPaper[]
}

// ================== API Functions ==================

/**
 * Options for dashboard API call with pagination and filters
 */
export interface DashboardOptions {
  // Conference pagination and filters
  conferenceLimit?: number
  conferenceOffset?: number
  conferenceSearch?: string

  // Invitation pagination and filters
  invitationLimit?: number
  invitationOffset?: number
  invitationStatus?: string

  // Recent assignments limit and offset
  recentAssignmentLimit?: number
  recentAssignmentOffset?: number
}

/**
 * Get complete reviewer dashboard data with pagination
 * Fetches conferences, stats, invitations, and recent assignments in one call
 */
export async function getReviewerDashboard(
  reviewerEmail: string,
  options: DashboardOptions = {},
): Promise<{ data: ReviewerDashboardData | null; error: string | null; status: number }> {
  try {
    // Build query string with all parameters
    const queryParams = new URLSearchParams()

    // Conference params (default: limit 10, offset 0)
    if (options.conferenceLimit !== undefined) {
      queryParams.append("conference_limit", options.conferenceLimit.toString())
    }
    if (options.conferenceOffset !== undefined) {
      queryParams.append("conference_offset", options.conferenceOffset.toString())
    }
    if (options.conferenceSearch) {
      queryParams.append("conference_search", options.conferenceSearch)
    }

    // Invitation params (default: limit 10, offset 0)
    if (options.invitationLimit !== undefined) {
      queryParams.append("invitation_limit", options.invitationLimit.toString())
    }
    if (options.invitationOffset !== undefined) {
      queryParams.append("invitation_offset", options.invitationOffset.toString())
    }
    if (options.invitationStatus) {
      queryParams.append("invitation_status", options.invitationStatus)
    }

    // Recent assignments limit and offset (default: limit 10, offset 0)
    if (options.recentAssignmentLimit !== undefined) {
      queryParams.append("recent_assignment_limit", options.recentAssignmentLimit.toString())
    }
    if (options.recentAssignmentOffset !== undefined) {
      queryParams.append("recent_assignment_offset", options.recentAssignmentOffset.toString())
    }

    const queryString = queryParams.toString()
    const url = `/api/v1/reviewer/${encodeURIComponent(reviewerEmail)}/dashboard${queryString ? `?${queryString}` : ""}`

    let data: { data: BackendDashboardResponse }
    let response: Response

    try {
      const result = await apiFetch<{ data: BackendDashboardResponse }>(url)
      data = result.data
      response = result.response
    } catch (fetchError: any) {
      // If endpoint doesn't exist (404/500), return empty dashboard data
      console.warn("Reviewer dashboard endpoint not available, returning empty data:", fetchError)
      return {
        data: {
          conferences: [],
          stats: {
            total_assigned: 0,
            pending: 0,
            in_progress: 0,
            completed: 0,
            pending_requests: 0,
          },
          invitations: [],
          recent_assignments: [],
          total_conferences: 0,
          total_invitations: 0,
          total_assignments: 0,
        },
        error: null,
        status: 200,
      }
    }

    // Handle case where backend returns { data: null }
    if (!data.data) {
      return {
        data: null,
        error: "No data returned from server",
        status: response.status,
      }
    }

    // Check if backend returned the new paginated format or old format
    const backendData = data.data
    const isNewFormat =
      backendData.conferences &&
      typeof backendData.conferences === "object" &&
      "data" in backendData.conferences

    // Map backend conferences to frontend format
    const conferencesArray = isNewFormat
      ? (backendData.conferences as any).data
      : backendData.conferences || []
    const mappedConferences: ReviewerConference[] = conferencesArray.map(
      (conf: BackendReviewerConference) => {
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
          status:
            (conf.status as "upcoming" | "active" | "completed" | "open" | "closed") || "active",
          tracks: [],
          chair: conf.chair,
          primary_contact: conf.primary_contact,
          area_chair: conf.area_chair,
          userRole: "reviewer",
          reviewed_papers: conf.reviewed_papers,
          total_papers: conf.total_papers,
          domain: conf.domain,
        }
      },
    )

    // Enrich conference total_papers with accurate counts (excluding 'suggested' assignments).
    // The dashboard's total_papers includes suggested; the per-conference papers endpoint does not.
    // We use limit=1 to minimise data transfer — we only need the total count.
    if (mappedConferences.length > 0) {
      const paperTotals = await Promise.allSettled(
        mappedConferences.map((conf) =>
          apiFetch<{ data: { papers: AssignedPaper[]; total: number } }>(
            `/api/v1/reviewer/${encodeURIComponent(reviewerEmail)}/conferences/${conf.id}/papers?limit=1&offset=0`,
          ).then((r) => ({ confId: conf.id, total: r.data.data?.total ?? conf.total_papers }))
            .catch(() => ({ confId: conf.id, total: conf.total_papers })),
        ),
      )
      const totalMap = new Map<string, number>()
      for (const result of paperTotals) {
        if (result.status === "fulfilled") {
          totalMap.set(result.value.confId, result.value.total)
        }
      }
      for (const conf of mappedConferences) {
        if (totalMap.has(conf.id)) {
          conf.total_papers = totalMap.get(conf.id)!
        }
      }
    }

    // Extract invitations, assignments and totals based on format
    const invitationsArray = isNewFormat
      ? (backendData.invitations as any).data
      : backendData.invitations || []
    const assignmentsArray = isNewFormat
      ? (backendData.recent_assignments as any).data
      : backendData.recent_assignments || []
    const totalConferences = isNewFormat
      ? (backendData.conferences as any).total
      : mappedConferences.length
    const totalInvitations = isNewFormat
      ? (backendData.invitations as any).total
      : invitationsArray.length
    const totalAssignments = isNewFormat
      ? (backendData.recent_assignments as any).total
      : assignmentsArray.length

    // Debug: Log stats structure
    console.log("Backend stats:", backendData.stats)

    return {
      data: {
        conferences: mappedConferences,
        stats: backendData.stats,
        invitations: invitationsArray,
        recent_assignments: assignmentsArray,
        total_conferences: totalConferences,
        total_invitations: totalInvitations,
        total_assignments: totalAssignments,
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
  reviewerEmail: string,
): Promise<{ data: ReviewerConference[] | null; error: string | null; status: number }> {
  try {
    const dashboardResponse = await getReviewerDashboard(reviewerEmail)
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
  reviewerEmail: string,
): Promise<{ data: ReviewerStats | null; error: string | null; status: number }> {
  try {
    const dashboardResponse = await getReviewerDashboard(reviewerEmail)
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
  reviewerEmail: string,
): Promise<{ data: ReviewRequest[] | null; error: string | null; status: number }> {
  try {
    const dashboardResponse = await getReviewerDashboard(reviewerEmail)
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
  reviewerEmail: string,
  conferenceId: string,
): Promise<{ data: AssignedPaper[] | null; error: string | null; status: number }> {
  try {
    const { data, response } = await apiFetch<{
      data: { papers: AssignedPaper[]; total: number }
    }>(`/api/v1/reviewer/${encodeURIComponent(reviewerEmail)}/conferences/${conferenceId}/papers`)

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
    // Build query string
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
 * Respond to a review invitation (accept or reject)
 */
export async function respondToReviewRequest(
  conferenceId: string,
  reviewerId: string,
  status: "accepted" | "rejected",
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
  reviewerEmail: string,
): Promise<{ data: AssignmentWithPaper[] | null; error: string | null; status: number }> {
  try {
    const dashboardResponse = await getReviewerDashboard(reviewerEmail)
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
