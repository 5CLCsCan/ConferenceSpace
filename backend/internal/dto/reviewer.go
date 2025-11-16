package dto

import "time"

// Reviewer represents a reviewer for both request and response
type Reviewer struct {
	ID           int64     `json:"id,omitempty"`
	UserID       int64     `json:"user_id" binding:"required"`
	ConferenceID int64     `json:"conference_id,omitempty"`
	Email        string    `json:"email,omitempty"`  // From users table (view field)
	Status       string    `json:"status,omitempty"` // Optional in request, defaults to "pending"
	Domain       []string  `json:"domain,omitempty"`
	CreatedAt    time.Time `json:"created_at,omitempty"`
	UpdatedAt    time.Time `json:"updated_at,omitempty"`
}

// ReviewerBatchInviteRequest represents the request to invite multiple reviewers
type ReviewerBatchInviteRequest struct {
	ConferenceID int64      `uri:"conference_id" binding:"required"`
	Reviewers    []Reviewer `json:"reviewers"`
}

// ReviewerBatchInviteResponse represents the response after inviting reviewers
type ReviewerBatchInviteResponse struct {
	Success []Reviewer `json:"success"`
	Failed  []struct {
		UserID int64  `json:"user_id"`
		Error  string `json:"error"`
	} `json:"failed,omitempty"`
}

// ReviewerGetRequest represents the request to get a specific reviewer
type ReviewerGetRequest struct {
	ConferenceID int64 `uri:"conference_id" binding:"required"`
	ReviewerID   int64 `uri:"reviewer_id" binding:"required"`
}

// ReviewerUpdateStatusRequest represents the request to update a reviewer's status
type ReviewerUpdateStatusRequest struct {
	ConferenceID int64  `uri:"conference_id" binding:"required"`
	ReviewerID   int64  `uri:"reviewer_id" binding:"required"`
	Status       string `json:"status"`
}

// ReviewerDeleteRequest represents the request to delete a reviewer
type ReviewerDeleteRequest struct {
	ConferenceID int64 `uri:"conference_id" binding:"required"`
	ReviewerID   int64 `uri:"reviewer_id" binding:"required"`
}

// ReviewerListRequest represents the request to list reviewers with pagination
type ReviewerListRequest struct {
	ConferenceID int64  `uri:"conference_id" binding:"required"`
	Limit        int    `form:"limit" json:"limit"`
	Offset       int    `form:"offset" json:"offset"`
	Status       string `form:"status" json:"status"` // Filter by status (pending, accepted, rejected)
}

// ReviewerListResponse represents the paginated list of reviewers
type ReviewerListResponse struct {
	Reviewers []*Reviewer `json:"reviewers"`
	Total     int64       `json:"total"`
	Limit     int         `json:"limit"`
	Offset    int         `json:"offset"`
}

// ================== Reviewer Dashboard DTOs ==================

// ReviewerDashboardResponse represents all data needed for reviewer dashboard
type ReviewerDashboardResponse struct {
	Conferences       []*ReviewerConference  `json:"conferences"`
	Stats             *ReviewerStats         `json:"stats"`
	Invitations       []*ReviewInvitation    `json:"invitations"`
	RecentAssignments []*AssignmentWithPaper `json:"recent_assignments"`
}

// ReviewerConference represents a conference with reviewer-specific progress info
type ReviewerConference struct {
	*ConferenceResponse        // Embed all conference fields
	ReviewedPapers      int    `json:"reviewed_papers"` // Papers reviewed
	TotalPapers         int    `json:"total_papers"`    // Total papers assigned
	Domain              string `json:"domain"`          // Conference domain (already in ConferenceResponse, but highlighted)
	Status              string `json:"status"`          // Conference status (active, upcoming, completed)
}

// ReviewerStats represents statistics for a reviewer
type ReviewerStats struct {
	TotalAssigned   int `json:"total_assigned"`
	Pending         int `json:"pending"`
	InProgress      int `json:"in_progress"`
	Completed       int `json:"completed"`
	PendingRequests int `json:"pending_requests"`
}

// ReviewInvitation represents a pending review request
type ReviewInvitation struct {
	ID                int64   `json:"id"`
	ConferenceID      int64   `json:"conference_id"`
	ConferenceName    string  `json:"conference_name"`
	ConferenceAcronym string  `json:"conference_acronym"`
	RequestedBy       string  `json:"requested_by"`
	RequestedByName   string  `json:"requested_by_name"`
	RequestedAt       string  `json:"requested_at"`
	Status            string  `json:"status"`
	ExpertiseMatch    float64 `json:"expertise_match"`
	EstimatedPapers   int     `json:"estimated_papers"`
	Deadline          string  `json:"deadline,omitempty"`
}

