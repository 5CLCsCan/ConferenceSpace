package agentquery

import (
	"fmt"
	"regexp"
	"slices"
	"strings"

	"github.com/dcao/conferencespace/internal/model"
)

type sqlFragment struct {
	sql  string
	args []interface{}
}

type fieldDefinition struct {
	meta       ResourceField
	expression func(actor Actor) sqlFragment
}

type resourceDefinition struct {
	schema       ResourceSchema
	from         string
	joins        []string
	defaultLimit int
	maxLimit     int
	scope        func(actor Actor) sqlFragment
	fields       map[string]fieldDefinition
}

type fieldOption func(meta *ResourceField)

func buildResourceRegistry() ([]string, map[string]*resourceDefinition) {
	order := []string{
		"conferences",
		"public_conferences",
		"submissions",
		"assignments",
		"conference_stats",
		"notifications",
	}

	registry := map[string]*resourceDefinition{
		"conferences":        buildConferencesResource(),
		"public_conferences": buildPublicConferencesResource(),
		"submissions":        buildSubmissionsResource(),
		"assignments":        buildAssignmentsResource(),
		"conference_stats":   buildConferenceStatsResource(),
		"notifications":      buildNotificationsResource(),
	}

	return order, registry
}

func simpleField(name string, fieldType string, description string, sql string, options ...fieldOption) fieldDefinition {
	meta := ResourceField{
		Name:        name,
		Type:        fieldType,
		Description: description,
		Selectable:  true,
	}
	for _, option := range options {
		option(&meta)
	}

	return fieldDefinition{
		meta: meta,
		expression: func(_ Actor) sqlFragment {
			return sqlFragment{sql: sql}
		},
	}
}

func jsonTextField(name string, fieldType string, description string, sql string, options ...fieldOption) fieldDefinition {
	meta := ResourceField{
		Name:        name,
		Type:        fieldType,
		Description: description,
		Selectable:  true,
	}
	for _, option := range options {
		option(&meta)
	}

	return fieldDefinition{
		meta: meta,
		expression: func(_ Actor) sqlFragment {
			return sqlFragment{sql: sql}
		},
	}
}

func withFilters(operators ...string) fieldOption {
	return func(meta *ResourceField) {
		meta.Filterable = true
		meta.Operators = append([]string{}, operators...)
	}
}

func sortable() fieldOption {
	return func(meta *ResourceField) {
		meta.Sortable = true
	}
}

func groupable() fieldOption {
	return func(meta *ResourceField) {
		meta.Groupable = true
	}
}

func aggregatable(fns ...string) fieldOption {
	return func(meta *ResourceField) {
		meta.Aggregates = append([]string{}, fns...)
	}
}

func sortedFields(fields map[string]fieldDefinition) []ResourceField {
	names := make([]string, 0, len(fields))
	for name := range fields {
		names = append(names, name)
	}
	slices.Sort(names)

	out := make([]ResourceField, 0, len(names))
	for _, name := range names {
		out = append(out, fields[name].meta)
	}
	return out
}

