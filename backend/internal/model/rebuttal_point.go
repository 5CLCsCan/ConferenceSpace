package model

import "time"

const RebuttalPointTableName = "rebuttal_points"

type RebuttalPoint struct {
	ID                   int64     `db:"id"`
	SubmissionID         int64     `db:"submission_id"`
	ConferenceID         int64     `db:"conference_id"`
	AssignmentID         int64     `db:"assignment_id"`
	PointID              string    `db:"point_id"`
	Category             string    `db:"category"`
	Section              string    `db:"section"`
	OriginalComment      string    `db:"original_comment"`
	AuthorResponse       string    `db:"author_response"`
	Status               string    `db:"status"`
	ReviewerAcknowledged bool      `db:"reviewer_acknowledged"`
	ReviewerNote         string    `db:"reviewer_note"`
	CreatedAt            time.Time `db:"created_at"`
	UpdatedAt            time.Time `db:"updated_at"`
}
