# Why This Match? — Detail Panel for Reviewer Suggestions

**Date**: 2026-04-30
**Status**: Approved
**Branch**: Enhance-AI-Reviewer-Suggestion

## Problem

On the chair's Conference > Assignments > Pending Suggestions tab, each suggested reviewer shows only an opaque percentage badge (e.g. 100%, 20%, 0%). Chairs have no way to understand why a reviewer was suggested for a paper, why a 0%-match reviewer appears in the list, or what checks were performed before the suggestion was made.

## Solution

Replace the bare percentage badge with a rich, explainable match summary: a concise badge plus an always-visible (collapsible) detail panel that shows the chair exactly why each reviewer was suggested.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Interaction pattern | Inline accordion, expanded by default, collapsible | Matches existing expanded-row pattern in reviews tab; keeps context close; allows comparing multiple reviewers |
| Data strategy | Store all metadata at suggestion-creation time | Captures the snapshot of why the system made the suggestion; simpler reads |
| Storage format | Single JSONB `metadata` column on `paper_assignments` | Flexible, one migration, data is only read as a whole blob for display |
| Reviewer load display | Current assignment count only, no max_load denominator | max_load is a transient computed value; raw count is sufficient |
| Legacy suggestions | Graceful degradation, no backfill | Show "breakdown not available" message; old suggestions get replaced by new auto-assign runs |
| UI indicators | Text labels with color/styling only, no icons or emojis | Per user preference |

## Data Model

### Migration

Add a nullable `metadata JSONB` column to `paper_assignments`:

```sql
ALTER TABLE paper_assignments ADD COLUMN metadata JSONB DEFAULT NULL;
```

### Metadata Schema

Written at suggestion-creation time. Structure varies by source:

```json
{
  "source": "auto_pass1" | "auto_pass2" | "manual",
  "matched_keywords": ["NLP", "Transformers"],
  "unmatched_paper_keywords": ["Sentiment Analysis"],
  "extra_reviewer_keywords": ["Computer Vision"],
  "coi_checks": {
    "self_author": "passed",
    "declared_conflicts": "passed",
    "relationship": "passed" | "skipped_neo4j_unavailable"
  },
  "created_at": "2026-04-30T12:00:00Z"
}
```

For `source: "manual"`, keyword fields are empty arrays (no computed match).

## Backend Changes

### 1. Migration

Add `metadata JSONB DEFAULT NULL` to `paper_assignments`.

### 2. Scoring Layer

Extract keyword set decomposition from the Jaccard scorer. The scorer currently computes `|intersection| / |union|` but doesn't expose the individual sets. Expose a method or return struct that provides:
- `matched_keywords` (intersection of paper keywords and reviewer domains)
- `unmatched_paper_keywords` (paper keywords not in reviewer domains)
- `extra_reviewer_keywords` (reviewer domains not in paper keywords)

### 3. Auto-Assign Service (`assignment/service.go`)

After the greedy matcher returns, for each assignment:
1. Compute keyword sets from the scorer's inputs
2. Determine source: check if the paper ID is in `MatchResult.FallbackAssignments` — if yes, `auto_pass2`; otherwise `auto_pass1`
3. Record COI check results from the COI service (which checks were run and their outcomes)
4. Build the metadata JSON blob
5. Persist alongside the assignment

### 4. Manual Add Handler (`POST /assignments/suggestions`)

Build metadata with:
- `source: "manual"`
- Empty keyword arrays
- COI check result from the existing COI warning logic that already runs on manual adds
- Current timestamp as `created_at`

### 5. GET Suggestions Endpoint

Update the response to include:
- `metadata` field (the raw JSONB, deserialized)
- `assignment_count` field (count of non-suggested assignments for this reviewer in this conference, via a count subquery or separate query)

## Frontend Changes

### 1. Updated Types (`lib/api/suggestions.ts`)

