// API Layer for Conference Management
// This file provides the API interface for conference-related operations
// Connected to backend API endpoints

import type { Conference, ConferenceStats, ConferenceStatus, Paper, User, Track } from "@/lib/types"
export type { Conference, ConferenceStats, ConferenceStatus, Paper, User, Track }
import { apiFetch, ApiError } from "@/lib/api/client"

// API Response wrapper for type safety
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  status: number
}

/**
 * Get conference details by ID
 * Backend endpoint: GET /api/v1/conferences/:conference_id
 * Database: conferences table
 */
export async function getConferenceById(conferenceId: string): Promise<ApiResponse<Conference>> {
  try {
    const { data, response } = await apiFetch<{ data: any }>(`/api/v1/conferences/${conferenceId}`)

    // Transform backend conference format to frontend Conference format
    const conference: Conference = {
      id: data.data.id.toString(),
      name: data.data.title,
      acronym: data.data.acronym,
      year: new Date(data.data.configurations?.start_date || data.data.created_at).getFullYear(),
      description: data.data.description,
      submission_deadline: data.data.configurations?.full_paper_submission_deadline || "",
      review_deadline: "", // TODO: Map if available
      camera_ready_deadline: data.data.configurations?.camera_ready_deadline || "",
      notification_date: "", // TODO: Map if available
      conference_date: data.data.configurations?.start_date || "",
      conference_end_date: data.data.configurations?.end_date || undefined,
      // Prefer explicit backend venue/location fields if present
      location: data.data.venue || data.data.location || "",
      website: data.data.website || "",
      status: (data.data.status || "open") as ConferenceStatus,
      tracks: data.data.tracks || [], // Ensure tracks is always an array
      domain: data.data.domain || [], // Research domains/keywords/topics
      call_for_paper_text: data.data.configurations?.call_for_paper_text || undefined,
      chair: data.data.chair,
      co_chairs: data.data.co_chairs || [], // Include co-chairs
      primary_contact: data.data.primary_contact,
      area_chair: data.data.area_chair,
      configurations: {
        start_date: data.data.configurations?.start_date,
        end_date: data.data.configurations?.end_date,
        abstract_submission_deadline: data.data.configurations?.abstract_submission_deadline,
        full_paper_submission_deadline: data.data.configurations?.full_paper_submission_deadline,
        camera_ready_deadline: data.data.configurations?.camera_ready_deadline,
        format: data.data.configurations?.format,
        review_type: data.data.configurations?.review_type,
        have_coi: data.data.configurations?.have_coi,
        maximum_pages: data.data.configurations?.maximum_pages,
        submission_format: data.data.configurations?.submission_format,
        require_complete_author_profile: data.data.configurations?.require_complete_author_profile,
        allow_paper_withdrawls: data.data.configurations?.allow_paper_withdrawls,
      },
    }

    return {
      data: conference,
      error: null,
      status: response.status,
    }
  } catch (error) {
    // Preserve status code from ApiError
    const status = error instanceof ApiError ? error.status : 500
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch conference",
      status,
    }
  }
}

/**
 * Get conference statistics
 * TODO: Backend endpoint not yet implemented - using mock data for now
 * Future endpoint: GET /api/v1/conferences/:conference_id/stats
 */
export async function getConferenceStats(
  conferenceId: string,
): Promise<ApiResponse<ConferenceStats>> {
  try {
    /*
    BACKEND REQUEST: <Implement GET /api/v1/conferences/:conference_id/stats; chair dashboard and conference analytics in frontend currently require synthetic/derived fallback metrics without an authoritative stats contract; return stable aggregates (submission totals, review progress, acceptance metrics, track/time breakdowns) with explicit field schema and empty-state behavior for new conferences.>
    */
    // TODO: Implement when backend stats endpoint is available
    // const { data, response } = await apiFetch<{ data: ConferenceStats }>(`/api/v1/conferences/${conferenceId}/stats`)
    // return {
    //   data: data.data,
    //   error: null,
    //   status: response.status,
    // }

    // For now, return mock data with proper structure
    return {
      data: {
        total_submissions: 0,
        total_reviews: 0,
        avg_reviews_per_paper: 0,
        acceptance_rate: 0,
        submissions_by_track: [],
        submissions_over_time: [],
        review_progress: {
          completed: 0,
          in_progress: 0,
          pending: 0,
        },
        top_keywords: [],
      },
      error: null,
      status: 200,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch conference stats",
      status: 500,
    }
  }
}

