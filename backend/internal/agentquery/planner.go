package agentquery

import (
	"fmt"
	"strings"

	sq "github.com/Masterminds/squirrel"
)

func (e *Engine) planQuery(actor Actor, req *Request) (*queryPlan, error) {
	if strings.TrimSpace(req.Resource) == "" {
		return nil, badRequest("resource is required for query")
	}

	resource, ok := e.resourceByName[strings.TrimSpace(req.Resource)]
	if !ok {
		return nil, badRequest(fmt.Sprintf("unknown resource %q", req.Resource))
	}
	if len(req.GroupBy) > 0 && len(req.Aggregates) == 0 {
		return nil, badRequest("group_by requires aggregates")
	}

	effectiveSelect := req.Select
	if len(req.GroupBy) > 0 && len(effectiveSelect) == 0 {
		effectiveSelect = make([]SelectField, 0, len(req.GroupBy))
		for _, field := range req.GroupBy {
			effectiveSelect = append(effectiveSelect, SelectField{Field: field.Field, As: field.As})
		}
	}
	if len(effectiveSelect) == 0 && len(req.Aggregates) == 0 {
		return nil, badRequest("query requires select fields or aggregates")
	}

	groupBySet := map[string]bool{}
	for _, groupField := range req.GroupBy {
		groupBySet[groupField.Field] = true
	}
	if len(req.GroupBy) > 0 {
		for _, selectField := range effectiveSelect {
			if !groupBySet[selectField.Field] {
				return nil, badRequest(fmt.Sprintf("selected field %q must also appear in group_by", selectField.Field))
			}
		}
	}

	builder := e.qb.Select().From(resource.from)
	for _, join := range resource.joins {
		builder = builder.JoinClause(join)
	}
	scope := resource.scope(actor)
	builder = builder.Where(sq.Expr(scope.sql, scope.args...))

	sortExpressions := map[string]orderableExpression{}
	groupBySQL := make([]string, 0, len(req.GroupBy))
	groupBySeen := map[string]bool{}
	columns := make([]string, 0, len(effectiveSelect)+len(req.Aggregates))

	for _, selectField := range effectiveSelect {
		definition, ok := resource.fields[selectField.Field]
		if !ok || !definition.meta.Selectable {
			return nil, badRequest(fmt.Sprintf("field %q is not selectable for resource %q", selectField.Field, resource.schema.Name))
		}

		fragment := definition.expression(actor)
		alias, err := resolveAlias(selectField.As, selectField.Field)
		if err != nil {
			return nil, badRequest(err.Error())
		}
		builder = builder.Column(fmt.Sprintf("%s AS %s", fragment.sql, alias), fragment.args...)
		columns = append(columns, alias)
		sortExpressions[selectField.Field] = orderableExpression{alias: alias, rawSQL: fragment.sql, requiresArgs: len(fragment.args) > 0}
		sortExpressions[alias] = orderableExpression{alias: alias}

		if groupBySet[selectField.Field] && !groupBySeen[selectField.Field] {
			if len(fragment.args) > 0 {
				return nil, badRequest(fmt.Sprintf("group_by field %q cannot depend on request-specific redaction arguments", selectField.Field))
			}
			groupBySQL = append(groupBySQL, fragment.sql)
			groupBySeen[selectField.Field] = true
		}
	}

	for _, aggregate := range req.Aggregates {
		definition, ok := resource.fields[aggregate.Field]
		if !ok {
			return nil, badRequest(fmt.Sprintf("aggregate field %q is not registered for resource %q", aggregate.Field, resource.schema.Name))
		}
		fn := strings.ToLower(strings.TrimSpace(aggregate.Fn))
		if !contains(definition.meta.Aggregates, fn) {
			return nil, badRequest(fmt.Sprintf("aggregate %q is not allowed on field %q", aggregate.Fn, aggregate.Field))
		}

		fragment := definition.expression(actor)
		if len(fragment.args) > 0 {
			return nil, badRequest(fmt.Sprintf("aggregate field %q cannot depend on request-specific redaction arguments", aggregate.Field))
		}
		alias, err := resolveAlias(aggregate.As, aggregate.Fn+"_"+strings.ReplaceAll(aggregate.Field, ".", "_"))
		if err != nil {
			return nil, badRequest(err.Error())
		}
		aggregateSQL, err := buildAggregateSQL(fn, fragment.sql)
		if err != nil {
			return nil, badRequest(err.Error())
		}
		builder = builder.Column(fmt.Sprintf("%s AS %s", aggregateSQL, alias))
		columns = append(columns, alias)
		sortExpressions[alias] = orderableExpression{alias: alias}
	}

	if req.Filter != nil {
		filterFragment, err := e.buildFilter(resource, actor, req.Filter)
		if err != nil {
			return nil, err
		}
		builder = builder.Where(sq.Expr(filterFragment.sql, filterFragment.args...))
	}

	if len(groupBySQL) > 0 {
		builder = builder.GroupBy(groupBySQL...)
	}

	builder, err := applyOrdering(builder, resource, actor, req.Sort, sortExpressions)
	if err != nil {
		return nil, err
	}

	limit := resource.defaultLimit
	if req.Limit != nil {
		limit = *req.Limit
	}
	if limit <= 0 {
		return nil, badRequest("limit must be greater than zero")
	}
	if limit > resource.maxLimit {
		return nil, badRequest(fmt.Sprintf("limit exceeds maximum of %d", resource.maxLimit))
	}
	builder = builder.Limit(uint64(limit))

	offset := 0
	if req.Offset != nil {
		offset = *req.Offset
	}
	if offset < 0 {
		return nil, badRequest("offset must be zero or greater")
	}
	if offset > 0 {
		builder = builder.Offset(uint64(offset))
	}

	sqlString, args, err := builder.ToSql()
	if err != nil {
		return nil, internalError("failed to build query")
	}

	return &queryPlan{
		SQL:      sqlString,
		Args:     args,
		Columns:  columns,
		Resource: resource,
		Limit:    limit,
		Offset:   offset,
	}, nil
}

