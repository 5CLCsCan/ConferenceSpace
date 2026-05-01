package dto

// ReviewerSuggestion represents a suggested reviewer for a conference
type ReviewerSuggestion struct {
	ID             string   `json:"id"`
	Source         string   `json:"source"` // "internal" or "external"
	Name           string   `json:"name"`
	Email          string   `json:"email"`
	Affiliation    string   `json:"affiliation"`
	OnPlatform     bool     `json:"on_platform"`
	Score          int      `json:"score"`
	Fields         []string `json:"fields"`
	MatchedFields  []string `json:"matched_fields"`
	Publications   int      `json:"publications"`
	PastReviews    *int     `json:"past_reviews"`
	ScholarID      string   `json:"scholar_id"`
	PlatformUserID *int64   `json:"platform_user_id"`
}

// ReviewerSuggestionRequest represents the request for fetching reviewer suggestions
type ReviewerSuggestionRequest struct {
	ConferenceID int64 `uri:"conference_id" binding:"required"`
	Limit        int   `form:"limit" json:"limit"`
}

// ReviewerSuggestionResponse represents the response for reviewer suggestions
type ReviewerSuggestionResponse struct {
	Suggestions      []*ReviewerSuggestion `json:"suggestions"`
	ConferenceTopics []string              `json:"conference_topics"`
	Total            int                   `json:"total"`
}
