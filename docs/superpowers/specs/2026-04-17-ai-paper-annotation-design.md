# AI Paper Annotation Design

**Date:** 2026-04-17
**Branch:** AI-Ciation
**Status:** Approved

## Overview

Add AI-powered inline paper annotations to help reviewers evaluate submissions. The AI reads through the paper and flags specific passages with categorized feedback — strengths, weaknesses, suggestions, and questions — giving reviewers a head start on their evaluation.

This is analogous to automated code review comments, but for academic papers. Both section-level summaries and passage-level annotations are provided.

## Context

### Existing AI Features
- **Reviewer Pre-Read Briefing**: High-level paper overview (contributions, notable elements, attention points, limitations)
- **Review Quality Audit**: Validates reviewer feedback before submission
- **Chair Decision Copilot**: Synthesizes reviews for accept/reject decisions

### Gap
The briefing gives a paper overview but doesn't provide granular, passage-level commentary. Reviewers must read the entire paper without guidance on which specific parts deserve attention. This feature fills that gap.

## Data Model

### PaperAnnotationArtifact

```
PaperAnnotationArtifact
  sections[]
    section_name        string    # e.g., "Introduction", "Methodology"
    summary             string    # Brief assessment of the section overall
    annotations[]
      category          enum      # "strength" | "weakness" | "suggestion" | "question"
      severity          enum      # "minor" | "moderate" | "major" (weakness/suggestion only, null for others)
      quoted_passage    string    # Exact text quoted from the paper
      commentary        string    # AI explanation of why this matters
      reviewer_hint     string?   # Optional: what the reviewer might want to probe
  overall_impression    string    # High-level summary across all sections
  domain_context        string?   # Domain/track used for tailoring, null if generic
  guardrails
    advisory_only       bool      # These are suggestions, not directives
    no_recommendation   bool      # AI does not recommend accept/reject
    bias_notices        string[]  # Any bias caveats
```

### Storage (Assignment domain)

New fields on the assignment record (or a related table):
- `annotation_artifact` — JSONB storing the full artifact
- `annotation_status` — enum: `idle` | `ready` | `stale` | `failed`
- `annotation_fingerprint` — string, SHA256 hash for cache invalidation
- `annotation_generated_at` — timestamp

## Backend Architecture

### AI Service Client (`ai_service/client.go`)

New methods following the existing briefing pattern:
- `GeneratePaperAnnotation(ctx, payload)` — calls AI service to generate annotations
- `LookupPaperAnnotation(ctx, payload)` — looks up cached annotations

**Workflow endpoint:** `POST /api/v1/workflows/paper-annotation/resolve`

**Payload includes:**
- Submission metadata (ID, title, abstract, track, keywords)
- PDF file content
- Domain tags and track name (when available, for domain-aware analysis)

### Controller Endpoints (Assignment controller)

- `GET /api/v1/conferences/{conferenceId}/assignments/{assignmentId}/paper-annotation` — lookup cached annotation
- `POST /api/v1/conferences/{conferenceId}/assignments/{assignmentId}/paper-annotation/generate` — trigger generation

Same authorization as briefing endpoints — reviewer must be assigned to the submission.

### Fingerprinting & Caching

Reuses the same fingerprint strategy as briefing:
- SHA256 of: submission ID, title, abstract, track, keywords, file metadata (name, size, mime type), updated_at
- If submission changes after generation, status becomes `stale`
- Stale artifacts can be refreshed by calling generate again

### Domain-Aware Analysis

The generate request includes domain tags and track name from the submission model. The AI service uses this context to tailor annotations when available (e.g., scrutinize reproducibility for ML papers, proof rigor for theory papers). Falls back to generic analysis when domain info is absent.

## Frontend Integration

### Single UI Surface

All annotation content lives in the existing AI Assistant panel in the review sidebar (`review-sidebar.tsx`), below the briefing content.

### New Files
- `hooks/use-paper-annotation.ts` — state management hook (same pattern as `use-assignment-briefing.ts`)
- `lib/api/paper-annotation.ts` — API client (`getPaperAnnotation`, `generatePaperAnnotation`)
- `components/reviewer/submission-review/paper-annotation-panel.tsx` — annotation display component

### Generation Flow
When the reviewer clicks "Generate AI Briefing":
1. Frontend fires two parallel requests: briefing generate + annotation generate
2. Each loads independently with its own loading/error state
3. Both display in the same sidebar panel

### Annotation Display
- **Overall impression** at the top of the annotation section
- **Collapsible sections** matching the paper's structure
- Each section shows its summary, then individual annotation cards
- **Annotation card layout:**
  - Category badge (color-coded: green=strength, red=weakness, amber=suggestion, blue=question)
  - Severity indicator (weakness/suggestion only)
  - Quoted passage in blockquote style
  - Commentary text
  - Reviewer hint as a subtle callout (when present)

### Text-Based References (Phase 1)
Annotations reference paper content via quoted passages and section names. No PDF coordinate mapping in this phase — designed to allow adding location-based highlighting in the future.

## Review Audit Integration

The existing review quality audit accepts optional context. Extend the audit request payload to include the annotation artifact alongside the briefing artifact. This allows the audit to check whether the reviewer addressed major issues flagged by annotations.

No changes to the audit workflow itself — just additional context in the payload.

## Guardrails

Following the established pattern across all AI features:
- `advisory_only: true` — annotations are suggestions, not directives
- `no_recommendation: true` — AI does not recommend accept/reject
- Bias notices surfaced when applicable
- Reviewer maintains full autonomy over their evaluation

## Migration

New database migration: `create_paper_annotation_fields`
- Adds annotation columns to the assignment table (or creates a related table)
- Fields: `annotation_artifact` (JSONB), `annotation_status` (varchar), `annotation_fingerprint` (varchar), `annotation_generated_at` (timestamp)

## Summary of Changes

| Layer | What Changes |
|-------|-------------|
| AI Service Client | New `GeneratePaperAnnotation` / `LookupPaperAnnotation` methods |
| Controller | New annotation GET/POST endpoints under assignment |
| Storage | New annotation fields on assignment |
| Migration | New migration for annotation columns |
| Frontend Hook | New `use-paper-annotation.ts` |
| Frontend API | New `paper-annotation.ts` client |
| Frontend UI | New annotation panel component, extended AI Assistant card |
| Review Audit | Pass annotation artifact as additional context |