// AssignmentWithPaper represents a paper assignment with paper details
type AssignmentWithPaper struct {
	AssignmentID   int64  `json:"assignment_id"`
	PaperID        int64  `json:"paper_id"`
	PaperTitle     string `json:"paper_title"`
	ConferenceID   int64  `json:"conference_id"`
	ConferenceName string `json:"conference_name"`
	Status         string `json:"status"`
	DueDate        string `json:"due_date,omitempty"`
	DaysLeft       int    `json:"days_left"`
}

// AssignedPaperResponse represents a paper assigned to reviewer with assignment info
type AssignedPaperResponse struct {
	*Submission             // Embed submission details
	AssignmentStatus string `json:"assignment_status"`
	DueDate          string `json:"due_date,omitempty"`
	AssignedAt       string `json:"assigned_at"`
	AssignmentID     int64  `json:"assignment_id"`
}

// GetConferencePapersRequest represents the request to get papers for a conference with pagination and filters
type GetConferencePapersRequest struct {
	ReviewerEmail string `uri:"reviewer_email" binding:"required"`
	ConferenceID  int64  `uri:"conference_id" binding:"required"`
	Limit         int    `form:"limit" json:"limit"`
	Offset        int    `form:"offset" json:"offset"`
	Search        string `form:"search" json:"search"` // Search by paper title
	Status        string `form:"status" json:"status"` // Filter by assignment status
}

// GetConferencePapersResponse represents paginated papers response
type GetConferencePapersResponse struct {
	Papers []*AssignedPaperResponse `json:"papers"`
	Total  int64                    `json:"total"`
	Limit  int                      `json:"limit"`
	Offset int                      `json:"offset"`
}

// GetCompletedPapersRequest represents the request to get all completed papers for a reviewer
type GetCompletedPapersRequest struct {
	ReviewerEmail string `uri:"reviewer_email" binding:"required"`
	Limit         int    `form:"limit" json:"limit"`
	Offset        int    `form:"offset" json:"offset"`
	Search        string `form:"search" json:"search"` // Search by paper title
}

// GetCompletedPapersResponse represents paginated completed papers response
type GetCompletedPapersResponse struct {
	Papers []*AssignedPaperResponse `json:"papers"`
	Total  int64                    `json:"total"`
	Limit  int                      `json:"limit"`
	Offset int                      `json:"offset"`
}

// GetDashboardRequest represents the request to get reviewer dashboard with optional filters
type GetDashboardRequest struct {
	ReviewerEmail          string `uri:"reviewer_email" binding:"required"`
	ConferenceLimit        int    `form:"conference_limit" json:"conference_limit"`
	ConferenceOffset       int    `form:"conference_offset" json:"conference_offset"`
	ConferenceSearch       string `form:"conference_search" json:"conference_search"` // Search conferences by name
	InvitationLimit        int    `form:"invitation_limit" json:"invitation_limit"`
	InvitationOffset       int    `form:"invitation_offset" json:"invitation_offset"`
	InvitationStatus       string `form:"invitation_status" json:"invitation_status"`               // Filter invitations by status (pending, accepted, rejected)
	RecentAssignmentLimit  int    `form:"recent_assignment_limit" json:"recent_assignment_limit"`   // Default: 10
	RecentAssignmentOffset int    `form:"recent_assignment_offset" json:"recent_assignment_offset"` // Offset for pagination
}

// ReviewerDashboardResponseWithPagination represents dashboard data with pagination info
type ReviewerDashboardResponseWithPagination struct {
	Conferences struct {
		Data   []*ReviewerConference `json:"data"`
		Total  int64                 `json:"total"`
		Limit  int                   `json:"limit"`
		Offset int                   `json:"offset"`
	} `json:"conferences"`
	Stats struct {
		*ReviewerStats
	} `json:"stats"`
	Invitations struct {
		Data   []*ReviewInvitation `json:"data"`
		Total  int64               `json:"total"`
		Limit  int                 `json:"limit"`
		Offset int                 `json:"offset"`
	} `json:"invitations"`
	RecentAssignments struct {
		Data   []*AssignmentWithPaper `json:"data"`
		Total  int64                  `json:"total"`
		Limit  int                    `json:"limit"`
		Offset int                    `json:"offset"`
	} `json:"recent_assignments"`
}
