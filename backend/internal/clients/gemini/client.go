package gemini

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client provides access to Google Gemini API
type Client struct {
	apiKey     string
	model      string
	baseURL    string
	httpClient *http.Client
}

// Config holds Gemini client configuration
type Config struct {
	APIKey string
	Model  string
}

// NewClient creates a new Gemini client
func NewClient(cfg Config) *Client {
	return &Client{
		apiKey:  cfg.APIKey,
		model:   cfg.Model,
		baseURL: "https://generativelanguage.googleapis.com/v1beta",
		httpClient: &http.Client{
			Timeout: 15 * time.Second, // Reduced timeout for faster failure
		},
	}
}

// GenerateContentRequest represents the request payload for Gemini API
type GenerateContentRequest struct {
	Contents         []Content         `json:"contents"`
	GenerationConfig *GenerationConfig `json:"generationConfig,omitempty"`
}

// Content represents a content item in the request
type Content struct {
	Parts []Part `json:"parts"`
	Role  string `json:"role,omitempty"`
}

// Part represents a part of content (text)
type Part struct {
	Text string `json:"text"`
}

// GenerateContentResponse represents the response from Gemini API
type GenerateContentResponse struct {
	Candidates []Candidate `json:"candidates"`
	Error      *APIError   `json:"error,omitempty"`
}

type GenerationConfig struct {
	ResponseMimeType string         `json:"responseMimeType,omitempty"`
	ResponseSchema   map[string]any `json:"responseSchema,omitempty"`
}

// Candidate represents a candidate response
type Candidate struct {
	Content      Content `json:"content"`
	FinishReason string  `json:"finishReason"`
}

// APIError represents an API error
type APIError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Status  string `json:"status"`
}

type apiErrorEnvelope struct {
	Error *APIError `json:"error"`
}

// GenerateText sends a prompt to Gemini and returns the generated text
func (c *Client) GenerateText(ctx context.Context, prompt string) (string, error) {
	return c.generate(ctx, prompt, nil)
}

// GenerateJSON sends a prompt to Gemini, requests JSON output, and unmarshals it into out.
func (c *Client) GenerateJSON(ctx context.Context, prompt string, schema map[string]any, out any) error {
	response, err := c.generate(ctx, prompt, &GenerationConfig{
		ResponseMimeType: "application/json",
		ResponseSchema:   schema,
	})
	if err != nil {
		return err
	}

	if err := json.Unmarshal([]byte(response), out); err != nil {
		return fmt.Errorf("failed to unmarshal gemini JSON response: %w", err)
	}

	return nil
}

func (c *Client) generate(ctx context.Context, prompt string, generationConfig *GenerationConfig) (string, error) {
	if c.apiKey == "" {
		return "", fmt.Errorf("gemini API key not configured")
	}

	url := fmt.Sprintf("%s/models/%s:generateContent?key=%s", c.baseURL, c.model, c.apiKey)

	reqBody := GenerateContentRequest{
		Contents: []Content{
			{
				Parts: []Part{
					{Text: prompt},
				},
			},
		},
		GenerationConfig: generationConfig,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		if apiErr := parseAPIErrorBody(body); apiErr != nil {
			return "", fmt.Errorf(
				"gemini API error: %s (code: %d, status: %s)",
				apiErr.Message,
				apiErr.Code,
				apiErr.Status,
			)
		}
		return "", fmt.Errorf("gemini API error: status %d, body: %s", resp.StatusCode, string(body))
	}

	var response GenerateContentResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return "", fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if response.Error != nil {
		return "", fmt.Errorf("gemini API error: %s", response.Error.Message)
	}

	if len(response.Candidates) == 0 {
		return "", fmt.Errorf("no candidates in response")
	}

	if len(response.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no content parts in response")
	}

	return response.Candidates[0].Content.Parts[0].Text, nil
}

func parseAPIErrorBody(body []byte) *APIError {
	var wrapped apiErrorEnvelope
	if err := json.Unmarshal(body, &wrapped); err == nil && wrapped.Error != nil {
		return wrapped.Error
	}

	var direct APIError
	if err := json.Unmarshal(body, &direct); err == nil && (direct.Code != 0 || direct.Message != "") {
		return &direct
	}

	return nil
}
