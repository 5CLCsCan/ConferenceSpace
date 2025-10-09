package conference

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/dcao/conferencespace/internal/model/conference"
)

// Conference handles conference data persistence
type Conference struct {
	db *sql.DB
}

// New creates a new conference storage instance
func New(db *sql.DB) *Conference {
	return &Conference{db: db}
}

// Create creates a new conference
func (s *Conference) Create(ctx context.Context, req *conference.CreateRequest) (*conference.Conference, error) {
	query := `
		INSERT INTO conferences (name, description, location, start_date, end_date, capacity, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, name, description, location, start_date, end_date, capacity, status, created_at, updated_at
	`

	now := time.Now()
	conf := &conference.Conference{}

	err := s.db.QueryRowContext(
		ctx,
		query,
		req.Name,
		req.Description,
		req.Location,
		req.StartDate,
		req.EndDate,
		req.Capacity,
		"draft",
		now,
		now,
	).Scan(
		&conf.ID,
		&conf.Name,
		&conf.Description,
		&conf.Location,
		&conf.StartDate,
		&conf.EndDate,
		&conf.Capacity,
		&conf.Status,
		&conf.CreatedAt,
		&conf.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create conference: %w", err)
	}

	return conf, nil
}

// GetByID retrieves a conference by ID
func (s *Conference) GetByID(ctx context.Context, id int64) (*conference.Conference, error) {
	query := `
		SELECT id, name, description, location, start_date, end_date, capacity, status, created_at, updated_at
		FROM conferences
		WHERE id = $1
	`

	conf := &conference.Conference{}
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&conf.ID,
		&conf.Name,
		&conf.Description,
		&conf.Location,
		&conf.StartDate,
		&conf.EndDate,
		&conf.Capacity,
		&conf.Status,
		&conf.CreatedAt,
		&conf.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("conference not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get conference: %w", err)
	}

	return conf, nil
}

// List retrieves all conferences
func (s *Conference) List(ctx context.Context) ([]*conference.Conference, error) {
	query := `
		SELECT id, name, description, location, start_date, end_date, capacity, status, created_at, updated_at
		FROM conferences
		ORDER BY start_date DESC
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list conferences: %w", err)
	}
	defer rows.Close()

	var conferences []*conference.Conference
	for rows.Next() {
		conf := &conference.Conference{}
		err := rows.Scan(
			&conf.ID,
			&conf.Name,
			&conf.Description,
			&conf.Location,
			&conf.StartDate,
			&conf.EndDate,
			&conf.Capacity,
			&conf.Status,
			&conf.CreatedAt,
			&conf.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan conference: %w", err)
		}
		conferences = append(conferences, conf)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating conferences: %w", err)
	}

	return conferences, nil
}

// Update updates a conference
func (s *Conference) Update(ctx context.Context, id int64, req *conference.UpdateRequest) (*conference.Conference, error) {
	query := "UPDATE conferences SET updated_at = $1"
	args := []interface{}{time.Now()}
	argPos := 2

	if req.Name != nil {
		query += fmt.Sprintf(", name = $%d", argPos)
		args = append(args, *req.Name)
		argPos++
	}
	if req.Description != nil {
		query += fmt.Sprintf(", description = $%d", argPos)
		args = append(args, *req.Description)
		argPos++
	}
	if req.Location != nil {
		query += fmt.Sprintf(", location = $%d", argPos)
		args = append(args, *req.Location)
		argPos++
	}
	if req.StartDate != nil {
		query += fmt.Sprintf(", start_date = $%d", argPos)
		args = append(args, *req.StartDate)
		argPos++
	}
	if req.EndDate != nil {
		query += fmt.Sprintf(", end_date = $%d", argPos)
		args = append(args, *req.EndDate)
		argPos++
	}
	if req.Capacity != nil {
		query += fmt.Sprintf(", capacity = $%d", argPos)
		args = append(args, *req.Capacity)
		argPos++
	}
	if req.Status != nil {
		query += fmt.Sprintf(", status = $%d", argPos)
		args = append(args, *req.Status)
		argPos++
	}

	query += fmt.Sprintf(" WHERE id = $%d RETURNING id, name, description, location, start_date, end_date, capacity, status, created_at, updated_at", argPos)
	args = append(args, id)

	conf := &conference.Conference{}
	err := s.db.QueryRowContext(ctx, query, args...).Scan(
		&conf.ID,
		&conf.Name,
		&conf.Description,
		&conf.Location,
		&conf.StartDate,
		&conf.EndDate,
		&conf.Capacity,
		&conf.Status,
		&conf.CreatedAt,
		&conf.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("conference not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update conference: %w", err)
	}

	return conf, nil
}

// Delete deletes a conference
func (s *Conference) Delete(ctx context.Context, id int64) error {
	query := "DELETE FROM conferences WHERE id = $1"
	result, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete conference: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("conference not found")
	}

	return nil
}

