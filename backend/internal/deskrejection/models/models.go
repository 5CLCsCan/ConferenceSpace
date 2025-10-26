package models

type PaperRuleConfig struct {
	MaxPages         int                `json:"max_pages"`
	MinReferences    int                `json:"min_references"`
	RequiredSections []string           `json:"required_sections"`
	FormattingRules  FormattingRules    `json:"formatting_rules"`
	Thresholds       Thresholds         `json:"thresholds"`
	Weights          map[string]float64 `json:"weights"`
	CustomRules      CustomRules        `json:"custom_rules,omitempty"`
	TitleMaxWords    int                `json:"title_max_words"`
	MaxSentenceWords int                `json:"max_sentence_words"`
}

// PaperSettings stores only custom validation settings
// Everything else uses defaults
type PaperSettings struct {
	MaxPages          *int                `json:"max_pages,omitempty"`
	MinReferences     *int                `json:"min_references,omitempty"`
	RequiredSections  []string            `json:"required_sections,omitempty"`
	Thresholds        *Thresholds         `json:"thresholds,omitempty"`
	Weights           map[string]float64  `json:"weights,omitempty"`
	CustomRules       *CustomRules        `json:"custom_rules,omitempty"`
	TitleMaxWords     *int                `json:"title_max_words,omitempty"`
	MaxSentenceWords  *int                `json:"max_sentence_words,omitempty"`
}

// NewPaperRuleConfig creates a default paper rule configuration
func NewPaperRuleConfig() *PaperRuleConfig {
	return &PaperRuleConfig{
		MaxPages:         8,
		MinReferences:    20,
		RequiredSections: []string{"Abstract", "Introduction", "Methods", "Results", "Conclusions"},
		FormattingRules: FormattingRules{
			FontSizeMin: 10,
			MarginMin:   1.0,
		},
		Thresholds: Thresholds{
			DeskRejectScore: 0.3,
			AcceptScore:     0.7,
		},
		Weights: map[string]float64{
			"title_abstract":   0.2,
			"writing_quality": 0.3,
			"experiments":      0.5,
		},
		TitleMaxWords:    15, // Default max words in title
		MaxSentenceWords: 25, // Default max words in a sentence
	}
}

// ConferenceConfig is kept for backward compatibility with desk rejection system
type ConferenceConfig PaperRuleConfig

type CustomRules struct {
	MinDatasets            int      `json:"min_datasets,omitempty"`
	MinimumTables          int      `json:"minimum_tables,omitempty"`
	AuthorAnonymizationReq bool     `json:"author_anonymization_required,omitempty"`
	CriticalKeywordsReq    []string `json:"critical_keywords_required,omitempty"`
	BannedPhrases          []string `json:"banned_phrases,omitempty"`
}

type FormattingRules struct {
	FontSizeMin int     `json:"font_size_min"`
	MarginMin   float64 `json:"margin_min"`
}

type Thresholds struct {
	DeskRejectScore float64 `json:"desk_reject_score"`
	AcceptScore     float64 `json:"accept_score"`
}

type Document struct {
	FullText string
	Sections map[string]string
	Stats    DocumentStats
	Keywords []string // Extracted keywords for scope matching
}

type DocumentStats struct {
	WordCount        int
	PageCount        int
	FigureCount      int
	TableCount       int
	ReferenceCount   int
	SelfCitationPerc float64
}

type CheckResult struct {
	ItemID     string  `json:"item_id"`
	Category   string  `json:"category"`
	Description string `json:"description"`
	Status     string  `json:"status"`
	Details    string  `json:"details"`
	Confidence float64 `json:"confidence"`
}

type ComplianceReport struct {
	PaperTitle      string                   `json:"paper_title"`
	OverallScore    float64                  `json:"overall_score"`
	Decision        string                   `json:"decision"`
	Summary         Summary                  `json:"summary"`
	CategoryScores  map[string]CategoryScore `json:"category_scores"`
	DetailedResults []CheckResult            `json:"detailed_results"`
}

type Summary struct {
	TotalItems int     `json:"total_items"`
	Passed     int     `json:"passed"`
	Failed     int     `json:"failed"`
	PassRate   float64 `json:"pass_rate"`
}

type CategoryScore struct {
	Score  float64 `json:"score"`
	Passed int     `json:"passed"`
	Failed int     `json:"failed"`
	Weight float64 `json:"weight"`
}

