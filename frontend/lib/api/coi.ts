// COI (Conflict of Interest) API Client
// Real backend integration (replaces coi-mock.ts)

import { apiFetch } from "@/lib/api/client"

// ============================================================================
// TYPES
// ============================================================================

export interface COIDashboardStats {
  conference_id: number
  total_reviewers: number
  available_reviewers: number
  total_papers: number
  papers_under_review: number
  coi_detected: number
  total_relationships: number
  total_assignments: number
  completed_assignments: number
}

export interface COIRelationship {
  id: number
  conference_id: number
  reviewer_id: number
  reviewer_name: string
  reviewer_email: string
  author_email: string // Primary identifier (not author_id)
  author_name: string
  author_affiliation?: string
  submission_id?: number
  type: string // "co_author" | "same_organization" | "advisor_advisee" | etc.
  severity: "high" | "medium" | "low"
  description: string
  evidence?: string[]
  start_date?: string
  end_date?: string
  detected_by: string
  paper_titles?: string[]
  created_at: string
  updated_at: string
}

export interface COIReport {
  reviewer_id: number
  reviewer_name: string
  reviewer_email: string
  reviewer_affiliation: string
  author_email: string // Primary identifier (not author_id)
  author_name: string
  author_affiliation: string
  coi_type: string
  severity: "high" | "medium" | "low" | "none"
  relationships: COIRelationship[]
  summary: string
  recommendation: "assign" | "review" | "avoid"
}

export interface AuthorInfo {
  email: string
  name: string
  affiliation?: string
}

export interface ConflictedReviewerInfo {
  reviewer_id: number
  reviewer_name: string
  reviewer_email: string
  severity: string
  reasons: string[]
}

export interface PaperCOISummary {
  paper_id: string
  paper_title: string
  authors: AuthorInfo[]
  total_conflicts: number
  high_severity_count: number
  medium_severity_count: number
  low_severity_count: number
  conflicted_reviewers: ConflictedReviewerInfo[]
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get COI dashboard statistics for a conference
 * Endpoint: GET /api/v1/coi/dashboard/stats/:conference_id
 */
export async function getCOIDashboardStats(
  conferenceId: number,
): Promise<COIDashboardStats> {
  const { data } = await apiFetch<{ data: COIDashboardStats }>(
    `/api/v1/coi/dashboard/stats/${conferenceId}`,
  )
  return data.data
}

/**
 * Get all COI relationships with filters and pagination
 * Endpoint: GET /api/v1/coi/relationships
 */
export async function getAllCOIRelationships(params: {
  conference_id: number // Required!
  severity?: "high" | "medium" | "low"
  relationship_type?: string
  search?: string
  limit?: number
  page?: number
}): Promise<{
  relationships: COIRelationship[]
  total: number
  page: number
  limit: number
}> {
  const queryParams = new URLSearchParams()
  queryParams.append("conference_id", params.conference_id.toString())
  if (params.severity) queryParams.append("severity", params.severity)
  if (params.relationship_type) queryParams.append("relationship_type", params.relationship_type)
  if (params.search) queryParams.append("search", params.search)
  if (params.limit) queryParams.append("limit", params.limit.toString())
  if (params.page) queryParams.append("page", params.page.toString())

  const { data } = await apiFetch<{ data: {
    relationships: COIRelationship[]
    total: number
    page: number
    limit: number
  } }>(`/api/v1/coi/relationships?${queryParams.toString()}`)
  
  return data.data
}

/**
 * Check detailed COI between a reviewer and an author
 * Endpoint: GET /api/v1/coi/check/reviewer/:reviewer_id/author/:author_email
 * Note: Uses author_email, not author_id!
 */
export async function checkReviewerToAuthorCOI(
  conferenceId: number,
  reviewerId: number,
  authorEmail: string,
): Promise<COIReport> {
  const { data } = await apiFetch<{ data: COIReport }>(
    `/api/v1/coi/check/reviewer/${reviewerId}/author/${encodeURIComponent(authorEmail)}?conference_id=${conferenceId}`,
  )
  return data.data
}

/**
 * Get COI summaries for all papers in a conference
 * Endpoint: GET /api/v1/coi/papers
 */
export async function getAllPaperCOIs(params: {
  conference_id: number // Required!
  severity?: "high" | "medium" | "low"
  search?: string
  limit?: number
  page?: number
}): Promise<{
  papers: PaperCOISummary[]
  total: number
  page: number
  limit: number
}> {
  const queryParams = new URLSearchParams()
  queryParams.append("conference_id", params.conference_id.toString())
  if (params.severity) queryParams.append("severity", params.severity)
  if (params.search) queryParams.append("search", params.search)
  if (params.limit) queryParams.append("limit", params.limit.toString())
  if (params.page) queryParams.append("page", params.page.toString())

  const { data } = await apiFetch<{ data: {
    papers: PaperCOISummary[]
    total: number
    page: number
    limit: number
  } }>(`/api/v1/coi/papers?${queryParams.toString()}`)
  
  return data.data
}

/**
 * Rebuild COI relationships for a conference
 * Endpoint: POST /api/v1/coi/conferences/:conference_id/rebuild
 * Admin/Chair only
 */
export async function rebuildCOIRelationships(
  conferenceId: number,
): Promise<{
  conference_id: number
  relationships_found: number
  relationships_stored: number
  detection_time_ms: number
}> {
  const { data } = await apiFetch<{ data: any }>(
    `/api/v1/coi/conferences/${conferenceId}/rebuild`,
    {
      method: "POST",
    },
  )
  return data.data
}





