package ai_service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net"
	"net/http"
	neturl "net/url"
	"strings"
	"time"
)

type Client struct {
	baseURL    string
	httpClient *http.Client
}

type Config struct {
	BaseURL        string
	TimeoutSeconds int
}

type ActorPayload struct {
	UserID int64  `json:"user_id"`
	Email  string `json:"email,omitempty"`
	Role   string `json:"role,omitempty"`
}

type ConflictDeclarationPayload struct {
	Email  string `json:"email"`
	Reason string `json:"reason"`
}

type SubmissionInformationPayload struct {
	Keywords          []string                     `json:"keywords,omitempty"`
	CoAuthors         []string                     `json:"co_authors,omitempty"`
	DeclaredConflicts []ConflictDeclarationPayload `json:"declared_conflicts,omitempty"`
	PaperType         string                       `json:"paper_type,omitempty"`
	TrackName         string                       `json:"track_name,omitempty"`
	AdditionalNotes   string                       `json:"additional_notes,omitempty"`
	Metadata          map[string]interface{}       `json:"metadata,omitempty"`
}

type SubmissionPayload struct {
	Title       string                       `json:"title,omitempty"`
	Abstract    string                       `json:"abstract,omitempty"`
	Track       string                       `json:"track,omitempty"`
	Status      string                       `json:"status,omitempty"`
	Information SubmissionInformationPayload `json:"information,omitempty"`
}

type DeskRejectionCustomRulesPayload struct {
	MinDatasets                 *int     `json:"min_datasets,omitempty"`
	MinimumTables               *int     `json:"minimum_tables,omitempty"`
	AuthorAnonymizationRequired *bool    `json:"author_anonymization_required,omitempty"`
	CriticalKeywordsRequired    []string `json:"critical_keywords_required,omitempty"`
	BannedPhrases               []string `json:"banned_phrases,omitempty"`
}

type DeskRejectionSettingsPayload struct {
	Enabled          bool                            `json:"enabled"`
	MinReferences    *int                            `json:"min_references,omitempty"`
	RequiredSections []string                        `json:"required_sections,omitempty"`
	Thresholds       map[string]float64              `json:"thresholds,omitempty"`
	Weights          map[string]float64              `json:"weights,omitempty"`
	CustomRules      DeskRejectionCustomRulesPayload `json:"custom_rules,omitempty"`
	PromptFragments  []string                        `json:"prompt_fragments,omitempty"`
}

type WorkflowSettingsPayload struct {
	StrictDeadlines bool `json:"strict_deadlines"`
}

type PolicyPayload struct {
	MaximumPages          *int                         `json:"maximum_pages,omitempty"`
	SubmissionFormat      []string                     `json:"submission_format,omitempty"`
	ReviewType            string                       `json:"review_type,omitempty"`
	DeskRejectionSettings DeskRejectionSettingsPayload `json:"desk_rejection_settings"`
	WorkflowSettings      WorkflowSettingsPayload      `json:"workflow_settings,omitempty"`
}

type FileMetadataPayload struct {
	OriginalFilename string `json:"original_filename"`
	SizeBytes        int64  `json:"size_bytes,omitempty"`
	ContentType      string `json:"content_type,omitempty"`
}

type ReviewerInitialSubmissionPayload struct {
	Title    string   `json:"title"`
	Abstract string   `json:"abstract"`
	Keywords []string `json:"keywords,omitempty"`
	Track    string   `json:"track,omitempty"`
}

type ReviewerInitialFileMetadataPayload struct {
	OriginalFilename string `json:"original_filename"`
	SizeBytes        int64  `json:"size_bytes,omitempty"`
	ContentType      string `json:"content_type,omitempty"`
}

type ResearchKeywordPaperSample struct {
	Title    string `json:"title"`
	Abstract string `json:"abstract"`
	Venue    string `json:"venue,omitempty"`
	Year     int    `json:"year,omitempty"`
}

type ResearchKeywordExtractionRequest struct {
	Papers []ResearchKeywordPaperSample `json:"papers"`
}

type ResearchKeywordExtractionResponse struct {
	Keywords []string `json:"keywords"`
}

type TrackRecommendationConferenceContext struct {
	Title         string   `json:"title"`
	Acronym       string   `json:"acronym,omitempty"`
	Description   string   `json:"description,omitempty"`
	CallForPapers string   `json:"call_for_papers,omitempty"`
	Domains       []string `json:"domains,omitempty"`
	Tracks        []string `json:"tracks"`
}

type TrackRecommendationPaperContext struct {
	Title    string   `json:"title"`
	Abstract string   `json:"abstract"`
	Keywords []string `json:"keywords,omitempty"`
}

type TrackRecommendationRequest struct {
	Conference TrackRecommendationConferenceContext `json:"conference"`
	Paper      TrackRecommendationPaperContext      `json:"paper"`
}

type TrackRecommendationItem struct {
	TrackName  string  `json:"track_name"`
	Confidence float64 `json:"confidence"`
	Reasoning  string  `json:"reasoning"`
	Rank       int     `json:"rank"`
}

type TrackRecommendationResponse struct {
	Recommendations []TrackRecommendationItem `json:"recommendations"`
}

