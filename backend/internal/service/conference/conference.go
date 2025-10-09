package conference

import (
	"context"

	"github.com/dcao/conferencespace/internal/model/conference"
)

// StorageInterface defines the interface for conference storage
type StorageInterface interface {
	Create(ctx context.Context, req *conference.CreateRequest) (*conference.Conference, error)
	GetByID(ctx context.Context, id int64) (*conference.Conference, error)
	List(ctx context.Context) ([]*conference.Conference, error)
	Update(ctx context.Context, id int64, req *conference.UpdateRequest) (*conference.Conference, error)
	Delete(ctx context.Context, id int64) error
}

// Conference handles business logic for conferences
type Conference struct {
	storage StorageInterface
}

// New creates a new conference service
func New(storage StorageInterface) *Conference {
	return &Conference{storage: storage}
}

// Create creates a new conference
func (s *Conference) Create(ctx context.Context, req *conference.CreateRequest) (*conference.Conference, error) {
	// Add business logic here (e.g., validation, authorization)
	return s.storage.Create(ctx, req)
}

// GetByID retrieves a conference by ID
func (s *Conference) GetByID(ctx context.Context, id int64) (*conference.Conference, error) {
	return s.storage.GetByID(ctx, id)
}

// List retrieves all conferences
func (s *Conference) List(ctx context.Context) ([]*conference.Conference, error) {
	return s.storage.List(ctx)
}

// Update updates a conference
func (s *Conference) Update(ctx context.Context, id int64, req *conference.UpdateRequest) (*conference.Conference, error) {
	// Add business logic here (e.g., validation, authorization)
	return s.storage.Update(ctx, id, req)
}

// Delete deletes a conference
func (s *Conference) Delete(ctx context.Context, id int64) error {
	// Add business logic here (e.g., check if conference has attendees)
	return s.storage.Delete(ctx, id)
}

