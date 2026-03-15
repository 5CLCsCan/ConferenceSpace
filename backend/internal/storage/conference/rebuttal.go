package conference

import (
	"context"
	"fmt"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
)

// GetRebuttalSettings returns the rebuttal configuration for a conference.
func (s *Storage) GetRebuttalSettings(ctx context.Context, conferenceID int64) (*dto.ConferenceRebuttalConfig, error) {
	var cfg dto.ConferenceRebuttalConfig
	err := s.db.QueryRowContext(ctx, `
		SELECT rebuttal_enabled, rebuttal_phase, rebuttal_start_at, rebuttal_deadline,
		       char_limit_general, char_limit_per_point, allow_discussion
		FROM conferences WHERE conference_id = $1
	`, conferenceID).Scan(
		&cfg.Enabled, &cfg.Phase, &cfg.StartAt, &cfg.Deadline,
		&cfg.CharLimitGeneral, &cfg.CharLimitPerPoint, &cfg.AllowDiscussion,
	)
	if err != nil {
		return nil, fmt.Errorf("get rebuttal settings: %w", err)
	}
	return &cfg, nil
}

// SaveRebuttalSettings persists rebuttal configuration (does not change phase).
func (s *Storage) SaveRebuttalSettings(ctx context.Context, conferenceID int64, req *dto.SaveRebuttalConfigRequest) (*dto.ConferenceRebuttalConfig, error) {
	if req.CharLimitGeneral <= 0 {
		req.CharLimitGeneral = 3000
	}
	if req.CharLimitPerPoint <= 0 {
		req.CharLimitPerPoint = 1000
	}
	_, err := s.db.ExecContext(ctx, `
		UPDATE conferences SET
		    rebuttal_enabled     = $1,
		    rebuttal_start_at    = $2,
		    rebuttal_deadline    = $3,
		    char_limit_general   = $4,
		    char_limit_per_point = $5,
		    allow_discussion     = $6,
		    updated_at           = NOW()
		WHERE conference_id = $7
	`, req.Enabled, req.StartAt, req.Deadline, req.CharLimitGeneral, req.CharLimitPerPoint, req.AllowDiscussion, conferenceID)
	if err != nil {
		return nil, fmt.Errorf("save rebuttal settings: %w", err)
	}
	return s.GetRebuttalSettings(ctx, conferenceID)
}

// OpenRebuttal transitions conference to 'awaiting' and bulk-sets all submissions.
// Only transitions from 'not_started'. Uses a transaction.
func (s *Storage) OpenRebuttal(ctx context.Context, conferenceID int64) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	res, err := tx.ExecContext(ctx, `
		UPDATE conferences SET rebuttal_phase = $1, updated_at = NOW()
		WHERE conference_id = $2 AND rebuttal_phase = $3
	`, model.ConferenceRebuttalPhaseAwaiting, conferenceID, model.ConferenceRebuttalPhaseNotStarted)
	if err != nil {
		return fmt.Errorf("set conference rebuttal phase: %w", err)
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		return fmt.Errorf("cannot open rebuttal: current phase is not 'not_started'")
	}

	_, err = tx.ExecContext(ctx, `
		UPDATE conference_submissions
		SET rebuttal_phase = $1, updated_at = NOW()
		WHERE conference_id = $2
	`, model.RebuttalPhaseAwaiting, conferenceID)
	if err != nil {
		return fmt.Errorf("bulk set submission rebuttal phase: %w", err)
	}

	return tx.Commit()
}

// FinalizeRebuttal transitions conference to 'finalized' and bulk-updates all submissions.
func (s *Storage) FinalizeRebuttal(ctx context.Context, conferenceID int64) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, `
		UPDATE conferences SET rebuttal_phase = $1, updated_at = NOW()
		WHERE conference_id = $2
	`, model.ConferenceRebuttalPhaseFinalized, conferenceID)
	if err != nil {
		return fmt.Errorf("finalize conference rebuttal: %w", err)
	}

	_, err = tx.ExecContext(ctx, `
		UPDATE conference_submissions
		SET rebuttal_phase = $1, updated_at = NOW()
		WHERE conference_id = $2
	`, model.RebuttalPhaseFinalized, conferenceID)
	if err != nil {
		return fmt.Errorf("bulk finalize submission rebuttal: %w", err)
	}

	return tx.Commit()
}

// OpenDiscussion transitions to 'discussion'. Requires allow_discussion=true and current phase='awaiting'.
func (s *Storage) OpenDiscussion(ctx context.Context, conferenceID int64) error {
	res, err := s.db.ExecContext(ctx, `
		UPDATE conferences SET rebuttal_phase = $1, updated_at = NOW()
		WHERE conference_id = $2 AND allow_discussion = TRUE
		  AND rebuttal_phase = $3
	`, model.ConferenceRebuttalPhaseDiscussion, conferenceID, model.ConferenceRebuttalPhaseAwaiting)
	if err != nil {
		return fmt.Errorf("open discussion: %w", err)
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		return fmt.Errorf("cannot open discussion: ensure allow_discussion=true and phase is 'awaiting'")
	}
	return nil
}

// GetRebuttalOverview returns settings + per-submission rebuttal status for the chair.
func (s *Storage) GetRebuttalOverview(ctx context.Context, conferenceID int64) (*dto.RebuttalOverviewResponse, error) {
	settings, err := s.GetRebuttalSettings(ctx, conferenceID)
	if err != nil {
		return nil, err
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT
		    cs.submission_id,
		    cs.title,
		    cs.rebuttal_phase,
		    CASE WHEN cs.rebuttal_general_response IS NOT NULL THEN TRUE ELSE FALSE END AS has_response,
		    COUNT(pa.id)::int AS total_reviewers,
		    COUNT(CASE WHEN pa.rebuttal_status = 'acknowledged' THEN 1 END)::int AS acked_reviewers
		FROM conference_submissions cs
		LEFT JOIN paper_assignments pa ON pa.submission_id = cs.submission_id
		    AND pa.conference_id = cs.conference_id
		    AND pa.status = 'completed'
		WHERE cs.conference_id = $1
		GROUP BY cs.submission_id, cs.title, cs.rebuttal_phase, cs.rebuttal_general_response
		ORDER BY cs.submission_id
	`, conferenceID)
	if err != nil {
		return nil, fmt.Errorf("get rebuttal overview: %w", err)
	}
	defer rows.Close()

	var subs []dto.RebuttalOverviewRow
	for rows.Next() {
		var r dto.RebuttalOverviewRow
		if err := rows.Scan(&r.SubmissionID, &r.Title, &r.RebuttalPhase, &r.HasResponse, &r.TotalReviewers, &r.AckedReviewers); err != nil {
			return nil, err
		}
		subs = append(subs, r)
	}
	if subs == nil {
		subs = []dto.RebuttalOverviewRow{}
	}

	return &dto.RebuttalOverviewResponse{Settings: *settings, Submissions: subs}, nil
}

// GetOverdueRebuttalConferences returns IDs of conferences where rebuttal deadline has passed
// and phase is not yet finalized — used by the auto-finalize cron job.
func (s *Storage) GetOverdueRebuttalConferences(ctx context.Context) ([]int64, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT conference_id FROM conferences
		WHERE rebuttal_deadline < NOW()
		  AND rebuttal_phase NOT IN ('not_started', 'finalized')
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}
