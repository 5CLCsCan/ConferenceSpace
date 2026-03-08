// API Layer for Submission Management
// This file provides the API interface for submission-related operations
// Connected to backend API endpoints

import type { Conference } from "@/lib/types"
import { apiFetch } from "@/lib/api/client"
import { listConferences } from "./conferences"
import type { ApiResponse } from "./conferences"

// Submission interface matching backend DTO
export interface Submission {
  id: number
  conference_id: number
  author: string
  title: string
  abstract: string
  link?: string
  domain: string[]
  status: "draft" | "published" | "reviewing" | "accepted" | "rejected"
  information?: {
    co_authors?: string[]
    keywords?: string[]
    paper_type?: string
    track_name?: string
    additional_notes?: string
    declared_conflicts?: Array<{
      email: string
      reason: string
    }>
    metadata?: Record<string, unknown>
  }
  file?: {
    filename: string
    original_name: string
    size: number
    mime_type: string
    path: string
  }
  cover_letter?: {
    filename: string
    original_name: string
    size: number
    mime_type: string
    path: string
  }
  camera_ready?: {
    filename: string
    original_name: string
    size: number
    mime_type: string
    path: string
  }
  rebuttal_phase?: string
  rebuttal_general_response?: string
  created_at: string
  updated_at: string
}

// Submission with conference context for display
export interface SubmissionWithConference extends Submission {
  conference: Conference
}

/**
 * Get submissions for a specific conference with optional filters
 * Backend endpoint: GET /api/v1/conferences/:conference_id/submissions
 * Database: submissions table
 */
export async function getConferenceSubmissions(
  conferenceId: string,
  filters?: {
    author?: string
    status?: string
    title?: string
    limit?: number
    offset?: number
  },
): Promise<ApiResponse<{ submissions: Submission[]; total: number }>> {
  try {
    const params = new URLSearchParams()
    if (filters?.author) params.append("author", filters.author)
    if (filters?.status) params.append("status", filters.status)
    if (filters?.title) params.append("title", filters.title)
    if (filters?.limit) params.append("limit", filters.limit.toString())
    if (filters?.offset) params.append("offset", filters.offset.toString())

    const queryString = params.toString()
    const endpoint = `/api/v1/conferences/${conferenceId}/submissions${queryString ? `?${queryString}` : ""}`

    console.log("[getConferenceSubmissions] Fetching:", { endpoint, filters })

    const { data, response } = await apiFetch<{
      data: { submissions: Submission[]; total: number }
    }>(endpoint)

    console.log("[getConferenceSubmissions] Response:", {
      status: response.status,
      count: data.data?.submissions?.length || 0,
      total: data.data?.total || 0,
    })

    return {
      data: data.data,
      error: null,
      status: response.status,
    }
  } catch (error) {
    console.error("[getConferenceSubmissions] Error:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch submissions",
      status: 500,
    }
  }
}

/**
 * Get a single submission by ID
 * Backend endpoint: GET /api/v1/conferences/:conference_id/submissions/:id
 */
export async function getSubmissionById(
  conferenceId: string,
  submissionId: string,
): Promise<ApiResponse<Submission>> {
  try {
    const endpoint = `/api/v1/conferences/${conferenceId}/submissions/${submissionId}`

    console.log("[getSubmissionById] Fetching:", { endpoint, conferenceId, submissionId })

    const { data, response } = await apiFetch<{ data: Submission }>(endpoint)

    console.log("[getSubmissionById] Response:", {
      status: response.status,
      submissionId: data.data?.id,
      title: data.data?.title,
    })

    return {
      data: data.data,
      error: null,
      status: response.status,
    }
  } catch (error) {
    console.error("[getSubmissionById] Error:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch submission",
      status: 500,
    }
  }
}

/**
 * Update submission status
 * Backend endpoint: PUT /api/v1/conferences/:conference_id/submissions/:id/status
 */
export async function updateSubmissionStatus(
  conferenceId: string,
  submissionId: string,
  status: "draft" | "published" | "reviewing" | "accepted" | "rejected",
): Promise<ApiResponse<Submission>> {
  try {
    const endpoint = `/api/v1/conferences/${conferenceId}/submissions/${submissionId}/status`

    if (!status || status.trim() === "") {
      console.error("Status is empty or invalid!")
      // Handle error, ví dụ throw hoặc alert
      return {
        data: null,
        error: "Status is empty or invalid",
        status: 400,
      }
    }
    console.log("Sending body:", JSON.stringify({ status }))
    const { data, response } = await apiFetch<{ data: Submission }>(endpoint, {
      method: "PUT",
      body: JSON.stringify({ status }),
    })

    return {
      data: data.data,
      error: null,
      status: response.status,
    }
  } catch (error) {
    console.error("[updateSubmissionStatus] Error:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update submission status",
      status: 500,
    }
  }
}

/**
 * Get all submissions for the authenticated user across all conferences.
 *
 * Strategy: Query only conferences where this user has the "author" role instead
 * of listing ALL conferences.  This avoids scanning rows that belong to broken
 * conferences (e.g. NULL title) that the user is not a member of.
 *
 * Backend endpoint: GET /api/v1/conferences/:conference_id/submissions?author=email
 */
export async function getUserSubmissions(
  userEmail: string,
): Promise<ApiResponse<SubmissionWithConference[]>> {
  try {
    console.log("[getUserSubmissions] Starting fetch for user:", userEmail)

    // Fetch only conferences where this user has a role (author/reviewer/chair).
    // The NULL-titled conference is almost certainly not associated with any real
    // user, so this filter naturally excludes it and avoids the backend scan error.
    const conferencesResponse = await listConferences({
      limit: 1000,
      myConferences: true,
    })

    if (conferencesResponse.error || !conferencesResponse.data) {
      // Even the filtered list failed — fall back silently (show empty state).
      console.warn(
        "[getUserSubmissions] Failed to fetch user conferences:",
        conferencesResponse.error,
      )
      return { data: [], error: null, status: 200 }
    }

    const conferences = conferencesResponse.data.conferences
    console.log("[getUserSubmissions] Found user conferences:", conferences.length)

    // Fetch submissions for ALL conferences in PARALLEL (instead of sequential loop)
    // Use Promise.allSettled so a single failing conference doesn't break the whole page.
    const submissionPromises = conferences.map((conference) =>
      getConferenceSubmissions(conference.id, {
        author: userEmail,
      }).then((response) => ({
        conference,
        response,
      })),
    )

    const results = await Promise.allSettled(submissionPromises)

    // Collect all submissions with conference context, skipping any that failed
    const allSubmissions: SubmissionWithConference[] = results.flatMap((result) => {
      if (result.status === "rejected") return []
      const { conference, response } = result.value
      if (response.data && response.data.submissions.length > 0) {
        console.log(
          `[getUserSubmissions] Found ${response.data.submissions.length} submissions for conference ${conference.id}`,
        )
        return response.data.submissions.map((submission) => ({
          ...submission,
          conference,
        }))
      }
      return []
    })

    console.log("[getUserSubmissions] Total submissions found:", allSubmissions.length)
    return {
      data: allSubmissions,
      error: null,
      status: 200,
    }
  } catch (error) {
    console.error("[getUserSubmissions] Error:", error)
    return {
      data: [],
      error: null,
      status: 200,
    }
  }
}
