package orchestrator

import (
	"github.com/dcao/conferencespace/internal/clients/brevo"
	"github.com/dcao/conferencespace/internal/config"
	"github.com/dcao/conferencespace/internal/orchestrator/user"
	"github.com/dcao/conferencespace/internal/storage"
)

type Orchestrator struct {
	User *user.Orchestrator
}

func NewOrchestrator(store *storage.Storage, cfg *config.Config) *Orchestrator {
	brevoClient := brevo.New(brevo.Config{
		APIKey:    cfg.Brevo.APIKey,
		FromEmail: cfg.Brevo.FromEmail,
		FromName:  cfg.Brevo.FromName,
	})
	return &Orchestrator{
		User: user.New(store, cfg.JWT.Secret, cfg.JWT.Expiry, brevoClient, cfg.RequireEmailVerification, cfg.AppBaseURL),
	}
}
