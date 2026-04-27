package utils

import (
	"context"

	"github.com/dcao/conferencespace/internal/model"
	conferenceuserrole "github.com/dcao/conferencespace/internal/storage/conference_user_role"
)

// IsUserChairOrCoChair checks if a user has chair permissions (main chair or co-chair) in a conference
func IsUserChairOrCoChair(ctx context.Context, roleStorage conferenceuserrole.StorageInterface, conferenceID int64, userEmail string) bool {
	hasRole, err := roleStorage.HasRole(ctx, conferenceID, userEmail, []string{model.RoleChair, model.RoleCoChair})
	if err != nil {
		return false
	}

	return hasRole
}

// IsUserChairCoChairOrPC checks if a user has chair, co-chair, or PC permissions in a conference
func IsUserChairCoChairOrPC(ctx context.Context, roleStorage conferenceuserrole.StorageInterface, conferenceID int64, userEmail string) bool {
	hasRole, err := roleStorage.HasRole(ctx, conferenceID, userEmail, []string{model.RoleChair, model.RoleCoChair, model.RolePC})
	if err != nil {
		return false
	}

	return hasRole
}
