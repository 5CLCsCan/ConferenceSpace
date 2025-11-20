/**
 * ============================================================================
 * COI (Conflict of Interest) API - Minimum Required Implementation
 * ============================================================================
 *
 * This file contains the 3 core APIs needed for the COI Dashboard:
 * 1. getCOIDashboardStats() - Dashboard statistics for a conference
 * 2. getAllCOIRelationships() - List and filter all COI relationships
 * 3. checkReviewerToAuthorCOI() - Detailed COI check for reviewer-author pair
 *
 * All other APIs are removed (searchReviewers, getReviewerById, etc.)
 * These can be added later if needed for future features.
 */

import type { Reviewer, Author, Paper, COIReport, Relationship } from "@/lib/mock-data/coi"
import {
  mockReviewers,
  mockAuthors,
  mockPapers,
  mockRelationships,
  generateReviewerToAuthorCOIReport,
  getRelationshipHistory,
} from "@/lib/mock-data/coi"

// Simulate API delay (remove in production - real API will be slower)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ============================================================================
// RESPONSE TYPES
// ============================================================================

interface ApiResponse<T> {
  data: T
  error: string | null
}

// ============================================================================
// API #1: GET /api/v1/coi/dashboard/stats/:conferenceId
// ============================================================================
/**
 * ENDPOINT: GET /api/v1/coi/dashboard/stats/:conferenceId
 *
 * PURPOSE:
 * Get COI statistics and overview metrics for a specific conference.
 * Used by the main dashboard to display quick stat cards.
 *
 * INPUT:
 * - conferenceId (path parameter): string - The conference to analyze
 *
 * RETURNS: ApiResponse with stats object containing:
 * - conference_id: string - The conference ID requested
 * - total_reviewers: number - Total reviewers in the system
 * - available_reviewers: number - Reviewers below workload capacity
 * - total_papers: number - Papers in this conference
 * - papers_under_review: number - Papers currently under review
 * - coi_detected: number - Count of COI relationships found
 * - total_relationships: number - Total reviewer-author relationships
 * - total_assignments: number - Total reviewer assignments made
 * - completed_assignments: number - Completed assignments
 *
 * FILTERING:
 * - Only includes papers from the specified conference_id
 * - Only counts relationships between reviewers and authors in those papers
 * - Available reviewers = current_workload < max_capacity
 *
 * EXAMPLE RESPONSE:
 * {
 *   data: {
 *     conference_id: "conf-2024",
 *     total_reviewers: 50,
 *     available_reviewers: 35,
 *     total_papers: 120,
 *     papers_under_review: 85,
 *     coi_detected: 42,
 *     total_relationships: 215,
 *     total_assignments: 180,
 *     completed_assignments: 150
 *   },
 *   error: null
 * }
 */
export async function getCOIDashboardStats(conferenceId: string): Promise<
  ApiResponse<{
    conference_id: string
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

  // Note: In the mock data, papers don't have conference_id field.
  // In the real backend, you would filter by conference_id here.
  // For now, we return stats for all papers/relationships.
  const conferencePapers = mockPapers // Would be: mockPapers.filter((p) => p.conference_id === conferenceId)
  const conferenceAuthors = mockAuthors.filter((a) =>
    conferencePapers.some((p) => p.authors.some((pa) => pa.id === a.id)),
  )
  const conferenceRelationships = mockRelationships.filter((r) =>
    conferenceAuthors.some((a) => a.id === r.author_id),
  )

  const availableReviewers = mockReviewers.filter((r) => r.current_workload < r.max_capacity).length
  const coiDetected = conferenceRelationships.filter((r) => r.severity !== "none").length

  return {
    data: {
      conference_id: conferenceId,
      total_reviewers: mockReviewers.length,
      available_reviewers: availableReviewers,
      total_papers: conferencePapers.length,
      papers_under_review: conferencePapers.filter((p) => p.status === "under_review").length,
      coi_detected: coiDetected,
      total_relationships: conferenceRelationships.length,
      total_assignments: 8,
      completed_assignments: 8,
    },
    error: null,
  }
}

