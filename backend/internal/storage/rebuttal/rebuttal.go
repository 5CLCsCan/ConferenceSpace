package rebuttal

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
)

type StorageInterface interface {
	UpsertPoints(ctx context.Context, points []model.RebuttalPoint) error
	GetBySubmission(ctx context.Context, submissionID int64) ([]dto.RebuttalPointDTO, error)
	AcknowledgePoint(ctx context.Context, submissionID int64, pointID string, status string, note string) error
}

type Storage struct {
	db *sql.DB
}

func New(db *sql.DB) *Storage {
	return &Storage{db: db}
}

// UpsertPoints inserts or updates all rebuttal points for a submission.
func (s *Storage) UpsertPoints(ctx context.Context, points []model.RebuttalPoint) error {
	if len(points) == 0 {
		return nil
	}
	for _, p := range points {
		_, err := s.db.ExecContext(ctx, `
			INSERT INTO rebuttal_points
			  (submission_id, conference_id, assignment_id, point_id, category, section,
			   original_comment, author_response, status, updated_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending_review',NOW())
			ON CONFLICT (submission_id, point_id) DO UPDATE
			  SET author_response  = EXCLUDED.author_response,
			      category         = EXCLUDED.category,
			      section          = EXCLUDED.section,
			      original_comment = EXCLUDED.original_comment,
			      updated_at       = NOW()
		`, p.SubmissionID, p.ConferenceID, p.AssignmentID, p.PointID,
			p.Category, p.Section, p.OriginalComment, p.AuthorResponse)
		if err != nil {
			return fmt.Errorf("upsert point %s: %w", p.PointID, err)
		}
	}
	return nil
}

// GetBySubmission returns all rebuttal points for a submission.
func (s *Storage) GetBySubmission(ctx context.Context, submissionID int64) ([]dto.RebuttalPointDTO, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT point_id, assignment_id, category, section, original_comment,
		       author_response, status, reviewer_acknowledged, reviewer_note
		FROM rebuttal_points
		WHERE submission_id = $1
		ORDER BY id
	`, submissionID)
	if err != nil {
		return nil, fmt.Errorf("get rebuttal points: %w", err)
	}
	defer rows.Close()

	var result []dto.RebuttalPointDTO
	for rows.Next() {
		var p dto.RebuttalPointDTO
		var note sql.NullString
		var authorResponse sql.NullString
		if err := rows.Scan(&p.PointID, &p.AssignmentID, &p.Category, &p.Section,
			&p.OriginalComment, &authorResponse, &p.Status, &p.ReviewerAcknowledged, &note); err != nil {
			return nil, err
		}
		p.AuthorResponse = authorResponse.String
		p.ReviewerNote = note.String
		result = append(result, p)
	}
	if result == nil {
		result = []dto.RebuttalPointDTO{}
	}
	return result, nil
}

// AcknowledgePoint marks a single point as acknowledged by the reviewer.
func (s *Storage) AcknowledgePoint(ctx context.Context, submissionID int64, pointID string, status string, note string) error {
	now := time.Now()
	res, err := s.db.ExecContext(ctx, `
		UPDATE rebuttal_points
		SET reviewer_acknowledged = TRUE,
		    status     = $1,
		    reviewer_note = $2,
		    updated_at   = $3
		WHERE submission_id = $4 AND point_id = $5
	`, status, note, now, submissionID, pointID)
	if err != nil {
		return fmt.Errorf("acknowledge point: %w", err)
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		return fmt.Errorf("point not found: %s", pointID)
	}
	return nil
}
