package testutils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"testing"
	"time"
)

// TestContext holds the HTTP client for API testing
type TestContext struct {
	T       *testing.T
	BaseURL string
	Client  *http.Client
}

// NewTestContext creates a new test context
func NewTestContext(t *testing.T) *TestContext {
	// Base URL for API calls - configurable via env var
	baseURL := fmt.Sprintf("http://%s:%s",
		getEnv("TEST_SERVER_HOST", "localhost"),
		getEnv("TEST_SERVER_PORT", "8080"),
	)

	return &TestContext{
		T:       t,
		BaseURL: baseURL,
		Client:  &http.Client{Timeout: 10 * time.Second},
	}
}

// getEnv gets environment variable or returns default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// Close cleans up resources (nothing to do for HTTP client)
func (tc *TestContext) Close() {
	// HTTP client doesn't need cleanup
}

// MakeRequest makes an HTTP request to the real server
func (tc *TestContext) MakeRequest(method, path string, body interface{}, token string) (*http.Response, error) {
	var reqBody io.Reader
	if body != nil {
		jsonBytes, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonBytes)
	}

	url := tc.BaseURL + path
	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	}

	resp, err := tc.Client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}

	// Buffer the response body so it can be read multiple times
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		resp.Body.Close()
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}
	resp.Body.Close()

	// Replace body with a buffer that can be read multiple times
	resp.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	return resp, nil
}

// DecodeResponse decodes JSON response into the given struct
func DecodeResponse(t *testing.T, resp *http.Response, v interface{}) {
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("Failed to read response body: %v", err)
	}

	// Reset body for potential future reads
	resp.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	if err := json.Unmarshal(bodyBytes, v); err != nil {
		t.Fatalf("Failed to decode response: %v. Body: %s", err, string(bodyBytes))
	}
}

// ReadResponseBody reads the response body as string
func ReadResponseBody(t *testing.T, resp *http.Response) string {
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("Failed to read response body: %v", err)
	}

	// Reset body for potential future reads
	resp.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	return string(bodyBytes)
}

// AssertStatusCode checks if the response status code matches expected
func AssertStatusCode(t *testing.T, resp *http.Response, expected int) {
	if resp.StatusCode != expected {
		body := ReadResponseBody(t, resp)
		t.Errorf("Expected status code %d, got %d. Body: %s", expected, resp.StatusCode, body)
	}
}

// AssertNoError checks if error field in response is empty
func AssertNoError(t *testing.T, resp *http.Response) {
	bodyBytes, _ := io.ReadAll(resp.Body)
	resp.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var respMap map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &respMap); err != nil {
		t.Fatalf("Failed to decode response: %v. Body: %s", err, string(bodyBytes))
	}

	if errMsg, ok := respMap["error"].(string); ok && errMsg != "" {
		t.Errorf("Expected no error, got: %s", errMsg)
	}
}

// AssertError checks if error field in response contains expected message
func AssertError(t *testing.T, resp *http.Response, expectedMsg string) {
	bodyBytes, _ := io.ReadAll(resp.Body)
	resp.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var respMap map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &respMap); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	errMsg, ok := respMap["error"].(string)
	if !ok {
		t.Errorf("Expected error message, got none. Body: %s", string(bodyBytes))
		return
	}

	if errMsg != expectedMsg {
		t.Errorf("Expected error '%s', got '%s'", expectedMsg, errMsg)
	}
}

// WaitForServer waits for the server to be ready by checking health endpoint
func (tc *TestContext) WaitForServer() error {
	maxRetries := 30
	for i := 0; i < maxRetries; i++ {
		resp, err := tc.Client.Get(tc.BaseURL + "/health")
		if err == nil && resp.StatusCode == http.StatusOK {
			resp.Body.Close()
			return nil
		}
		if resp != nil {
			resp.Body.Close()
		}
		time.Sleep(100 * time.Millisecond)
	}
	return fmt.Errorf("server did not become ready after %d attempts", maxRetries)
}

// UniqueEmail generates a unique email address for testing
func UniqueEmail(base string) string {
	timestamp := time.Now().UnixNano()
	return fmt.Sprintf("%s-%d@example.com", base, timestamp)
}

// UniqueString generates a unique string for testing (e.g., conference acronyms)
func UniqueString(base string) string {
	timestamp := time.Now().UnixNano()
	return fmt.Sprintf("%s-%d", base, timestamp)
}

// MakeMultipartRequest makes a multipart/form-data request to the real server
func (tc *TestContext) MakeMultipartRequest(method, path string, formData map[string]string, token string) (*http.Response, error) {
	var reqBody bytes.Buffer
	writer := multipart.NewWriter(&reqBody)

	// Add all form fields
	for key, val := range formData {
		if err := writer.WriteField(key, val); err != nil {
			return nil, fmt.Errorf("failed to write form field %s: %w", key, err)
		}
	}

	if err := writer.Close(); err != nil {
		return nil, fmt.Errorf("failed to close multipart writer: %w", err)
	}

	url := tc.BaseURL + path
	req, err := http.NewRequest(method, url, &reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())
	if token != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	}

	resp, err := tc.Client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}

	// Buffer the response body so it can be read multiple times
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		resp.Body.Close()
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}
	resp.Body.Close()

	// Replace body with a buffer that can be read multiple times
	resp.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	return resp, nil
}
