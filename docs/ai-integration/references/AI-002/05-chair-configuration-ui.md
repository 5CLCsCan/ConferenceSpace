# AI-002 Chair Configuration UI

## Existing Backend Data Model

The Go backend already persists `DeskRejectionSettings` inside `ConferenceConfiguration`, which includes rule-oriented fields and an LLM steering surface. The wizard currently does not expose any of these fields (`backend/internal/dto/conference.go:5-29`, `frontend/components/wizard/creation/steps/policy-guidelines.tsx`).

### Fields Already Available In `DeskRejectionSettings`

| Field | Type | Purpose |
| ----- | ---- | ------- |
| `enabled` | `*bool` | Master toggle for submission gating. |
| `min_references` | `*int` | Minimum number of references required. |
| `required_sections` | `[]string` | Section headings that must be present (e.g., `["Abstract", "Introduction", "Conclusion"]`). |
| `title_max_words` | `*int` | Maximum word count for the submission title. |
| `max_sentence_words` | `*int` | Maximum words per sentence (readability heuristic). |
| `thresholds` | `DeskRejectionThresholds` | Score thresholds for `desk_reject` and `accept` decisions. |
| `weights` | `map[string]float64` | Rule weight overrides for scoring. |
| `custom_rules` | `DeskRejectionCustomRules` | Extended rules: `min_datasets`, `minimum_tables`, `author_anonymization_required`, `critical_keywords_required`, `banned_phrases`. |
| `scope_keywords` | `[]string` | Keywords defining conference scope for relevance checks. |
| `prompt_fragments` | `[]string` | LLM steering prompt fragments provided by the chair. |

## Wizard UI Design: Submission Gating Section

A new `WizardFormCard` should be added to the `PolicyGuidelinesStep` (Step 3) or introduced as a dedicated step. Given the amount of configuration, a subsection within Policy & Guidelines is preferred for v1.

### Section 1: Submission Gating Toggle

- **Master toggle**: "Enable AI-Powered Submission Gating"
- When disabled, no precheck runs at upload time and no enforcement at publish time.
- Maps to `desk_rejection_settings.enabled`.

### Section 2: Basic Rules

Deterministic rules that produce hard verdicts without LLM involvement.

| UI Control | Maps To | Default |
| ---------- | ------- | ------- |
| Minimum References (number input) | `desk_rejection_settings.min_references` | 10 |
| Required Sections (tag input) | `desk_rejection_settings.required_sections` | `["Abstract", "Introduction", "Conclusion", "References"]` |
| Title Max Words (number input) | `desk_rejection_settings.title_max_words` | 20 |
| Author Anonymization Required (checkbox) | `desk_rejection_settings.custom_rules.author_anonymization_required` | `true` when review type is `double-blind` |
| Banned Phrases (tag input) | `desk_rejection_settings.custom_rules.banned_phrases` | `[]` |
| Scope Keywords (tag input) | `desk_rejection_settings.scope_keywords` | derived from conference `domain` / `topics` |

### Section 3: Steering Prompt

A free-text area where the chair provides natural-language instructions for the LLM-based content evaluation.

- **UI element**: Multi-line textarea with character count and placeholder guidance.
- **Placeholder text**: "e.g., Reject papers that focus on classical machine learning without a deep learning component. Flag papers that do not address reproducibility or lack an ethics statement."
- **Maps to**: `desk_rejection_settings.prompt_fragments` (stored as a single-element array containing the full prompt text, or split by paragraph for granularity).
- **Character limit**: 2000 characters for v1.

### Section 4: Preview / Examples (optional v1+)

A read-only panel that summarizes the active gating configuration:
- Number of active deterministic rules
- Steering prompt preview (truncated)
- Estimated strictness level based on enabled rules

## LLM Evaluation Architecture

### Verdict Hierarchy

The deterministic rules and the LLM-steered evaluation contribute to the verdict differently:

| Source | Can Produce `block`? | Can Produce `warn`? | Can Produce `pass`? |
| ------ | -------------------- | ------------------- | ------------------- |
| Deterministic rules (binary integrity, policy evaluation) | Yes | Yes | Yes |
| LLM-steered content evaluation | No | Yes | Yes |

The LLM-steered evaluation can flag concerns and produce `warn` findings, but **cannot unilaterally `block` a submission**. Only deterministic rule failures can `block`. This preserves the guarantee that a chair-misconfigured or hallucinated LLM prompt cannot silently reject papers.

### Pipeline Integration

The LLM-steered evaluation runs as a new stage between `fact_derivation` and `policy_evaluation`:

| Stage | Input | Output |
| ----- | ----- | ------ |
| `content_evaluation` | `ExtractedDocument`, `SubmissionFacts`, `PolicySnapshot.steering_prompt` | `ContentFindings` (advisory-level findings only) |

- This stage is **skipped** when `prompt_fragments` is empty or `desk_rejection_settings.enabled` is false.
- The LLM call uses the extracted document text and the chair's steering prompt to produce structured findings.
- Findings from this stage are tagged with `source: "llm_content_evaluation"` so they can be distinguished from deterministic findings in the UI and audit trail.

### Request Contract Extension

The `policy` object in the AI-002 request contract should include the steering prompt:

```json
{
  "policy": {
    "maximum_pages": 8,
    "submission_format": "PDF",
    "review_type": "double-blind",
    "desk_rejection_settings": {
      "enabled": true,
      "min_references": 10,
      "required_sections": ["Abstract", "Introduction", "Conclusion", "References"],
      "title_max_words": 20,
      "custom_rules": {
        "author_anonymization_required": true,
        "banned_phrases": ["as shown in our previous work"]
      },
      "scope_keywords": ["deep learning", "transformer", "attention"],
      "prompt_fragments": ["Reject papers that focus on classical ML without deep learning. Flag papers missing an ethics statement."]
    },
    "workflow_settings": {
      "strict_deadlines": false
    }
  }
}
```

## Frontend Form Data Extension

`ConferenceFormData` in `types.ts` needs new fields:

```typescript
// Step 3: Policy & Guidelines - Submission Gating
submissionGatingEnabled: boolean
minReferences: number
requiredSections: string[]
titleMaxWords: number
authorAnonymizationRequired: boolean
bannedPhrases: string[]
scopeKeywords: string[]
steeringPrompt: string
```

These fields are mapped to `desk_rejection_settings` during the `conference-form.ts` serialization step.