var aliasPattern = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_]*$`)

func resolveAlias(requested string, fallback string) (string, error) {
	alias := strings.TrimSpace(requested)
	if alias == "" {
		alias = strings.NewReplacer(".", "_", "-", "_").Replace(fallback)
	}
	if !aliasPattern.MatchString(alias) {
		return "", fmt.Errorf("invalid alias %q", alias)
	}
	return alias, nil
}

func buildConferencesResource() *resourceDefinition {
	fields := map[string]fieldDefinition{
		"id":                simpleField("id", "integer", "Conference ID", "c.conference_id", withFilters("eq", "in"), sortable(), groupable(), aggregatable("count")),
		"title":             simpleField("title", "string", "Conference title", "c.title", withFilters("eq", "like", "ilike"), sortable(), groupable()),
		"acronym":           simpleField("acronym", "string", "Conference acronym", "c.acronym", withFilters("eq", "like", "ilike", "in"), sortable(), groupable()),
		"status":            simpleField("status", "string", "Conference lifecycle status", "c.status", withFilters("eq", "in"), sortable(), groupable(), aggregatable("count")),
		"created_at":        simpleField("created_at", "datetime", "Conference creation timestamp", "c.created_at", withFilters("gte", "lte", "gt", "lt"), sortable()),
		"updated_at":        simpleField("updated_at", "datetime", "Conference update timestamp", "c.updated_at", withFilters("gte", "lte", "gt", "lt"), sortable()),
		"rebuttal_phase":    simpleField("rebuttal_phase", "string", "Conference rebuttal phase", "c.rebuttal_phase", withFilters("eq", "in"), sortable(), groupable()),
		"rebuttal_deadline": simpleField("rebuttal_deadline", "datetime", "Conference rebuttal deadline", "c.rebuttal_deadline", withFilters("gte", "lte", "gt", "lt"), sortable()),
		"actor_role": {
			meta: ResourceField{
				Name:        "actor_role",
				Type:        "string",
				Description: "The current user's highest-precedence role in the conference",
				Selectable:  true,
			},
			expression: func(actor Actor) sqlFragment {
				return sqlFragment{
					sql: `CASE
						WHEN EXISTS (SELECT 1 FROM conference_user_roles cur_role WHERE cur_role.conference_id = c.conference_id AND cur_role.user_email = ? AND cur_role.status = 'active' AND cur_role.role = 'chair') THEN 'chair'
						WHEN EXISTS (SELECT 1 FROM conference_user_roles cur_role WHERE cur_role.conference_id = c.conference_id AND cur_role.user_email = ? AND cur_role.status = 'active' AND cur_role.role = 'co_chair') THEN 'co_chair'
						WHEN EXISTS (SELECT 1 FROM conference_user_roles cur_role WHERE cur_role.conference_id = c.conference_id AND cur_role.user_email = ? AND cur_role.status = 'active' AND cur_role.role = 'reviewer') THEN 'reviewer'
						WHEN EXISTS (SELECT 1 FROM conference_submissions s_role WHERE s_role.conference_id = c.conference_id AND s_role.author = ?) THEN 'author'
						ELSE NULL
					END`,
					args: []interface{}{actor.UserEmail, actor.UserEmail, actor.UserEmail, actor.UserEmail},
				}
			},
		},
	}

	return &resourceDefinition{
		schema: ResourceSchema{
			Name:        "conferences",
			Description: "Conferences related to the current user through an active role or authored submission",
			Fields:      sortedFields(fields),
			PolicyNotes: []string{
				"Rows are limited to conferences related to the current user.",
				"Conference access is scoped through active conference roles or authored submissions.",
			},
		},
		from:         "conferences c",
		defaultLimit: 25,
		maxLimit:     100,
		scope: func(actor Actor) sqlFragment {
			return sqlFragment{
				sql: `(EXISTS (SELECT 1 FROM conference_user_roles cur WHERE cur.conference_id = c.conference_id AND cur.user_email = ? AND cur.status = ?)
					OR EXISTS (SELECT 1 FROM conference_submissions s_actor WHERE s_actor.conference_id = c.conference_id AND s_actor.author = ?))`,
				args: []interface{}{actor.UserEmail, model.RoleStatusActive, actor.UserEmail},
			}
		},
		fields: fields,
	}
}

func buildSubmissionsResource() *resourceDefinition {
	fields := map[string]fieldDefinition{
		"id":                 simpleField("id", "integer", "Submission ID", "s.submission_id", withFilters("eq", "in"), sortable(), groupable(), aggregatable("count")),
		"title":              simpleField("title", "string", "Submission title", "s.title", withFilters("eq", "like", "ilike"), sortable(), groupable()),
		"status":             simpleField("status", "string", "Submission status", "s.status", withFilters("eq", "in"), sortable(), groupable(), aggregatable("count")),
		"track":              simpleField("track", "string", "Submission track", "s.track", withFilters("eq", "in", "like", "ilike"), sortable(), groupable()),
		"rebuttal_phase":     simpleField("rebuttal_phase", "string", "Submission rebuttal phase", "s.rebuttal_phase", withFilters("eq", "in"), sortable(), groupable()),
		"created_at":         simpleField("created_at", "datetime", "Submission creation timestamp", "s.created_at", withFilters("gte", "lte", "gt", "lt"), sortable()),
		"updated_at":         simpleField("updated_at", "datetime", "Submission update timestamp", "s.updated_at", withFilters("gte", "lte", "gt", "lt"), sortable()),
		"conference.id":      simpleField("conference.id", "integer", "Conference ID", "c.conference_id", withFilters("eq", "in"), sortable(), groupable()),
		"conference.title":   simpleField("conference.title", "string", "Conference title", "c.title", withFilters("eq", "like", "ilike"), sortable(), groupable()),
		"conference.acronym": simpleField("conference.acronym", "string", "Conference acronym", "c.acronym", withFilters("eq", "like", "ilike", "in"), sortable(), groupable()),
		"conference.status":  simpleField("conference.status", "string", "Conference status", "c.status", withFilters("eq", "in"), sortable(), groupable()),
		"actor_role": {
			meta: ResourceField{
				Name:        "actor_role",
				Type:        "string",
				Description: "How the current user can see this submission",
				Selectable:  true,
			},
			expression: func(actor Actor) sqlFragment {
				return sqlFragment{
					sql: `CASE
						WHEN EXISTS (SELECT 1 FROM conference_user_roles cur_role WHERE cur_role.conference_id = s.conference_id AND cur_role.user_email = ? AND cur_role.status = 'active' AND cur_role.role = 'chair') THEN 'chair'
						WHEN EXISTS (SELECT 1 FROM conference_user_roles cur_role WHERE cur_role.conference_id = s.conference_id AND cur_role.user_email = ? AND cur_role.status = 'active' AND cur_role.role = 'co_chair') THEN 'co_chair'
						WHEN s.author = ? THEN 'author'
						WHEN EXISTS (SELECT 1 FROM paper_assignments a_role WHERE a_role.submission_id = s.submission_id AND a_role.reviewer_email = ?) THEN 'reviewer'
						ELSE NULL
					END`,
					args: []interface{}{actor.UserEmail, actor.UserEmail, actor.UserEmail, actor.UserEmail},
				}
			},
		},
	}

	return &resourceDefinition{
		schema: ResourceSchema{
			Name:        "submissions",
			Description: "Submissions visible to the current user as author, assigned reviewer, or chair/co-chair",
			Fields:      sortedFields(fields),
			PolicyNotes: []string{
				"Rows are limited to submissions related to the current user.",
				"Author identity is not exposed through this resource.",
			},
		},
		from:         "conference_submissions s",
		joins:        []string{"JOIN conferences c ON c.conference_id = s.conference_id"},
		defaultLimit: 25,
		maxLimit:     100,
		scope: func(actor Actor) sqlFragment {
			return sqlFragment{
				sql: `(EXISTS (SELECT 1 FROM conference_user_roles cur WHERE cur.conference_id = s.conference_id AND cur.user_email = ? AND cur.status = ? AND cur.role IN (?, ?))
					OR s.author = ?
					OR EXISTS (SELECT 1 FROM paper_assignments a_actor WHERE a_actor.submission_id = s.submission_id AND a_actor.reviewer_email = ?))`,
				args: []interface{}{actor.UserEmail, model.RoleStatusActive, model.RoleChair, model.RoleCoChair, actor.UserEmail, actor.UserEmail},
			}
		},
		fields: fields,
	}
}

func buildPublicConferencesResource() *resourceDefinition {
	fields := map[string]fieldDefinition{
		"id":                             simpleField("id", "integer", "Conference ID", "c.conference_id", withFilters("eq", "in"), sortable(), groupable(), aggregatable("count")),
		"title":                          simpleField("title", "string", "Conference title", "c.title", withFilters("eq", "like", "ilike"), sortable(), groupable()),
		"acronym":                        simpleField("acronym", "string", "Conference acronym", "c.acronym", withFilters("eq", "like", "ilike", "in"), sortable(), groupable()),
		"description":                    simpleField("description", "string", "Conference description", "c.description", withFilters("eq", "like", "ilike"), sortable()),
		"chair":                          simpleField("chair", "string", "Conference chair", "c.chair", withFilters("eq", "like", "ilike"), sortable(), groupable()),
		"co_chairs":                      jsonTextField("co_chairs", "array", "Conference co-chairs", "COALESCE(to_jsonb(c.co_chairs)::text, '[]')"),
		"domain":                         jsonTextField("domain", "array", "Conference domains", "COALESCE(to_jsonb(c.domain)::text, '[]')"),
		"tracks":                         jsonTextField("tracks", "array", "Conference tracks", "COALESCE(to_jsonb(c.tracks)::text, '[]')"),
		"venue":                          simpleField("venue", "string", "Conference venue", "c.venue", withFilters("eq", "like", "ilike"), sortable(), groupable()),
		"status":                         simpleField("status", "string", "Conference lifecycle status", "c.status", withFilters("eq", "in"), sortable(), groupable(), aggregatable("count")),
		"created_at":                     simpleField("created_at", "datetime", "Conference creation timestamp", "c.created_at", withFilters("gte", "lte", "gt", "lt"), sortable()),
		"updated_at":                     simpleField("updated_at", "datetime", "Conference update timestamp", "c.updated_at", withFilters("gte", "lte", "gt", "lt"), sortable()),
		"start_date":                     simpleField("start_date", "datetime", "Conference start date", "NULLIF(c.configurations->>'start_date', '')::timestamptz", withFilters("eq", "gte", "lte", "gt", "lt"), sortable()),
		"end_date":                       simpleField("end_date", "datetime", "Conference end date", "NULLIF(c.configurations->>'end_date', '')::timestamptz", withFilters("eq", "gte", "lte", "gt", "lt"), sortable()),
		"abstract_submission_deadline":   simpleField("abstract_submission_deadline", "datetime", "Abstract submission deadline", "NULLIF(c.configurations->>'abstract_submission_deadline', '')::timestamptz", withFilters("eq", "gte", "lte", "gt", "lt"), sortable()),
		"full_paper_submission_deadline": simpleField("full_paper_submission_deadline", "datetime", "Full paper submission deadline", "NULLIF(c.configurations->>'full_paper_submission_deadline', '')::timestamptz", withFilters("eq", "gte", "lte", "gt", "lt"), sortable()),
		"camera_ready_deadline":          simpleField("camera_ready_deadline", "datetime", "Camera ready deadline", "NULLIF(c.configurations->>'camera_ready_deadline', '')::timestamptz", withFilters("eq", "gte", "lte", "gt", "lt"), sortable()),
		"format":                         simpleField("format", "string", "Conference format", "NULLIF(c.configurations->>'format', '')", withFilters("eq", "like", "ilike"), sortable(), groupable()),
		"review_type":                    simpleField("review_type", "string", "Conference review type", "NULLIF(c.configurations->>'review_type', '')", withFilters("eq", "like", "ilike"), sortable(), groupable()),
		"submission_type":                simpleField("submission_type", "string", "Conference submission type", "NULLIF(c.configurations->>'submission_type', '')", withFilters("eq", "like", "ilike"), sortable(), groupable()),
		"maximum_pages":                  simpleField("maximum_pages", "integer", "Maximum pages per submission", "NULLIF(c.configurations->>'maximum_pages', '')::int", withFilters("eq", "gte", "lte", "gt", "lt"), sortable(), groupable()),
		"cfp_text":                       simpleField("cfp_text", "string", "Call for papers text", "NULLIF(c.configurations->>'call_for_paper_text', '')", withFilters("eq", "like", "ilike"), sortable()),
	}

	return &resourceDefinition{
		schema: ResourceSchema{
			Name:        "public_conferences",
			Description: "Public conference information visible in platform exploration and discovery flows",
			Fields:      sortedFields(fields),
			PolicyNotes: []string{
				"Rows are limited to non-draft conferences.",
				"Only public conference fields are exposed; private operational settings remain hidden.",
			},
		},
		from:         "conferences c",
		defaultLimit: 25,
		maxLimit:     100,
		scope: func(_ Actor) sqlFragment {
			return sqlFragment{
				sql:  "c.status <> ?",
				args: []interface{}{model.ConferenceStatusDraft},
			}
		},
		fields: fields,
	}
}

func buildAssignmentsResource() *resourceDefinition {
	fields := map[string]fieldDefinition{
		"id":                  simpleField("id", "integer", "Assignment ID", "a.id", withFilters("eq", "in"), sortable(), groupable(), aggregatable("count")),
		"status":              simpleField("status", "string", "Assignment status", "a.status", withFilters("eq", "in"), sortable(), groupable(), aggregatable("count")),
		"review_status":       simpleField("review_status", "string", "Review workflow status", "a.review_status", withFilters("eq", "in"), sortable(), groupable(), aggregatable("count")),
		"score":               simpleField("score", "number", "Assignment matching score", "a.score", withFilters("eq", "gte", "lte", "gt", "lt"), sortable()),
		"assigned_at":         simpleField("assigned_at", "datetime", "Assignment creation time", "a.assigned_at", withFilters("gte", "lte", "gt", "lt"), sortable()),
		"completed_at":        simpleField("completed_at", "datetime", "Assignment completion time", "a.completed_at", withFilters("gte", "lte", "gt", "lt", "is_null"), sortable()),
		"review_submitted_at": simpleField("review_submitted_at", "datetime", "Review submission time", "a.review_submitted_at", withFilters("gte", "lte", "gt", "lt", "is_null"), sortable()),
		"rebuttal_status":     simpleField("rebuttal_status", "string", "Assignment rebuttal status", "a.rebuttal_status", withFilters("eq", "in"), sortable(), groupable()),
		"submission.id":       simpleField("submission.id", "integer", "Submission ID", "s.submission_id", withFilters("eq", "in"), sortable(), groupable()),
		"submission.title":    simpleField("submission.title", "string", "Submission title", "s.title", withFilters("eq", "like", "ilike"), sortable(), groupable()),
		"submission.status":   simpleField("submission.status", "string", "Submission status", "s.status", withFilters("eq", "in"), sortable(), groupable()),
		"conference.id":       simpleField("conference.id", "integer", "Conference ID", "c.conference_id", withFilters("eq", "in"), sortable(), groupable()),
		"conference.title":    simpleField("conference.title", "string", "Conference title", "c.title", withFilters("eq", "like", "ilike"), sortable(), groupable()),
		"conference.acronym":  simpleField("conference.acronym", "string", "Conference acronym", "c.acronym", withFilters("eq", "like", "ilike", "in"), sortable(), groupable()),
		"reviewer.email": {
			meta: ResourceField{
				Name:          "reviewer.email",
				Type:          "string",
				Description:   "Reviewer email when visible to the current user",
				Selectable:    true,
				Filterable:    true,
				Groupable:     true,
				Sortable:      true,
				Operators:     []string{"eq", "in", "like", "ilike"},
				Aggregates:    []string{"count"},
				RedactionNote: "Only chairs/co-chairs can see other reviewers. Reviewers can only see their own identity.",
			},
			expression: func(actor Actor) sqlFragment {
				return sqlFragment{
					sql: `CASE WHEN EXISTS (
						SELECT 1 FROM conference_user_roles cur_reviewer
						WHERE cur_reviewer.conference_id = a.conference_id
						  AND cur_reviewer.user_email = ?
						  AND cur_reviewer.status = 'active'
						  AND cur_reviewer.role IN ('chair', 'co_chair')
					) OR a.reviewer_email = ? THEN a.reviewer_email ELSE NULL END`,
					args: []interface{}{actor.UserEmail, actor.UserEmail},
				}
			},
		},
		"actor_role": {
			meta: ResourceField{
				Name:        "actor_role",
				Type:        "string",
				Description: "How the current user can see this assignment",
				Selectable:  true,
			},
			expression: func(actor Actor) sqlFragment {
				return sqlFragment{
					sql: `CASE
						WHEN EXISTS (SELECT 1 FROM conference_user_roles cur_role WHERE cur_role.conference_id = a.conference_id AND cur_role.user_email = ? AND cur_role.status = 'active' AND cur_role.role IN ('chair', 'co_chair')) THEN 'chair'
						WHEN a.reviewer_email = ? THEN 'reviewer'
						ELSE NULL
					END`,
					args: []interface{}{actor.UserEmail, actor.UserEmail},
				}
			},
		},
	}

	return &resourceDefinition{
		schema: ResourceSchema{
			Name:        "assignments",
			Description: "Assignments visible to the current user as assigned reviewer or chair/co-chair",
			Fields:      sortedFields(fields),
			PolicyNotes: []string{
				"Rows are limited to assignments related to the current user.",
				"Reviewer identity is masked unless the current user chairs the conference or the row belongs to them.",
			},
		},
		from: "paper_assignments a",
		joins: []string{
			"JOIN conference_submissions s ON s.submission_id = a.submission_id",
			"JOIN conferences c ON c.conference_id = a.conference_id",
		},
		defaultLimit: 25,
		maxLimit:     100,
		scope: func(actor Actor) sqlFragment {
			return sqlFragment{
				sql: `(EXISTS (SELECT 1 FROM conference_user_roles cur WHERE cur.conference_id = a.conference_id AND cur.user_email = ? AND cur.status = ? AND cur.role IN (?, ?))
					OR a.reviewer_email = ?)`,
				args: []interface{}{actor.UserEmail, model.RoleStatusActive, model.RoleChair, model.RoleCoChair, actor.UserEmail},
			}
		},
		fields: fields,
	}
}

func buildConferenceStatsResource() *resourceDefinition {
	fields := map[string]fieldDefinition{
		"conference.id":              simpleField("conference.id", "integer", "Conference ID", "c.conference_id", withFilters("eq", "in"), sortable(), groupable()),
		"conference.title":           simpleField("conference.title", "string", "Conference title", "c.title", withFilters("eq", "like", "ilike"), sortable(), groupable()),
		"conference.acronym":         simpleField("conference.acronym", "string", "Conference acronym", "c.acronym", withFilters("eq", "like", "ilike", "in"), sortable(), groupable()),
		"conference.status":          simpleField("conference.status", "string", "Conference status", "c.status", withFilters("eq", "in"), sortable(), groupable(), aggregatable("count")),
		"updated_at":                 simpleField("updated_at", "datetime", "Conference update timestamp", "c.updated_at", withFilters("gte", "lte", "gt", "lt"), sortable()),
		"submission_total":           simpleField("submission_total", "integer", "Total submissions", "(SELECT COUNT(*) FROM conference_submissions s_stats WHERE s_stats.conference_id = c.conference_id)", withFilters("eq", "gte", "lte", "gt", "lt"), sortable(), aggregatable("sum", "avg", "max", "min")),
		"submission_submitted_count": simpleField("submission_submitted_count", "integer", "Submitted or reviewing submissions", "(SELECT COUNT(*) FROM conference_submissions s_stats WHERE s_stats.conference_id = c.conference_id AND s_stats.status IN ('submitted', 'reviewing'))", withFilters("eq", "gte", "lte", "gt", "lt"), sortable(), aggregatable("sum", "avg", "max", "min")),
		"submission_accepted_count":  simpleField("submission_accepted_count", "integer", "Accepted submissions", "(SELECT COUNT(*) FROM conference_submissions s_stats WHERE s_stats.conference_id = c.conference_id AND s_stats.status = 'accepted')", withFilters("eq", "gte", "lte", "gt", "lt"), sortable(), aggregatable("sum", "avg", "max", "min")),
		"submission_rejected_count":  simpleField("submission_rejected_count", "integer", "Rejected submissions", "(SELECT COUNT(*) FROM conference_submissions s_stats WHERE s_stats.conference_id = c.conference_id AND s_stats.status = 'rejected')", withFilters("eq", "gte", "lte", "gt", "lt"), sortable(), aggregatable("sum", "avg", "max", "min")),
		"assignment_total":           simpleField("assignment_total", "integer", "Total assignments", "(SELECT COUNT(*) FROM paper_assignments a_stats WHERE a_stats.conference_id = c.conference_id)", withFilters("eq", "gte", "lte", "gt", "lt"), sortable(), aggregatable("sum", "avg", "max", "min")),
		"review_completed_count":     simpleField("review_completed_count", "integer", "Completed reviews", "(SELECT COUNT(*) FROM paper_assignments a_stats WHERE a_stats.conference_id = c.conference_id AND a_stats.status = 'completed')", withFilters("eq", "gte", "lte", "gt", "lt"), sortable(), aggregatable("sum", "avg", "max", "min")),
		"review_pending_count":       simpleField("review_pending_count", "integer", "Pending reviews", "((SELECT COUNT(*) FROM paper_assignments a_stats WHERE a_stats.conference_id = c.conference_id) - (SELECT COUNT(*) FROM paper_assignments a_stats WHERE a_stats.conference_id = c.conference_id AND a_stats.status = 'completed'))", withFilters("eq", "gte", "lte", "gt", "lt"), sortable(), aggregatable("sum", "avg", "max", "min")),
	}

	return &resourceDefinition{
		schema: ResourceSchema{
			Name:        "conference_stats",
			Description: "Per-conference statistics visible only to chairs and co-chairs",
			Fields:      sortedFields(fields),
			PolicyNotes: []string{
				"Rows are limited to conferences where the current user is chair or co-chair.",
				"All fields are pre-aggregated per conference and can be re-aggregated in the DSL.",
			},
		},
		from:         "conferences c",
		defaultLimit: 25,
		maxLimit:     100,
		scope: func(actor Actor) sqlFragment {
			return sqlFragment{
				sql:  `EXISTS (SELECT 1 FROM conference_user_roles cur WHERE cur.conference_id = c.conference_id AND cur.user_email = ? AND cur.status = ? AND cur.role IN (?, ?))`,
				args: []interface{}{actor.UserEmail, model.RoleStatusActive, model.RoleChair, model.RoleCoChair},
			}
		},
		fields: fields,
	}
}

func buildNotificationsResource() *resourceDefinition {
	fields := map[string]fieldDefinition{
		"id":                 simpleField("id", "integer", "Notification ID", "n.id", withFilters("eq", "in"), sortable(), groupable(), aggregatable("count")),
		"type":               simpleField("type", "string", "Notification type", "n.type", withFilters("eq", "in"), sortable(), groupable(), aggregatable("count")),
		"title":              simpleField("title", "string", "Notification title", "n.title", withFilters("eq", "like", "ilike"), sortable(), groupable()),
		"message":            simpleField("message", "string", "Notification body", "n.message", withFilters("eq", "like", "ilike"), sortable()),
		"read":               simpleField("read", "boolean", "Read state", "n.read", withFilters("eq"), sortable(), groupable(), aggregatable("count")),
		"action_url":         simpleField("action_url", "string", "Notification action URL", "n.action_url", withFilters("eq", "like", "ilike"), sortable()),
		"created_at":         simpleField("created_at", "datetime", "Notification creation timestamp", "n.created_at", withFilters("gte", "lte", "gt", "lt"), sortable()),
		"conference.id":      simpleField("conference.id", "integer", "Conference ID", "c.conference_id", withFilters("eq", "in"), sortable(), groupable()),
		"conference.acronym": simpleField("conference.acronym", "string", "Conference acronym", "c.acronym", withFilters("eq", "like", "ilike", "in"), sortable(), groupable()),
	}

	return &resourceDefinition{
		schema: ResourceSchema{
			Name:        "notifications",
			Description: "Notifications belonging to the current user",
			Fields:      sortedFields(fields),
			PolicyNotes: []string{
				"Rows are limited to notifications belonging to the current user.",
			},
		},
		from: "notifications n",
		joins: []string{
			"LEFT JOIN conferences c ON c.conference_id = n.conference_id",
		},
		defaultLimit: 25,
		maxLimit:     100,
		scope: func(actor Actor) sqlFragment {
			return sqlFragment{
				sql:  "n.user_email = ?",
				args: []interface{}{actor.UserEmail},
			}
		},
		fields: fields,
	}
}
