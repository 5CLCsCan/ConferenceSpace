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
  status: "draft" | "published"
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
 * Get all submissions for the authenticated user across all conferences
 * Strategy: Fetch all conferences first, then fetch submissions with author filter for each conference
 * Backend endpoint: GET /api/v1/conferences/:conference_id/submissions?author=email
 */
export async function getUserSubmissions(
  userEmail: string,
): Promise<ApiResponse<SubmissionWithConference[]>> {
  try {
    console.log("[getUserSubmissions] Starting fetch for user:", userEmail)

    // First, fetch all conferences
    const conferencesResponse = await listConferences({ limit: 1000 })
    if (conferencesResponse.error || !conferencesResponse.data) {
      console.error("[getUserSubmissions] Failed to fetch conferences:", conferencesResponse.error)
      return {
        data: null,
        error: conferencesResponse.error || "Failed to fetch conferences",
        status: conferencesResponse.status,
      }
    }

    const conferences = conferencesResponse.data.conferences
    console.log("[getUserSubmissions] Found conferences:", conferences.length)
    const allSubmissions: SubmissionWithConference[] = []

    // Fetch submissions for each conference with author filter
    for (const conference of conferences) {
      const submissionsResponse = await getConferenceSubmissions(conference.id, {
        author: userEmail,
      })

      if (submissionsResponse.data && submissionsResponse.data.submissions.length > 0) {
        console.log(
          `[getUserSubmissions] Found ${submissionsResponse.data.submissions.length} submissions for conference ${conference.id}`,
        )
        // Add conference context to each submission
        const submissionsWithConference = submissionsResponse.data.submissions.map(
          (submission) => ({
            ...submission,
            conference,
          }),
        )
        allSubmissions.push(...submissionsWithConference)
      }
    }

    console.log("[getUserSubmissions] Total submissions found:", allSubmissions.length)
    return {
      data: allSubmissions,
      error: null,
      status: 200,
    }
  } catch (error) {
    console.error("[getUserSubmissions] Error:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch user submissions",
      status: 500,
    }
  }
}
