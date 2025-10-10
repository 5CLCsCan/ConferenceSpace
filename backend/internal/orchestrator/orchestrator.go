package orchestrator

import (
	"github.com/dcao/conferencespace/internal/orchestrator/user"
	"github.com/dcao/conferencespace/internal/storage"
)

type Orchestrator struct {
	User *user.Orchestrator
}

func NewOrchestrator(store *storage.Storage, jwtSecret string, jwtExpiryHours int) *Orchestrator {
	return &Orchestrator{
		User: user.New(store, jwtSecret, jwtExpiryHours),
	}
}