type ReviewerInitialAnalysisResolveRequest struct {
	Action                     string                             `json:"action"`
	ConferenceID               int64                              `json:"conference_id"`
	AssignmentID               int64                              `json:"assignment_id"`
	SubmissionID               int64                              `json:"submission_id"`
	Actor                      ActorPayload                       `json:"actor"`
	SubmissionStateFingerprint string                             `json:"submission_state_fingerprint"`
	Submission                 ReviewerInitialSubmissionPayload   `json:"submission"`
	FileMetadata               ReviewerInitialFileMetadataPayload `json:"file_metadata"`
	DomainTags                 []string                           `json:"domain_tags,omitempty"`
}

type ReviewerInitialAnalysisCachePayload struct {
	Hit                        bool   `json:"hit"`
	SubmissionStateFingerprint string `json:"submission_state_fingerprint"`
}

type ReviewerInitialSubmissionSnapshot struct {
	Title              string   `json:"title"`
	AbstractSummary    string   `json:"abstract_summary"`
	ManuscriptOverview string   `json:"manuscript_overview"`
	Keywords           []string `json:"keywords"`
	Track              *string  `json:"track"`
}

type ReviewerInitialContribution struct {
	Label    string   `json:"label"`
	Evidence []string `json:"evidence"`
	Source   string   `json:"source"`
}

type ReviewerInitialNotableElement struct {
	Label  string `json:"label"`
	Detail string `json:"detail"`
	Source string `json:"source"`
}

type ReviewerInitialAttentionPoint struct {
	Focus  string  `json:"focus"`
	Reason *string `json:"reason"`
	Source string  `json:"source"`
}

type ReviewerInitialScopeLimitation struct {
	Label  string `json:"label"`
	Detail string `json:"detail"`
	Source string `json:"source"`
}

type ReviewerInitialReadinessSignal struct {
	Label  string `json:"label"`
	Status string `json:"status"`
	Detail string `json:"detail"`
	Source string `json:"source"`
}

type ReviewerInitialBriefing struct {
	SubmissionSnapshot      ReviewerInitialSubmissionSnapshot `json:"submission_snapshot"`
	ReviewReadinessSignals  []ReviewerInitialReadinessSignal  `json:"review_readiness_signals"`
	ClaimedContributions    []ReviewerInitialContribution     `json:"claimed_contributions"`
	NotableElements         []ReviewerInitialNotableElement   `json:"notable_elements"`
	ReviewerAttentionPoints []ReviewerInitialAttentionPoint   `json:"reviewer_attention_points"`
	StatedScopeLimitations  []ReviewerInitialScopeLimitation  `json:"stated_scope_and_limitations"`
}

type ReviewerInitialAnnotationItem struct {
	Category      string  `json:"category"`
	Severity      *string `json:"severity,omitempty"`
	QuotedPassage string  `json:"quoted_passage"`
	Commentary    string  `json:"commentary"`
	ReviewerHint  *string `json:"reviewer_hint,omitempty"`
}

type ReviewerInitialAnnotationSection struct {
	SectionName string                          `json:"section_name"`
	Summary     string                          `json:"summary"`
	Annotations []ReviewerInitialAnnotationItem `json:"annotations,omitempty"`
}

type ReviewerInitialAnnotations struct {
	OverallImpression string                             `json:"overall_impression"`
	DomainContext     *string                            `json:"domain_context,omitempty"`
	Sections          []ReviewerInitialAnnotationSection `json:"sections"`
}

type ReviewerInitialAnalysisArtifact struct {
	Briefing    ReviewerInitialBriefing    `json:"briefing"`
	Annotations ReviewerInitialAnnotations `json:"annotations"`
}

type ReviewerInitialAnalysisErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type ReviewerInitialAnalysisResolveResponse struct {
	Status   string                               `json:"status"`
	RunID    string                               `json:"run_id,omitempty"`
	Cache    ReviewerInitialAnalysisCachePayload  `json:"cache"`
	Artifact *ReviewerInitialAnalysisArtifact     `json:"artifact,omitempty"`
	Error    *ReviewerInitialAnalysisErrorPayload `json:"error,omitempty"`
}

type ReviewQualityAuditResolveRequest struct {
	Mode             string                           `json:"mode"`
	ConferenceID     int64                            `json:"conference_id"`
	AssignmentID     int64                            `json:"assignment_id"`
	SubmissionID     int64                            `json:"submission_id"`
	Actor            ActorPayload                     `json:"actor"`
	Submission       ReviewerInitialSubmissionPayload `json:"submission"`
	ReviewScore      *float64                         `json:"review_score,omitempty"`
	Review           ReviewQualityAuditReviewPayload  `json:"review"`
	Policy           *ReviewQualityAuditPolicyPayload `json:"policy,omitempty"`
	AnalysisArtifact *ReviewerInitialAnalysisArtifact `json:"analysis_artifact,omitempty"`
}

type ReviewQualityAuditReviewPayload struct {
	Criteria       ReviewCriteriaPayload `json:"criteria"`
	Feedback       ReviewFeedbackPayload `json:"feedback"`
	Recommendation string                `json:"recommendation"`
	Confidence     string                `json:"confidence"`
}

type ReviewCriteriaPayload struct {
	Originality      int `json:"originality"`
	TechnicalQuality int `json:"technical_quality"`
	Clarity          int `json:"clarity"`
	Significance     int `json:"significance"`
	Methodology      int `json:"methodology"`
}

