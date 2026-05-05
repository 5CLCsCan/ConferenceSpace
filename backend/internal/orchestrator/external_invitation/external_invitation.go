package external_invitation

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/model"
	conferenceStorage "github.com/dcao/conferencespace/internal/storage/conference"
	conferenceuserrole "github.com/dcao/conferencespace/internal/storage/conference_user_role"
	externalInvStorage "github.com/dcao/conferencespace/internal/storage/external_invitation"
	reviewerStorage "github.com/dcao/conferencespace/internal/storage/reviewer"
	userStorage "github.com/dcao/conferencespace/internal/storage/user"
	"github.com/dcao/conferencespace/pkg/jwt"
	semanticScholarController "github.com/dcao/conferencespace/internal/controller/semantic_scholar"
	userOrchestrator "github.com/dcao/conferencespace/internal/orchestrator/user"
)

type Orchestrator struct {
	store               externalInvStorage.StorageInterface
	appBaseURL          string
	userOrch            *userOrchestrator.Orchestrator
	userStorage         userStorage.StorageInterface
	reviewerStorage     reviewerStorage.StorageInterface
	roleStorage         conferenceuserrole.StorageInterface
	confStorage         conferenceStorage.StorageInterface
	semanticScholarCtrl *semanticScholarController.Controller // nil-safe
	jwtSecret           string
	jwtExpiry           time.Duration
}

func New(
	store externalInvStorage.StorageInterface,
	appBaseURL string,
	userOrch *userOrchestrator.Orchestrator,
	userStore userStorage.StorageInterface,
	reviewerStore reviewerStorage.StorageInterface,
	roleStore conferenceuserrole.StorageInterface,
	confStore conferenceStorage.StorageInterface,
	s2Ctrl *semanticScholarController.Controller,
	jwtSecret string,
	jwtExpiry time.Duration,
) *Orchestrator {
	return &Orchestrator{
		store:               store,
		appBaseURL:          appBaseURL,
		userOrch:            userOrch,
		userStorage:         userStore,
		reviewerStorage:     reviewerStore,
		roleStorage:         roleStore,
		confStorage:         confStore,
		semanticScholarCtrl: s2Ctrl,
		jwtSecret:           jwtSecret,
		jwtExpiry:           jwtExpiry,
	}
}

// SetSemanticScholarCtrl allows late-binding the S2 controller after
// construction (the S2 client is only available in the controller layer).
func (o *Orchestrator) SetSemanticScholarCtrl(ctrl *semanticScholarController.Controller) {
	o.semanticScholarCtrl = ctrl
}

// BatchCreate persists invitations and, for every successful row, attaches
// invitation_url so the chair can copy and forward the link to the invitee.
// The platform itself does not deliver the link — the chair handles that.
func (o *Orchestrator) BatchCreate(
	ctx context.Context,
	conferenceID, invitedBy int64,
	items []dto.ExternalInvitationCreateItem,
) (*dto.ExternalInvitationBatchCreateResponse, error) {
	resp, err := o.store.BatchCreate(ctx, conferenceID, invitedBy, items)
	if err != nil {
		return nil, err
	}

	// For each successful row, look up the token and compose the invitation URL.
	// GetTokenByID is the dedicated read-path so we don't embed the raw token
	// in the public DTO (raw tokens shouldn't leak via List / GET endpoints).
	for i := range resp.Success {
		token, err := o.store.GetTokenByID(ctx, resp.Success[i].ID)
		if err != nil || token == "" {
			continue
		}
		resp.Success[i].InvitationURL = o.buildURL(token)
	}
	return resp, nil
}

