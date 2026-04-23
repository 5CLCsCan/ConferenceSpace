// User roles
export type UserRole = "author" | "reviewer" | "chair" | "pc" | "admin"

// Paper status
export type PaperStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "reviewing"
  | "revision_requested"
  | "accepted"
  | "rejected"
  | "camera_ready"

// Review status
export type ReviewStatus = "pending" | "in_progress" | "completed"

export type PrecheckDecision = "accept_for_review" | "manual_review" | "desk_reject"

export interface PrecheckResult {
  paper_title: string
  overall_score: number
  decision: PrecheckDecision
  summary: {
    total_items: number
    passed: number
    failed: number
    pass_rate: number
  }
  category_scores: Record<
    string,
    {
      score: number
      passed: number
      failed: number
      weight: number
    }
  >
  detailed_results: Array<{
    item_id: string
    category: string
    description: string
    status: "pass" | "fail" | "warning"
    details: string
    confidence: number
  }>
}

export interface PrecheckBlockingItem {
  item_id: string
  category: string
  description: string
  status: string
  details: string
}

export interface PrecheckBlockedError {
  code: "PRECHECK_BLOCKED"
  decision: PrecheckDecision
  blocking_items: PrecheckBlockingItem[]
}

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
  semantic_scholar_id?: string
  profile_sync_status?: "pending" | "completed" | "failed" | string
}

// Conference status type - matches backend enum
export type ConferenceStatus = "draft" | "open" | "reviewing" | "completed" | "archived"

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
  conference_end_date?: string
  location: string
  website?: string
  status: ConferenceStatus
  created_at?: string
  updated_at?: string
  tracks: string[]
  domain?: string[] // Research domains/keywords/topics
  call_for_paper_text?: string // Call for paper content
  chair?: string
  co_chairs?: string[] // Co-chair email addresses
  pc_members?: string[] // PC member email addresses
  primary_contact?: number
  area_chair?: number
  userRole?: string // "chair", "author", "reviewer", or undefined
  isBookmarked?: boolean // Whether the user has bookmarked this conference
  submissionStatus?: "draft" | "submitted" | "under_review" | "accepted" | "rejected" // User's submission status for this conference
  configurations?: {
    start_date?: string
    end_date?: string
    abstract_submission_deadline?: string
    full_paper_submission_deadline?: string
    camera_ready_deadline?: string
    format?: string
    review_type?: string
    have_coi?: boolean
    maximum_pages?: number
    submission_format?: string
    require_complete_author_profile?: boolean
    allow_paper_withdrawls?: boolean
    website?: string
    desk_rejection_settings?: {
      enabled?: boolean
      min_references?: number
      required_sections?: string[]
      title_max_words?: number
      max_sentence_words?: number
      thresholds?: {
        desk_reject_score?: number
        accept_score?: number
      }
      weights?: Record<string, number>
      custom_rules?: {
        min_datasets?: number
        minimum_tables?: number
        author_anonymization_required?: boolean
        critical_keywords_required?: string[]
        banned_phrases?: string[]
      }
      scope_keywords?: string[]
      prompt_fragments?: string[]
    }
    discussion_settings?: {
      enabled?: boolean
      allow_author_response?: boolean
      start_at?: string
      end_at?: string
    }
    rebuttal_settings?: {
      enabled?: boolean
      start_at?: string
      end_at?: string
      character_limit?: number
      allow_revisions?: boolean
      allow_new_results?: boolean
      require_response_to_all?: boolean
    }
    workflow_settings?: {
      strict_deadlines?: boolean
    }
  }
}

export interface ConferenceConfigTemplatePayload {
  description?: string
  location?: string
  location_type?: "in-person" | "virtual" | "hybrid" | string
  topics?: string[]
  tracks?: string[]
  conference_start_date?: string
  conference_end_date?: string
  abstract_deadline?: string
  full_paper_deadline?: string
  camera_ready_deadline?: string
  max_pages?: number
  abstract_max_words?: number
  min_keywords?: number
  max_keywords?: number
  allow_supplementary?: boolean
  supplementary_types?: string[]
  strict_deadlines?: boolean
  review_type?: "single-blind" | "double-blind" | string
  rebuttal_start_date?: string
  rebuttal_end_date?: string
  final_decision_date?: string
  file_formats?: string[]
  call_for_paper_text?: string
  co_chairs?: string[]
}

export interface ConferenceConfigTemplate {
  id: string
  name: string
  description: string
  payload: ConferenceConfigTemplatePayload
  created_at: string
  updated_at: string
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
// Notification types
export type NotificationType =
  | "submission_received"
  | "review_assigned"
  | "review_submitted"
  | "paper_accepted"
  | "paper_rejected"
  | "deadline_reminder"
  | "status_change"
  | "discussion_thread"
  | "discussion_message"

export interface Notification {
  id: number
  user_email: string
  type: NotificationType
  title: string
  message: string
  metadata?: Record<string, unknown>
  read: boolean
  action_url?: string
  conference_id?: number
  created_at: string
}

export interface ReviewRequest {
  id: string
  conference_id: string
  conference_name: string
  conference_acronym: string
  requested_by: String
  requested_by_name: string
  requested_at: string
  status: "pending" | "accepted" | "rejected"
  expertise_match: number
  papers_count: number
  estimated_hours: number
  conflict_of_interest: boolean
}

// ================== Reviewer Types ==================

export interface ReviewerStats {
  total_assigned: number
  pending: number
  in_progress: number
  completed: number
  pending_requests: number
}

export interface AssignmentWithPaper {
  assignment_id: number
  paper_id: number
  paper_title: string
  conference_id: number
  conference_name: string
  status: string
  due_date?: string
  days_left: number
}

export interface ReviewerConference {
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
  tracks: any[]
  chair?: string
  primary_contact?: number
  area_chair?: number
  userRole?: string
  reviewed_papers: number
  total_papers: number
  domain: string
}

export interface ReviewerDashboardData {
  conferences: ReviewerConference[]
  stats: ReviewerStats
  invitations: any[]
  recent_assignments: AssignmentWithPaper[]
  // Pagination totals
  total_conferences?: number
  total_invitations?: number
  total_assignments?: number
}

export interface AssignedPaper {
  id: string
  title: string
  abstract: string
  keywords: string[]
  authors: any[]
  conference_id: string
  track_id: string
  status: string
  submitted_at: string
  updated_at: string
  file_url?: string
  version: number
  reviews: any[]
  assignment_status: string
  due_date?: string
  assigned_at: string
  assignment_id: number
}

// ================== Profile Types ==================

export interface ProfileFormData {
  firstName: string
  lastName: string
  email: string
  domain: string[]
}

export interface UpdateProfileRequest {
  id: number
  user: {
    id: number
    first_name: string
    last_name: string
    email: string
    domain: string[]
  }
}
