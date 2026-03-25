# AI-002 Reference Index

## Purpose

This folder is the curated navigation layer for AI-002. The main lifecycle record remains [`AI-002-submission-material-gating.md`](../../AI-002-submission-material-gating.md); these notes point implementers to the exact roadmap, code, and external research needed to work on the feature without re-discovering the system.

## Reference Notes

| Note | Role |
| ---- | ---- |
| [`01-spec-and-recon.md`](./01-spec-and-recon.md) | Normalizes the original AI-002 roadmap scope and the platform recon findings that constrain the workflow boundary. |
| [`02-current-state-audit.md`](./02-current-state-audit.md) | Maps the shipped precheck flow, enforcement hooks, policy surfaces, file constraints, and current `ai-service` boundary. |
| [`03-tooling-research.md`](./03-tooling-research.md) | Records the selected open-source libraries, why they fit AI-002, and which options are explicitly deferred or rejected. |
| [`04-pipeline-design.md`](./04-pipeline-design.md) | Locks the deterministic stage map, state object, route contracts, and Go adapter handshake for implementation. |
| [`05-chair-configuration-ui.md`](./05-chair-configuration-ui.md) | Specifies the conference creation wizard UI for submission gating rules and LLM steering prompt, verdict hierarchy, and pipeline integration. |
| [`06-architecture-and-execution.md`](./06-architecture-and-execution.md) | Full architecture: annotated `ai-service` directory tree, `GatingState` dataclass, state machine diagram, annotated execution trace, DB schema, API contract, and Go proxy adapter behavior. |

## Primary Source Trail

- Roadmap and lifecycle index:
  - [`docs/ai-integration.md`](../../ai-integration.md)
  - [`docs/ai-integration/procedure.md`](../../procedure.md)
- Recon and feature mapping:
  - [`docs/platform-recon.md`](../../../platform-recon.md)
  - [`docs/feature-mapping.md`](../../../feature-mapping.md)
- Frontend advisory precheck:
  - `frontend/lib/api/papers.ts`
  - `frontend/components/author/submit/file-upload-step.tsx`
  - `frontend/components/author/submit/paper-submission-form.tsx`
  - `frontend/components/author/submit/precheck-results.tsx`
- Backend precheck and enforcement precursor:
  - `backend/internal/controller/submission/precheck.go`
  - `backend/internal/controller/submission/precheck_gate.go`
  - `backend/internal/controller/submission/submission.go`
  - `backend/internal/storage/file/file.go`
  - `backend/internal/deskrejection/**`
- `ai-service` target boundary:
  - `ai-service/app/main.py`
  - `ai-service/app/api/routes.py`
  - `ai-service/app/db/models.py`
  - `ai-service/pyproject.toml`
- Chair configuration UI:
  - `frontend/components/wizard/creation/steps/policy-guidelines.tsx`
  - `frontend/components/wizard/creation/types.ts`
  - `frontend/lib/conference-form.ts`
  - `backend/internal/dto/conference.go`

## Reading Order

1. Read [`01-spec-and-recon.md`](./01-spec-and-recon.md) to understand what AI-002 is supposed to do.
2. Read [`02-current-state-audit.md`](./02-current-state-audit.md) to see what already exists and why it is insufficient.
3. Read [`03-tooling-research.md`](./03-tooling-research.md) to understand the chosen library stack.
4. Read [`04-pipeline-design.md`](./04-pipeline-design.md) before implementation starts.
5. Read [`05-chair-configuration-ui.md`](./05-chair-configuration-ui.md) for the wizard UI design and LLM steering prompt integration.
6. Read [`06-architecture-and-execution.md`](./06-architecture-and-execution.md) for the full directory structure, state machine, execution trace, DB schema, and API contract.
