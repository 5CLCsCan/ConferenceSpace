package assignment

import (
	"context"
	"fmt"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
)

// UpdatePostRebuttalScore sets the reviewer's post-rebuttal score and recommendation.
func (s *Storage) UpdatePostRebuttalScore(ctx context.Context, assignmentID int64, req *dto.PostRebuttalScoreRequest) error {
	now := time.Now()
	res, err := s.db.ExecContext(ctx, `
		UPDATE paper_assignments SET
		    post_rebuttal_score          = $1,
		    post_rebuttal_recommendation = $2,
		    post_rebuttal_comment        = $3,
		    post_rebuttal_updated_at     = $4,
		    updated_at                   = $5
		WHERE id = $6 AND conference_id = $7
	`, req.Score, req.Recommendation, req.Comment, now, now, assignmentID, req.ConferenceID)
	if err != nil {
		return fmt.Errorf("update post rebuttal score: %w", err)
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		return fmt.Errorf("assignment not found")
	}
	return nil
}
