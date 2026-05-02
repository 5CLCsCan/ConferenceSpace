package orchestrator

import (
	"time"

	"github.com/dcao/conferencespace/internal/clients/brevo"
	"github.com/dcao/conferencespace/internal/config"
	extInvOrchestrator "github.com/dcao/conferencespace/internal/orchestrator/external_invitation"
	"github.com/dcao/conferencespace/internal/orchestrator/user"
	"github.com/dcao/conferencespace/internal/storage"
)

type Orchestrator struct {
	User               *user.Orchestrator
	ExternalInvitation *extInvOrchestrator.Orchestrator
}

func NewOrchestrator(store *storage.Storage, cfg *config.Config) *Orchestrator {
	brevoClient := brevo.New(brevo.Config{
		APIKey:    cfg.Brevo.APIKey,
		FromEmail: cfg.Brevo.FromEmail,
		FromName:  cfg.Brevo.FromName,
	})
	userOrch := user.New(store, cfg.JWT.Secret, cfg.JWT.Expiry, brevoClient, cfg.RequireEmailVerification, cfg.AppBaseURL)
	return &Orchestrator{
		User: userOrch,
		ExternalInvitation: extInvOrchestrator.New(
			store.ExternalInvitation,
			cfg.AppBaseURL,
			userOrch,
			store.User,
			store.Reviewer,
			store.ConferenceUserRole,
			store.Conference,
			nil, // semanticScholarCtrl wired in controller layer where the S2 client is available
			cfg.JWT.Secret,
			time.Duration(cfg.JWT.Expiry)*time.Hour,
		),
	}
}
