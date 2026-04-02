package agentquery

import "net/http"

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
