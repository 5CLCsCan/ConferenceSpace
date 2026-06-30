package conference

import (
	"testing"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
)

func TestCloseSubmissionDeadlinesAtSnapsFutureDeadline(t *testing.T) {
	future := time.Now().Add(72 * time.Hour)
	cfg := &dto.ConferenceConfiguration{
		FullPaperSubmissionDeadline: &future,
	}
	closedAt := time.Date(2026, 6, 2, 12, 0, 0, 0, time.UTC)

	updated := closeSubmissionDeadlinesAt(cfg, closedAt)

	if updated.FullPaperSubmissionDeadline == nil {
		t.Fatal("expected full paper deadline to be set")
	}
	if !updated.FullPaperSubmissionDeadline.Equal(closedAt) {
		t.Fatalf("expected %s, got %s", closedAt, updated.FullPaperSubmissionDeadline)
	}
}