type ReviewFeedbackPayload struct {
	Summary    string `json:"summary,omitempty"`
	Strengths  string `json:"strengths,omitempty"`
	Weaknesses string `json:"weaknesses,omitempty"`
	Questions  string `json:"questions,omitempty"`
}

type ReviewQualityAuditPolicyPayload struct {
	RequiredSections []string `json:"required_sections,omitempty"`
	Strict           bool     `json:"strict,omitempty"`
}

type ReviewQualityAuditFinding struct {
	Code                 string `json:"code"`
	Severity             string `json:"severity"`
	Field                string `json:"field"`
	Rationale            string `json:"rationale"`
	Message              string `json:"message"`
	Suggestion           string `json:"suggestion"`
	ConditionFingerprint string `json:"condition_fingerprint"`
}

type ReviewQualityAuditEvaluation struct {
	Summary               string `json:"summary"`
	EvidenceEngagement    string `json:"evidence_engagement"`
	ConsistencyAssessment string `json:"consistency_assessment"`
	ImprovementFocus      string `json:"improvement_focus"`
}

type ReviewQualityAuditResolveResponse struct {
	Status     string                       `json:"status"`
	RunID      string                       `json:"run_id,omitempty"`
	Evaluation ReviewQualityAuditEvaluation `json:"evaluation"`
	Findings   []ReviewQualityAuditFinding  `json:"findings,omitempty"`
}

type DecisionCopilotResolveRequest struct {
	Action                string                                      `json:"action"`
	ConferenceID          int64                                       `json:"conference_id"`
	SubmissionID          int64                                       `json:"submission_id"`
	Actor                 ActorPayload                                `json:"actor"`
	EvidenceFingerprint   string                                      `json:"evidence_fingerprint,omitempty"`
	ComponentFingerprints DecisionCopilotComponentFingerprintsPayload `json:"component_fingerprints"`
	Evidence              DecisionCopilotEvidencePayload              `json:"evidence,omitempty"`
}

type DecisionCopilotComponentFingerprintsPayload struct {
	Submission string `json:"submission"`
	Reviews    string `json:"reviews"`
	Discussion string `json:"discussion"`
	Rebuttal   string `json:"rebuttal"`
}

type DecisionCopilotConferenceCFPPayload struct {
	Name          string   `json:"name,omitempty"`
	Acronym       string   `json:"acronym,omitempty"`
	Description   string   `json:"description,omitempty"`
	Domains       []string `json:"domains,omitempty"`
	Tracks        []string `json:"tracks,omitempty"`
	CallForPapers string   `json:"call_for_papers,omitempty"`
}

type DecisionCopilotSubmissionContextPayload struct {
	Title         string   `json:"title,omitempty"`
	Track         string   `json:"track,omitempty"`
	Status        string   `json:"status,omitempty"`
	Keywords      []string `json:"keywords,omitempty"`
	LastUpdatedAt string   `json:"last_updated_at,omitempty"`
}

type DecisionCopilotReviewPayload struct {
	ReviewerID                 string         `json:"reviewer_id"`
	Recommendation             string         `json:"recommendation,omitempty"`
	Confidence                 string         `json:"confidence,omitempty"`
	Score                      *float64       `json:"score,omitempty"`
	SubmittedAt                string         `json:"submitted_at,omitempty"`
	Summary                    string         `json:"summary,omitempty"`
	Strengths                  string         `json:"strengths,omitempty"`
	Weaknesses                 string         `json:"weaknesses,omitempty"`
	Questions                  string         `json:"questions,omitempty"`
	Criteria                   map[string]int `json:"criteria,omitempty"`
	PostRebuttalScore          *float64       `json:"post_rebuttal_score,omitempty"`
	PostRebuttalRecommendation string         `json:"post_rebuttal_recommendation,omitempty"`
	PostRebuttalComment        string         `json:"post_rebuttal_comment,omitempty"`
	PostRebuttalUpdatedAt      string         `json:"post_rebuttal_updated_at,omitempty"`
}

type DecisionCopilotAnalyticsPayload struct {
	ReviewDistribution         []DecisionCopilotCountMetric `json:"review_distribution,omitempty"`
	ConfidenceMix              []DecisionCopilotCountMetric `json:"confidence_mix,omitempty"`
	StrongestCriteria          []string                     `json:"strongest_criteria,omitempty"`
	WeakestCriteria            []string                     `json:"weakest_criteria,omitempty"`
	ReviewCoverageCompleteness string                       `json:"review_coverage_completeness,omitempty"`
	ScoreChangesAfterRebuttal  *string                      `json:"score_changes_after_rebuttal,omitempty"`
	LastEvidenceUpdate         string                       `json:"last_evidence_update,omitempty"`
}

type DecisionCopilotDiscussionMessagePayload struct {
	Role      string `json:"role,omitempty"`
	Content   string `json:"content,omitempty"`
	CreatedAt string `json:"created_at,omitempty"`
}

type DecisionCopilotDiscussionThreadPayload struct {
	Title         string                                    `json:"title,omitempty"`
	Visibility    string                                    `json:"visibility,omitempty"`
	MessageCount  int                                       `json:"message_count,omitempty"`
	LastMessageAt string                                    `json:"last_message_at,omitempty"`
	Messages      []DecisionCopilotDiscussionMessagePayload `json:"messages,omitempty"`
}

