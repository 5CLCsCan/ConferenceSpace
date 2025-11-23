/**
 * Mock data for COI (Conflict of Interest) analysis
 * Includes reviewers, authors, papers, and relationship history
 */

export type COIType = "paper" | "author" | "organization" | "domain" | "collaboration"

export type COISeverity = "high" | "medium" | "low" | "none"

export type RelationshipType =
  | "co_author"
  | "same_organization"
  | "advisor_advisee"
  | "collaborator"
  | "competitor"
  | "citation"
  | "review_history"

export interface Reviewer {
  id: string
  name: string
  email: string
  affiliation: string
  domains: string[]
  h_index?: number
  total_papers?: number
  current_workload: number
  max_capacity: number
}

export interface Author {
  id: string
  name: string
  email: string
  affiliation: string
  domains: string[]
}

export interface Paper {
  id: string
  title: string
  abstract: string
  keywords: string[]
  authors: Author[]
  submitted_at: string
  status: string
}

export interface Relationship {
  id: string
  reviewer_id: string
  author_id: string
  type: RelationshipType
  start_date: string
  end_date?: string
  description: string
  severity: COISeverity
  evidence?: string[]
}

export interface COIReport {
  reviewer_id: string
  reviewer_name: string
  reviewer_email: string
  reviewer_affiliation: string
  paper_id?: string
  author_id?: string
  author_name?: string
  author_email?: string
  author_affiliation?: string
  coi_type: COIType
  severity: COISeverity
  relationships: Relationship[]
  summary: string
  recommendation: "assign" | "review" | "avoid"
}

// Mock Reviewers
export const mockReviewers: Reviewer[] = [
  {
    id: "rev-1",
    name: "Dr. Sarah Chen",
    email: "sarah.chen@mit.edu",
    affiliation: "MIT Computer Science",
    domains: ["Machine Learning", "Deep Learning", "NLP"],
    h_index: 42,
    total_papers: 128,
    current_workload: 3,
    max_capacity: 8,
  },
  {
    id: "rev-2",
    name: "Prof. Michael Zhang",
    email: "m.zhang@stanford.edu",
    affiliation: "Stanford AI Lab",
    domains: ["Computer Vision", "Robotics", "ML"],
    h_index: 38,
    total_papers: 156,
    current_workload: 5,
    max_capacity: 10,
  },
  {
    id: "rev-3",
    name: "Dr. Emily Rodriguez",
    email: "emily.rodriguez@berkeley.edu",
    affiliation: "UC Berkeley EECS",
    domains: ["NLP", "LLMs", "Information Retrieval"],
    h_index: 35,
    total_papers: 98,
    current_workload: 2,
    max_capacity: 8,
  },
  {
    id: "rev-4",
    name: "Prof. David Kim",
    email: "d.kim@cmu.edu",
    affiliation: "Carnegie Mellon University",
    domains: ["Computer Vision", "Multimodal Learning"],
    h_index: 45,
    total_papers: 142,
    current_workload: 4,
    max_capacity: 10,
  },
  {
    id: "rev-5",
    name: "Dr. Lisa Wang",
    email: "lisa.wang@oxford.ac.uk",
    affiliation: "Oxford Computer Science",
    domains: ["ML Theory", "Optimization", "Fairness"],
    h_index: 32,
    total_papers: 87,
    current_workload: 1,
    max_capacity: 8,
  },
  {
    id: "rev-6",
    name: "Prof. James Anderson",
    email: "j.anderson@harvard.edu",
    affiliation: "Harvard SEAS",
    domains: ["NLP", "Machine Learning", "AI Ethics"],
    h_index: 40,
    total_papers: 115,
    current_workload: 6,
    max_capacity: 10,
  },
]

// Mock Authors
export const mockAuthors: Author[] = [
  {
    id: "auth-1",
    name: "Alex Thompson",
    email: "alex.thompson@stanford.edu",
    affiliation: "Stanford University",
    domains: ["Deep Learning", "Computer Vision"],
  },
  {
    id: "auth-2",
    name: "Maria Garcia",
    email: "maria.garcia@mit.edu",
    affiliation: "MIT CSAIL",
    domains: ["NLP", "LLMs"],
  },
  {
    id: "auth-3",
    name: "Robert Lee",
    email: "r.lee@berkeley.edu",
    affiliation: "UC Berkeley",
    domains: ["Machine Learning", "Optimization"],
  },
  {
    id: "auth-4",
    name: "Sarah Chen", // Same as reviewer - potential COI
    email: "sarah.chen@mit.edu",
    affiliation: "MIT Computer Science",
    domains: ["Machine Learning", "Deep Learning"],
  },
]

