package model

import (
	"encoding/json"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/lib/pq"
)

const (
	ConferenceTableName = "conferences"

	ColConferenceID        = "conference_id"
	ColTitle               = "title"
	ColAcronym             = "acronym"
	ColDescription         = "description"
	ColChair               = "chair"
	ColCoChairs            = "co_chairs"
	ConferenceColDomain    = "domain"
	ColTracks              = "tracks"
	ColConfigurations      = "configurations"
	ColConferenceStatus    = "status"
	ConferenceColCreatedAt = "created_at"
	ConferenceColUpdatedAt = "updated_at"
)

// User roles in conference context
const (
	RoleChair    = "chair"
	RoleCoChair  = "co_chair"
	RoleAuthor   = "author"
	RoleReviewer = "reviewer"
)

// Conference status constants
const (
	ConferenceStatusOpen      = "open"      // Accepting submissions
	ConferenceStatusReviewing = "reviewing" // Submissions closed, under review
	ConferenceStatusCompleted = "completed" // Conference finished
)

type Conference struct {
	ConferenceID   int64          `db:"conference_id"`
	Title          string         `db:"title"`
	Acronym        string         `db:"acronym"`
	Description    string         `db:"description"`
	Chair          string         `db:"chair"`
	CoChairs       pq.StringArray `db:"co_chairs"`
	Domain         pq.StringArray `db:"domain"`
	Tracks         pq.StringArray `db:"tracks"`
	Configurations []byte         `db:"configurations"`
	Status         string         `db:"status"`
	CreatedAt      time.Time      `db:"created_at"`
	UpdatedAt      time.Time      `db:"updated_at"`

	// ========= View Fields ===========
	// These fields are populated from JOINs and are not stored in the conferences table
	UserRole string `db:"user_role"` // User's role in this conference (from conference_user_roles)
}

func (c *Conference) ToDTO() *dto.ConferenceResponse {
	domain := []string(c.Domain)
	if domain == nil {
		domain = []string{}
	}

	coChairs := []string(c.CoChairs)
	if coChairs == nil {
		coChairs = []string{}
	}

	tracks := []string(c.Tracks)
	if tracks == nil {
		tracks = []string{}
	}

	var config *dto.ConferenceConfiguration
	if len(c.Configurations) > 0 {
		config = &dto.ConferenceConfiguration{}
		if err := json.Unmarshal(c.Configurations, config); err != nil {
			config = nil
		}
	}

	return &dto.ConferenceResponse{
		ID:             c.ConferenceID,
		Title:          c.Title,
		Acronym:        c.Acronym,
		Description:    c.Description,
		Chair:          c.Chair,
		CoChairs:       coChairs,
		Domain:         domain,
		Tracks:         tracks,
		Configurations: config,
		Status:         c.Status,
		CreatedAt:      c.CreatedAt,
		UpdatedAt:      c.UpdatedAt,
		UserRole:       c.UserRole, // Include view field
	}
}

func SerializeConferenceConfiguration(config *dto.ConferenceConfiguration) ([]byte, error) {
	if config == nil {
		return []byte("{}"), nil
	}
	return json.Marshal(config)
}
