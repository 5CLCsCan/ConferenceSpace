package config

import (
	"encoding/json"
	"fmt"

	"github.com/dcao/conferencespace/internal/deskrejection/models"
)


type Manager struct {
	baseConfig *models.PaperRuleConfig
}


func NewManager() *Manager {
	return &Manager{
		baseConfig: models.NewPaperRuleConfig(),
	}
}


func (m *Manager) SetDefaults(defaults *models.PaperRuleConfig) {
	m.baseConfig = defaults
}


func (m *Manager) GetConfig() *models.PaperRuleConfig {
	return m.baseConfig
}


func (m *Manager) ApplyCustomSettings(settings *models.PaperSettings) {
	if settings == nil {
		return
	}

	// Update fields if provided
	if settings.MaxPages != nil {
		m.baseConfig.MaxPages = *settings.MaxPages
	}

	if settings.MinReferences != nil {
		m.baseConfig.MinReferences = *settings.MinReferences
	}

	if len(settings.RequiredSections) > 0 {
		m.baseConfig.RequiredSections = settings.RequiredSections
	}

	if settings.Thresholds != nil {
		m.baseConfig.Thresholds = *settings.Thresholds
	}

	if len(settings.Weights) > 0 {
		m.baseConfig.Weights = settings.Weights
	}

	if settings.CustomRules != nil {
		m.baseConfig.CustomRules = *settings.CustomRules
	}

	if settings.TitleMaxWords != nil {
		m.baseConfig.TitleMaxWords = *settings.TitleMaxWords
	}

	if settings.MaxSentenceWords != nil {
		m.baseConfig.MaxSentenceWords = *settings.MaxSentenceWords
	}
}


func (m *Manager) Set(field string, value interface{}) error {
	switch field {
	case "max_pages":
		if v, ok := value.(int); ok {
			m.baseConfig.MaxPages = v
		} else {
			return fmt.Errorf("max_pages must be int")
		}
	case "min_references":
		if v, ok := value.(int); ok {
			m.baseConfig.MinReferences = v
		} else {
			return fmt.Errorf("min_references must be int")
		}
	case "title_max_words":
		if v, ok := value.(int); ok {
			m.baseConfig.TitleMaxWords = v
		} else {
			return fmt.Errorf("title_max_words must be int")
		}
	case "max_sentence_words":
		if v, ok := value.(int); ok {
			m.baseConfig.MaxSentenceWords = v
		} else {
			return fmt.Errorf("max_sentence_words must be int")
		}
	case "required_sections":
		if v, ok := value.([]string); ok {
			m.baseConfig.RequiredSections = v
		} else {
			return fmt.Errorf("required_sections must be []string")
		}
	case "thresholds":
		if v, ok := value.(models.Thresholds); ok {
			m.baseConfig.Thresholds = v
		} else {
			return fmt.Errorf("thresholds must be Thresholds struct")
		}
	case "weights":
		if v, ok := value.(map[string]float64); ok {
			m.baseConfig.Weights = v
		} else {
			return fmt.Errorf("weights must be map[string]float64")
		}
	case "custom_rules":
		if v, ok := value.(models.CustomRules); ok {
			m.baseConfig.CustomRules = v
		} else {
			return fmt.Errorf("custom_rules must be CustomRules struct")
		}
	default:
		return fmt.Errorf("unknown field: %s", field)
	}
	return nil
}


func (m *Manager) Get(field string) (interface{}, error) {
	switch field {
	case "max_pages":
		return m.baseConfig.MaxPages, nil
	case "min_references":
		return m.baseConfig.MinReferences, nil
	case "title_max_words":
		return m.baseConfig.TitleMaxWords, nil
	case "max_sentence_words":
		return m.baseConfig.MaxSentenceWords, nil
	case "required_sections":
		return m.baseConfig.RequiredSections, nil
	case "thresholds":
		return m.baseConfig.Thresholds, nil
	case "weights":
		return m.baseConfig.Weights, nil
	case "custom_rules":
		return m.baseConfig.CustomRules, nil
	default:
		return nil, fmt.Errorf("unknown field: %s", field)
	}
}


func (m *Manager) ApplyJSON(jsonData []byte) error {
	var settings map[string]interface{}
	if err := json.Unmarshal(jsonData, &settings); err != nil {
		return err
	}

	for field, value := range settings {
		if err := m.Set(field, value); err != nil {
			return fmt.Errorf("error setting %s: %w", field, err)
		}
	}
	return nil
}


func Merge(settings *models.PaperSettings, maxPages int) *models.PaperRuleConfig {
	manager := NewManager()
	manager.baseConfig.MaxPages = maxPages
	manager.ApplyCustomSettings(settings)
	return manager.GetConfig()
}