/**
 * Get all submissions for a conference
 * Backend endpoint: GET /api/v1/conferences/:conference_id/submissions
 * Database: submissions table
 */
export async function getConferencePapers(
  conferenceId: string,
  filters?: {
    status?: string
    track_id?: string
  },
): Promise<ApiResponse<Paper[]>> {
  try {
    // Build query parameters
    const params = new URLSearchParams()
    if (filters?.status) params.append("status", filters.status)
    // Note: track_id filtering might need backend support

    const queryString = params.toString()
    const endpoint = `/api/v1/conferences/${conferenceId}/submissions${queryString ? `?${queryString}` : ""}`

    const { data, response } = await apiFetch<{ data: { submissions: any[] } }>(endpoint)

    // Transform backend submission format to frontend Paper format
    const papers: Paper[] = data.data.submissions.map((sub) => ({
      id: sub.id.toString(),
      title: sub.title,
      abstract: sub.abstract || "",
      keywords: [], // TODO: Map from submission keywords if available
      authors: [], // TODO: Map from submission co_authors if available
      conference_id: conferenceId,
      track_id: "", // TODO: Map from submission track if available
      status: sub.status as any,
      submitted_at: sub.created_at,
      updated_at: sub.updated_at,
      version: 1,
      reviews: [],
    }))

    return {
      data: papers,
      error: null,
      status: response.status,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch conference papers",
      status: 500,
    }
  }
}

/**
 * List conferences with optional filters
 * Backend endpoint: GET /api/v1/conferences
 * Database: conferences table
 */
export async function listConferences(filters?: {
  limit?: number
  offset?: number
  title?: string
  acronym?: string
  chair?: string
  status?: string
  myConferences?: boolean
  role?: string
  myBookmark?: boolean
}): Promise<ApiResponse<{ conferences: Conference[]; total: number }>> {
  try {
    const params = new URLSearchParams()
    if (filters?.limit) params.append("limit", filters.limit.toString())
    if (filters?.offset) params.append("offset", filters.offset.toString())
    if (filters?.title) params.append("title", filters.title)
    if (filters?.acronym) params.append("acronym", filters.acronym)
    if (filters?.chair) params.append("chair", filters.chair)
    if (filters?.status) params.append("status", filters.status)
    if (filters?.myConferences !== undefined)
      params.append("myConferences", filters.myConferences.toString())
    if (filters?.role) params.append("role", filters.role)
    if (filters?.myBookmark !== undefined)
      params.append("myBookmark", filters.myBookmark.toString())

    const queryString = params.toString()
    const endpoint = `/api/v1/conferences${queryString ? `?${queryString}` : ""}`

    const { data, response } = await apiFetch<{ data: { conferences: any[]; total: number } }>(
      endpoint,
    )

    // Transform backend conference format to frontend Conference format
    const conferences: Conference[] = data.data.conferences.map((conf) => ({
      id: conf.id.toString(),
      name: conf.title,
      acronym: conf.acronym,
      year: new Date(conf.configurations?.start_date || conf.created_at).getFullYear(),
      description: conf.description,
      submission_deadline: conf.configurations?.full_paper_submission_deadline || "",
      review_deadline: "", // TODO: Map if available
      camera_ready_deadline: conf.configurations?.camera_ready_deadline || "",
      notification_date: "", // TODO: Map if available
      conference_date: conf.configurations?.start_date || "",
      conference_end_date: conf.configurations?.end_date || undefined,
      location: conf.venue || conf.location || "",
      website: conf.website || "",
      status: (conf.status || "open") as ConferenceStatus,
      tracks: conf.tracks || [], // TODO: Map if available
      domain: conf.domain || [], // Research domains/keywords/topics
      call_for_paper_text: conf.configurations?.call_for_paper_text || undefined,
      chair: conf.chair,
      primary_contact: conf.primary_contact,
      area_chair: conf.area_chair,
      userRole: conf.user_role, // Backend now provides user role information
    }))

    return {
      data: { conferences, total: data.data.total },
      error: null,
      status: response.status,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch conferences",
      status: 500,
    }
  }
}

