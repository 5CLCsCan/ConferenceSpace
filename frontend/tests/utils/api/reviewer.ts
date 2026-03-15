import { APIRequestContext } from "@playwright/test"

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8080/api/v1"

export interface ReviewerInvite {
  user_id: number
  domain?: string[]
}

export interface Reviewer {
  id: number
  user_id: number
  conference_id: number
  email: string
  status: "pending" | "accepted" | "rejected"
  domain: string[]
  created_at: string
  updated_at: string
}

export interface BatchInviteResponse {
  success: Reviewer[]
  failed: Array<{
    email: string
    error: string
  }>
}

/**
 * Batch invite reviewers to a conference via API
 * @param request - Playwright APIRequestContext
 * @param chairToken - JWT token of the chair user
 * @param conferenceId - Conference ID
 * @param reviewers - Array of reviewer invitations
 * @returns Batch invite response with success and failed arrays
 */
export async function batchInviteReviewers(
  request: APIRequestContext,
  chairToken: string,
  conferenceId: number,
  reviewers: ReviewerInvite[],
): Promise<BatchInviteResponse> {
  const response = await request.post(`${API_BASE_URL}/conferences/${conferenceId}/reviewers`, {
    headers: {
      Authorization: `Bearer ${chairToken}`,
      "Content-Type": "application/json",
    },
    data: {
      reviewers,
    },
  })

  if (!response.ok()) {
    const errorBody = await response.text()
    throw new Error(`Failed to invite reviewers: ${response.status()} - ${errorBody}`)
  }

  const responseData = await response.json()
  // Backend uses `omitempty` on failed field, so it may be undefined
  return {
    success: responseData.data.success || [],
    failed: responseData.data.failed || [],
  }
}

/**
 * Invite a single reviewer to a conference via API
 * @param request - Playwright APIRequestContext
 * @param chairToken - JWT token of the chair user
 * @param conferenceId - Conference ID
 * @param reviewerEmail - Reviewer email
 * @param domain - Optional reviewer domain
 * @returns Created reviewer object
 */
export async function inviteReviewer(
  request: APIRequestContext,
  chairToken: string,
  conferenceId: number,
  reviewerEmail: string,
  domain?: string[],
): Promise<Reviewer> {
  const result = await batchInviteReviewers(request, chairToken, conferenceId, [
    { email: reviewerEmail, domain },
  ])

  if (result.failed.length > 0) {
    throw new Error(`Failed to invite reviewer: ${result.failed[0].error}`)
  }

  return result.success[0]
}

/**
 * Update reviewer invitation status via API
 * @param request - Playwright APIRequestContext
 * @param reviewerToken - JWT token of the reviewer user
 * @param conferenceId - Conference ID
 * @param reviewerId - Reviewer ID
 * @param status - New status ('accepted' or 'rejected')
 * @returns Updated reviewer object
 */
export async function updateReviewerStatus(
  request: APIRequestContext,
  reviewerToken: string,
  conferenceId: number,
  reviewerId: number,
  status: "accepted" | "rejected",
): Promise<Reviewer> {
  const response = await request.put(
    `${API_BASE_URL}/conferences/${conferenceId}/reviewers/${reviewerId}/status`,
    {
      headers: {
        Authorization: `Bearer ${reviewerToken}`,
        "Content-Type": "application/json",
      },
      data: {
        status,
      },
    },
  )

  if (!response.ok()) {
    const errorBody = await response.text()
    throw new Error(`Failed to update reviewer status: ${response.status()} - ${errorBody}`)
  }

  const responseData = await response.json()
  return responseData.data
}

/**
 * Accept reviewer invitation via API
 * @param request - Playwright APIRequestContext
 * @param reviewerToken - JWT token of the reviewer user
 * @param conferenceId - Conference ID
 * @param reviewerId - Reviewer ID
 * @returns Updated reviewer object with 'accepted' status
 */
export async function acceptInvitation(
  request: APIRequestContext,
  reviewerToken: string,
  conferenceId: number,
  reviewerId: number,
): Promise<Reviewer> {
  return await updateReviewerStatus(request, reviewerToken, conferenceId, reviewerId, "accepted")
}

/**
 * Reject reviewer invitation via API
 * @param request - Playwright APIRequestContext
 * @param reviewerToken - JWT token of the reviewer user
 * @param conferenceId - Conference ID
 * @param reviewerId - Reviewer ID
 * @returns Updated reviewer object with 'rejected' status
 */
export async function rejectInvitation(
  request: APIRequestContext,
  reviewerToken: string,
  conferenceId: number,
  reviewerId: number,
): Promise<Reviewer> {
  return await updateReviewerStatus(request, reviewerToken, conferenceId, reviewerId, "rejected")
}

/**
 * Get reviewer by ID via API
 * @param request - Playwright APIRequestContext
 * @param token - JWT token for authentication
 * @param conferenceId - Conference ID
 * @param reviewerId - Reviewer ID
 * @returns Reviewer object
 */
export async function getReviewer(
  request: APIRequestContext,
  token: string,
  conferenceId: number,
  reviewerId: number,
): Promise<Reviewer> {
  const response = await request.get(
    `${API_BASE_URL}/conferences/${conferenceId}/reviewers/${reviewerId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok()) {
    const errorBody = await response.text()
    throw new Error(`Failed to get reviewer ${reviewerId}: ${response.status()} - ${errorBody}`)
  }

  const responseData = await response.json()
  return responseData.data
}

/**
 * List reviewers for a conference via API
 * @param request - Playwright APIRequestContext
 * @param token - JWT token for authentication
 * @param conferenceId - Conference ID
 * @param filters - Optional filters (status, limit, offset)
 * @returns Array of reviewers and total count
 */
export async function listReviewers(
  request: APIRequestContext,
  token: string,
  conferenceId: number,
  filters?: {
    status?: "pending" | "accepted" | "rejected"
    limit?: number
    offset?: number
  },
): Promise<{ reviewers: Reviewer[]; total: number }> {
  const params = new URLSearchParams()
  if (filters?.status) params.append("status", filters.status)
  if (filters?.limit) params.append("limit", filters.limit.toString())
  if (filters?.offset) params.append("offset", filters.offset.toString())

  const url = `${API_BASE_URL}/conferences/${conferenceId}/reviewers${
    params.toString() ? "?" + params.toString() : ""
  }`

  const response = await request.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok()) {
    const errorBody = await response.text()
    throw new Error(`Failed to list reviewers: ${response.status()} - ${errorBody}`)
  }

  const responseData = await response.json()
  return {
    reviewers: responseData.data.reviewers,
    total: responseData.data.total,
  }
}

/**
 * Delete reviewer invitation via API
 * @param request - Playwright APIRequestContext
 * @param chairToken - JWT token of the chair user
 * @param conferenceId - Conference ID
 * @param reviewerId - Reviewer ID
 */
export async function deleteReviewer(
  request: APIRequestContext,
  chairToken: string,
  conferenceId: number,
  reviewerId: number,
): Promise<void> {
  const response = await request.delete(
    `${API_BASE_URL}/conferences/${conferenceId}/reviewers/${reviewerId}`,
    {
      headers: {
        Authorization: `Bearer ${chairToken}`,
      },
    },
  )

  if (!response.ok()) {
    const errorBody = await response.text()
    throw new Error(`Failed to delete reviewer ${reviewerId}: ${response.status()} - ${errorBody}`)
  }
}
