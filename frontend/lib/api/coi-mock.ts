/**
 * Mock API endpoints for COI (Conflict of Interest) management
 *
 * These endpoints simulate the backend API structure that will be implemented.
 * Each function documents the endpoint, params, and response format.
 */

import type { Reviewer, Author, Paper, COIReport, Relationship, COIType } from "@/lib/mock-data/coi"
import {
  mockReviewers,
  mockAuthors,
  mockPapers,
  mockRelationships,
  generateReviewerToAuthorCOIReport,
  generateReviewerToPaperCOIReport,
  getRelationshipHistory,
  filterReviewers,
} from "@/lib/mock-data/coi"

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ============================================================================
// API Response Types
// ============================================================================

interface ApiResponse<T> {
  data: T
  error: string | null
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  error: null
}

// ============================================================================
// GET /api/v1/coi/reviewers
// ============================================================================
/**
 * Endpoint: GET /api/v1/coi/reviewers
 * Description: Search and list reviewers with optional filters
 *
 * Query Parameters:
 * - query?: string - Search query (name, email, affiliation, domain)
 * - status?: string - Filter by status ("available", "busy", "all")
 * - limit?: number - Maximum number of results (default: 50)
 * - page?: number - Page number for pagination (default: 1)
 *
 * Response:
 * {
 *   data: Reviewer[],
 *   total: number,
 *   page: number,
 *   limit: number,
 *   error: null
 * }
 */
export async function searchReviewers(params: {
  query?: string
  status?: string
  limit?: number
  page?: number
}): Promise<PaginatedResponse<Reviewer>> {
  await delay(300)

  let reviewers = [...mockReviewers]

  if (params.query || params.status) {
    reviewers = filterReviewers(reviewers, params.query || "", params.status)
  }

  const limit = params.limit || 50
  const page = params.page || 1
  const start = (page - 1) * limit
  const end = start + limit

  return {
    data: reviewers.slice(start, end),
    total: reviewers.length,
    page,
    limit,
    error: null,
  }
}

// ============================================================================
// GET /api/v1/coi/reviewers/:id
// ============================================================================
/**
 * Endpoint: GET /api/v1/coi/reviewers/:id
 * Description: Get reviewer details by ID
 *
 * Path Parameters:
 * - id: string - Reviewer ID
 *
 * Response:
 * {
 *   data: Reviewer | null,
 *   error: string | null
 * }
 */
export async function getReviewerById(reviewerId: string): Promise<ApiResponse<Reviewer | null>> {
  await delay(200)

  const reviewer = mockReviewers.find((r) => r.id === reviewerId)
  return {
    data: reviewer || null,
    error: reviewer ? null : "Reviewer not found",
  }
}

// ============================================================================
// GET /api/v1/coi/papers
// ============================================================================
/**
 * Endpoint: GET /api/v1/coi/papers
 * Description: Get all papers available for COI checking
 *
 * Query Parameters:
 * - conference_id?: string - Filter by conference ID
 * - status?: string - Filter by paper status
 *
 * Response:
 * {
 *   data: Paper[],
 *   error: null
 * }
 */
export async function getAllPapers(params?: {
  conference_id?: string
  status?: string
}): Promise<ApiResponse<Paper[]>> {
  await delay(200)
  return { data: [...mockPapers], error: null }
}

// ============================================================================
// GET /api/v1/coi/authors
// ============================================================================
/**
 * Endpoint: GET /api/v1/coi/authors
 * Description: Get all authors available for COI checking
 *
 * Query Parameters:
 * - paper_id?: string - Filter authors by paper ID
 * - conference_id?: string - Filter authors by conference ID
 *
 * Response:
 * {
 *   data: Author[],
 *   error: null
 * }
 */
export async function getAllAuthors(params?: {
  paper_id?: string
  conference_id?: string
}): Promise<ApiResponse<Author[]>> {
  await delay(200)
  return { data: [...mockAuthors], error: null }
}

// ============================================================================
// GET /api/v1/coi/check/reviewer/:reviewerId/author/:authorId
// ============================================================================
/**
 * Endpoint: GET /api/v1/coi/check/reviewer/:reviewerId/author/:authorId
 * Description: Check COI for a specific reviewer-author pair
 *
 * Path Parameters:
 * - reviewerId: string - Reviewer ID
 * - authorId: string - Author ID
 *
 * Response:
 * {
 *   data: COIReport | null,
 *   error: string | null
 * }
 *
 * COIReport Structure:
 * {
 *   reviewer_id: string
 *   reviewer_name: string
 *   author_id: string
 *   coi_type: "author"
 *   severity: "high" | "medium" | "low" | "none"
 *   relationships: Relationship[]
 *   summary: string
 *   recommendation: "assign" | "review" | "avoid"
 * }
 */
export async function checkReviewerToAuthorCOI(
  reviewerId: string,
  authorId: string,
): Promise<ApiResponse<COIReport | null>> {
  await delay(400)

  const report = generateReviewerToAuthorCOIReport(reviewerId, authorId)
  return {
    data: report,
    error: report ? null : "Invalid reviewer or author ID",
  }
}

