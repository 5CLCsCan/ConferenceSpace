package submission

import (
	"errors"
	"testing"

	"github.com/lib/pq"
)

func TestIsAuthorAlreadySubmittedError(t *testing.T) {
	tests := []struct {
		name string
		err  error
		want bool
	}{
		{
			name: "matches author conference unique index",
			err: &pq.Error{
				Code:       "23505",
				Constraint: "idx_unique_author_per_conference",
			},
			want: true,
		},
		{
			name: "ignores other unique indexes",
			err: &pq.Error{
				Code:       "23505",
				Constraint: "users_email_key",
			},
			want: false,
		},
		{
			name: "ignores non postgres errors",
			err:  errors.New("connection refused"),
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := isAuthorAlreadySubmittedError(tt.err); got != tt.want {
				t.Fatalf("expected %v, got %v", tt.want, got)
			}
		})
	}
}
