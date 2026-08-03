package agentquery

import (
	"encoding/json"
	"fmt"
	"net/http"
	"slices"
)

type Actor struct {
	UserID    int64
	UserEmail string
}

type Request struct {
	Op         string          `json:"op"`
	Resource   string          `json:"resource,omitempty"`
	Select     []SelectField   `json:"select,omitempty"`
	Filter     *FilterNode     `json:"filter,omitempty"`
	GroupBy    []GroupField    `json:"group_by,omitempty"`
	Aggregates []AggregateSpec `json:"aggregates,omitempty"`
	Sort       []SortSpec      `json:"sort,omitempty"`
	Limit      *int            `json:"limit,omitempty"`
	Offset     *int            `json:"offset,omitempty"`
}

type SelectField struct {
	Field string `json:"field"`
	As    string `json:"as,omitempty"`
}

type GroupField struct {
	Field string `json:"field"`
	As    string `json:"as,omitempty"`
}

type AggregateSpec struct {
	Fn    string `json:"fn"`
	Field string `json:"field"`
	As    string `json:"as,omitempty"`
}

type SortSpec struct {
	Field string `json:"field"`
	Dir   string `json:"dir,omitempty"`
}

type FilterNode struct {
	And   []*FilterNode `json:"and,omitempty"`
	Or    []*FilterNode `json:"or,omitempty"`
	Field string        `json:"field,omitempty"`
	Op    string        `json:"op,omitempty"`
	Value interface{}   `json:"value,omitempty"`
}

func (f *FilterNode) UnmarshalJSON(data []byte) error {
	type explicitFilterNode FilterNode

	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}

	if hasExplicitFilterShape(raw) {
		var decoded explicitFilterNode
		if err := json.Unmarshal(data, &decoded); err != nil {
			return err
		}
		*f = FilterNode(decoded)
		return nil
	}

	keys := make([]string, 0, len(raw))
	for key := range raw {
		keys = append(keys, key)
	}
	slices.Sort(keys)

	children := make([]*FilterNode, 0, len(keys))
	for _, field := range keys {
		var operators map[string]interface{}
		if err := json.Unmarshal(raw[field], &operators); err != nil {
			return fmt.Errorf("filter shorthand for %q must map operators to values", field)
		}
		operatorNames := make([]string, 0, len(operators))
		for operator := range operators {
			operatorNames = append(operatorNames, operator)
		}
		slices.Sort(operatorNames)
		for _, operator := range operatorNames {
			children = append(children, &FilterNode{
				Field: field,
				Op:    operator,
				Value: operators[operator],
			})
		}
	}

	if len(children) == 1 {
		*f = *children[0]
		return nil
	}
	f.And = children
	return nil
}

func hasExplicitFilterShape(raw map[string]json.RawMessage) bool {
	for _, key := range []string{"and", "or", "field", "op", "value"} {
		if _, ok := raw[key]; ok {
			return true
		}
	}
	return false
}

type ResourceField struct {
	Name          string   `json:"name"`
	Type          string   `json:"type"`
	Description   string   `json:"description,omitempty"`
	Selectable    bool     `json:"selectable"`
	Filterable    bool     `json:"filterable"`
	Groupable     bool     `json:"groupable"`
	Sortable      bool     `json:"sortable"`
	Operators     []string `json:"operators,omitempty"`
	Aggregates    []string `json:"aggregates,omitempty"`
	RedactionNote string   `json:"redaction_note,omitempty"`
}

type ResourceSchema struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Fields      []ResourceField `json:"fields"`
	PolicyNotes []string        `json:"policy_notes,omitempty"`
}

type DescribeResponse struct {
	Resources []ResourceSchema `json:"resources,omitempty"`
	Resource  *ResourceSchema  `json:"resource,omitempty"`
}

type QueryResponse struct {
	Resource string                   `json:"resource"`
	Rows     []map[string]interface{} `json:"rows"`
	Meta     QueryMeta                `json:"meta"`
}

type QueryMeta struct {
	RowCount    int      `json:"row_count"`
	Limit       int      `json:"limit"`
	Offset      int      `json:"offset"`
	PolicyNotes []string `json:"policy_notes,omitempty"`
}

type Error struct {
	StatusCode int
	Message    string
}

func (e *Error) Error() string {
	return e.Message
}

func badRequest(message string) *Error {
	return &Error{StatusCode: http.StatusBadRequest, Message: message}
}

func internalError(message string) *Error {
	return &Error{StatusCode: http.StatusInternalServerError, Message: message}
}
