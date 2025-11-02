package aggregator

import (
	"github.com/dcao/conferencespace/internal/deskrejection/models"
)

func Generate(results []models.CheckResult, doc models.Document, config models.PaperRuleConfig) models.ComplianceReport {
	var report models.ComplianceReport
	report.PaperTitle = "Extracted Title"

	categoryScores := make(map[string]models.CategoryScore)
	passed, failed := 0, 0

	for _, res := range results {
		report.DetailedResults = append(report.DetailedResults, res)
		catScore := categoryScores[res.Category]
		catScore.Weight = config.Weights[res.Category]
		if res.Status == "pass" {
			passed++
			catScore.Passed++
			catScore.Score += 100
		} else {
			failed++
			catScore.Failed++
		}
		numChecks := catScore.Passed + catScore.Failed
		if numChecks > 0 {
			catScore.Score /= float64(numChecks)
		}
		categoryScores[res.Category] = catScore
	}

	totalItems := passed + failed
	report.Summary = models.Summary{
		TotalItems: totalItems,
		Passed:     passed,
		Failed:     failed,
		PassRate:   float64(passed) / float64(totalItems),
	}

	var overall float64
	for _, score := range categoryScores {
		overall += score.Score * score.Weight
	}
	report.OverallScore = overall
	report.CategoryScores = categoryScores

	if overall >= config.Thresholds.AcceptScore {
		report.Decision = "accept_for_review"
	} else if overall < config.Thresholds.DeskRejectScore {
		report.Decision = "desk_reject"
	} else {
		report.Decision = "manual_review"
	}

	return report
}

