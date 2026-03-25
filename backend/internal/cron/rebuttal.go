package cron

import (
	"context"
	"log"
	"time"

	conferenceStorage "github.com/dcao/conferencespace/internal/storage/conference"
)

// StartRebuttalAutoFinalize starts a goroutine that checks every hour for conferences
// whose rebuttal deadline has passed and auto-finalizes them.
// Call this from main.go after server setup.
func StartRebuttalAutoFinalize(confStorage conferenceStorage.StorageInterface) {
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			ctx := context.Background()
			ids, err := confStorage.GetOverdueRebuttalConferences(ctx)
			if err != nil {
				log.Printf("[cron:rebuttal] failed to query overdue conferences: %v", err)
				continue
			}
			for _, id := range ids {
				if err := confStorage.FinalizeRebuttal(ctx, id); err != nil {
					log.Printf("[cron:rebuttal] failed to auto-finalize conference %d: %v", id, err)
				} else {
					log.Printf("[cron:rebuttal] auto-finalized rebuttal for conference %d", id)
				}
			}
		}
	}()
}