/**
 * Create a new conference
 * Backend endpoint: POST /api/v1/conferences
 * Database: conferences table
 */
export async function createConference(conferenceData: {
  title: string
  acronym: string
  description: string
  domain: string[]
  tracks?: string[]
  venue: string
  configurations: {
    start_date: string
    end_date: string
    abstract_submission_deadline?: string
    full_paper_submission_deadline: string
    camera_ready_deadline?: string
    format: string
    review_type: string
    maximum_pages: number
    have_coi: boolean
    submission_format: string
    require_complete_author_profile: boolean
    allow_paper_withdrawls: boolean
    call_for_paper_text?: string
  }
}): Promise<ApiResponse<Conference>> {
  try {
    const payload = {
      conference: {
        title: conferenceData.title,
        acronym: conferenceData.acronym,
        description: conferenceData.description,
        domain: conferenceData.domain,
        tracks: conferenceData.tracks || [],
        venue: conferenceData.venue,
        configurations: conferenceData.configurations,
      },
    }

    const { data, response } = await apiFetch<{ data: any }>(`/api/v1/conferences`, {
      method: "POST",
      body: JSON.stringify(payload),
    })

    // Transform backend response to frontend format
    const conference: Conference = {
      id: data.data.id.toString(),
      name: data.data.title,
      acronym: data.data.acronym,
      year: new Date(data.data.configurations?.start_date || data.data.created_at).getFullYear(),
      description: data.data.description,
      submission_deadline: data.data.configurations?.full_paper_submission_deadline || "",
      review_deadline: "",
      camera_ready_deadline: data.data.configurations?.camera_ready_deadline || "",
      notification_date: "",
      conference_date: data.data.configurations?.start_date || "",
      conference_end_date: data.data.configurations?.end_date || undefined,
      location: data.data.venue || data.data.location || "",
      website: data.data.website || "",
      status: (data.data.status || "open") as ConferenceStatus,
      tracks: data.data.tracks || [],
      domain: data.data.domain || [],
      call_for_paper_text: data.data.configurations?.call_for_paper_text || undefined,
    }

    return {
      data: conference,
      error: null,
      status: response.status,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create conference",
      status: 500,
    }
  }
}

/**
 * Update an existing conference
 * Backend endpoint: PUT /api/v1/conferences/:conference_id
 * Database: conferences table
 */
