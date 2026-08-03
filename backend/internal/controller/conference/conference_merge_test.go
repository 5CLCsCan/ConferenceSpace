package conference

import (
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
)

func TestMergeConferenceForUpdatePreservesExistingFields(t *testing.T) {
	existing := &dto.ConferenceResponse{
		Title:       "My Conference",
		Acronym:     "MC2025",
		Description: "Keep this",
		Chair:       "chair@example.com",
		CoChairs:    []string{"co@example.com"},
		Domain:      []string{"AI"},
		Tracks:      []string{"Main"},
		Venue:       "Hanoi",
	}

	update := &dto.Conference{
		PCMembers: []string{"pc@example.com"},
	}

	mergeConferenceForUpdate(existing, update)

	if update.Title != existing.Title {
		t.Fatalf("title = %q, want %q", update.Title, existing.Title)
	}
	if update.Acronym != existing.Acronym {
		t.Fatalf("acronym = %q, want %q", update.Acronym, existing.Acronym)
	}
	if update.Description != existing.Description {
		t.Fatalf("description = %q, want %q", update.Description, existing.Description)
	}
	if update.Chair != existing.Chair {
		t.Fatalf("chair = %q, want %q", update.Chair, existing.Chair)
	}
	if update.Venue != existing.Venue {
		t.Fatalf("venue = %q, want %q", update.Venue, existing.Venue)
	}
	if len(update.CoChairs) != 1 || update.CoChairs[0] != "co@example.com" {
		t.Fatalf("co_chairs = %v, want [co@example.com]", update.CoChairs)
	}
	if len(update.Domain) != 1 || update.Domain[0] != "AI" {
		t.Fatalf("domain = %v, want [AI]", update.Domain)
	}
	if len(update.Tracks) != 1 || update.Tracks[0] != "Main" {
		t.Fatalf("tracks = %v, want [Main]", update.Tracks)
	}
}

func TestMergeConferenceForUpdateAllowsExplicitCoChairChange(t *testing.T) {
	existing := &dto.ConferenceResponse{
		Title:    "My Conference",
		Acronym:  "MC2025",
		CoChairs: []string{"old@example.com"},
	}

	update := &dto.Conference{
		CoChairs: []string{"new@example.com"},
	}

	mergeConferenceForUpdate(existing, update)

	if len(update.CoChairs) != 1 || update.CoChairs[0] != "new@example.com" {
		t.Fatalf("co_chairs = %v, want [new@example.com]", update.CoChairs)
	}
}
