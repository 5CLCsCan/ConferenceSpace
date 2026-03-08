package aggregator

import (
	"strings"

	"github.com/dcao/conferencespace/internal/deskrejection/models"
)

func Generate(results []models.CheckResult, doc models.Document, config models.PaperRuleConfig) models.ComplianceReport {
	var report models.ComplianceReport
	report.PaperTitle = extractTitle(doc.FullText)

	categoryScores := make(map[string]models.CategoryScore)
	rawCategoryPoints := make(map[string]float64)
	rawCategoryChecks := make(map[string]int)
	passed, failed := 0, 0

	for _, res := range results {
		report.DetailedResults = append(report.DetailedResults, res)
		catScore := categoryScores[res.Category]
		catScore.Weight = config.Weights[res.Category]

		scoreDelta := 0.0
		if res.Status == "pass" {
			passed++
			catScore.Passed++
			scoreDelta = 100
		} else {
			if res.Status == "fail" {
				failed++
				catScore.Failed++
				scoreDelta = 0
			} else {
				scoreDelta = 60
			}
		}

		rawCategoryPoints[res.Category] += scoreDelta
		rawCategoryChecks[res.Category]++
		categoryScores[res.Category] = catScore
	}

	totalItems := len(results)
	passRate := 0.0
	if totalItems > 0 {
		passRate = float64(passed) / float64(totalItems)
	}
	report.Summary = models.Summary{
		TotalItems: totalItems,
		Passed:     passed,
		Failed:     failed,
		PassRate:   passRate,
	}

	normalizeCategoryWeights(categoryScores, config.Weights)

	totalWeight := 0.0
	for _, score := range categoryScores {
		totalWeight += score.Weight
	}

	var overall float64
	for category, score := range categoryScores {
		checkCount := rawCategoryChecks[category]
		if checkCount > 0 {
			score.Score = rawCategoryPoints[category] / float64(checkCount)
		}
		categoryScores[category] = score

		if totalWeight > 0 {
			overall += score.Score * score.Weight
		}
	}

	if totalWeight == 0 && len(categoryScores) > 0 {
		total := 0.0
		for category := range categoryScores {
			total += rawCategoryPoints[category] / float64(rawCategoryChecks[category])
		}
		overall = total / float64(len(categoryScores))
	}

	report.OverallScore = overall
	report.CategoryScores = categoryScores

	acceptThreshold := normalizeThreshold(config.Thresholds.AcceptScore)
	deskRejectThreshold := normalizeThreshold(config.Thresholds.DeskRejectScore)

	if totalItems == 0 {
		report.Decision = "manual_review"
		return report
	}

	if overall >= acceptThreshold {
		report.Decision = "accept_for_review"
	} else if overall < deskRejectThreshold {
		report.Decision = "desk_reject"
	} else {
		report.Decision = "manual_review"
	}

	return report
}

func extractTitle(fullText string) string {
	for _, line := range strings.Split(fullText, "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed != "" {
			return trimmed
		}
	}
	return "Untitled"
}

func normalizeThreshold(value float64) float64 {
	if value <= 1 {
		return value * 100
	}
	return value
}

func normalizeCategoryWeights(scores map[string]models.CategoryScore, configured map[string]float64) {
	if len(scores) == 0 {
		return
	}

	total := 0.0
	for category := range scores {
		weight := configured[category]
		if weight > 0 {
			total += weight
			score := scores[category]
			score.Weight = weight
			scores[category] = score
		}
	}

	if total == 0 {
		equalWeight := 1.0 / float64(len(scores))
		for category := range scores {
			score := scores[category]
			score.Weight = equalWeight
			scores[category] = score
		}
		return
	}

	for category := range scores {
		score := scores[category]
		score.Weight = score.Weight / total
		scores[category] = score
	}
}
