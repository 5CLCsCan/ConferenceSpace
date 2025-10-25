import type { Conference, Paper, ReviewRequest } from "@/lib/types"
import {
  mockConferences,
  mockReviewAssignments,
  mockPapers,
  mockReviewRequests,
} from "@/lib/mock-data"

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  status: number
}

/**
 * Get conferences where reviewer is actively reviewing
 * Backend endpoint: GET /api/reviewer/:id/conferences
 * Modified for dev: Return all conferences without filtering by reviewerId
 */
export async function getReviewerConferences(
  reviewerId: string,
): Promise<ApiResponse<Conference[]>> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))
    // Keep returning all mockConferences as per previous request
    return {
      data: mockConferences,
      error: null,
      status: 200,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    }
  }
}

/**
 * Get review requests for reviewer (pending invitations from chairs)
 * Backend endpoint: GET /api/reviewer/:id/review-requests
 * Modified for dev: Return all review requests without filtering by reviewerId
 */
export async function getReviewRequests(reviewerId: string): Promise<ApiResponse<ReviewRequest[]>> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))
    // Return all mockReviewRequests without filtering
    return {
      data: mockReviewRequests as ReviewRequest[],
      error: null,
      status: 200,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    }
  }
}

/**
 * Get papers assigned to reviewer for a specific conference
 * Backend endpoint: GET /api/reviewer/:id/conferences/:conferenceId/papers
 * Modified: Filter papers by conferenceId for accurate display
 */
export async function getReviewerPapersForConference(
  reviewerId: string,
  conferenceId: string,
): Promise<ApiResponse<(Paper & { assignment_status: string; due_date: string })[]>> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))
    // Filter papers by conferenceId
    const papers = mockPapers
      .filter((paper) => paper.conference_id === conferenceId)
      .map((paper) => ({
        ...paper,
        assignment_status: "pending", // Default status for dev
        due_date: "2025-04-30T23:59:59Z", // Default due date for dev
      }))
    return {
      data: papers,
      error: null,
      status: 200,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    }
  }
}

/**
 * Accept or decline a review request
 * Backend endpoint: POST /api/reviewer/:id/review-requests/:requestId/respond
 * Unchanged: Mock implementation for responding to review requests
 */
export async function respondToReviewRequest(
  reviewerId: string,
  requestId: string,
  response: "accepted" | "declined",
): Promise<ApiResponse<ReviewRequest>> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))
    // Mock implementation - in real app, would update database
    return {
      data: {
        id: requestId,
        conference_id: "conf-2025-2",
        conference_name: "International Conference on Machine Learning",
        conference_acronym: "ICML 2025",
        requested_by: "user-2",
        requested_by_name: "Prof. Michael Rodriguez",
        requested_at: "2025-03-10T14:00:00Z",
        status: response,
        expertise_match: 92,
        papers_count: 8,
        estimated_hours: 0,
        conflict_of_interest: false,
      },
      error: null,
      status: 200,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    }
  }
}

/**
 * Get reviewer statistics
 * Backend endpoint: GET /api/reviewer/:id/stats
 * Modified for dev: Return stats based on all review assignments
 */
export async function getReviewerStats(reviewerId: string) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))
    // Use all mockReviewAssignments for stats, ignoring reviewerId
    const pendingRequests = mockReviewRequests.filter((req) => req.status === "pending").length
    return {
      data: {
        total_assigned: mockReviewAssignments.length,
        pending: mockReviewAssignments.filter((a) => a.status === "pending").length,
        in_progress: mockReviewAssignments.filter((a) => a.status === "in_progress").length,
        completed: mockReviewAssignments.filter((a) => a.status === "completed").length,
        pending_requests: pendingRequests,
      },
      error: null,
      status: 200,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    }
  }
}