Add to `SuggestedReviewer`:
```typescript
metadata: {
  source: "auto_pass1" | "auto_pass2" | "manual";
  matched_keywords: string[];
  unmatched_paper_keywords: string[];
  extra_reviewer_keywords: string[];
  coi_checks: {
    self_author: "passed" | "skipped_neo4j_unavailable";
    declared_conflicts: "passed" | "skipped_neo4j_unavailable";
    relationship: "passed" | "skipped_neo4j_unavailable";
  };
  created_at: string;
} | null;
assignment_count: number;
```

### 2. New `SuggestionDetail` Component

Renders the detail panel from metadata + assignment_count. Sections:

**Score Breakdown**
- Three keyword lists with visual distinction via color/styling:
  - Matched keywords (highlighted, e.g. green text or green background tags)
  - Paper-only unmatched keywords (neutral styling)
  - Reviewer-only extra keywords (neutral styling)
- If all sets are empty: "No keyword data available"

**Match Reasons** (dynamic checklist derived from metadata)
- "Shares N keywords: X, Y, Z" when `matched_keywords` is non-empty
- "Fallback assignment — added to satisfy minimum reviewers per paper" when `source === "auto_pass2"`
- "Manually added by chair — no computed score" when `source === "manual"`

**COI Status**
- One line per check from `coi_checks`, with text status indicator:
  - "Self-author check: Passed"
  - "Declared conflicts check: Passed"
  - "Relationship check: Passed" or "Relationship check: Skipped (graph database unavailable)"

**Reviewer Load**
- "N papers assigned in this conference" (from `assignment_count`)

**Source Footer**
- Source label ("Auto-assign Pass 1", "Auto-assign Pass 2 (Fallback)", "Manual") + formatted `created_at` timestamp

### 3. Updated Suggestion Row

Embed `SuggestionDetail` below each reviewer card. Expanded by default. Collapsible via click on a toggle element.

### 4. Legacy Fallback

When `metadata` is null: show the score badge as today, and a muted text line: "Detailed breakdown not available for suggestions created before this feature."

## Layout

```
┌─────────────────────────────────────────────────┐
│ [Avatar] reviewer@email.com    [85%] [Confirm] [Remove] │
│                                                  │
│  ┌─ Detail Panel (expanded by default) ───────┐ │
│  │                                             │ │
│  │  Score Breakdown                            │ │
│  │  Matched: NLP, Transformers                 │ │
│  │  Paper only: Sentiment Analysis             │ │
│  │  Reviewer only: Computer Vision             │ │
│  │                                             │ │
│  │  Match Reasons                              │ │
│  │  Shares 2 keywords: NLP, Transformers       │ │
│  │  Fallback assignment — added to satisfy     │ │
│  │  minimum reviewers per paper                │ │
│  │                                             │ │
│  │  COI Status                                 │ │
│  │  Self-author check: Passed                  │ │
│  │  Declared conflicts check: Passed           │ │
│  │  Relationship check: Passed                 │ │
│  │                                             │ │
│  │  Reviewer Load                              │ │
│  │  3 papers assigned in this conference       │ │
│  │                                             │ │
│  │  Source: Auto-assign Pass 1 · Apr 30, 2026  │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Edge Cases

- **Score 0% with no fallback flag**: Shouldn't happen in practice (0% assignments come from pass 2), but if it does, show the keyword breakdown normally — empty matched set makes it self-explanatory.
- **Neo4j unavailable during auto-assign**: COI relationship check records `"skipped_neo4j_unavailable"` in metadata. The detail panel shows "Relationship check: Skipped (graph database unavailable)".
- **Reviewer removed from conference after suggestion**: The suggestion still renders with its stored metadata. No special handling — the chair can delete the suggestion.
- **Re-running auto-assign**: Existing suggestions are cleared (current behavior), new ones get fresh metadata. No stale data problem.

## Out of Scope

- No filtering or sorting suggestions by match reason
- No editing metadata after creation
- No export of match explanations
- No changes to the confirmed assignments tab