// List delegates to storage and decorates each in-flight pending row with its
// invitation_url so the committee table's "Copy invite link" button has a
// value to copy after a page reload.
func (o *Orchestrator) List(
	ctx context.Context,
	conferenceID int64,
	params *externalInvStorage.ListParams,
) (*dto.ExternalInvitationListResponse, error) {
	invitations, total, err := o.store.List(ctx, conferenceID, params)
	if err != nil {
		return nil, err
	}
	for i := range invitations {
		if invitations[i].Status != model.ExternalInvitationStatusPending {
			continue
		}
		token, err := o.store.GetTokenByID(ctx, invitations[i].ID)
		if err != nil || token == "" {
			continue
		}
		invitations[i].InvitationURL = o.buildURL(token)
	}
	return &dto.ExternalInvitationListResponse{
		Invitations: invitations,
		Total:       total,
		Limit:       params.Limit,
		Offset:      params.Offset,
	}, nil
}

func (o *Orchestrator) buildURL(token string) string {
	return fmt.Sprintf("%s/invitation/accept?token=%s", o.appBaseURL, token)
}

// ValidateToken validates an invitation token and returns the prefill data
// needed to render the accept page.
func (o *Orchestrator) ValidateToken(ctx context.Context, token string) (*dto.ExternalInvitationAcceptValidateResponse, error) {
	inv, err := o.store.GetByToken(ctx, token)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "invitation not found")
	}
	if inv.InvitationTokenUsedAt != nil {
		return nil, handler.NewErrorResponse(http.StatusGone, "invitation has already been accepted")
	}
	if inv.InvitationTokenExpiresAt != nil && time.Now().After(*inv.InvitationTokenExpiresAt) {
		return nil, handler.NewErrorResponse(http.StatusGone, "invitation has expired")
	}

	conf, _ := o.confStorage.GetByID(ctx, inv.ConferenceID)
	inviter, _ := o.userStorage.GetByID(ctx, inv.InvitedBy)

	out := &dto.ExternalInvitationAcceptValidateResponse{
		InvitationID: inv.ID,
		Role:         inv.Role,
		Name:         inv.Name,
	}
	if inv.Email != nil {
		out.Email = *inv.Email
	}
	if inv.ScholarID != nil {
		out.ScholarID = *inv.ScholarID
	}
	if inv.Affiliation != nil {
		out.Affiliation = *inv.Affiliation
	}
	if inv.ProfileURL != nil {
		out.ProfileURL = *inv.ProfileURL
	}
	if len(inv.FieldsOfStudy) > 0 {
		out.FieldsOfStudy = []string(inv.FieldsOfStudy)
	}
	if conf != nil {
		out.Conference.ID = conf.ID
		out.Conference.Title = conf.Title
		out.Conference.Acronym = conf.Acronym
	}
	if inviter != nil {
		out.InvitedBy.Name = strings.TrimSpace(inviter.FirstName + " " + inviter.LastName)
		out.InvitedBy.Email = inviter.Email
	}
	return out, nil
}

