package utils

import (
	"context"
	"fmt"
	"testing"

	"github.com/dcao/conferencespace/internal/model"
	conferenceuserrole "github.com/dcao/conferencespace/internal/storage/conference_user_role"
)

// mockRoleStorage implements conferenceuserrole.StorageInterface for testing
type mockRoleStorage struct {
	roles map[string][]string // key: "conferenceID:email" -> roles
}

func (m *mockRoleStorage) AddRole(_ context.Context, _ int64, _ string, _ string) error {
	return nil
}
func (m *mockRoleStorage) AddRoles(_ context.Context, _ []model.RoleAssignment) error {
	return nil
}
func (m *mockRoleStorage) RemoveRole(_ context.Context, _ int64, _ string) error {
	return nil
}
func (m *mockRoleStorage) UpdateRoleStatus(_ context.Context, _ int64, _ string, _ string) error {
	return nil
}
func (m *mockRoleStorage) GetUserRoles(_ context.Context, _ int64, _ string) ([]string, error) {
	return nil, nil
}
func (m *mockRoleStorage) GetAllUserRoles(_ context.Context, _ string) ([]string, error) {
	return nil, nil
}
func (m *mockRoleStorage) GetEmailsByRole(_ context.Context, _ int64, _ string) ([]string, error) {
	return nil, nil
}
func (m *mockRoleStorage) HasRole(_ context.Context, conferenceID int64, userEmail string, roles []string) (bool, error) {
	key := fmt.Sprintf("%d:%s", conferenceID, userEmail)
	userRoles, exists := m.roles[key]
	if !exists {
		return false, nil
	}
	for _, ur := range userRoles {
		for _, r := range roles {
			if ur == r {
				return true, nil
			}
		}
	}
	return false, nil
}

var _ conferenceuserrole.StorageInterface = (*mockRoleStorage)(nil)

func TestIsUserChairOrCoChair(t *testing.T) {
	store := &mockRoleStorage{
		roles: map[string][]string{
			"1:chair@test.com":    {model.RoleChair},
			"1:cochair@test.com":  {model.RoleCoChair},
			"1:pc@test.com":       {model.RolePC},
			"1:reviewer@test.com": {model.RoleReviewer},
		},
	}

	tests := []struct {
		name     string
		email    string
		expected bool
	}{
		{"chair returns true", "chair@test.com", true},
		{"co-chair returns true", "cochair@test.com", true},
		{"pc returns false", "pc@test.com", false},
		{"reviewer returns false", "reviewer@test.com", false},
		{"unknown returns false", "nobody@test.com", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsUserChairOrCoChair(context.Background(), store, 1, tt.email)
			if result != tt.expected {
				t.Errorf("IsUserChairOrCoChair(%s) = %v, want %v", tt.email, result, tt.expected)
			}
		})
	}
}

func TestIsUserChairCoChairOrPC(t *testing.T) {
	store := &mockRoleStorage{
		roles: map[string][]string{
			"1:chair@test.com":    {model.RoleChair},
			"1:cochair@test.com":  {model.RoleCoChair},
			"1:pc@test.com":       {model.RolePC},
			"1:reviewer@test.com": {model.RoleReviewer},
		},
	}

	tests := []struct {
		name     string
		email    string
		expected bool
	}{
		{"chair returns true", "chair@test.com", true},
		{"co-chair returns true", "cochair@test.com", true},
		{"pc returns true", "pc@test.com", true},
		{"reviewer returns false", "reviewer@test.com", false},
		{"unknown returns false", "nobody@test.com", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsUserChairCoChairOrPC(context.Background(), store, 1, tt.email)
			if result != tt.expected {
				t.Errorf("IsUserChairCoChairOrPC(%s) = %v, want %v", tt.email, result, tt.expected)
			}
		})
	}
}