func applyOrdering(
	builder sq.SelectBuilder,
	resource *resourceDefinition,
	actor Actor,
	sorts []SortSpec,
	sortExpressions map[string]orderableExpression,
) (sq.SelectBuilder, error) {
	if len(sorts) == 0 {
		if raw, ok := resource.fields["updated_at"]; ok {
			fragment := raw.expression(actor)
			if len(fragment.args) == 0 {
				return builder.OrderBy(fragment.sql + " DESC"), nil
			}
		}
		return builder, nil
	}

	orderings := make([]string, 0, len(sorts))
	for _, sortSpec := range sorts {
		dir := strings.ToUpper(strings.TrimSpace(sortSpec.Dir))
		if dir == "" {
			dir = "ASC"
		}
		if dir != "ASC" && dir != "DESC" {
			return builder, badRequest(fmt.Sprintf("sort direction for %q must be asc or desc", sortSpec.Field))
		}

		orderable, ok := sortExpressions[sortSpec.Field]
		if !ok {
			fieldDef, fieldOK := resource.fields[sortSpec.Field]
			if !fieldOK || !fieldDef.meta.Sortable {
				return builder, badRequest(fmt.Sprintf("field %q is not sortable", sortSpec.Field))
			}
			fragment := fieldDef.expression(actor)
			orderable = orderableExpression{rawSQL: fragment.sql, requiresArgs: len(fragment.args) > 0}
		}

		if orderable.alias != "" {
			orderings = append(orderings, orderable.alias+" "+dir)
			continue
		}
		if orderable.requiresArgs {
			return builder, badRequest(fmt.Sprintf("field %q must be selected before sorting", sortSpec.Field))
		}
		orderings = append(orderings, orderable.rawSQL+" "+dir)
	}

	return builder.OrderBy(orderings...), nil
}

