package pipeline

import (
	"context"
	"fmt"
	"log"

	"github.com/dcao/conferencespace/internal/deskrejection/aggregator"
	"github.com/dcao/conferencespace/internal/deskrejection/checkers"
	"github.com/dcao/conferencespace/internal/deskrejection/evaluator"
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
	// Add config to context so stages can access it
	ctx = context.WithValue(ctx, "config", config)

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
	// Safe type assertion for path
	path, ok := input.(string)
	if !ok {
		return nil, fmt.Errorf("extractStage: expected string input, got %T", input)
	}

	// Safe type assertion for config
	configVal := ctx.Value("config")
	if configVal == nil {
		return nil, fmt.Errorf("extractStage: config not found in context")
	}
	config, ok := configVal.(*models.PaperRuleConfig)
	if !ok {
		return nil, fmt.Errorf("extractStage: config has wrong type")
	}

	return extractor.Extract(path, *config)
}

func checkStage(ctx context.Context, input any) (any, error) {
	// Safe type assertion for document
	doc, ok := input.(models.Document)
	if !ok {
		return nil, fmt.Errorf("checkStage: expected Document input, got %T", input)
	}

	// Safe type assertion for config
	configVal := ctx.Value("config")
	if configVal == nil {
		return nil, fmt.Errorf("checkStage: config not found in context")
	}
	config, ok := configVal.(*models.PaperRuleConfig)
	if !ok {
		return nil, fmt.Errorf("checkStage: config has wrong type")
	}

	customCheckers := checkers.BuildCustom(*config)
	allResults := checkers.ExecuteAllWithCustom(ctx, doc, *config, customCheckers)

	if geminiClientVal := ctx.Value("gemini_client"); geminiClientVal != nil {
		llmEvaluator := evaluator.NewLLMEvaluator(geminiClientVal)
		contentResults, err := llmEvaluator.EvaluateContent(ctx, doc, *config)
		if err != nil {
			log.Printf("[deskrejection] optional llm evaluation skipped: %v", err)
		} else if len(contentResults) > 0 {
			allResults = append(allResults, contentResults...)
		}
	}

	return allResults, nil
}

func aggregateStage(ctx context.Context, input any) (any, error) {
	// Safe type assertion for results
	results, ok := input.([]models.CheckResult)
	if !ok {
		return nil, fmt.Errorf("aggregateStage: expected []CheckResult input, got %T", input)
	}

	// Safe type assertion for document
	docVal := ctx.Value("doc")
	if docVal == nil {
		return nil, fmt.Errorf("aggregateStage: doc not found in context")
	}
	doc, ok := docVal.(models.Document)
	if !ok {
		return nil, fmt.Errorf("aggregateStage: doc has wrong type")
	}

	// Safe type assertion for config
	configVal := ctx.Value("config")
	if configVal == nil {
		return nil, fmt.Errorf("aggregateStage: config not found in context")
	}
	config, ok := configVal.(*models.PaperRuleConfig)
	if !ok {
		return nil, fmt.Errorf("aggregateStage: config has wrong type")
	}

	return aggregator.Generate(results, doc, *config), nil
}
