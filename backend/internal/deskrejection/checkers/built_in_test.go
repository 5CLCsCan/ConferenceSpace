package checkers

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/dcao/conferencespace/internal/deskrejection/models"
)

func TestBuiltInCheckers_WithRuleDrivenFixtures(t *testing.T) {
	t.Run("scope_match_passes_for_relevant_content", func(t *testing.T) {
		text := mustReadFixture(t, "scope_pass.txt")
		config := models.NewPaperRuleConfig()
		config.ConferenceDomains = []string{"machine learning", "neural network"}

		results := ExecuteAll(context.Background(), models.Document{
			FullText: text,
			Stats:    models.DocumentStats{PageCount: 6},
		}, *config)

		assertStatus(t, results, "0.1", "pass")
	})

	t.Run("scope_match_fails_for_out_of_scope_content", func(t *testing.T) {
		text := mustReadFixture(t, "scope_fail.txt")
		config := models.NewPaperRuleConfig()
		config.ConferenceDomains = []string{"machine learning", "neural network"}

		results := ExecuteAll(context.Background(), models.Document{
			FullText: text,
			Stats:    models.DocumentStats{PageCount: 6},
		}, *config)

		assertStatus(t, results, "0.1", "fail")
	})

	t.Run("title_limit_and_sentence_limit_respect_config", func(t *testing.T) {
		titleText := mustReadFixture(t, "long_title.txt")
		sentenceText := mustReadFixture(t, "long_sentence.txt")
		config := models.NewPaperRuleConfig()
		config.TitleMaxWords = 8
		config.MaxSentenceWords = 12

		titleResults := ExecuteAll(context.Background(), models.Document{
			FullText: titleText,
			Stats:    models.DocumentStats{PageCount: 6},
		}, *config)
		assertStatus(t, titleResults, "1.1", "fail")

		sentenceResults := ExecuteAll(context.Background(), models.Document{
			FullText: sentenceText,
			Stats:    models.DocumentStats{PageCount: 6},
		}, *config)
		assertStatus(t, sentenceResults, "6.2", "warning")
	})

	t.Run("page_limit_is_deterministic", func(t *testing.T) {
		config := models.NewPaperRuleConfig()
		config.MaxPages = 8

		results := ExecuteAll(context.Background(), models.Document{
			FullText: "Reliable Title\n\nAbstract\nA short abstract.",
			Stats:    models.DocumentStats{PageCount: 12},
		}, *config)

		assertStatus(t, results, "11.4", "fail")
	})
}

func assertStatus(t *testing.T, results []models.CheckResult, itemID, want string) {
	t.Helper()
	for _, result := range results {
		if result.ItemID == itemID {
			if result.Status != want {
				t.Fatalf("checker %s status = %s, want %s (details: %s)", itemID, result.Status, want, result.Details)
			}
			return
		}
	}
	t.Fatalf("checker %s not found in result set", itemID)
}

func mustReadFixture(t *testing.T, name string) string {
	t.Helper()
	path := filepath.Join("testdata", name)
	content, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("failed to read fixture %s: %v", name, err)
	}
	return string(content)
}
