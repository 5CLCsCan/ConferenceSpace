package checkers

import (
	"context"
	"sync"

	"github.com/dcao/conferencespace/internal/deskrejection/models"
)

type Checker interface {
	ID() string
	Category() string
	Description() string
	Check(ctx context.Context, doc models.Document, config models.PaperRuleConfig) models.CheckResult
}

var (
	mu       sync.RWMutex
	registry = make(map[string]map[string]Checker)
)

func Register(category, id string, checker Checker) {
	mu.Lock()
	defer mu.Unlock()
	if _, ok := registry[category]; !ok {
		registry[category] = make(map[string]Checker)
	}
	registry[category][id] = checker
}

func GetAll() map[string][]Checker {
	mu.RLock()
	defer mu.RUnlock()
	cats := make(map[string][]Checker)
	for cat, m := range registry {
		cats[cat] = make([]Checker, 0, len(m))
		for _, c := range m {
			cats[cat] = append(cats[cat], c)
		}
	}
	return cats
}

func ExecuteAll(ctx context.Context, doc models.Document, config models.PaperRuleConfig) []models.CheckResult {
	checkersByCat := GetAll()
	resultsChan := make(chan models.CheckResult, 100)
	var wg sync.WaitGroup

	for _, checkers := range checkersByCat {
		for _, checker := range checkers {
			wg.Add(1)
			go func(ch Checker) {
				defer wg.Done()
				select {
				case <-ctx.Done():
					return
				default:
					resultsChan <- ch.Check(ctx, doc, config)
				}
			}(checker)
		}
	}

	go func() {
		wg.Wait()
		close(resultsChan)
	}()

	results := make([]models.CheckResult, 0)
	for res := range resultsChan {
		results = append(results, res)
	}
	return results
}

