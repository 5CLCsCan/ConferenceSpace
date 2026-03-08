import { apiFetch } from "./client"

// ================== Types ==================

export interface SuggestedReviewer {
  assignment_id: number
  reviewer_id: number
  reviewer_email: string
  score: number
}

export interface SuggestionGroup {
  submission_id: number
  submission_title: string
  reviewers: SuggestedReviewer[]
}

export interface SuggestionsListResponse {
  suggestions: SuggestionGroup[]
  total_papers: number
  total_suggestions: number
}

export interface ConfirmSuggestionsRequest {
  assignment_ids?: number[]
}

export interface ConfirmSuggestionsResponse {
  confirmed_count: number
  message: string
}

export interface AddSuggestionRequest {
  submission_id: number
  reviewer_id: number
}

export interface COIWarning {
  has_conflict: boolean
  reasons: string[]
}

export interface Assignment {
  id: number
  conference_id: number
  submission_id: number
  reviewer_id: number
  score: number
  status: string
  reviewer_email: string
}

export interface AddSuggestionResponse {
  assignment: Assignment
  coi_warning?: COIWarning
}

// ================== Confirmed Assignments Types ==================

export interface ConfirmedReviewer {
  assignment_id: number
  reviewer_id: number
  reviewer_email: string
  score: number
  status: string // pending, accepted, declined, completed
  review_status: string // not_started, in_progress, submitted
}

export interface ConfirmedAssignmentGroup {
  submission_id: number
  submission_title: string
  reviewers: ConfirmedReviewer[]
}

export interface ConfirmedAssignmentsListResponse {
  assignments: ConfirmedAssignmentGroup[]
  total_papers: number
  total_assignments: number
}

// ================== API Functions ==================

/**
 * Get all suggestions for a conference grouped by submission
 */
export async function getSuggestions(
  conferenceId: string | number,
): Promise<{ data: SuggestionsListResponse | null; error: string | null; status: number }> {
  try {
    const { data, response } = await apiFetch<{ data: SuggestionsListResponse }>(
      `/api/v1/conferences/${conferenceId}/assignments/suggestions`,
    )

    return {
      data: data.data,
      error: null,
      status: response.status,
    }
  } catch (error: any) {
    console.error("Failed to fetch suggestions:", error)
    return {
      data: null,
      error: error.message || "Failed to fetch suggestions",
      status: error.status || 500,
    }
  }
}

/**
 * Confirm suggestions - either specific assignment IDs or all suggestions
 */
export async function confirmSuggestions(
  conferenceId: string | number,
  assignmentIds?: number[],
): Promise<{ data: ConfirmSuggestionsResponse | null; error: string | null; status: number }> {
  try {
    const body: ConfirmSuggestionsRequest = {}
    if (assignmentIds && assignmentIds.length > 0) {
      body.assignment_ids = assignmentIds
    }

    const { data, response } = await apiFetch<{ data: ConfirmSuggestionsResponse }>(
      `/api/v1/conferences/${conferenceId}/assignments/suggestions/confirm`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    )

    return {
      data: data.data,
      error: null,
      status: response.status,
    }
  } catch (error: any) {
    console.error("Failed to confirm suggestions:", error)
    return {
      data: null,
      error: error.message || "Failed to confirm suggestions",
      status: error.status || 500,
    }
  }
}

/**
 * Delete a single suggestion
 */
export async function deleteSuggestion(
  conferenceId: string | number,
  assignmentId: number,
): Promise<{ success: boolean; error: string | null; status: number }> {
  try {
    const { response } = await apiFetch<{ message: string }>(
      `/api/v1/conferences/${conferenceId}/assignments/suggestions/${assignmentId}`,
      {
        method: "DELETE",
      },
    )

    return {
      success: true,
      error: null,
      status: response.status,
    }
  } catch (error: any) {
    console.error("Failed to delete suggestion:", error)
    return {
      success: false,
      error: error.message || "Failed to delete suggestion",
      status: error.status || 500,
    }
  }
}

/**
 * Manually add a suggestion (with COI check)
 */
export async function addSuggestion(
  conferenceId: string | number,
  submissionId: number,
  reviewerId: number,
): Promise<{ data: AddSuggestionResponse | null; error: string | null; status: number }> {
  try {
    const body: AddSuggestionRequest = {
      submission_id: submissionId,
      reviewer_id: reviewerId,
    }

    const { data, response } = await apiFetch<{ data: AddSuggestionResponse }>(
      `/api/v1/conferences/${conferenceId}/assignments/suggestions`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    )

    return {
      data: data.data,
      error: null,
      status: response.status,
    }
  } catch (error: any) {
    console.error("Failed to add suggestion:", error)
    return {
      data: null,
      error: error.message || "Failed to add suggestion",
      status: error.status || 500,
    }
  }
}

/**
 * Get all confirmed assignments for a conference grouped by submission
 */
export async function getConfirmedAssignments(conferenceId: string | number): Promise<{
  data: ConfirmedAssignmentsListResponse | null
  error: string | null
  status: number
}> {
  try {
    const { data, response } = await apiFetch<{ data: ConfirmedAssignmentsListResponse }>(
      `/api/v1/conferences/${conferenceId}/assignments/confirmed`,
    )

    return {
      data: data.data,
      error: null,
      status: response.status,
    }
  } catch (error: any) {
    console.error("Failed to fetch confirmed assignments:", error)
    return {
      data: null,
      error: error.message || "Failed to fetch confirmed assignments",
      status: error.status || 500,
    }
  }
}