// ============================================================================
// API #2: GET /api/v1/coi/relationships
// ============================================================================
/**
 * ENDPOINT: GET /api/v1/coi/relationships
 *
 * PURPOSE:
 * Get all COI relationships between reviewers and authors with full filtering,
 * searching, and pagination. This is the main data source for the analysis dashboard.
 *
 * INPUT: Query parameters (all optional)
 * - severity?: "high" | "medium" | "low" - Filter by severity level
 * - relationship_type?: string - Filter by relationship type
 *   Types: "co_author" | "same_organization" | "advisor_advisee" | 
 *          "collaborator" | "competitor" | "citation" | "review_history"
 * - search?: string - Full-text search across names/emails/descriptions
 * - limit?: number - Results per page (default: 100, max: 500)
 * - page?: number - Page number for pagination (default: 1)
 *
 * RETURNS: ApiResponse with object containing:
 * - relationships: RelationshipWithDetails[] - Array of COI relationships
 * - total: number - Total count of relationships matching filters (for pagination)
 * - page: number - Current page number
 * - limit: number - Results per page
 *
 * RELATIONSHIP DETAILS (enriched data):
 * - id: string - Unique relationship ID
 * - reviewer_id: string - Reviewer ID
 * - reviewer_name: string - Reviewer full name
 * - reviewer_email: string - Reviewer email address
 * - author_id: string - Author ID
 * - author_name: string - Author full name
 * - author_email: string - Author email
 * - author_affiliation: string - Author's organization
 * - type: string - Relationship type (co_author, etc.)
 * - severity: "high" | "medium" | "low" - COI severity level
 * - start_date: string - When relationship began (ISO 8601)
 * - end_date?: string - When relationship ended (if applicable)
 * - description: string - Human-readable description
 * - evidence?: string[] - Supporting evidence/notes
 * - paper_titles?: string[] - Papers this author has written
 *
 * FILTERING BEHAVIOR:
 * - Multiple filters combine with AND logic (all must match)
 * - Search is case-insensitive substring matching
 * - Pagination: (page-1) * limit to (page*limit)
 *
 * EXAMPLE REQUEST:
 * GET /api/v1/coi/relationships?severity=high&search=john&page=1&limit=50
 *
 * EXAMPLE RESPONSE:
 * {
 *   data: {
 *     relationships: [
 *       {
 *         id: "rel-1",
 *         reviewer_id: "rev-1",
 *         reviewer_name: "Dr. John Smith",
 *         reviewer_email: "john@example.com",
 *         author_id: "auth-1",
 *         author_name: "Jane Doe",
 *         author_email: "jane@example.com",
 *         author_affiliation: "MIT",
 *         type: "co_author",
 *         severity: "high",
 *         start_date: "2021-01-15",
 *         description: "Co-authored 3 papers 2021-2023",
 *         paper_titles: ["Paper A", "Paper B"]
 *       }
 *     ],
 *     total: 245,
 *     page: 1,
 *     limit: 50
 *   },
 *   error: null
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

  // Filter by severity
  if (params?.severity) {
    relationships = relationships.filter((r) => r.severity === params.severity)
  }

  // Filter by relationship type
  if (params?.relationship_type) {
    relationships = relationships.filter((r) => r.type === params.relationship_type)
  }

  // Search filter (case-insensitive)
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

  // Enrich relationships with reviewer and author details
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

// ============================================================================
// API #3: GET /api/v1/coi/check/reviewer/:reviewerId/author/:authorId
// ============================================================================
/**
 * ENDPOINT: GET /api/v1/coi/check/reviewer/:reviewerId/author/:authorId
 *
 * PURPOSE:
 * Perform detailed COI analysis for a specific reviewer-author pair.
 * Returns comprehensive report with all relationships and timeline.
 * Used by the COI detail page to show full relationship history.
 *
 * INPUT:
 * - reviewerId (path parameter): string - The reviewer to check
 * - authorId (path parameter): string - The author to check against
 *
 * RETURNS: ApiResponse<COIReport | null> containing:
 * - reviewer_id: string - Reviewer ID
 * - reviewer_name: string - Reviewer full name
 * - reviewer_email: string - Reviewer email
 * - reviewer_affiliation: string - Reviewer's organization
 * - author_id: string - Author ID
 * - author_name: string - Author full name
 * - author_email: string - Author email
 * - author_affiliation: string - Author's organization
 * - coi_type: "author" - Always "author" for this endpoint
 * - severity: "high" | "medium" | "low" | "none" - Overall COI severity
 * - relationships: Relationship[] - All detected relationships between them
 * - summary: string - Human-readable COI summary
 * - recommendation: "assign" | "review" | "avoid" - Assignment recommendation
 *
 * SEVERITY LEVELS:
 * - high: Direct, recent, significant conflict (co-author, same org, advisor)
 * - medium: Indirect or older conflict (collaborator, citation)
 * - low: Minimal or very old conflict
 * - none: No conflict detected
 *
 * RECOMMENDATIONS:
 * - assign: Safe to assign as reviewer (no COI)
 * - review: Can assign with caution/disclosure (medium COI)
 * - avoid: Should not assign (high COI)
 *
 * ERROR CASES:
 * - Returns null data if reviewer or author ID is invalid
 * - error field contains error message
 *
 * EXAMPLE REQUEST:
 * GET /api/v1/coi/check/reviewer/rev-1/author/auth-5
 *
 * EXAMPLE RESPONSE (with COI):
 * {
 *   data: {
 *     reviewer_id: "rev-1",
 *     reviewer_name: "Dr. John Smith",
 *     reviewer_email: "john@example.com",
 *     reviewer_affiliation: "Harvard",
 *     author_id: "auth-5",
 *     author_name: "Jane Doe",
 *     author_email: "jane@example.com",
 *     author_affiliation: "MIT",
 *     coi_type: "author",
 *     severity: "high",
 *     relationships: [
 *       {
 *         id: "rel-1",
 *         type: "co_author",
 *         severity: "high",
 *         description: "Co-authored 5 papers (2019-2023)",
 *         start_date: "2019-03-15",
 *         end_date: "2023-11-20"
 *       }
 *     ],
 *     summary: "High COI detected: Co-authored multiple papers recently.",
 *     recommendation: "avoid"
 *   },
 *   error: null
 * }
 *
 * EXAMPLE RESPONSE (no COI):
 * {
 *   data: {
 *     ...same structure...
 *     severity: "none",
 *     relationships: [],
 *     summary: "No conflict of interest detected.",
 *     recommendation: "assign"
 *   },
 *   error: null
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

