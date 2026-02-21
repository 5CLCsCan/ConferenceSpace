// COI mock shim for local/dev parity.
// Kept intentionally lightweight for frontend-v2 test/dev flows.

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
  author_email: string
  author_name: string
  author_affiliation?: string
  submission_id?: number
  type: string
  severity: "high" | "medium" | "low"
  description: string
  evidence?: string[]
  created_at: string
  updated_at: string
}

export interface COIReport {
  reviewer_id: number
  reviewer_name: string
  reviewer_email: string
  reviewer_affiliation: string
  author_email: string
  author_name: string
  author_affiliation: string
  coi_type: string
  severity: "high" | "medium" | "low" | "none"
  relationships: COIRelationship[]
  summary: string
  recommendation: "assign" | "review" | "avoid"
}

export interface PaperCOISummary {
  paper_id: string
  paper_title: string
  authors: Array<{ email: string; name: string; affiliation?: string }>
  total_conflicts: number
  high_severity_count: number
  medium_severity_count: number
  low_severity_count: number
  conflicted_reviewers: Array<{
    reviewer_id: number
    reviewer_name: string
    reviewer_email: string
    severity: string
    reasons: string[]
  }>
}

const now = new Date().toISOString()

const RELATIONSHIPS: COIRelationship[] = [
  {
    id: 1,
    conference_id: 1,
    reviewer_id: 101,
    reviewer_name: "Reviewer One",
    reviewer_email: "reviewer.one@example.com",
    author_email: "author.one@example.com",
    author_name: "Author One",
    type: "co_author",
    severity: "high",
    description: "Co-authored multiple papers in the last 3 years",
    evidence: ["Semantic Scholar overlap", "Declared COI"],
    created_at: now,
    updated_at: now,
  },
]

const STATS: COIDashboardStats = {
  conference_id: 1,
  total_reviewers: 120,
  available_reviewers: 98,
  total_papers: 320,
  papers_under_review: 280,
  coi_detected: 42,
  total_relationships: 42,
  total_assignments: 900,
  completed_assignments: 640,
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getCOIDashboardStats(
  conferenceId: number,
): Promise<COIDashboardStats> {
  await delay(50)
  return { ...STATS, conference_id: conferenceId }
}

export async function getAllCOIRelationships(params: {
  conference_id: number
  severity?: "high" | "medium" | "low"
  relationship_type?: string
  search?: string
  limit?: number
  page?: number
}): Promise<{ relationships: COIRelationship[]; total: number; page: number; limit: number }> {
  await delay(60)
  const severity = params.severity
  const search = params.search?.toLowerCase()

  let relationships = RELATIONSHIPS.filter((item) => item.conference_id === params.conference_id)

  if (severity) {
    relationships = relationships.filter((item) => item.severity === severity)
  }

  if (params.relationship_type) {
    relationships = relationships.filter((item) => item.type === params.relationship_type)
  }

  if (search) {
    relationships = relationships.filter(
      (item) =>
        item.reviewer_name.toLowerCase().includes(search) ||
        item.author_name.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search),
    )
  }

  const limit = params.limit || 20
  const page = params.page || 1
  const offset = (page - 1) * limit

  return {
    relationships: relationships.slice(offset, offset + limit),
    total: relationships.length,
    page,
    limit,
  }
}

export async function checkReviewerToAuthorCOI(
  conferenceId: number,
  reviewerId: number,
  authorEmail: string,
): Promise<COIReport> {
  await delay(50)

  const rels = RELATIONSHIPS.filter(
    (item) =>
      item.conference_id === conferenceId &&
      item.reviewer_id === reviewerId &&
      item.author_email === authorEmail,
  )

  if (rels.length === 0) {
    return {
      reviewer_id: reviewerId,
      reviewer_name: "Unknown Reviewer",
      reviewer_email: "",
      reviewer_affiliation: "",
      author_email: authorEmail,
      author_name: "Unknown Author",
      author_affiliation: "",
      coi_type: "author",
      severity: "none",
      relationships: [],
      summary: "No COI relationships found",
      recommendation: "assign",
    }
  }

  const first = rels[0]
  return {
    reviewer_id: reviewerId,
    reviewer_name: first.reviewer_name,
    reviewer_email: first.reviewer_email,
    reviewer_affiliation: first.author_affiliation || "",
    author_email: authorEmail,
    author_name: first.author_name,
    author_affiliation: first.author_affiliation || "",
    coi_type: "author",
    severity: rels.some((r) => r.severity === "high")
      ? "high"
      : rels.some((r) => r.severity === "medium")
        ? "medium"
        : "low",
    relationships: rels,
    summary: "Potential conflict detected in local mock dataset",
    recommendation: rels.some((r) => r.severity === "high") ? "avoid" : "review",
  }
}

export async function getAllPaperCOIs(params: {
  conference_id: number
  severity?: "high" | "medium" | "low"
  search?: string
  limit?: number
  page?: number
}): Promise<{ papers: PaperCOISummary[]; total: number; page: number; limit: number }> {
  await delay(50)

  const papers: PaperCOISummary[] = [
    {
      paper_id: "1",
      paper_title: "Example paper",
      authors: [{ email: "author.one@example.com", name: "Author One" }],
      total_conflicts: 1,
      high_severity_count: 1,
      medium_severity_count: 0,
      low_severity_count: 0,
      conflicted_reviewers: [
        {
          reviewer_id: 101,
          reviewer_name: "Reviewer One",
          reviewer_email: "reviewer.one@example.com",
          severity: "high",
          reasons: ["Recent co-author relation"],
        },
      ],
    },
  ]

  const limit = params.limit || 20
  const page = params.page || 1
  const offset = (page - 1) * limit

  return {
    papers: papers.slice(offset, offset + limit),
    total: papers.length,
    page,
    limit,
  }
}

export async function rebuildCOIRelationships(conferenceId: number): Promise<{
  conference_id: number
  relationships_found: number
  relationships_stored: number
  detection_time_ms: number
}> {
  await delay(100)
  return {
    conference_id: conferenceId,
    relationships_found: RELATIONSHIPS.length,
    relationships_stored: RELATIONSHIPS.length,
    detection_time_ms: 100,
  }
}
