package agentquery

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	sq "github.com/Masterminds/squirrel"
)

type Engine struct {
	db             *sql.DB
	qb             sq.StatementBuilderType
	order          []string
	resourceByName map[string]*resourceDefinition
}

type queryPlan struct {
	SQL      string
	Args     []interface{}
	Columns  []string
	Resource *resourceDefinition
	Limit    int
	Offset   int
}

type orderableExpression struct {
	alias        string
	rawSQL       string
	requiresArgs bool
}

func NewEngine(db *sql.DB) *Engine {
	order, registry := buildResourceRegistry()
	return &Engine{
		db:             db,
		qb:             sq.StatementBuilder.PlaceholderFormat(sq.Dollar),
		order:          order,
		resourceByName: registry,
	}
}

func (e *Engine) Describe(resource string) (*DescribeResponse, error) {
	resource = strings.TrimSpace(resource)
	if resource == "" {
		resources := make([]ResourceSchema, 0, len(e.order))
		for _, name := range e.order {
			if definition, ok := e.resourceByName[name]; ok {
				resources = append(resources, definition.schema)
			}
		}
		return &DescribeResponse{Resources: resources}, nil
	}

	definition, ok := e.resourceByName[resource]
	if !ok {
		return nil, badRequest(fmt.Sprintf("unknown resource %q", resource))
	}
	return &DescribeResponse{Resource: &definition.schema}, nil
}

func (e *Engine) Execute(ctx context.Context, actor Actor, req *Request) (interface{}, error) {
	switch strings.TrimSpace(req.Op) {
	case "describe":
		return e.Describe(req.Resource)
	case "query":
		plan, err := e.planQuery(actor, req)
		if err != nil {
			return nil, err
		}
		return e.runPlan(ctx, plan)
	default:
		return nil, badRequest("op must be one of: describe, query")
	}
}

func (e *Engine) runPlan(ctx context.Context, plan *queryPlan) (*QueryResponse, error) {
	if e.db == nil {
		return nil, internalError("query engine database is not configured")
	}

	rows, err := e.db.QueryContext(ctx, plan.SQL, plan.Args...)
	if err != nil {
		return nil, internalError("failed to execute query")
	}
	defer rows.Close()

	resultRows := make([]map[string]interface{}, 0)
	for rows.Next() {
		destinations := make([]interface{}, len(plan.Columns))
		rawValues := make([]interface{}, len(plan.Columns))
		for index := range destinations {
			destinations[index] = &rawValues[index]
		}
		if err := rows.Scan(destinations...); err != nil {
			return nil, internalError("failed to scan query result")
		}

		row := make(map[string]interface{}, len(plan.Columns))
		for index, column := range plan.Columns {
			row[column] = normalizeValue(rawValues[index])
		}
		resultRows = append(resultRows, row)
	}
	if err := rows.Err(); err != nil {
		return nil, internalError("failed while iterating query results")
	}

	return &QueryResponse{
		Resource: plan.Resource.schema.Name,
		Rows:     resultRows,
		Meta: QueryMeta{
			RowCount:    len(resultRows),
			Limit:       plan.Limit,
			Offset:      plan.Offset,
			PolicyNotes: append([]string{}, plan.Resource.schema.PolicyNotes...),
		},
	}, nil
}

func normalizeValue(value interface{}) interface{} {
	switch typed := value.(type) {
	case nil:
		return nil
	case []byte:
		return normalizeJSONString(string(typed))
	case string:
		return normalizeJSONString(typed)
	case time.Time:
		return typed.UTC().Format(time.RFC3339)
	default:
		return typed
	}
}

func normalizeJSONString(raw string) interface{} {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return raw
	}
	if !strings.HasPrefix(trimmed, "[") && !strings.HasPrefix(trimmed, "{") {
		return raw
	}

	var decoded interface{}
	if err := json.Unmarshal([]byte(trimmed), &decoded); err != nil {
		return raw
	}
	return decoded
}

func contains(values []string, target string) bool {
	for _, value := range values {
		if strings.EqualFold(strings.TrimSpace(value), strings.TrimSpace(target)) {
			return true
		}
	}
	return false
}