export async function updateConference(
  conferenceId: string,
  updates: Partial<{
    title: string
    acronym: string
    description: string
    domain: string[]
    tracks: string[]
    venue: string
    co_chairs: string[]
    configurations: Partial<{
      start_date?: string
      end_date?: string
      abstract_submission_deadline?: string
      full_paper_submission_deadline?: string
      camera_ready_deadline?: string
      call_for_paper_text?: string
      review_type?: string
      submission_format?: string
      maximum_pages?: number
      have_coi?: boolean
      require_complete_author_profile?: boolean
      allow_paper_withdrawls?: boolean
    }>
  }>,
): Promise<ApiResponse<Conference>> {
  try {
    const payload = {
      conference: updates,
    }

    const { data, response } = await apiFetch<{ data: any }>(
      `/api/v1/conferences/${conferenceId}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    )

    // Transform backend response to frontend format
    const conference: Conference = {
      id: data.data.id.toString(),
      name: data.data.title,
      acronym: data.data.acronym,
      year: new Date(data.data.configurations?.start_date || data.data.created_at).getFullYear(),
      description: data.data.description,
      submission_deadline: data.data.configurations?.full_paper_submission_deadline || "",
      review_deadline: "",
      camera_ready_deadline: data.data.configurations?.camera_ready_deadline || "",
      notification_date: "",
      conference_date: data.data.configurations?.start_date || "",
      conference_end_date: data.data.configurations?.end_date || undefined,
      location: data.data.venue || "",
      website: data.data.website || "",
      status: (data.data.status || "open") as ConferenceStatus,
      tracks: data.data.tracks || [],
      domain: data.data.domain || [],
      call_for_paper_text: data.data.configurations?.call_for_paper_text || undefined,
      chair: data.data.chair,
      co_chairs: data.data.co_chairs || [],
      configurations: {
        start_date: data.data.configurations?.start_date,
        end_date: data.data.configurations?.end_date,
        abstract_submission_deadline: data.data.configurations?.abstract_submission_deadline,
        full_paper_submission_deadline: data.data.configurations?.full_paper_submission_deadline,
        camera_ready_deadline: data.data.configurations?.camera_ready_deadline,
        format: data.data.configurations?.format,
        review_type: data.data.configurations?.review_type,
        have_coi: data.data.configurations?.have_coi,
        maximum_pages: data.data.configurations?.maximum_pages,
        submission_format: data.data.configurations?.submission_format,
        require_complete_author_profile: data.data.configurations?.require_complete_author_profile,
        allow_paper_withdrawls: data.data.configurations?.allow_paper_withdrawls,
      },
    }

    return {
      data: conference,
      error: null,
      status: response.status,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update conference",
      status: 500,
    }
  }
}

/**
 * Delete a conference
 * Backend endpoint: DELETE /api/v1/conferences/:conference_id
 * Database: conferences table
 */
export async function deleteConference(conferenceId: string): Promise<ApiResponse<boolean>> {
  try {
    const { response } = await apiFetch(`/api/v1/conferences/${conferenceId}`, {
      method: "DELETE",
    })

    return {
      data: true,
      error: null,
      status: response.status,
    }
  } catch (error) {
    return {
      data: false,
      error: error instanceof Error ? error.message : "Failed to delete conference",
      status: 500,
    }
  }
}

/**
 * Reviewer interface matching backend DTO
 */
export interface Reviewer {
  id?: number
  user_id: number
  conference_id?: number
  email?: string
  status?: "pending" | "accepted" | "rejected"
  domain?: string[]
  created_at?: string
  updated_at?: string
}

export interface ReviewerListResponse {
  reviewers: Reviewer[]
  total: number
  limit: number
  offset: number
}

/**
 * Get conference reviewers (committee members)
 * Endpoint: GET /api/v1/conferences/:conference_id/reviewers
 */
export async function getConferenceReviewers(
  conferenceId: string,
  params?: {
    limit?: number
    offset?: number
    status?: string
  },
): Promise<ApiResponse<ReviewerListResponse>> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.offset) queryParams.append("offset", params.offset.toString())
    if (params?.status) queryParams.append("status", params.status)

    const { data, response } = await apiFetch<
      ReviewerListResponse | { data: ReviewerListResponse }
    >(`/api/v1/conferences/${conferenceId}/reviewers?${queryParams.toString()}`)

    const payload =
      (data as { data?: ReviewerListResponse })?.data || (data as ReviewerListResponse)
    const reviewers = Array.isArray(payload?.reviewers) ? payload.reviewers : []

    return {
      data: {
        reviewers,
        total: payload?.total ?? reviewers.length,
        limit: payload?.limit ?? params?.limit ?? reviewers.length,
        offset: payload?.offset ?? params?.offset ?? 0,
      },
      error: null,
      status: response.status,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch reviewers",
      status: 500,
    }
  }
}

/**
 * Invite reviewers to conference (batch)
 * Endpoint: POST /api/v1/conferences/:conference_id/reviewers
 */
export async function inviteReviewers(
  conferenceId: string,
  reviewers: { user_id: number }[],
): Promise<
  ApiResponse<{ success: Reviewer[]; failed: Array<{ user_id: number; error: string }> }>
> {
  try {
    const { data, response } = await apiFetch<{
      success: Reviewer[]
      failed: Array<{ user_id: number; error: string }>
    }>(`/api/v1/conferences/${conferenceId}/reviewers`, {
      method: "POST",
      body: JSON.stringify({ reviewers }),
    })

    return {
      data: data,
      error: null,
      status: response.status,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to invite reviewers",
      status: 500,
    }
  }
}

/**
 * Remove a reviewer from conference
 * Endpoint: DELETE /api/v1/conferences/:conference_id/reviewers/:reviewer_id
 */
export async function removeReviewer(
  conferenceId: string,
  reviewerId: string,
): Promise<ApiResponse<{ message: string }>> {
  try {
    const { data, response } = await apiFetch<{ message: string }>(
      `/api/v1/conferences/${conferenceId}/reviewers/${reviewerId}`,
      { method: "DELETE" },
    )

    return {
      data: data,
      error: null,
      status: response.status,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to remove reviewer",
      status: 500,
    }
  }
}

/**
 * Get conference committee members (alias for getConferenceReviewers)
 */
export async function getConferenceCommittee(conferenceId: string): Promise<ApiResponse<User[]>> {
  try {
    const response = await getConferenceReviewers(conferenceId, { limit: 100 })
    if (response.error || !response.data) {
      return {
        data: null,
        error: response.error || "Failed to fetch committee members",
        status: response.status,
      }
    }

    const users: User[] = response.data.reviewers.map((reviewer) => {
      const email = reviewer.email || `user-${reviewer.user_id}@unknown.local`
      const localPart = email.split("@")[0] || `User ${reviewer.user_id}`
      const name = localPart
        .split(/[._-]/g)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" ")

      return {
        id: String(reviewer.user_id),
        name: name || `User ${reviewer.user_id}`,
        email,
        roles: ["reviewer"],
        expertise: reviewer.domain || [],
        domain: reviewer.domain || [],
      }
    })

    return {
      data: users,
      error: null,
      status: response.status,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch committee members",
      status: 500,
    }
  }
}

/**
 * Get conference tracks
 * TODO: Backend endpoint not yet implemented - using mock data for now
 * Future endpoint: GET /api/conferences/:conference_id/tracks
 */
export async function getConferenceTracks(conferenceId: string): Promise<ApiResponse<Track[]>> {
  try {
    const conference = await getConferenceById(conferenceId)
    if (conference.error || !conference.data) {
      return {
        data: null,
        error: conference.error || "Failed to fetch conference tracks",
        status: conference.status,
      }
    }

    const rawTracks = Array.isArray(conference.data.tracks) ? conference.data.tracks : []
    const tracks: Track[] = rawTracks.map((rawTrack: any, index) => {
      if (typeof rawTrack === "string") {
        return {
          id: String(index + 1),
          name: rawTrack,
          description: "",
          chairs: [],
        }
      }

      return {
        id: String(rawTrack?.id ?? index + 1),
        name: String(rawTrack?.name ?? rawTrack?.title ?? `Track ${index + 1}`),
        description: String(rawTrack?.description ?? ""),
        chairs: Array.isArray(rawTrack?.chairs)
          ? rawTrack.chairs.map((chair: any) => String(chair))
          : [],
      }
    })

    return {
      data: tracks,
      error: null,
      status: 200,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch conference tracks",
      status: 500,
    }
  }
}

/**
 * Get important dates for conference
 * Extracts dates from conference configurations
 */
export interface ImportantDate {
  id: string
  title: string
  date: string
  description: string
  type: "deadline" | "notification" | "event"
  isPast: boolean
}

export async function getConferenceDates(
  conferenceId: string,
): Promise<ApiResponse<ImportantDate[]>> {
  try {
    // Fetch raw conference data to access all configuration fields
    const { data, response } = await apiFetch<{ data: any }>(`/api/v1/conferences/${conferenceId}`)

    if (!data?.data) {
      return {
        data: null,
        error: "Conference not found",
        status: 404,
      }
    }

    const config = data.data.configurations
    if (!config) {
      return {
        data: [],
        error: null,
        status: 200,
      }
    }

    const now = new Date()
    const dates: ImportantDate[] = []

    // Extract all available dates from configurations
    if (config.abstract_submission_deadline) {
      const dateStr = config.abstract_submission_deadline
      dates.push({
        id: "abstract-submission-deadline",
        title: "Abstract Submission Deadline",
        date: dateStr,
        description: "Deadline for abstract submissions",
        type: "deadline",
        isPast: new Date(dateStr) < now,
      })
    }

    if (config.full_paper_submission_deadline) {
      const dateStr = config.full_paper_submission_deadline
      dates.push({
        id: "submission-deadline",
        title: "Paper Submission Deadline",
        date: dateStr,
        description: "Final deadline for paper submissions",
        type: "deadline",
        isPast: new Date(dateStr) < now,
      })
    }

    if (config.camera_ready_deadline) {
      const dateStr = config.camera_ready_deadline
      dates.push({
        id: "camera-ready-deadline",
        title: "Camera-Ready Deadline",
        date: dateStr,
        description: "Final version of accepted papers due",
        type: "deadline",
        isPast: new Date(dateStr) < now,
      })
    }

    if (config.start_date) {
      const dateStr = config.start_date
      dates.push({
        id: "conference-start-date",
        title: "Conference Start Date",
        date: dateStr,
        description: "Main conference event begins",
        type: "event",
        isPast: new Date(dateStr) < now,
      })
    }

    if (config.end_date) {
      const dateStr = config.end_date
      dates.push({
        id: "conference-end-date",
        title: "Conference End Date",
        date: dateStr,
        description: "Main conference event ends",
        type: "event",
        isPast: new Date(dateStr) < now,
      })
    }

    // Sort dates chronologically
    dates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return {
      data: dates,
      error: null,
      status: 200,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch conference dates",
      status: 500,
    }
  }
}

/**
 * Toggle conference bookmark
 * Backend endpoint: PUT /api/v1/conferences/:conference_id/bookmark
 * Database: conference_bookmarks table
 */
export async function toggleBookmark(
  conferenceId: string,
): Promise<ApiResponse<{ message: string; isBookmarked: boolean }>> {
  try {
    const { data, response } = await apiFetch<{
      data: { message: string; is_bookmarked: boolean }
    }>(`/api/v1/conferences/${conferenceId}/bookmark`, {
      method: "PUT",
    })

    return {
      data: {
        message: data.data.message,
        isBookmarked: data.data.is_bookmarked,
      },
      error: null,
      status: response.status,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to toggle bookmark",
      status: 500,
    }
  }
}

/**
 * Update conference status (stage)
 * Expected backend endpoint: PUT /api/v1/conferences/:conference_id/status
 */
export async function updateConferenceStatus(
  conferenceId: string,
  status: ConferenceStatus,
): Promise<ApiResponse<Conference>> {
  try {
    const { data, response } = await apiFetch<{ data: any }>(
      `/api/v1/conferences/${conferenceId}/status`,
      {
        method: "PUT",
        body: JSON.stringify({
          conference_id: Number(conferenceId),
          new_status: status,
        }),
      },
    )

    const conference: Conference = {
      id: data.data.id.toString(),
      name: data.data.title,
      acronym: data.data.acronym,
      year: new Date(data.data.configurations?.start_date || data.data.created_at).getFullYear(),
      description: data.data.description,
      submission_deadline: data.data.configurations?.full_paper_submission_deadline || "",
      review_deadline: "",
      camera_ready_deadline: data.data.configurations?.camera_ready_deadline || "",
      notification_date: "",
      conference_date: data.data.configurations?.start_date || "",
      conference_end_date: data.data.configurations?.end_date || undefined,
      location: data.data.venue || data.data.location || "",
      website: data.data.website || "",
      status: (data.data.status || status) as ConferenceStatus,
      tracks: data.data.tracks || [],
      domain: data.data.domain || [],
      call_for_paper_text: data.data.configurations?.call_for_paper_text || undefined,
      chair: data.data.chair,
      primary_contact: data.data.primary_contact,
      area_chair: data.data.area_chair,
    }

    return {
      data: conference,
      error: null,
      status: response.status,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update conference status",
      status: 500,
    }
  }
}
