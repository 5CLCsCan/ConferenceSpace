// User roles
export type UserRole = "author" | "reviewer" | "pc_member" | "chair" | "admin"

// Paper status
export type PaperStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "revision_requested"
  | "accepted"
  | "rejected"
  | "camera_ready"

// Review status
export type ReviewStatus = "pending" | "in_progress" | "completed"

// Decision types
export type DecisionType = "accept" | "reject" | "major_revision" | "minor_revision"

// User interface
export interface User {
  id: string
  name: string
  email: string
  affiliation?: string
  roles: UserRole[]
  avatar?: string
  expertise: string[]
  h_index?: number
  total_papers?: number
  total_reviews?: number
  first_name?: string
  last_name?: string
  domain?: string[]
  created_at?: string
  updated_at?: string
}

// Conference interface
export interface Conference {
  id: string
  name: string
  acronym: string
  year: number
  description: string
  submission_deadline: string
  review_deadline: string
  camera_ready_deadline: string
  notification_date: string
  conference_date: string
  location: string
  website?: string
  status: "upcoming" | "active" | "completed" | "open" | "closed"
  tracks: Track[]
  chair?: string
  primary_contact?: number
  area_chair?: number
  userRole?: string // "chair", "author", "reviewer", or undefined
}

// Track interface
export interface Track {
  id: string
  name: string
  description: string
  chairs: string[] // User IDs
}

// Paper interface
export interface Paper {
  id: string
  title: string
  abstract: string
  keywords: string[]
  authors: Author[]
  conference_id: string
  track_id: string
  status: PaperStatus
  submitted_at: string
  updated_at: string
  file_url?: string
  version: number
  reviews: Review[]
  ai_suggestions?: AISuggestion
}

// Author interface
export interface Author {
  user_id: string
  name: string
  email: string
  affiliation: string
  is_corresponding: boolean
  order: number
}

// Review interface
export interface Review {
  id: string
  paper_id: string
  reviewer_id: string
  reviewer_name?: string
  status: ReviewStatus
  overall_score: number // 1-5
  confidence: number // 1-5
  novelty: number // 1-5
  technical_quality: number // 1-5
  clarity: number // 1-5
  relevance: number // 1-5
  comments_to_authors: string
  comments_to_pc: string
  recommendation: DecisionType
  submitted_at?: string
  ai_analysis?: ReviewAIAnalysis
}

// AI Suggestion for paper submission
export interface AISuggestion {
  recommended_reviewers: RecommendedReviewer[]
  similar_papers: SimilarPaper[]
  keyword_suggestions: string[]
  track_recommendation: {
    track_id: string
    track_name: string
    confidence: number
    reasoning: string
  }
  quality_assessment: {
    abstract_clarity: number
    keyword_relevance: number
    title_effectiveness: number
    suggestions: string[]
  }
}

// Recommended reviewer
export interface RecommendedReviewer {
  user_id: string
  name: string
  affiliation: string
  expertise_match: number // 0-100
  availability: "high" | "medium" | "low"
  past_reviews: number
  avg_review_quality: number
  reasoning: string
  conflicts?: string[]
}

// Similar paper
export interface SimilarPaper {
  id: string
  title: string
  authors: string[]
  year: number
  venue: string
  similarity_score: number
  relevance: string
}

// Review AI Analysis
export interface ReviewAIAnalysis {
  sentiment: "positive" | "neutral" | "negative"
  consistency_score: number // How consistent scores are with comments
  key_strengths: string[]
  key_weaknesses: string[]
  suggested_questions: string[] // Questions authors might want to address
  bias_detection: {
    has_potential_bias: boolean
    bias_type?: string
    confidence: number
  }
}

// Assignment interface
export interface ReviewAssignment {
  id: string
  paper_id: string
  reviewer_id: string
  assigned_by: string
  assigned_at: string
  due_date: string
  status: ReviewStatus
  ai_match_score?: number
}

// Discussion interface
export interface Discussion {
  id: string
  paper_id: string
  participants: string[] // User IDs
  messages: DiscussionMessage[]
  created_at: string
  updated_at: string
}

// Discussion message
export interface DiscussionMessage {
  id: string
  user_id: string
  user_name: string
  user_role: UserRole
  message: string
  timestamp: string
  is_ai_generated?: boolean
}

// Statistics interface
export interface ConferenceStats {
  total_submissions: number
  total_reviews: number
  avg_reviews_per_paper: number
  acceptance_rate: number
  submissions_by_track: { track: string; count: number }[]
  submissions_over_time: { date: string; count: number }[]
  review_progress: {
    completed: number
    in_progress: number
    pending: number
  }
  top_keywords: { keyword: string; count: number }[]
}

// Notification interface
export interface Notification {
  id: string
  user_id: string
  type: "info" | "success" | "warning" | "error"
  title: string
  message: string
  read: boolean
  created_at: string
  action_url?: string
}

export interface ReviewRequest {
  id: string
  conference_id: string
  conference_name: string
  conference_acronym: string
  requested_by: String
  requested_by_name: string
  requested_at: string
  status: "pending" | "accepted" | "declined"
  expertise_match: number
  papers_count: number
  estimated_hours: number
  conflict_of_interest: boolean
}
