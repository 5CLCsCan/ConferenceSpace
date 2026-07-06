package quality

import (
	"reflect"
	"testing"
)

func TestExtractTopics(t *testing.T) {
	got := ExtractTopics("Graph Neural Networks for Recommendation", []string{"Computer Science"})
	want := []string{
		"computer science",
		"graph",
		"graph neural",
		"networks",
		"neural",
		"neural networks",
		"recommendation",
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("ExtractTopics mismatch\n got: %#v\nwant: %#v", got, want)
	}
}

func TestExtractTopicsDropsStopwordsAndShortTokens(t *testing.T) {
	got := ExtractTopics("A Study of AI", nil)
	// "a", "of" are stopwords; "study" is a stopword; "ai" is < 5 chars (no unigram)
	// and every adjacent pair contains a stopword, so no bigrams -> empty.
	if len(got) != 0 {
		t.Fatalf("expected no topics, got %#v", got)
	}
}
