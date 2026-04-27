package research_domain

import (
	"context"
	"errors"
	"testing"
)

type fakeGenerator struct {
	response keywordResponse
	err      error
}

func (f fakeGenerator) GenerateJSON(_ context.Context, _ string, _ map[string]any, out any) error {
	if f.err != nil {
		return f.err
	}
	target, ok := out.(*keywordResponse)
	if !ok {
		return errors.New("unexpected output type")
	}
	*target = f.response
	return nil
}

func TestExtractFromPapersNormalizesKeywords(t *testing.T) {
	service := New(fakeGenerator{
		response: keywordResponse{
			Keywords: []string{
				" Machine Learning ",
				"machine learning",
				"Natural Language Processing",
				"",
				"Computer Vision.",
			},
		},
	})

	keywords, err := service.ExtractFromPapers(context.Background(), []SourcePaper{
		{Title: "Paper A", Abstract: "A useful abstract."},
	})
	if err != nil {
		t.Fatalf("ExtractFromPapers() error = %v", err)
	}

	want := []string{"Computer Vision", "Machine Learning", "Natural Language Processing"}
	if len(keywords) != len(want) {
		t.Fatalf("len(keywords) = %d, want %d (%v)", len(keywords), len(want), keywords)
	}
	for i := range want {
		if keywords[i] != want[i] {
			t.Fatalf("keywords[%d] = %q, want %q", i, keywords[i], want[i])
		}
	}
}

func TestExtractFromPapersSkipsWhenNoAbstracts(t *testing.T) {
	service := New(fakeGenerator{
		response: keywordResponse{Keywords: []string{"Machine Learning"}},
	})

	keywords, err := service.ExtractFromPapers(context.Background(), []SourcePaper{
		{Title: "Paper A"},
		{Title: "Paper B", Abstract: "   "},
	})
	if err != nil {
		t.Fatalf("ExtractFromPapers() error = %v", err)
	}
	if keywords != nil {
		t.Fatalf("keywords = %v, want nil", keywords)
	}
}
