package pipeline

import (
	"context"
	"fmt"

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

	// Register custom checkers
	checkers.RegisterCustom(*config)
	
	// Run manual checkers and LLM evaluation concurrently
	resultsChan := make(chan []models.CheckResult, 2)
	errChan := make(chan error, 2)
	
	// Run built-in and custom checkers (manual checks: page count, word count, etc.)
	go func() {
		manualResults := checkers.ExecuteAll(ctx, doc, *config)
		resultsChan <- manualResults
	}()
	
	// Run LLM content evaluation concurrently (single call for content-relevant checks)
	go func() {
		if geminiClientVal := ctx.Value("gemini_client"); geminiClientVal != nil {
			llmEvaluator := evaluator.NewLLMEvaluator(geminiClientVal)
			contentResults, err := llmEvaluator.EvaluateContent(ctx, doc, *config)
			if err != nil {
				// LLM failure doesn't block - return empty results
				resultsChan <- []models.CheckResult{}
			} else if contentResults != nil {
				resultsChan <- contentResults
			} else {
				resultsChan <- []models.CheckResult{}
			}
		} else {
			resultsChan <- []models.CheckResult{}
		}
	}()
	
	// Collect results from both goroutines
	var allResults []models.CheckResult
	for i := 0; i < 2; i++ {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case results := <-resultsChan:
			allResults = append(allResults, results...)
		case err := <-errChan:
			if err != nil {
				// Log error but continue with available results
			}
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

