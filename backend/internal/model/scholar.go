package model

import (
	"encoding/json"
	"time"

	"github.com/lib/pq"
)

const (
	ScholarProfileTableName = "scholar_profiles"
	ScholarPapersTableName  = "scholar_papers"
	ScholarProfilePapersTableName = "scholar_profile_papers"
)

type ScholarProfile struct {
	ID                int64          `db:"id"`
	UserID            int64          `db:"user_id"`
	SemanticScholarID string         `db:"semantic_scholar_id"`
	Name              string         `db:"name"`
	Affiliations      pq.StringArray `db:"affiliations"`
	PaperCount        int            `db:"paper_count"`
	CitationCount     int            `db:"citation_count"`
	HIndex            int            `db:"h_index"`
	URL               string         `db:"url"`
	CreatedAt         time.Time      `db:"created_at"`
	UpdatedAt         time.Time      `db:"updated_at"`
}

type ScholarPaper struct {
	ID                int64           `db:"id"`
	SemanticScholarID string          `db:"semantic_scholar_id"`
	Title             string          `db:"title"`
	Abstract          string          `db:"abstract"`
	Venue             string          `db:"venue"`
	Year              int             `db:"year"`
	CitationCount     int             `db:"citation_count"`
	URL               string          `db:"url"`
	Authors           json.RawMessage `db:"authors"`
	CreatedAt         time.Time       `db:"created_at"`
	UpdatedAt         time.Time       `db:"updated_at"`
}
