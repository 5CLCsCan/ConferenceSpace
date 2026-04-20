# AI Paper Annotation — AI Service Workflow Design

**Date:** 2026-04-18
**Status:** Approved

## Overview

Add a `paper-annotation` workflow to the AI service (Python/FastAPI) that reads a submitted paper, analyzes it section by section, and returns structured inline annotations (strengths, weaknesses, suggestions, questions) with quoted passages. This is the AI service counterpart to the backend Go endpoints and frontend React components already implemented.

## Context

The Go backend already calls `POST /api/v1/workflows/paper-annotation/resolve` on the AI service. The frontend already displays the response. The AI service currently returns 404 because the workflow doesn't exist. This spec covers building it.

## Architecture

Follows the established workflow pattern (`reviewer_pre_read_briefing/` as template):

```
ai-service/app/workflows/paper_annotation/
├── __init__.py
├── schemas.py     # Pydantic request/response models
├── prompts.py     # LLM system prompt
├── runner.py      # Orchestration: cache → extract → LLM → persist
└── router.py      # FastAPI route (/api/v1/workflows/paper-annotation/resolve)
```

Plus:
- `app/repositories/paper_annotation_repo.py` — DB access
- `app/db/models.py` — three new SQLAlchemy models
- Alembic migration — three new tables
- `app/main.py` — registration

## Schemas

### Request

```python
class PaperAnnotationResolveRequest(BaseModel):
    action: Literal["lookup", "generate"]
    conference_id: int
    assignment_id: int
    submission_id: int
    actor: ActorPayload                    # reused from briefing schemas
    submission_state_fingerprint: str
    submission: SubmissionMetadataInput     # reused from briefing schemas
    file_metadata: FileMetadataInput       # reused from briefing schemas
    domain_tags: list[str] = Field(default_factory=list)
```

### Response Artifact

```python
class PaperAnnotationItem(BaseModel):
    category: Literal["strength", "weakness", "suggestion", "question"]
    severity: Literal["minor", "moderate", "major"] | None = None
    quoted_passage: str
    commentary: str
    reviewer_hint: str | None = None

class PaperAnnotationSection(BaseModel):
    section_name: str
    summary: str
    annotations: list[PaperAnnotationItem] = Field(default_factory=list)

class PaperAnnotationGuardrails(BaseModel):
    advisory_only: bool
    no_recommendation: bool
    bias_notices: list[str] = Field(default_factory=list)

class PaperAnnotationArtifact(BaseModel):
    overall_impression: str
    domain_context: str | None = None
    sections: list[PaperAnnotationSection] = Field(default_factory=list)
    guardrails: PaperAnnotationGuardrails
```

### Response Envelope

Same pattern as briefing:
```python
class PaperAnnotationResolveResponse(BaseModel):
    status: Literal["idle", "ready", "stale", "failed"]
    run_id: str | None = None
    cache: PaperAnnotationCacheMetadata
    artifact: PaperAnnotationArtifact | None = None
    error: PaperAnnotationError | None = None
```

## Runner

`PaperAnnotationRunner` — same lifecycle as `ReviewerPreReadBriefingRunner`:

1. **Cache check** — `repo.get_matching_artifact()` for exact fingerprint match
2. **Stale check** — `repo.get_latest_artifact_for_scope()` for same scope but different fingerprint
3. **Lookup action** — return idle (no prior) or stale (prior exists, fingerprint mismatch)
4. **Generate action** — requires `file_bytes`:
   a. Extract document using existing `extract_document()` from briefing runner (PDF/DOCX/LaTeX extractors)
   b. Validate text coverage ratio
   c. Build inference payload (submission metadata + manuscript text + section headings + domain tags)
   d. Call `llm_client.complete_structured()` with `PaperAnnotationArtifact` as response model
   e. Persist via repo
   f. Return ready response

### Inference Payload

```python
{
    "submission": {
        "title": "...",
        "abstract": "...",
        "keywords": [...],
        "track": "..."
    },
    "manuscript": {
        "section_headings": [...],
        "page_count": N,
        "raw_text": "...(truncated to ~24k chars)..."
    },
    "domain_tags": ["machine learning", "nlp"],
    "guardrails": {
        "advisory_only": True,
        "no_recommendation": True,
        "bias_notices": ["This analysis is assistive only and must not replace independent reviewer judgment."]
    }
}
```

## Prompt

System prompt directs the LLM to:

- Read the manuscript section by section
- For each section: write a brief summary, then flag specific passages with annotations
- Each annotation must:
  - Categorize as strength/weakness/suggestion/question
  - Assign severity (minor/moderate/major) for weakness and suggestion only
  - Quote the actual passage from the manuscript text
  - Provide commentary explaining why this matters
  - Optionally include a reviewer hint (what to probe further)
- When domain tags are present, tailor scrutiny to the domain
- Produce an overall impression summarizing key observations across all sections
- Hard constraints: no accept/reject recommendations, no scores, factual tone, grounded in evidence

## Router

Single POST endpoint at `/api/v1/workflows/paper-annotation/resolve`:
- Multipart form data → generate action (with PDF file)
- JSON body → lookup action only
- Same auth via `_require_identity(request)`

## Repository

`PaperAnnotationRepository` with same interface as `ReviewerBriefingRepository`:
- `get_matching_artifact(conference_id, assignment_id, submission_id, actor_id, fingerprint)`
- `get_latest_artifact_for_scope(conference_id, assignment_id, submission_id, actor_id)`
- `save_completed_run(request_payload, artifact_payload, stage_records)`
- `save_failed_run(run_id, request_payload, error_detail, stage_records)`

## DB Models

Three SQLAlchemy models (same structure as briefing):

- `PaperAnnotationRun` — id, conference_id, assignment_id, submission_id, actor_id, submission_state_fingerprint, status, request_json, error_detail, completed_at, created_at
- `PaperAnnotationArtifactModel` — id, run_id, conference_id, assignment_id, submission_id, actor_id, submission_state_fingerprint, artifact_json, generated_at
- `PaperAnnotationStageRecord` — id, run_id, stage_name, status, detail, created_at

## Migration

One Alembic migration creating the three tables with appropriate indexes on (conference_id, assignment_id, submission_id, actor_id, submission_state_fingerprint).

## Registration in main.py

- Import runner and router
- Add `paper_annotation_repo` and `paper_annotation_runner` to `AppContainer`
- Instantiate in `lifespan()`
- `app.include_router(paper_annotation_router)`

## Files Changed

| File | Action |
|------|--------|
| `app/workflows/paper_annotation/__init__.py` | Create |
| `app/workflows/paper_annotation/schemas.py` | Create |
| `app/workflows/paper_annotation/prompts.py` | Create |
| `app/workflows/paper_annotation/runner.py` | Create |
| `app/workflows/paper_annotation/router.py` | Create |
| `app/repositories/paper_annotation_repo.py` | Create |
| `app/repositories/__init__.py` | Modify (add export) |
| `app/db/models.py` | Modify (add 3 models) |
| `app/main.py` | Modify (register workflow) |
| `alembic/versions/xxx_add_paper_annotation.py` | Create |
