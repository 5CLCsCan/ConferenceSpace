# Skill: Workload / Deadline-Risk / SLA Insights

## When To Use

Use this skill when the user asks about workload pressure, deadline risk, overdue review risk, SLA pressure, invitation backlog, or mitigation options for review capacity.

Typical prompts:

- "Summarize my review workload risk."
- "Which reviewers are most at risk of missing deadlines?"
- "Do I have too many pending reviews?"
- "Give me an SLA risk summary for review assignments."

## Goal

Produce a concise, evidence-backed workload and deadline-risk summary plus suggested mitigations. Do not over-interpret sparse data.

## Required Behavior

1. Use `query_engine` for current-state evidence.
2. Use `{"op":"describe"}` first if the available assignment or notification fields are unclear.
3. Prefer `assignments` for workload, due-date, completion, and status signals.
4. Use `notifications` only if it materially helps explain invitation backlog or recent review-related alerts.
5. Use `conference_stats` only when the user explicitly asks for aggregate chair-facing rollups that cannot be answered from assignment rows alone.
6. Keep the query set narrow. Do not run near-identical exploratory queries.
7. If you use `group_by`, you must also use `aggregates`; for grouped counts or status breakdowns, use an explicit aggregate like `{"fn":"count","field":"id","as":"assignment_count"}` instead of selecting `id` with an alias.
8. If the retrieved data is sparse or missing due dates, say so explicitly and lower confidence.

## Analysis Workflow

1. Identify whether the question is reviewer-scoped, chair-scoped, or mixed.
2. Retrieve the minimum fields needed to assess:
   - assignment status
   - due dates or deadlines
   - completion state
   - invitation acceptance or pending state if available
   - conference identifiers needed to group or explain risk
3. Derive the risk summary from retrieved evidence only:
   - workload risk: too many open items, concentration of pending reviews, invitation pile-up
   - deadline risk: upcoming deadlines, overdue items, tight clustering of due dates
   - SLA risk: open items that appear stalled, aging pending work, persistent non-completion
4. Distinguish direct evidence from inference. If a mitigation is inferred, label it as inferred.
5. If data is incomplete, say what is missing and how that limits the assessment.

## Output Format

Use this exact structure unless the user asks for a different format:

```
## Overall Risk

One short paragraph summarizing the current workload/deadline/SLA posture.

## Key Signals

- Total open review workload and the most important distribution signal
- Deadline or overdue risk signal
- Invitation or acceptance backlog signal, if available
- Sparse-data caveat, if applicable

## Suggested Mitigations

- 2 to 4 concrete next actions grounded in the retrieved evidence
- Mark any mitigation that is inferred rather than directly supported by a field
```

## Guardrails

- Do not invent SLAs, deadlines, or reviewer capacity.
- Do not claim certainty from a small number of rows.
- Do not expose hidden identities or private data outside the tool results.
- If no meaningful risk signal is available, say that clearly instead of manufacturing concern.