type DecisionCopilotDiscussionPayload struct {
	ThreadCount    int                                      `json:"thread_count,omitempty"`
	MessageCount   int                                      `json:"message_count,omitempty"`
	LastActivityAt string                                   `json:"last_activity_at,omitempty"`
	Threads        []DecisionCopilotDiscussionThreadPayload `json:"threads,omitempty"`
}

type DecisionCopilotRebuttalPointPayload struct {
	AssignmentID         int64  `json:"assignment_id"`
	Category             string `json:"category,omitempty"`
	Section              string `json:"section,omitempty"`
	OriginalComment      string `json:"original_comment,omitempty"`
	AuthorResponse       string `json:"author_response,omitempty"`
	Status               string `json:"status,omitempty"`
	ReviewerAcknowledged bool   `json:"reviewer_acknowledged"`
	ReviewerNote         string `json:"reviewer_note,omitempty"`
}

type DecisionCopilotRebuttalAssignmentPayload struct {
	AssignmentID   int64  `json:"assignment_id"`
	RebuttalStatus string `json:"rebuttal_status,omitempty"`
}

type DecisionCopilotRebuttalPayload struct {
	Status          string                                     `json:"status"`
	GeneralResponse *string                                    `json:"general_response,omitempty"`
	Points          []DecisionCopilotRebuttalPointPayload      `json:"points,omitempty"`
	Assignments     []DecisionCopilotRebuttalAssignmentPayload `json:"assignments,omitempty"`
	SummaryHint     string                                     `json:"summary_hint,omitempty"`
}

type DecisionCopilotEvidencePayload struct {
	SchemaVersion   string                                  `json:"schema_version,omitempty"`
	ConferenceCFP   DecisionCopilotConferenceCFPPayload     `json:"conference_cfp"`
	Submission      DecisionCopilotSubmissionContextPayload `json:"submission"`
	Reviews         []DecisionCopilotReviewPayload          `json:"reviews,omitempty"`
	ReviewAnalytics DecisionCopilotAnalyticsPayload         `json:"review_analytics"`
	Discussion      DecisionCopilotDiscussionPayload        `json:"discussion"`
	Rebuttal        DecisionCopilotRebuttalPayload          `json:"rebuttal"`
}

type DecisionCopilotCachePayload struct {
	Hit                 bool     `json:"hit"`
	EvidenceFingerprint string   `json:"evidence_fingerprint"`
	IsStale             bool     `json:"is_stale"`
	StaleReasons        []string `json:"stale_reasons,omitempty"`
}

type DecisionCopilotEvidenceSummary struct {
	Overview      string   `json:"overview"`
	EvidenceBasis []string `json:"evidence_basis,omitempty"`
}

type DecisionCopilotReviewFeedbackSynthesis struct {
	Summary    string   `json:"summary"`
	Strengths  []string `json:"strengths,omitempty"`
	Weaknesses []string `json:"weaknesses,omitempty"`
	Questions  []string `json:"questions,omitempty"`
}

type DecisionCopilotCountMetric struct {
	Label string `json:"label"`
	Count int    `json:"count"`
}

type DecisionCopilotReviewAnalytics struct {
	ReviewDistribution         []DecisionCopilotCountMetric `json:"review_distribution,omitempty"`
	ConfidenceMix              []DecisionCopilotCountMetric `json:"confidence_mix,omitempty"`
	StrongestCriteria          []string                     `json:"strongest_criteria,omitempty"`
	WeakestCriteria            []string                     `json:"weakest_criteria,omitempty"`
	ReviewCoverageCompleteness string                       `json:"review_coverage_completeness,omitempty"`
	ScoreChangesAfterRebuttal  string                       `json:"score_changes_after_rebuttal,omitempty"`
}

type DecisionCopilotDiscussionSignals struct {
	Summary        string `json:"summary"`
	ThreadCount    int    `json:"thread_count,omitempty"`
	MessageCount   int    `json:"message_count,omitempty"`
	LastActivityAt string `json:"last_activity_at,omitempty"`
}

type DecisionCopilotRebuttalSignals struct {
	Status  string `json:"status"`
	Summary string `json:"summary"`
}

type DecisionCopilotDisagreementMap struct {
	AreasOfAgreement    []string `json:"areas_of_agreement,omitempty"`
	AreasOfDisagreement []string `json:"areas_of_disagreement,omitempty"`
	UnresolvedConcerns  []string `json:"unresolved_concerns,omitempty"`
	ConfidenceLimits    []string `json:"confidence_limits,omitempty"`
}

type DecisionCopilotArtifact struct {
	EvidenceSummary         DecisionCopilotEvidenceSummary         `json:"evidence_summary"`
	ReviewFeedbackSynthesis DecisionCopilotReviewFeedbackSynthesis `json:"review_feedback_synthesis"`
	ReviewAnalytics         DecisionCopilotReviewAnalytics         `json:"review_analytics"`
	DiscussionSignals       DecisionCopilotDiscussionSignals       `json:"discussion_signals"`
	RebuttalSignals         DecisionCopilotRebuttalSignals         `json:"rebuttal_signals"`
	DisagreementMap         DecisionCopilotDisagreementMap         `json:"disagreement_map"`
	SuggestedChairNote      string                                 `json:"suggested_chair_note"`
	EvidenceFingerprint     string                                 `json:"evidence_fingerprint"`
	GeneratedAt             string                                 `json:"generated_at"`
}

type DecisionCopilotErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type DecisionCopilotResolveResponse struct {
	Status   string                       `json:"status"`
	RunID    string                       `json:"run_id,omitempty"`
	Cache    DecisionCopilotCachePayload  `json:"cache"`
	Artifact *DecisionCopilotArtifact     `json:"artifact,omitempty"`
	Error    *DecisionCopilotErrorPayload `json:"error,omitempty"`
}

type SubmissionAutofillFileMetadata struct {
	FileID           string `json:"file_id"`
	OriginalFilename string `json:"original_filename"`
	SizeBytes        int64  `json:"size_bytes,omitempty"`
	ContentType      string `json:"content_type,omitempty"`
}

type SubmissionAutofillConferenceContext struct {
	Name        string   `json:"name"`
	Acronym     string   `json:"acronym"`
	Description string   `json:"description"`
	Domain      []string `json:"domain"`
	CFPText     string   `json:"cfp_text"`
	Tracks      []string `json:"tracks"`
}

type SubmissionAutofillRunRequest struct {
	ConferenceID      int64                               `json:"conference_id"`
	Actor             ActorPayload                        `json:"actor"`
	ExtraDetails      string                              `json:"extra_details,omitempty"`
	AvailableTracks   []string                            `json:"available_tracks,omitempty"`
	ConferenceContext SubmissionAutofillConferenceContext `json:"conference_context"`
	Files             []SubmissionAutofillFileMetadata    `json:"files"`
}

type SubmissionAutofillFields struct {
	Title           string   `json:"title"`
	Abstract        string   `json:"abstract"`
	Keywords        []string `json:"keywords"`
	PaperType       string   `json:"paper_type"`
	AdditionalNotes string   `json:"additional_notes"`
}

type SubmissionAutofillTrackRanking struct {
	TrackName  string  `json:"track_name"`
	Confidence float64 `json:"confidence"`
	Rationale  string  `json:"rationale"`
}

type SubmissionAutofillAuthor struct {
	Name        string `json:"name"`
	Email       string `json:"email,omitempty"`
	Affiliation string `json:"affiliation,omitempty"`
	Country     string `json:"country,omitempty"`
}

type SubmissionAutofillMaterial struct {
	FileID            string   `json:"file_id"`
	Filename          string   `json:"filename"`
	ContentType       string   `json:"content_type,omitempty"`
	SizeBytes         int64    `json:"size_bytes"`
	Role              string   `json:"role"`
	ExtractionStatus  string   `json:"extraction_status"`
	TextCoverageRatio *float64 `json:"text_coverage_ratio,omitempty"`
	PageCount         *int     `json:"page_count,omitempty"`
	Warnings          []string `json:"warnings,omitempty"`
}

type SubmissionAutofillErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type SubmissionAutofillRunResponse struct {
	RunID         string                           `json:"run_id"`
	Status        string                           `json:"status"`
	Fields        SubmissionAutofillFields         `json:"fields"`
	TrackRankings []SubmissionAutofillTrackRanking `json:"track_rankings,omitempty"`
	Authors       []SubmissionAutofillAuthor       `json:"authors,omitempty"`
	Materials     []SubmissionAutofillMaterial     `json:"materials,omitempty"`
	Warnings      []string                         `json:"warnings,omitempty"`
	Error         *SubmissionAutofillErrorPayload  `json:"error,omitempty"`
}

type SubmissionAutofillFileContent struct {
	FileID   string
	Filename string
	Content  []byte
}

type GatingRunRequest struct {
	Mode         string              `json:"mode"`
	Source       string              `json:"source"`
	ConferenceID int64               `json:"conference_id"`
	SubmissionID *int64              `json:"submission_id,omitempty"`
	Actor        ActorPayload        `json:"actor"`
	Submission   SubmissionPayload   `json:"submission"`
	Policy       PolicyPayload       `json:"policy"`
	FileMetadata FileMetadataPayload `json:"file_metadata"`
}

type FindingPayload struct {
	RuleID      string                 `json:"rule_id"`
	Source      string                 `json:"source"`
	Severity    string                 `json:"severity"`
	Message     string                 `json:"message"`
	Remediation string                 `json:"remediation,omitempty"`
	Evidence    map[string]interface{} `json:"evidence,omitempty"`
	Excerpt     string                 `json:"excerpt,omitempty"`
}

type GuidancePayload struct {
	RuleID      string `json:"rule_id"`
	Source      string `json:"source"`
	Severity    string `json:"severity"`
	Message     string `json:"message"`
	Remediation string `json:"remediation"`
}

type GatingRunResponse struct {
	RunID            string                 `json:"run_id"`
	InputFingerprint string                 `json:"input_fingerprint"`
	PolicyHash       string                 `json:"policy_hash"`
	Verdict          string                 `json:"verdict"`
	Decision         string                 `json:"decision"`
	Score            *float64               `json:"score,omitempty"`
	Summary          map[string]int         `json:"summary,omitempty"`
	Findings         []FindingPayload       `json:"findings,omitempty"`
	Guidance         []GuidancePayload      `json:"guidance,omitempty"`
	StageTimings     map[string]int         `json:"stage_timings,omitempty"`
	Determinism      map[string]interface{} `json:"determinism,omitempty"`
	CompletedAt      string                 `json:"completed_at,omitempty"`
}

type apiErrorEnvelope struct {
	Detail interface{} `json:"detail"`
	Error  string      `json:"error"`
}