func (e *Engine) buildFilter(resource *resourceDefinition, actor Actor, node *FilterNode) (sqlFragment, error) {
	if node == nil {
		return sqlFragment{}, badRequest("filter node is empty")
	}

	if len(node.And) > 0 {
		return combineLogicalFilters("AND", e, resource, actor, node.And)
	}
	if len(node.Or) > 0 {
		return combineLogicalFilters("OR", e, resource, actor, node.Or)
	}

	fieldName := strings.TrimSpace(node.Field)
	operator := strings.ToLower(strings.TrimSpace(node.Op))
	if fieldName == "" || operator == "" {
		return sqlFragment{}, badRequest("filter leaf requires field and op")
	}

	definition, ok := resource.fields[fieldName]
	if !ok || !definition.meta.Filterable {
		return sqlFragment{}, badRequest(fmt.Sprintf("field %q is not filterable", fieldName))
	}
	if !contains(definition.meta.Operators, operator) {
		return sqlFragment{}, badRequest(fmt.Sprintf("operator %q is not allowed on field %q", operator, fieldName))
	}

	fragment := definition.expression(actor)
	switch operator {
	case "eq":
		return combineSQL(fragment, "= ?", node.Value), nil
	case "ne":
		return combineSQL(fragment, "<> ?", node.Value), nil
	case "gt":
		return combineSQL(fragment, "> ?", node.Value), nil
	case "gte":
		return combineSQL(fragment, ">= ?", node.Value), nil
	case "lt":
		return combineSQL(fragment, "< ?", node.Value), nil
	case "lte":
		return combineSQL(fragment, "<= ?", node.Value), nil
	case "like":
		return combineSQL(fragment, "LIKE ?", node.Value), nil
	case "ilike":
		return combineSQL(fragment, "ILIKE ?", node.Value), nil
	case "is_null":
		boolValue, ok := node.Value.(bool)
		if !ok {
			return sqlFragment{}, badRequest(fmt.Sprintf("operator %q on field %q requires boolean value", operator, fieldName))
		}
		if boolValue {
			return sqlFragment{sql: fragment.sql + " IS NULL", args: fragment.args}, nil
		}
		return sqlFragment{sql: fragment.sql + " IS NOT NULL", args: fragment.args}, nil
	case "in":
		values, ok := node.Value.([]interface{})
		if !ok || len(values) == 0 {
			return sqlFragment{}, badRequest(fmt.Sprintf("operator %q on field %q requires a non-empty array", operator, fieldName))
		}
		placeholders := make([]string, len(values))
		args := append([]interface{}{}, fragment.args...)
		for index, value := range values {
			placeholders[index] = "?"
			args = append(args, value)
		}
		return sqlFragment{
			sql:  fmt.Sprintf("%s IN (%s)", fragment.sql, strings.Join(placeholders, ", ")),
			args: args,
		}, nil
	default:
		return sqlFragment{}, badRequest(fmt.Sprintf("unsupported operator %q", operator))
	}
}

func combineLogicalFilters(
	operator string,
	engine *Engine,
	resource *resourceDefinition,
	actor Actor,
	children []*FilterNode,
) (sqlFragment, error) {
	parts := make([]string, 0, len(children))
	args := make([]interface{}, 0)
	for _, child := range children {
		fragment, err := engine.buildFilter(resource, actor, child)
		if err != nil {
			return sqlFragment{}, err
		}
		parts = append(parts, "("+fragment.sql+")")
		args = append(args, fragment.args...)
	}
	return sqlFragment{sql: strings.Join(parts, " "+operator+" "), args: args}, nil
}

func combineSQL(fragment sqlFragment, suffix string, value interface{}) sqlFragment {
	args := append([]interface{}{}, fragment.args...)
	args = append(args, value)
	return sqlFragment{sql: fragment.sql + " " + suffix, args: args}
}

func buildAggregateSQL(fn string, expr string) (string, error) {
	switch fn {
	case "count":
		return "COUNT(" + expr + ")", nil
	case "sum":
		return "SUM(" + expr + ")", nil
	case "avg":
		return "AVG(" + expr + ")", nil
	case "min":
		return "MIN(" + expr + ")", nil
	case "max":
		return "MAX(" + expr + ")", nil
	default:
		return "", fmt.Errorf("aggregate %q is not supported", fn)
	}
}
