package dto

import (
	"encoding/json"
	"strings"
	"testing"
)

// Regression: the batch-create response MUST always emit `success` and
// `failed` keys, even when the slice is empty. The frontend reads
// `response.data.failed.length` directly; if the field is omitted (or
// serialised as `null`) it crashes with "Cannot read properties of undefined
// (reading 'length')". See commit history on this file for the original
// `omitempty` bug.
func TestExternalInvitationBatchCreateResponse_AlwaysEmitsSuccessAndFailed(t *testing.T) {
	tests := []struct {
		name string
		resp ExternalInvitationBatchCreateResponse
	}{
		{
			name: "both slices empty but non-nil",
			resp: ExternalInvitationBatchCreateResponse{
				Success: []ExternalInvitation{},
				Failed:  []ExternalInvitationFailure{},
			},
		},
		{
			name: "both slices nil",
			resp: ExternalInvitationBatchCreateResponse{},
		},
		{
			name: "only success populated (the regression case)",
			resp: ExternalInvitationBatchCreateResponse{
				Success: []ExternalInvitation{{ID: 1, Name: "A"}},
				Failed:  []ExternalInvitationFailure{},
			},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			raw, err := json.Marshal(tc.resp)
			if err != nil {
				t.Fatalf("marshal failed: %v", err)
			}
			body := string(raw)
			if !strings.Contains(body, `"success"`) {
				t.Errorf(`expected payload to contain "success" key, got: %s`, body)
			}
			if !strings.Contains(body, `"failed"`) {
				t.Errorf(`expected payload to contain "failed" key (frontend reads .failed.length), got: %s`, body)
			}
		})
	}
}