// AcceptInvitation consumes the token, creates (or finds) the user,
// links their Semantic Scholar profile when known, and adds them to
// the conference committee.
func (o *Orchestrator) AcceptInvitation(ctx context.Context, req *dto.ExternalInvitationAcceptRequest) (*dto.ExternalInvitationAcceptResponse, error) {
	inv, err := o.store.GetByToken(ctx, req.Token)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "invitation not found")
	}
	if inv.InvitationTokenUsedAt != nil {
		return nil, handler.NewErrorResponse(http.StatusGone, "invitation already used")
	}
	if inv.InvitationTokenExpiresAt != nil && time.Now().After(*inv.InvitationTokenExpiresAt) {
		return nil, handler.NewErrorResponse(http.StatusGone, "invitation expired")
	}

	// Handle the case where the email already belongs to an existing user.
	existingUser, existErr := o.userStorage.GetByEmail(ctx, req.Email)
	var userResp *dto.UserResponse
	if existErr == nil && existingUser != nil {
		userResp = existingUser
	} else {
		// Create the user. The invitation link proves email ownership, so we
		// skip the email verification step.
		userReq := &dto.UserCreateRequest{
			User: &dto.User{
				Email:     req.Email,
				FirstName: req.FirstName,
				LastName:  req.LastName,
				Domain:    req.Domain,
			},
			Password: req.Password,
		}
		userResp, err = o.userOrch.RegisterInternal(ctx, userReq, true /* markEmailVerified */)
		if err != nil {
			return nil, err
		}
	}

	// Link Semantic Scholar profile in the background (mirrors LinkAcademicProfile).
	if inv.ScholarID != nil && *inv.ScholarID != "" && o.semanticScholarCtrl != nil {
		scholarID := *inv.ScholarID
		userID := userResp.ID

		// Persist the semantic_scholar_id on the user record so the profile
		// appears linked immediately (sync status = "pending" until done).
		pendingStatus := "pending"
		linkDTO := &dto.User{
			Email:                userResp.Email,
			FirstName:            userResp.FirstName,
			LastName:             userResp.LastName,
			Domain:               userResp.Domain,
			SemanticScholarID:    &scholarID,
			SemanticScholarIDSet: true,
			ProfileSyncStatus:    &pendingStatus,
			ProfileSyncStatusSet: true,
		}
		if updated, updateErr := o.userStorage.Update(ctx, userID, linkDTO); updateErr == nil {
			userResp = updated
		}

		go func() {
			bgCtx := context.Background()
			newStatus := "completed"
			if syncErr := o.semanticScholarCtrl.SyncAuthorProfile(bgCtx, userID, scholarID, ""); syncErr != nil {
				fmt.Printf("[external-invitation] S2 sync failed user=%d scholar=%s err=%v\n",
					userID, scholarID, syncErr)
				newStatus = "failed"
			}
			// Update sync status on user record.
			currentUser, err := o.userStorage.GetByID(bgCtx, userID)
			if err == nil {
				currentUser.User.ProfileSyncStatus = &newStatus
				currentUser.User.ProfileSyncStatusSet = true
				_, _ = o.userStorage.Update(bgCtx, userID, currentUser.User)
			}
		}()
	}

	// Mark invitation accepted FIRST, before adding the user to the
	// conference's regular member list.
	//
	// Reason: the chair's committee table merges external_invitations rows
	// with conference_user_roles / conference_reviewers rows. Marking accepted
	// first prevents a transient duplicate row if the chair refreshes mid-accept.
	// MarkAccepted uses WHERE status='pending' to be idempotent against a
	// concurrent double-submit from two browser tabs.
	if err := o.store.MarkAccepted(ctx, inv.ID, userResp.ID); err != nil {
		return nil, handler.NewErrorResponse(http.StatusGone, "invitation already accepted or not found")
	}

	// Auto-assign role via conference_user_roles + reviewer table.
	switch inv.Role {
	case "pc", "co_chair":
		if err := o.roleStorage.AddRole(ctx, inv.ConferenceID, userResp.Email, inv.Role); err != nil {
			return nil, fmt.Errorf("auto-assign role: %w", err)
		}
	case "reviewer":
		if err := o.roleStorage.AddRole(ctx, inv.ConferenceID, userResp.Email, "reviewer"); err != nil {
			return nil, fmt.Errorf("auto-assign role: %w", err)
		}
		// Also insert into conference_reviewers for reviewer-specific features.
		if _, err := o.reviewerStorage.Create(ctx, inv.ConferenceID, &dto.Reviewer{
			UserID: userResp.ID,
			Status: "accepted",
			Domain: userResp.Domain,
		}); err != nil {
			return nil, fmt.Errorf("auto-assign reviewer: %w", err)
		}
	}

	// Issue JWT for auto-login.
	tok, err := jwt.GenerateToken(userResp.ID, userResp.Email, o.jwtSecret, o.jwtExpiry)
	if err != nil {
		return nil, fmt.Errorf("generate jwt: %w", err)
	}

	return &dto.ExternalInvitationAcceptResponse{
		Token:        tok,
		User:         userResp,
		ConferenceID: inv.ConferenceID,
		Role:         inv.Role,
	}, nil
}