const (
	submissionGatingDialAttemptCount = 3
	submissionGatingDialRetryDelay   = 200 * time.Millisecond
)

func NewClient(cfg Config) *Client {
	baseURL := strings.TrimRight(strings.TrimSpace(cfg.BaseURL), "/")
	timeout := time.Duration(cfg.TimeoutSeconds) * time.Second
	if timeout <= 0 {
		timeout = 30 * time.Second
	}

	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
}

func (c *Client) RunSubmissionMaterialGating(
	ctx context.Context,
	token string,
	requestPayload *GatingRunRequest,
	filename string,
	fileContent []byte,
) (*GatingRunResponse, error) {
	if c == nil || strings.TrimSpace(c.baseURL) == "" {
		return nil, fmt.Errorf("ai-service client is not configured")
	}
	if requestPayload == nil {
		return nil, fmt.Errorf("gating request payload is required")
	}
	if len(fileContent) == 0 {
		return nil, fmt.Errorf("gating file content is required")
	}

	requestJSON, err := json.Marshal(requestPayload)
	if err != nil {
		return nil, fmt.Errorf("marshal gating request: %w", err)
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	if err := writer.WriteField("request", string(requestJSON)); err != nil {
		return nil, fmt.Errorf("write gating request field: %w", err)
	}

	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return nil, fmt.Errorf("create gating file part: %w", err)
	}
	if _, err := part.Write(fileContent); err != nil {
		return nil, fmt.Errorf("write gating file content: %w", err)
	}
	if err := writer.Close(); err != nil {
		return nil, fmt.Errorf("close gating multipart body: %w", err)
	}
	requestBody := body.Bytes()
	contentType := writer.FormDataContentType()
	endpoint := c.baseURL + "/api/v1/workflows/submission-material-gating/runs"
	normalizedToken := normalizeBearerToken(token)

	var resp *http.Response
	for attempt := 1; attempt <= submissionGatingDialAttemptCount; attempt++ {
		req, requestErr := http.NewRequestWithContext(
			ctx,
			http.MethodPost,
			endpoint,
			bytes.NewReader(requestBody),
		)
		if requestErr != nil {
			return nil, fmt.Errorf("create gating request: %w", requestErr)
		}
		req.Header.Set("Content-Type", contentType)
		if normalizedToken != "" {
			req.Header.Set("Authorization", "Bearer "+normalizedToken)
		}

		resp, err = c.httpClient.Do(req)
		if err == nil {
			break
		}
		if !isRetryableDialError(err) || attempt == submissionGatingDialAttemptCount {
			return nil, fmt.Errorf("call ai-service gating workflow: %w", err)
		}
		if waitErr := waitForRetry(ctx, submissionGatingDialRetryDelay); waitErr != nil {
			return nil, fmt.Errorf("call ai-service gating workflow: %w", err)
		}
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read ai-service gating response: %w", err)
	}

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return nil, fmt.Errorf(
			"ai-service gating workflow failed: status=%d detail=%s",
			resp.StatusCode,
			extractErrorDetail(responseBody),
		)
	}

	var payload GatingRunResponse
	if err := json.Unmarshal(responseBody, &payload); err != nil {
		return nil, fmt.Errorf("decode ai-service gating response: %w", err)
	}

	return &payload, nil
}

