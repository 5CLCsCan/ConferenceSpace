package semantic_scholar

import (
	"reflect"
	"testing"
)

func TestAggregateAuthorFieldsOfStudy(t *testing.T) {
	tests := []struct {
		name   string
		papers []Paper
		want   []string
	}{
		{
			name:   "no papers returns nil (not empty slice)",
			papers: nil,
			want:   nil,
		},
		{
			name: "papers without any field tags return nil",
			papers: []Paper{
				{PaperID: "p1", Title: "T1"},
				{PaperID: "p2", Title: "T2"},
			},
			want: nil,
		},
		{
			name: "dedupes across papers and across fieldsOfStudy + s2FieldsOfStudy",
			papers: []Paper{
				{
					PaperID:       "p1",
					FieldsOfStudy: []string{"Computer Science", "Mathematics"},
					S2FieldsOfStudy: []S2FieldOfStudy{
						{Category: "Computer Science", Source: "s2-fos-model"},
					},
				},
				{
					PaperID: "p2",
					S2FieldsOfStudy: []S2FieldOfStudy{
						{Category: "Biology", Source: "external"},
						{Category: "Mathematics", Source: "s2-fos-model"},
					},
				},
			},
			// Deduplicated + alphabetically sorted.
			want: []string{"Biology", "Computer Science", "Mathematics"},
		},
		{
			name: "drops empty / whitespace-only categories",
			papers: []Paper{
				{
					FieldsOfStudy: []string{"", "  ", "Medicine"},
					S2FieldsOfStudy: []S2FieldOfStudy{
						{Category: ""},
						{Category: "   "},
						{Category: "Physics"},
					},
				},
			},
			want: []string{"Medicine", "Physics"},
		},
		{
			name: "preserves inner whitespace but trims outer",
			papers: []Paper{
				{
					S2FieldsOfStudy: []S2FieldOfStudy{
						{Category: "  Computer Science  "},
						{Category: "Computer Science"},
					},
				},
			},
			// Both collapse to the same trimmed value.
			want: []string{"Computer Science"},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := aggregateAuthorFieldsOfStudy(tc.papers)
			if !reflect.DeepEqual(got, tc.want) {
				t.Fatalf("aggregateAuthorFieldsOfStudy() = %v, want %v", got, tc.want)
			}
		})
	}
}
