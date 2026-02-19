package dto

// AcademicProfileResponse represents the user's academic profile
type AcademicProfileResponse struct {
	UserID            int64           `json:"userId"`
	SemanticScholarID string          `json:"semanticScholarId"`
	Name              string          `json:"name"`
	Affiliations      []string        `json:"affiliations"`
	PaperCount        int             `json:"paperCount"`
	CitationCount     int             `json:"citationCount"`
	HIndex            int             `json:"hIndex"`
	URL               string          `json:"url"`
	SyncedAt          string          `json:"syncedAt"`
	Papers            []AcademicPaper `json:"papers"`
}

// PaperAuthor represents an author of a paper
type PaperAuthor struct {
	AuthorID string `json:"authorId"`
	Name     string `json:"name"`
}

// AcademicPaper represents a single paper in the academic profile
type AcademicPaper struct {
	PaperID       string        `json:"paperId"`
	Title         string        `json:"title"`
	Abstract      string        `json:"abstract,omitempty"`
	Venue         string        `json:"venue,omitempty"`
	Year          int           `json:"year,omitempty"`
	CitationCount int           `json:"citationCount"`
	URL           string        `json:"url,omitempty"`
	Authors       []PaperAuthor `json:"authors,omitempty"`
}