func (c *Client) RunSubmissionAutofill(
	ctx context.Context,
	token string,
	requestPayload *SubmissionAutofillRunRequest,
	files []SubmissionAutofillFileContent,
) (*SubmissionAutofillRunResponse, error) {
	if c == nil || strings.TrimSpace(c.baseURL) == "" {
		return nil, fmt.Errorf("ai-service client is not configured")
	}
	if requestPayload == nil {
		return nil, fmt.Errorf("submission autofill request payload is required")
	}
	if len(files) == 0 {
		return nil, fmt.Errorf("submission autofill files are required")
	}

	requestPayload.ConferenceContext.Domain = nonNilStrings(requestPayload.ConferenceContext.Domain)
	requestPayload.ConferenceContext.Tracks = nonNilStrings(requestPayload.ConferenceContext.Tracks)
	requestPayload.AvailableTracks = nonNilStrings(requestPayload.AvailableTracks)

	requestJSON, err := json.Marshal(requestPayload)
	if err != nil {
		return nil, fmt.Errorf("marshal submission autofill request: %w", err)
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	if err := writer.WriteField("request", string(requestJSON)); err != nil {
		return nil, fmt.Errorf("write submission autofill request field: %w", err)
	}
	for _, filePayload := range files {
		if len(filePayload.Content) == 0 {
			return nil, fmt.Errorf("submission autofill file content is required")
		}
		fieldName := "files"
		if strings.TrimSpace(filePayload.FileID) != "" {
			fieldName = "files." + strings.TrimSpace(filePayload.FileID)
		}
		part, err := writer.CreateFormFile(fieldName, filePayload.Filename)
		if err != nil {
			return nil, fmt.Errorf("create submission autofill file part: %w", err)
		}
		if _, err := part.Write(filePayload.Content); err != nil {
			return nil, fmt.Errorf("write submission autofill file content: %w", err)
		}
	}
	if err := writer.Close(); err != nil {
		return nil, fmt.Errorf("close submission autofill multipart body: %w", err)
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		c.baseURL+"/api/v1/workflows/submission-autofill/runs",
		bytes.NewReader(body.Bytes()),
	)
	if err != nil {
		return nil, fmt.Errorf("create submission autofill request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	if normalizedToken := normalizeBearerToken(token); normalizedToken != "" {
		req.Header.Set("Authorization", "Bearer "+normalizedToken)
	}

	return doJSONRequest[SubmissionAutofillRunResponse](c.httpClient, req, "submission autofill workflow")
}

func (c *Client) LookupReviewerInitialAnalysis(
	ctx context.Context,
	token string,
	requestPayload *ReviewerInitialAnalysisResolveRequest,
) (*ReviewerInitialAnalysisResolveResponse, error) {
	if c == nil || strings.TrimSpace(c.baseURL) == "" {
		return nil, fmt.Errorf("ai-service client is not configured")
	}
	if requestPayload == nil {
		return nil, fmt.Errorf("reviewer initial analysis request payload is required")
	}

	requestJSON, err := json.Marshal(requestPayload)
	if err != nil {
		return nil, fmt.Errorf("marshal reviewer initial analysis request: %w", err)
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		c.baseURL+"/api/v1/workflows/reviewer-initial-analysis/resolve",
		bytes.NewReader(requestJSON),
	)
	if err != nil {
		return nil, fmt.Errorf("create reviewer initial analysis request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if normalizedToken := normalizeBearerToken(token); normalizedToken != "" {
		req.Header.Set("Authorization", "Bearer "+normalizedToken)
	}

	return doJSONRequest[ReviewerInitialAnalysisResolveResponse](c.httpClient, req, "reviewer initial analysis workflow")
}

func (c *Client) GenerateReviewerInitialAnalysis(
	ctx context.Context,
	token string,
	requestPayload *ReviewerInitialAnalysisResolveRequest,
	filename string,
	fileContent []byte,
) (*ReviewerInitialAnalysisResolveResponse, error) {
	if c == nil || strings.TrimSpace(c.baseURL) == "" {
		return nil, fmt.Errorf("ai-service client is not configured")
	}
	if requestPayload == nil {
		return nil, fmt.Errorf("reviewer initial analysis request payload is required")
	}
	if len(fileContent) == 0 {
		return nil, fmt.Errorf("reviewer initial analysis file content is required")
	}

	requestJSON, err := json.Marshal(requestPayload)
	if err != nil {
		return nil, fmt.Errorf("marshal reviewer initial analysis request: %w", err)
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	if err := writer.WriteField("request_payload", string(requestJSON)); err != nil {
		return nil, fmt.Errorf("write reviewer initial analysis request field: %w", err)
	}
	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return nil, fmt.Errorf("create reviewer initial analysis file part: %w", err)
	}
	if _, err := part.Write(fileContent); err != nil {
		return nil, fmt.Errorf("write reviewer initial analysis file content: %w", err)
	}
	if err := writer.Close(); err != nil {
		return nil, fmt.Errorf("close reviewer initial analysis multipart body: %w", err)
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		c.baseURL+"/api/v1/workflows/reviewer-initial-analysis/resolve",
		bytes.NewReader(body.Bytes()),
	)
	if err != nil {
		return nil, fmt.Errorf("create reviewer initial analysis request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	if normalizedToken := normalizeBearerToken(token); normalizedToken != "" {
		req.Header.Set("Authorization", "Bearer "+normalizedToken)
	}

	return doJSONRequest[ReviewerInitialAnalysisResolveResponse](c.httpClient, req, "reviewer initial analysis workflow")
}

func (c *Client) ExtractResearchKeywords(
	ctx context.Context,
	token string,
	requestPayload *ResearchKeywordExtractionRequest,
) (*ResearchKeywordExtractionResponse, error) {
	if c == nil || strings.TrimSpace(c.baseURL) == "" {
		return nil, fmt.Errorf("ai-service client is not configured")
	}
	if requestPayload == nil {
		return nil, fmt.Errorf("research keyword request payload is required")
	}

	requestJSON, err := json.Marshal(requestPayload)
	if err != nil {
		return nil, fmt.Errorf("marshal research keyword request: %w", err)
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		c.baseURL+"/api/v1/workflows/research-keywords/extract",
		bytes.NewReader(requestJSON),
	)
	if err != nil {
		return nil, fmt.Errorf("create research keyword request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if normalizedToken := normalizeBearerToken(token); normalizedToken != "" {
		req.Header.Set("Authorization", "Bearer "+normalizedToken)
	}

	return doJSONRequest[ResearchKeywordExtractionResponse](c.httpClient, req, "research keyword workflow")
}

func (c *Client) RecommendTracks(
	ctx context.Context,
	token string,
	requestPayload *TrackRecommendationRequest,
) (*TrackRecommendationResponse, error) {
	if c == nil || strings.TrimSpace(c.baseURL) == "" {
		return nil, fmt.Errorf("ai-service client is not configured")
	}
	if requestPayload == nil {
		return nil, fmt.Errorf("track recommendation request payload is required")
	}

	requestJSON, err := json.Marshal(requestPayload)
	if err != nil {
		return nil, fmt.Errorf("marshal track recommendation request: %w", err)
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		c.baseURL+"/api/v1/workflows/track-recommendation/recommend",
		bytes.NewReader(requestJSON),
	)
	if err != nil {
		return nil, fmt.Errorf("create track recommendation request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if normalizedToken := normalizeBearerToken(token); normalizedToken != "" {
		req.Header.Set("Authorization", "Bearer "+normalizedToken)
	}

	return doJSONRequest[TrackRecommendationResponse](c.httpClient, req, "track recommendation workflow")
}

func (c *Client) ResolveReviewQualityAudit(
	ctx context.Context,
	token string,
	requestPayload *ReviewQualityAuditResolveRequest,
) (*ReviewQualityAuditResolveResponse, error) {
	if c == nil || strings.TrimSpace(c.baseURL) == "" {
		return nil, fmt.Errorf("ai-service client is not configured")
	}
	if requestPayload == nil {
		return nil, fmt.Errorf("review quality audit request payload is required")
	}

	requestJSON, err := json.Marshal(requestPayload)
	if err != nil {
		return nil, fmt.Errorf("marshal review quality audit request: %w", err)
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		c.baseURL+"/api/v1/workflows/review-quality-auditor/resolve",
		bytes.NewReader(requestJSON),
	)
	if err != nil {
		return nil, fmt.Errorf("create review quality audit request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if normalizedToken := normalizeBearerToken(token); normalizedToken != "" {
		req.Header.Set("Authorization", "Bearer "+normalizedToken)
	}

	return doJSONRequest[ReviewQualityAuditResolveResponse](c.httpClient, req, "review quality audit workflow")
}

func (c *Client) LookupDecisionCopilot(
	ctx context.Context,
	token string,
	requestPayload *DecisionCopilotResolveRequest,
) (*DecisionCopilotResolveResponse, error) {
	return c.resolveDecisionCopilot(ctx, token, requestPayload)
}

func (c *Client) GenerateDecisionCopilot(
	ctx context.Context,
	token string,
	requestPayload *DecisionCopilotResolveRequest,
) (*DecisionCopilotResolveResponse, error) {
	return c.resolveDecisionCopilot(ctx, token, requestPayload)
}

func (c *Client) RegenerateDecisionCopilot(
	ctx context.Context,
	token string,
	requestPayload *DecisionCopilotResolveRequest,
) (*DecisionCopilotResolveResponse, error) {
	return c.resolveDecisionCopilot(ctx, token, requestPayload)
}

func (c *Client) resolveDecisionCopilot(
	ctx context.Context,
	token string,
	requestPayload *DecisionCopilotResolveRequest,
) (*DecisionCopilotResolveResponse, error) {
	if c == nil || strings.TrimSpace(c.baseURL) == "" {
		return nil, fmt.Errorf("ai-service client is not configured")
	}
	if requestPayload == nil {
		return nil, fmt.Errorf("decision copilot request payload is required")
	}

	requestJSON, err := json.Marshal(requestPayload)
	if err != nil {
		return nil, fmt.Errorf("marshal decision copilot request: %w", err)
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		c.baseURL+"/api/v1/workflows/chair-decision-copilot/resolve",
		bytes.NewReader(requestJSON),
	)
	if err != nil {
		return nil, fmt.Errorf("create decision copilot request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if normalizedToken := normalizeBearerToken(token); normalizedToken != "" {
		req.Header.Set("Authorization", "Bearer "+normalizedToken)
	}

	return doJSONRequest[DecisionCopilotResolveResponse](c.httpClient, req, "decision copilot workflow")
}

func doJSONRequest[T any](httpClient *http.Client, req *http.Request, operation string) (*T, error) {
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("call ai-service %s: %w", operation, err)
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read ai-service %s response: %w", operation, err)
	}

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return nil, fmt.Errorf(
			"ai-service %s failed: status=%d detail=%s",
			operation,
			resp.StatusCode,
			extractErrorDetail(responseBody),
		)
	}

	var payload T
	if err := json.Unmarshal(responseBody, &payload); err != nil {
		return nil, fmt.Errorf("decode ai-service %s response: %w", operation, err)
	}
	return &payload, nil
}

func normalizeBearerToken(token string) string {
	value := strings.TrimSpace(token)
	if strings.HasPrefix(strings.ToLower(value), "bearer ") {
		return strings.TrimSpace(value[7:])
	}
	return value
}

func nonNilStrings(values []string) []string {
	if values == nil {
		return []string{}
	}
	return values
}

func extractErrorDetail(body []byte) string {
	if len(body) == 0 {
		return "empty response body"
	}

	var payload apiErrorEnvelope
	if err := json.Unmarshal(body, &payload); err == nil {
		if payload.Error != "" {
			return payload.Error
		}
		if payload.Detail != nil {
			switch detail := payload.Detail.(type) {
			case string:
				return detail
			default:
				encoded, marshalErr := json.Marshal(detail)
				if marshalErr == nil {
					return string(encoded)
				}
			}
		}
	}

	return strings.TrimSpace(string(body))
}

func isRetryableDialError(err error) bool {
	if err == nil {
		return false
	}

	var urlErr *neturl.Error
	if errors.As(err, &urlErr) && urlErr.Err != nil {
		err = urlErr.Err
	}

	var opErr *net.OpError
	if errors.As(err, &opErr) && strings.EqualFold(opErr.Op, "dial") {
		return true
	}

	message := strings.ToLower(err.Error())
	return strings.Contains(message, "connection refused") || strings.Contains(message, "actively refused")
}

func waitForRetry(ctx context.Context, delay time.Duration) error {
	timer := time.NewTimer(delay)
	defer timer.Stop()

	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-timer.C:
		return nil
	}
}
