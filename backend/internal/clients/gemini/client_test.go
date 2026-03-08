package gemini

import "testing"

func TestParseAPIErrorBody_WrappedEnvelope(t *testing.T) {
	body := []byte(`{"error":{"code":429,"message":"quota exceeded","status":"RESOURCE_EXHAUSTED"}}`)

	apiErr := parseAPIErrorBody(body)
	if apiErr == nil {
		t.Fatal("parseAPIErrorBody() returned nil")
	}
	if apiErr.Code != 429 {
		t.Fatalf("Code = %d, want 429", apiErr.Code)
	}
	if apiErr.Message != "quota exceeded" {
		t.Fatalf("Message = %q, want quota exceeded", apiErr.Message)
	}
	if apiErr.Status != "RESOURCE_EXHAUSTED" {
		t.Fatalf("Status = %q, want RESOURCE_EXHAUSTED", apiErr.Status)
	}
}

func TestParseAPIErrorBody_DirectShape(t *testing.T) {
	body := []byte(`{"code":403,"message":"permission denied","status":"PERMISSION_DENIED"}`)

	apiErr := parseAPIErrorBody(body)
	if apiErr == nil {
		t.Fatal("parseAPIErrorBody() returned nil")
	}
	if apiErr.Code != 403 {
		t.Fatalf("Code = %d, want 403", apiErr.Code)
	}
	if apiErr.Message != "permission denied" {
		t.Fatalf("Message = %q, want permission denied", apiErr.Message)
	}
}