// ============================================================================
// GET /api/v1/coi/check/reviewer/:reviewerId/paper/:paperId
// ============================================================================
/**
 * Endpoint: GET /api/v1/coi/check/reviewer/:reviewerId/paper/:paperId
 * Description: Check COI for a reviewer against all authors of a paper
 *
 * Path Parameters:
 * - reviewerId: string - Reviewer ID
 * - paperId: string - Paper ID
 *
 * Response:
 * {
 *   data: COIReport | null,
 *   error: string | null
 * }
 *
 * COIReport Structure:
 * {
 *   reviewer_id: string
 *   reviewer_name: string
 *   paper_id: string
 *   coi_type: "paper"
 *   severity: "high" | "medium" | "low" | "none"
 *   relationships: Relationship[] (all relationships across all paper authors)
 *   summary: string
 *   recommendation: "assign" | "review" | "avoid"
 * }
 */
export async function checkReviewerToPaperCOI(
  reviewerId: string,
  paperId: string,
): Promise<ApiResponse<COIReport | null>> {
  await delay(500)

  const report = generateReviewerToPaperCOIReport(reviewerId, paperId)
  return {
    data: report,
    error: report ? null : "Invalid reviewer or paper ID",
  }
}

// ============================================================================
// GET /api/v1/coi/relationships/reviewer/:reviewerId/author/:authorId
// ============================================================================
/**
 * Endpoint: GET /api/v1/coi/relationships/reviewer/:reviewerId/author/:authorId
 * Description: Get relationship history timeline for a reviewer-author pair
 *
 * Path Parameters:
 * - reviewerId: string - Reviewer ID
 * - authorId: string - Author ID
 *
 * Response:
 * {
 *   data: Relationship[],
 *   error: string | null
 * }
 *
 * Relationship Structure:
 * {
 *   id: string
 *   reviewer_id: string
 *   author_id: string
 *   type: "co_author" | "same_organization" | "advisor_advisee" | "collaborator" | "competitor" | "citation" | "review_history"
 *   start_date: string (ISO 8601)
 *   end_date?: string (ISO 8601)
 *   description: string
 *   severity: "high" | "medium" | "low"
 *   evidence?: string[]
 * }
 */
export async function getRelationshipTimeline(
  reviewerId: string,
  authorId: string,
): Promise<ApiResponse<Relationship[]>> {
  await delay(300)

  const history = getRelationshipHistory(reviewerId, authorId)
  return { data: history, error: null }
}

// ============================================================================
// POST /api/v1/coi/assignments
// ============================================================================
/**
 * Endpoint: POST /api/v1/coi/assignments
 * Description: Assign reviewer to paper/author with COI check
 *
 * Request Body:
 * {
 *   reviewer_id: string
 *   paper_id?: string (required if coi_type is "paper")
 *   author_id?: string (required if coi_type is "author")
 *   coi_type: "paper" | "author"
 *   override?: boolean (default: false) - Override COI warnings
 * }
 *
 * Response:
 * {
 *   data: {
 *     success: boolean
 *     message: string
 *     assignment_id?: string (if successful)
 *     coi_report?: COIReport (if COI detected)
 *   },
 *   error: string | null
 * }
 */
export async function assignReviewer(params: {
  reviewerId: string
  paperId?: string
  authorId?: string
  coiType: COIType
  override?: boolean
}): Promise<
  ApiResponse<{
    success: boolean
    message: string
    assignment_id?: string
    coi_report?: COIReport
  }>
> {
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
      data: {
        success: false,
        message: "COI check failed: Invalid parameters",
      },
      error: "Invalid parameters",
    }
  }

  if (report.severity === "high" && !params.override) {
    return {
      data: {
        success: false,
        message: `High COI detected: ${report.summary}. Assignment blocked unless overridden.`,
        coi_report: report,
      },
      error: "COI conflict",
    }
  }

  if (report.severity === "medium" && !params.override) {
    return {
      data: {
        success: true,
        message: `Medium COI detected: ${report.summary}. Assignment created with warning.`,
        assignment_id: `assign-${Date.now()}`,
        coi_report: report,
      },
      error: null,
    }
  }

  return {
    data: {
      success: true,
      message: `Reviewer assigned successfully. ${report.summary}`,
      assignment_id: `assign-${Date.now()}`,
      coi_report: report,
    },
    error: null,
  }
}

// ============================================================================
// GET /api/v1/coi/dashboard/stats
// ============================================================================
/**
 * Endpoint: GET /api/v1/coi/dashboard/stats
 * Description: Get COI dashboard statistics
 *
 * Query Parameters:
 * - conference_id?: string - Filter by conference ID
 *
 * Response:
 * {
 *   data: {
 *     total_reviewers: number
 *     available_reviewers: number
 *     total_papers: number
 *     papers_under_review: number
 *     coi_detected: number
 *     total_relationships: number
 *     total_assignments: number
 *     completed_assignments: number
 *   },
 *   error: null
 * }
 */
