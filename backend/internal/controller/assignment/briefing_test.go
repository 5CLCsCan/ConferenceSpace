package assignment

import (
	"testing"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
)

func TestComputeReviewerBriefingFingerprint_IgnoresAuthorButTracksVisibleSubmissionState(t *testing.T) {
	now := time.Date(2026, 3, 30, 12, 0, 0, 0, time.UTC)
	submission := &dto.Submission{
		ID:        7,
		Author:    "author-one@example.com",
		Title:     "  Reliable   Systems  ",
		Abstract:  "  A  structured   reviewer pre-read workflow. ",
		Track:     " main ",
		UpdatedAt: now,
		Information: &dto.SubmissionInformation{
			Keywords: []string{"Review", "review", " workflow ", "workflow"},
		},
		File: &dto.SubmissionFileMetadata{
			OriginalName: "submission.pdf",
			Size:         4096,
			MimeType:     "application/pdf",
		},
	}

	left := computeReviewerBriefingFingerprint(submission)
	submission.Author = "author-two@example.com"
	right := computeReviewerBriefingFingerprint(submission)

	if left != right {
		t.Fatalf("expected fingerprint to ignore author identity in reviewer-visible state")
	}

	submission.File.Size = 8192
	changed := computeReviewerBriefingFingerprint(submission)
	if left == changed {
		t.Fatalf("expected fingerprint to change when manuscript file metadata changes")
	}
}

func TestBuildReviewerBriefingSubmissionPayload_NormalizesKeywordsAndOmitsAuthor(t *testing.T) {
	submission := &dto.Submission{
		ID:       7,
		Author:   "author@example.com",
		Title:    "Reliable Systems",
		Abstract: "A structured reviewer pre-read workflow.",
		Track:    "main",
		Information: &dto.SubmissionInformation{
			Keywords: []string{"Review", "review", " workflow ", "workflow"},
		},
		File: &dto.SubmissionFileMetadata{
			OriginalName: "submission.pdf",
			Size:         4096,
			MimeType:     "application/pdf",
		},
	}

	payload := buildReviewerBriefingSubmissionPayload(submission)

	if payload.Title != "Reliable Systems" {
		t.Fatalf("expected title to be preserved, got %q", payload.Title)
	}
	if len(payload.Keywords) != 2 {
		t.Fatalf("expected deduplicated keywords, got %#v", payload.Keywords)
	}
	if payload.Track != "main" {
		t.Fatalf("expected normalized track, got %q", payload.Track)
	}
}
