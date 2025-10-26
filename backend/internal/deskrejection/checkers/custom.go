package checkers

import (
	"fmt"
	"strings"

	"github.com/dcao/conferencespace/internal/deskrejection/models"
)

func RegisterCustom(config models.PaperRuleConfig) {
	if config.CustomRules.MinDatasets > 0 {
		Register("experiments", "custom.min_datasets", &baseChecker{
			id:          "custom.min_datasets",
			category:    "experiments",
			description: fmt.Sprintf("At least %d datasets used", config.CustomRules.MinDatasets),
			checkFn: func(doc models.Document, conf models.PaperRuleConfig) (string, string, float64) {
				expText := doc.Sections["experiments"]
				count := strings.Count(strings.ToLower(expText), "dataset")
				status := "pass"
				if count < config.CustomRules.MinDatasets {
					status = "fail"
				}
				details := fmt.Sprintf("Found %d dataset mentions", count)
				return status, details, 0.8
			},
		})
	}

	if len(config.CustomRules.BannedPhrases) > 0 {
		Register("writing_quality", "custom.banned_phrases", &baseChecker{
			id:          "custom.banned_phrases",
			category:    "writing_quality",
			description: "No banned phrases",
			checkFn: func(doc models.Document, conf models.PaperRuleConfig) (string, string, float64) {
				found := []string{}
				for _, phrase := range config.CustomRules.BannedPhrases {
					if strings.Contains(doc.FullText, phrase) {
						found = append(found, phrase)
					}
				}
				status := "pass"
				if len(found) > 0 {
					status = "fail"
				}
				details := fmt.Sprintf("Banned phrases found: %v", found)
				return status, details, 1.0
			},
		})
	}
}