// Mock Papers
export const mockPapers: Paper[] = [
  {
    id: "paper-1",
    title: "Efficient Transformers for Large-Scale Language Models",
    abstract:
      "We propose a novel architecture for efficient transformer models that reduces computational costs by 60% while maintaining performance...",
    keywords: ["Transformers", "LLMs", "Efficiency", "NLP"],
    authors: [mockAuthors[0], mockAuthors[1]],
    submitted_at: "2024-01-15T10:00:00Z",
    status: "under_review",
  },
  {
    id: "paper-2",
    title: "Multi-Modal Learning for Computer Vision Applications",
    abstract:
      "This paper explores the integration of visual and textual information in deep learning models...",
    keywords: ["Computer Vision", "Multimodal", "Deep Learning"],
    authors: [mockAuthors[0], mockAuthors[2]],
    submitted_at: "2024-01-20T14:30:00Z",
    status: "under_review",
  },
  {
    id: "paper-3",
    title: "Fairness in Machine Learning: A Comprehensive Survey",
    abstract:
      "We survey recent advances in fairness-aware machine learning algorithms and evaluation metrics...",
    keywords: ["Fairness", "ML", "Ethics", "Bias"],
    authors: [mockAuthors[2], mockAuthors[3]],
    submitted_at: "2024-02-01T09:15:00Z",
    status: "under_review",
  },
]

// Mock Relationships
export const mockRelationships: Relationship[] = [
  // Reviewer 1 (Sarah Chen) relationships
  {
    id: "rel-1",
    reviewer_id: "rev-1",
    author_id: "auth-4", // Same person - high COI
    type: "co_author",
    start_date: "2018-01-01",
    description: "Co-authored 5 papers together",
    severity: "high",
    evidence: ["Paper: 'Deep Learning Advances' (2018)", "Paper: 'ML for NLP' (2019)"],
  },
  {
    id: "rel-2",
    reviewer_id: "rev-1",
    author_id: "auth-1",
    type: "same_organization",
    start_date: "2020-06-01",
    end_date: "2022-08-31",
    description: "Both worked at Stanford AI Lab",
    severity: "medium",
  },
  {
    id: "rel-3",
    reviewer_id: "rev-1",
    author_id: "auth-2",
    type: "collaborator",
    start_date: "2021-03-15",
    description: "Active collaboration on NLP research",
    severity: "medium",
  },
  // Reviewer 2 (Michael Zhang) relationships
  {
    id: "rel-4",
    reviewer_id: "rev-2",
    author_id: "auth-1",
    type: "advisor_advisee",
    start_date: "2019-09-01",
    end_date: "2023-06-30",
    description: "Advised author during PhD program",
    severity: "high",
  },
  {
    id: "rel-5",
    reviewer_id: "rev-2",
    author_id: "auth-2",
    type: "citation",
    start_date: "2020-01-01",
    description: "Multiple citations in recent papers",
    severity: "low",
  },
  // Reviewer 3 (Emily Rodriguez) relationships
  {
    id: "rel-6",
    reviewer_id: "rev-3",
    author_id: "auth-1",
    type: "collaborator",
    start_date: "2022-01-01",
    description: "Joint research projects",
    severity: "high",
  },
  {
    id: "rel-7",
    reviewer_id: "rev-3",
    author_id: "auth-3",
    type: "co_author",
    start_date: "2021-05-01",
    description: "Co-authored 3 papers",
    severity: "high",
  },
  // Reviewer 4 (David Kim) relationships
  {
    id: "rel-8",
    reviewer_id: "rev-4",
    author_id: "auth-2",
    type: "competitor",
    start_date: "2023-01-01",
    description: "Competing research directions",
    severity: "low",
  },
]

/**
 * Calculate COI severity based on relationships
 */
export function calculateCOISeverity(relationships: Relationship[]): COISeverity {
  if (relationships.length === 0) return "none"

  const hasHigh = relationships.some((r) => r.severity === "high")
  const hasMedium = relationships.some((r) => r.severity === "medium")

  if (hasHigh) return "high"
  if (hasMedium) return "medium"
  return "low"
}

/**
 * Get recommendation based on COI severity
 */
export function getCOIRecommendation(severity: COISeverity): "assign" | "review" | "avoid" {
  switch (severity) {
    case "high":
      return "avoid"
    case "medium":
      return "review"
    case "low":
      return "assign"
    case "none":
      return "assign"
  }
}

/**
 * Find COI relationships for a reviewer and author
 */
export function findReviewerToAuthorCOI(reviewerId: string, authorId: string): Relationship[] {
  return mockRelationships.filter(
    (rel) => rel.reviewer_id === reviewerId && rel.author_id === authorId,
  )
}

/**
 * Find COI relationships for a reviewer and paper (all authors)
 */
export function findReviewerToPaperCOI(
  reviewerId: string,
  paperId: string,
): { author: Author; relationships: Relationship[] }[] {
  const paper = mockPapers.find((p) => p.id === paperId)
  if (!paper) return []

  return paper.authors.map((author) => ({
    author,
    relationships: findReviewerToAuthorCOI(reviewerId, author.id),
  }))
}

/**
 * Generate COI report for reviewer-to-author
 */
