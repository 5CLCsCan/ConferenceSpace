package checkers

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"github.com/dcao/conferencespace/internal/deskrejection/models"
)

type baseChecker struct {
	id          string
	category    string
	description string
	checkFn     func(models.Document, models.PaperRuleConfig) (string, string, float64)
}

func (b *baseChecker) ID() string          { return b.id }
func (b *baseChecker) Category() string    { return b.category }
func (b *baseChecker) Description() string { return b.description }
func (b *baseChecker) Check(ctx context.Context, doc models.Document, config models.PaperRuleConfig) models.CheckResult {
	status, details, conf := b.checkFn(doc, config)
	return models.CheckResult{
		ItemID:     b.id,
		Category:   b.category,
		Description: b.description,
		Status:     status,
		Details:    details,
		Confidence: conf,
	}
}

func init() {
	Register("title_abstract", "1.1", &baseChecker{
		id:          "1.1",
		category:    "title_abstract",
		description: "Title ≤ 15 words",
		checkFn: func(doc models.Document, config models.PaperRuleConfig) (string, string, float64) {
			lines := strings.SplitN(doc.FullText, "\n", 2)
			title := strings.TrimSpace(lines[0])
			words := len(strings.Fields(title))
			maxWords := config.TitleMaxWords
			if maxWords == 0 {
				maxWords = 15 // Fallback to default
			}
			status := "pass"
			details := fmt.Sprintf("Title has %d words (max %d)", words, maxWords)
			if words > maxWords {
				status = "fail"
			}
			return status, details, 1.0
		},
	})

	Register("pre_submission", "11.4", &baseChecker{
		id:          "11.4",
		category:    "pre_submission",
		description: "Complies with page limit",
		checkFn: func(doc models.Document, config models.PaperRuleConfig) (string, string, float64) {
			status := "pass"
			if doc.Stats.PageCount > config.MaxPages {
				status = "fail"
			}
			details := fmt.Sprintf("Pages: %d (max %d)", doc.Stats.PageCount, config.MaxPages)
			return status, details, 1.0
		},
	})

	Register("writing_quality", "6.2", &baseChecker{
		id:          "6.2",
		category:    "writing_quality",
		description: "No sentence >25 words",
		checkFn: func(doc models.Document, config models.PaperRuleConfig) (string, string, float64) {
			sentences := regexp.MustCompile(`[.!?]`).Split(doc.FullText, -1)
			maxLen := 0
			for _, s := range sentences {
				lenS := len(strings.Fields(s))
				if lenS > maxLen {
					maxLen = lenS
				}
			}
			maxWords := config.MaxSentenceWords
			if maxWords == 0 {
				maxWords = 25 // Fallback to default
			}
			status := "pass"
			if maxLen > maxWords {
				status = "warning"
			}
			details := fmt.Sprintf("Max sentence: %d words (max %d)", maxLen, maxWords)
			return status, details, 0.9
		},
	})

	// Add scope matching checker (for conference scope validation)
	Register("scope_match", "0.1", &baseChecker{
		id:          "0.1",
		category:    "scope_match",
		description: "Paper scope matches conference scope",
		checkFn: func(doc models.Document, config models.PaperRuleConfig) (string, string, float64) {
			// This would be checked when we have conference domains available
			// For now, always pass (can be enhanced with domain comparison)
			status := "pass"
			details := "Scope check not implemented yet"
			return status, details, 0.5
		},
	})
}

