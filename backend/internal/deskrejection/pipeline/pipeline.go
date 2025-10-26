package pipeline

import (
	"context"
	"fmt"

	"github.com/dcao/conferencespace/internal/deskrejection/aggregator"
	"github.com/dcao/conferencespace/internal/deskrejection/checkers"
	"github.com/dcao/conferencespace/internal/deskrejection/extractor"
	"github.com/dcao/conferencespace/internal/deskrejection/models"
)

type Stage func(ctx context.Context, input any) (any, error)

var DefaultPipeline = []Stage{
	extractStage,
	checkStage,
	aggregateStage,
}

func Run(ctx context.Context, paperPath string, config *models.PaperRuleConfig) (models.ComplianceReport, error) {
	var input any = paperPath
	var err error
	var doc models.Document

	for _, stage := range DefaultPipeline {
		input, err = stage(ctx, input)
		if err != nil {
			return models.ComplianceReport{}, err
		}
		if d, ok := input.(models.Document); ok {
			doc = d
			ctx = context.WithValue(ctx, "doc", doc)
		}
	}

	if report, ok := input.(models.ComplianceReport); ok {
		return report, nil
	}

	return models.ComplianceReport{}, fmt.Errorf("pipeline did not produce report")
}

func extractStage(ctx context.Context, input any) (any, error) {
	path := input.(string)
	config := ctx.Value("config").(*models.PaperRuleConfig)
	return extractor.Extract(path, *config)
}

func checkStage(ctx context.Context, input any) (any, error) {
	doc := input.(models.Document)
	config := ctx.Value("config").(*models.PaperRuleConfig)
	checkers.RegisterCustom(*config)
	return checkers.ExecuteAll(ctx, doc, *config), nil
}

func aggregateStage(ctx context.Context, input any) (any, error) {
	results := input.([]models.CheckResult)
	doc := ctx.Value("doc").(models.Document)
	config := ctx.Value("config").(*models.PaperRuleConfig)
	return aggregator.Generate(results, doc, *config), nil
}

