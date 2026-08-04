package coi

import (
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
)

func TestSubmissionFromDTO_MetadataCoAuthors(t *testing.T) {
	sub := &dto.Submission{
		ID:     42,
		Author: "Primary@Example.com",
		Information: &dto.SubmissionInformation{
			Metadata: map[string]interface{}{
				"authors": []interface{}{
					map[string]interface{}{"email": "Primary@Example.com"},
					map[string]interface{}{"email": "meta-co@example.com"},
				},
			},
		},
	}

	result := SubmissionFromDTO(sub)
	if result.AuthorEmail != "primary@example.com" {
		t.Fatalf("expected normalized primary author, got %q", result.AuthorEmail)
	}
	if len(result.CoAuthors) != 1 || result.CoAuthors[0] != "meta-co@example.com" {
		t.Fatalf("expected metadata co-author in CoAuthors, got %v", result.CoAuthors)
	}
}
