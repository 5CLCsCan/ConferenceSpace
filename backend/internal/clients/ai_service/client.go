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

func normalizeBearerToken(token string) string {
	value := strings.TrimSpace(token)
	if strings.HasPrefix(strings.ToLower(value), "bearer ") {
		return strings.TrimSpace(value[7:])
	}
	return value
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