export async function getCOIDashboardStats(params?: { conference_id?: string }): Promise<
  ApiResponse<{
    total_reviewers: number
    available_reviewers: number
    total_papers: number
    papers_under_review: number
    coi_detected: number
    total_relationships: number
    total_assignments: number
    completed_assignments: number
  }>
> {
  await delay(250)

  const availableReviewers = mockReviewers.filter((r) => r.current_workload < r.max_capacity).length

  return {
    data: {
      total_reviewers: mockReviewers.length,
      available_reviewers: availableReviewers,
      total_papers: mockPapers.length,
      papers_under_review: mockPapers.filter((p) => p.status === "under_review").length,
      coi_detected: 12,
      total_relationships: 12,
      total_assignments: 8,
      completed_assignments: 8,
    },
    error: null,
  }
}

// ============================================================================
// GET /api/v1/coi/relationships
// ============================================================================
/**
 * Endpoint: GET /api/v1/coi/relationships
 * Description: Get all COI relationships with optional filtering
 *
 * Query Parameters:
 * - reviewer_id?: string - Filter by reviewer ID
 * - author_id?: string - Filter by author ID
 * - paper_id?: string - Filter by paper ID (shows relationships with all paper authors)
 * - severity?: "high" | "medium" | "low" - Filter by severity
 * - relationship_type?: RelationshipType - Filter by relationship type
 * - search?: string - Search in reviewer name, author name, description
 * - limit?: number - Maximum number of results (default: 100)
 * - page?: number - Page number for pagination (default: 1)
 *
 * Response:
 * {
 *   data: {
 *     relationships: RelationshipWithDetails[],
 *     total: number,
 *     page: number,
 *     limit: number
 *   },
 *   error: null
 * }
 *
 * RelationshipWithDetails extends Relationship with:
 * {
 *   reviewer_name: string
 *   reviewer_email: string
 *   author_name: string
 *   author_email: string
 *   paper_titles?: string[] (if relationship involves papers)
 * }
 */
export interface RelationshipWithDetails extends Relationship {
  reviewer_name: string
  reviewer_email: string
  author_name: string
  author_email: string
  author_affiliation: string
  paper_titles?: string[]
}

export async function getAllCOIRelationships(params?: {
  reviewer_id?: string
  author_id?: string
  paper_id?: string
  severity?: "high" | "medium" | "low"
  relationship_type?: Relationship["type"]
  search?: string
  limit?: number
  page?: number
}): Promise<
  ApiResponse<{
    relationships: RelationshipWithDetails[]
    total: number
    page: number
    limit: number
  }>
> {
  await delay(300)

  let relationships = [...mockRelationships]

  // Filter by reviewer_id
  if (params?.reviewer_id) {
    relationships = relationships.filter((r) => r.reviewer_id === params.reviewer_id)
  }

  // Filter by author_id
  if (params?.author_id) {
    relationships = relationships.filter((r) => r.author_id === params.author_id)
  }

  // Filter by paper_id (find all authors of the paper and filter relationships)
  if (params?.paper_id) {
    const paper = mockPapers.find((p) => p.id === params.paper_id)
    if (paper) {
      const authorIds = paper.authors.map((a) => a.id)
      relationships = relationships.filter((r) => authorIds.includes(r.author_id))
    }
  }

  // Filter by severity
  if (params?.severity) {
    relationships = relationships.filter((r) => r.severity === params.severity)
  }

  // Filter by relationship type
  if (params?.relationship_type) {
    relationships = relationships.filter((r) => r.type === params.relationship_type)
  }

  // Search filter
  if (params?.search) {
    const searchLower = params.search.toLowerCase()
    relationships = relationships.filter((rel) => {
      const reviewer = mockReviewers.find((r) => r.id === rel.reviewer_id)
      const author = mockAuthors.find((a) => a.id === rel.author_id)
      return (
        reviewer?.name.toLowerCase().includes(searchLower) ||
        reviewer?.email.toLowerCase().includes(searchLower) ||
        author?.name.toLowerCase().includes(searchLower) ||
        author?.email.toLowerCase().includes(searchLower) ||
        rel.description.toLowerCase().includes(searchLower)
      )
    })
  }

  // Enrich with details
  const relationshipsWithDetails: RelationshipWithDetails[] = relationships.map((rel) => {
    const reviewer = mockReviewers.find((r) => r.id === rel.reviewer_id)
    const author = mockAuthors.find((a) => a.id === rel.author_id)
    const papersWithAuthor = mockPapers.filter((p) => p.authors.some((a) => a.id === rel.author_id))

    return {
      ...rel,
      reviewer_name: reviewer?.name || "Unknown",
      reviewer_email: reviewer?.email || "",
      author_name: author?.name || "Unknown",
      author_email: author?.email || "",
      author_affiliation: author?.affiliation || "",
      paper_titles: papersWithAuthor.map((p) => p.title),
    }
  })

  // Pagination
  const limit = params?.limit || 100
  const page = params?.page || 1
  const start = (page - 1) * limit
  const end = start + limit

  return {
    data: {
      relationships: relationshipsWithDetails.slice(start, end),
      total: relationshipsWithDetails.length,
      page,
      limit,
    },
    error: null,
  }
}