export function generateReviewerToAuthorCOIReport(
  reviewerId: string,
  authorId: string,
): COIReport | null {
  const reviewer = mockReviewers.find((r) => r.id === reviewerId)
  const author = mockAuthors.find((a) => a.id === authorId)

  if (!reviewer || !author) return null

  const relationships = findReviewerToAuthorCOI(reviewerId, authorId)
  const severity = calculateCOISeverity(relationships)
  const recommendation = getCOIRecommendation(severity)

  let summary = ""
  if (relationships.length === 0) {
    summary = `No conflicts of interest found between ${reviewer.name} and ${author.name}.`
  } else {
    const types = relationships.map((r) => r.type).join(", ")
    summary = `Found ${relationships.length} relationship(s) (${types}) between ${reviewer.name} and ${author.name}.`
  }

  return {
    reviewer_id: reviewerId,
    reviewer_name: reviewer.name,
    reviewer_email: reviewer.email,
    reviewer_affiliation: reviewer.affiliation,
    author_id: authorId,
    author_name: author.name,
    author_email: author.email,
    author_affiliation: author.affiliation,
    coi_type: "author",
    severity,
    relationships,
    summary,
    recommendation,
  }
}

/**
 * Generate COI report for reviewer-to-paper
 */
export function generateReviewerToPaperCOIReport(
  reviewerId: string,
  paperId: string,
): COIReport | null {
  const reviewer = mockReviewers.find((r) => r.id === reviewerId)
  const paper = mockPapers.find((p) => p.id === paperId)

  if (!reviewer || !paper) return null

  const authorCOIs = findReviewerToPaperCOI(reviewerId, paperId)
  const allRelationships = authorCOIs.flatMap((item) => item.relationships)
  const severity = calculateCOISeverity(allRelationships)
  const recommendation = getCOIRecommendation(severity)

  let summary = ""
  if (allRelationships.length === 0) {
    summary = `No conflicts of interest found between ${reviewer.name} and any authors of "${paper.title}".`
  } else {
    const affectedAuthors = authorCOIs
      .filter((item) => item.relationships.length > 0)
      .map((item) => item.author.name)
    summary = `Found ${allRelationships.length} relationship(s) affecting ${affectedAuthors.length} author(s): ${affectedAuthors.join(", ")}.`
  }

  return {
    reviewer_id: reviewerId,
    reviewer_name: reviewer.name,
    reviewer_email: reviewer.email,
    reviewer_affiliation: reviewer.affiliation,
    paper_id: paperId,
    coi_type: "paper",
    severity,
    relationships: allRelationships,
    summary,
    recommendation,
  }
}

/**
 * Get relationship history timeline for a reviewer-author pair
 */
export function getRelationshipHistory(reviewerId: string, authorId: string): Relationship[] {
  return mockRelationships
    .filter((rel) => rel.reviewer_id === reviewerId && rel.author_id === authorId)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
}

/**
 * Filter reviewers by search query
 */
export function filterReviewers(
  reviewers: Reviewer[],
  searchQuery: string,
  statusFilter?: string,
): Reviewer[] {
  let filtered = reviewers

  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (reviewer) =>
        reviewer.name.toLowerCase().includes(query) ||
        reviewer.email.toLowerCase().includes(query) ||
        reviewer.affiliation.toLowerCase().includes(query) ||
        reviewer.domains.some((d) => d.toLowerCase().includes(query)),
    )
  }

  // Status filter would be based on workload/availability
  if (statusFilter === "available") {
    filtered = filtered.filter((r) => r.current_workload < r.max_capacity)
  }

  return filtered
}

export interface PaperCOISummary {
  paper_id: string
  paper_title: string
  authors: Author[]
  total_conflicts: number
  high_severity_count: number
  medium_severity_count: number
  low_severity_count: number
  conflicted_reviewers: {
    reviewer: Reviewer
    severity: COISeverity
    reasons: string[]
  }[]
}

/**
 * Generate a summary of COIs for a single paper against all reviewers
 */
export function generatePaperCOISummary(paperId: string): PaperCOISummary | null {
  const paper = mockPapers.find((p) => p.id === paperId)
  if (!paper) return null

  const conflictedReviewers: PaperCOISummary["conflicted_reviewers"] = []
  let high = 0
  let medium = 0
  let low = 0

  mockReviewers.forEach((reviewer) => {
    // Check this reviewer against all authors of the paper
    const relationships: Relationship[] = []
    paper.authors.forEach((author) => {
      const rels = findReviewerToAuthorCOI(reviewer.id, author.id)
      relationships.push(...rels)
    })

    if (relationships.length > 0) {
      const severity = calculateCOISeverity(relationships)
      if (severity !== "none") {
        if (severity === "high") high++
        else if (severity === "medium") medium++
        else if (severity === "low") low++

        conflictedReviewers.push({
          reviewer,
          severity,
          reasons: relationships.map((r) => r.description),
        })
      }
    }
  })

  return {
    paper_id: paper.id,
    paper_title: paper.title,
    authors: paper.authors,
    total_conflicts: high + medium + low,
    high_severity_count: high,
    medium_severity_count: medium,
    low_severity_count: low,
    conflicted_reviewers: conflictedReviewers.sort((a, b) => {
      // Sort by severity (High > Medium > Low)
      const severityScore = { high: 3, medium: 2, low: 1, none: 0 }
      return severityScore[b.severity] - severityScore[a.severity]
    }),
  }
}
