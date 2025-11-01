/**
 * Mock API functions for COI checking and reviewer assignment
 * These simulate backend API calls for demonstration purposes
 */

import type {
  Reviewer,
  Author,
  Paper,
  COIReport,
  Relationship,
  COIType,
} from "@/lib/mock-data/coi"
import {
  mockReviewers,
  mockAuthors,
  mockPapers,
  generateReviewerToAuthorCOIReport,
  generateReviewerToPaperCOIReport,
  getRelationshipHistory,
  filterReviewers,
} from "@/lib/mock-data/coi"

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Search and list reviewers with optional filters
 */
export async function searchReviewers(params: {
  query?: string
  status?: string
  limit?: number
}): Promise<{ data: Reviewer[]; error: null }> {
  await delay(300) // Simulate network delay

  let reviewers = [...mockReviewers]

  if (params.query || params.status) {
    reviewers = filterReviewers(reviewers, params.query || "", params.status)
  }

  if (params.limit) {
    reviewers = reviewers.slice(0, params.limit)
  }

  return { data: reviewers, error: null }
}

/**
 * Get reviewer details by ID
 */
export async function getReviewerById(reviewerId: string): Promise<{
  data: Reviewer | null
  error: string | null
}> {
  await delay(200)

  const reviewer = mockReviewers.find((r) => r.id === reviewerId)
  return { data: reviewer || null, error: reviewer ? null : "Reviewer not found" }
}

/**
 * Check COI for reviewer-to-author
 */
export async function checkReviewerToAuthorCOI(
  reviewerId: string,
  authorId: string,
): Promise<{ data: COIReport | null; error: string | null }> {
  await delay(400)

  const report = generateReviewerToAuthorCOIReport(reviewerId, authorId)
  return { data: report, error: report ? null : "Invalid reviewer or author ID" }
}

/**
 * Check COI for reviewer-to-paper
 */
export async function checkReviewerToPaperCOI(
  reviewerId: string,
  paperId: string,
): Promise<{ data: COIReport | null; error: string | null }> {
  await delay(500)

  const report = generateReviewerToPaperCOIReport(reviewerId, paperId)
  return { data: report, error: report ? null : "Invalid reviewer or paper ID" }
}

/**
 * Get relationship history timeline
 */
export async function getRelationshipTimeline(
  reviewerId: string,
  authorId: string,
): Promise<{ data: Relationship[]; error: string | null }> {
  await delay(300)

  const history = getRelationshipHistory(reviewerId, authorId)
  return { data: history, error: null }
}

/**
 * Get all papers
 */
export async function getAllPapers(): Promise<{ data: Paper[]; error: null }> {
  await delay(200)
  return { data: [...mockPapers], error: null }
}

/**
 * Get all authors
 */
export async function getAllAuthors(): Promise<{ data: Author[]; error: null }> {
  await delay(200)
  return { data: [...mockAuthors], error: null }
}

/**
 * Assign reviewer to paper with COI check
 */
export async function assignReviewer(params: {
  reviewerId: string
  paperId?: string
  authorId?: string
  coiType: COIType
  override?: boolean
}): Promise<{ data: { success: boolean; message: string }; error: string | null }> {
  await delay(600)

  let report: COIReport | null = null

  if (params.coiType === "paper" && params.paperId) {
    const result = await checkReviewerToPaperCOI(params.reviewerId, params.paperId)
    report = result.data
  } else if (params.coiType === "author" && params.authorId) {
    const result = await checkReviewerToAuthorCOI(params.reviewerId, params.authorId)
    report = result.data
  }

  if (!report) {
    return {
      data: { success: false, message: "COI check failed" },
      error: "Invalid parameters",
    }
  }

  if (report.severity === "high" && !params.override) {
    return {
      data: {
        success: false,
        message: `High COI detected: ${report.summary}. Assignment blocked unless overridden.`,
      },
      error: "COI conflict",
    }
  }

  if (report.severity === "medium" && !params.override) {
    return {
      data: {
        success: true,
        message: `Medium COI detected: ${report.summary}. Assignment created with warning.`,
      },
      error: null,
    }
  }

  return {
    data: {
      success: true,
      message: `Reviewer assigned successfully. ${report.summary}`,
    },
    error: null,
  }
}

