# ConferenceSpace R1-R6 Remediation (2026-03-08)

## Objective
Implement a production-ready remediation for requirements R1-R6 across backend and frontend, replacing placeholder behavior with enforced contracts, role-aware authorization, persistence-backed lifecycle handling, and UI wiring.

## Scope Decisions (Locked)
- Settings scope: all currently visible settings controls in active pages.
- Desk rejection policy: hard block submit/publish when decision is not `accept_for_review`.
- Recent conferences: existing conference list data only (`myConferences=true`, role filter, sorted by update/create timestamp).
- Unused endpoint strategy: wire-or-remove, with explicit audit and deprecation notes.
- Optional infra fallback: Gemini/Neo4j remain optional; non-availability degrades gracefully, runtime failures surface explicit categories.

## Execution Checklist

### R1 Recent Conferences
- [x] Replace sidebar mock recent conferences list with API-backed data.
- [x] Query `/api/v1/conferences` with `myConferences=true` and current role.
- [x] Sort by `updated_at DESC`, then `created_at DESC`.
- [x] Add loading, empty, and failure states.
- [x] Keep existing sidebar rendering style.

### R2 Desk Rejection & Hard Gate
- [x] Re-enable real precheck pipeline in submission precheck controller.
- [x] Remove temporary always-pass response.
- [x] Map conference configuration to paper rule config (thresholds, weights, custom rules, prompt fragments, scope keywords).
- [x] Add explicit precheck error categorization (`extraction_failed`, `llm_evaluation_failed`, `pipeline_failed`).
- [x] Fix aggregator normalization and threshold handling.
- [x] Implement non-placeholder scope checker logic.
- [x] Prevent checker registry mutation leakage by request-scoped custom checkers.
- [x] Tighten LLM response parsing with deterministic fallback checks.
- [x] Enforce hard gate on create/publish and return typed `422 PRECHECK_BLOCKED`.
- [x] Wire frontend submit flow to display and respect blocking state.

### R3 Settings / Config Wiring
- [x] Wire sidebar language switch to real i18n locale state.
- [x] Replace settings no-op actions in conference header, submission header, and conference cards.
- [x] Add backend notification preference read/write contract.
- [x] Wire notifications settings icon to real preferences modal + save.
- [x] Persist additional conference configuration sub-objects (desk-rejection/discussion/rebuttal/workflow).
- [x] Discussion settings adapter now consumes backend conference config (review mode and deadlines).
- [x] Rebuttal tabs now derive settings from backend conference config instead of fixed constants.
- [ ] Full rebuttal persistence contract (backend mutation APIs) remains pending.

### R4 Profile Sync Robustness
- [x] Fix nullable semantic field update semantics with explicit set flags.
- [x] Make unlink reliably clear `semantic_scholar_id` and `profile_sync_status`.
- [x] Add migration to enforce unique `scholar_profiles.user_id`.
- [x] Make sync relinking atomic by replacing profile-paper links in one transaction.
- [x] Add per-user sync locking for race-safe/idempotent sync calls.
- [x] Add dedicated sync status endpoint.
- [x] Surface sync lifecycle in profile UI (`pending/completed/failed`), disable conflicting actions during pending, and add retry affordance.
- [x] Normalize semantic sync fields into auth/session user state.

### R5 COI Hardening
- [x] Add chair/admin authorization checks for COI dashboard/list/check/paper/rebuild operations.
- [x] Replace in-memory COI staleness state with DB-backed `coi_refresh_state`.
- [x] Persist rebuild timestamps on successful rebuild.
- [x] Reduce enrichment N+1 impact with request-scoped reviewer/author caches.
- [x] Improve persisted relationship descriptions with evidence path hints.

### R6 Route Inventory / Wire-or-Remove
- [x] Re-audited route inventory in backend router registration.
- [x] Wired additional settings contracts to existing UI surfaces.
- [ ] Final endpoint-by-endpoint deprecation/removal PR (candidates: `GET /users`, `DELETE /users/:email`, `GET /users/:email/coi-check`, reviewer detail route) to follow after usage telemetry cut.

## Owner / Status Table
| Workstream | Owner | Status | Notes |
|---|---|---|---|
| R1 Sidebar recent conferences | Agent | Done | API-backed with role filter + fallback states |
| R2 precheck re-enable | Agent | Done | Controller restored, categorized failures |
| R2 scoring/checker quality | Agent | Done | Aggregator normalization + scope checker + custom checker isolation |
| R2 LLM parser/prompt quality | Agent | Done | Prompt fragments + schema fallback defaults |
| R2 hard gate contract | Agent | Done | Backend 422 typed payload + frontend CTA gating |
| R3 global settings wiring | Agent | In Progress | Core controls wired; rebuttal write APIs still pending |
| R3 notification preferences contract | Agent | Done | Backend endpoints + frontend modal |
| R4 data integrity and idempotency | Agent | Done | Unique user profile, atomic relink, race-safe sync |
| R4 profile sync UX lifecycle | Agent | Done | Pending/failed/completed state surfaced |
| R5 COI authorization and staleness persistence | Agent | Done | DB timestamp state + role guard |
| R5 COI query quality | Agent | Done | Enrichment caches + evidence detail improvement |
| R6 deprecation/removal actions | Agent | Partial | Audit complete; removal pass pending separate migration PR |

## File Touch Map (Implementation)
- Backend desk rejection and precheck:
  - `backend/internal/controller/submission/precheck.go`
  - `backend/internal/controller/submission/precheck_gate.go`
  - `backend/internal/controller/submission/submission.go`
  - `backend/internal/deskrejection/aggregator/aggregator.go`
  - `backend/internal/deskrejection/checkers/built_in.go`
  - `backend/internal/deskrejection/checkers/custom.go`
  - `backend/internal/deskrejection/checkers/registry.go`
  - `backend/internal/deskrejection/evaluator/llm.go`
  - `backend/internal/deskrejection/extractor/extractor.go`
  - `backend/internal/deskrejection/pipeline/pipeline.go`
  - `backend/internal/deskrejection/drerrors/errors.go`
  - `backend/internal/deskrejection/models/models.go`
  - `backend/internal/deskrejection/config/config.go`
- Backend contracts, handlers, and migrations:
  - `backend/internal/handler/handler.go`
  - `backend/internal/dto/submission.go`
  - `backend/internal/dto/conference.go`
  - `backend/internal/dto/user.go`
  - `backend/internal/dto/notification.go`
  - `backend/internal/model/notification.go`
  - `backend/migrations/000027_add_unique_user_to_scholar_profiles.up.sql`
  - `backend/migrations/000027_add_unique_user_to_scholar_profiles.down.sql`
  - `backend/migrations/000028_create_coi_refresh_state.up.sql`
  - `backend/migrations/000028_create_coi_refresh_state.down.sql`
- Backend profile sync:
  - `backend/internal/controller/user/link_profile.go`
  - `backend/internal/controller/user/user.go`
  - `backend/internal/controller/semantic_scholar/semantic_scholar.go`
  - `backend/internal/controller/semantic_scholar/sync.go`
  - `backend/internal/storage/user/user.go`
  - `backend/internal/storage/scholar/scholar.go`
- Backend COI:
  - `backend/internal/controller/coi/coi.go`
  - `backend/internal/service/coi/service.go`
  - `backend/internal/storage/coi/coi.go`
  - `backend/internal/controller/controller.go`
  - `backend/cmd/server/main.go`
- Frontend R1/R2/R3/R4:
  - `frontend/components/dashboard-sidebar.tsx`
  - `frontend/components/author/submit/file-upload-step.tsx`
  - `frontend/components/author/submit/paper-submission-form.tsx`
  - `frontend/components/author/submit/precheck-results.tsx`
  - `frontend/lib/api/papers.ts`
  - `frontend/lib/api/conferences.ts`
  - `frontend/lib/api/user.ts`
  - `frontend/lib/api/notifications.ts`
  - `frontend/lib/auth-context.tsx`
  - `frontend/lib/types.ts`
  - `frontend/app/notifications/page.tsx`
  - `frontend/app/profile/[user_id]/page.tsx`
  - `frontend/components/chair/conference-detail/conference-detail-header.tsx`
  - `frontend/components/chair/conference-detail/submission-detail-header.tsx`
  - `frontend/components/conference/conference-cards.tsx`
  - `frontend/components/shared/discussion/api-adapter.ts`
  - `frontend/components/chair/conference-detail/submission-detail/chair-discussion-tab.tsx`
  - `frontend/components/author/submission-detail/discussion-tab.tsx`
  - `frontend/components/reviewer/submission-review/discussion-tab.tsx`
  - `frontend/components/shared/rebuttal/mock-data.ts`
  - `frontend/components/shared/rebuttal/index.ts`
  - `frontend/components/author/submission-detail/rebuttal-tab.tsx`
  - `frontend/components/reviewer/submission-review/rebuttal-tab.tsx`
  - `frontend/app/role/chair/conferences/new/page.tsx`

## Validation Checklist
- [x] Run backend compile/unit scope (`GOCACHE=/tmp/go-build go test ./internal/... ./cmd/server`) and fix compile regressions.
- [x] Run frontend lint + type check (`npm run lint`, `npx tsc --noEmit`) and fix TS regressions.
- [ ] Run full frontend production build (`npm run build`) in network-enabled environment (sandbox cannot resolve `fonts.googleapis.com`).
- [ ] Validate migrations apply cleanly in sequence.
- [ ] Verify precheck blocked path returns `422` with structured payload.
- [ ] Verify profile link/sync/unlink lifecycle in UI with status transitions.
- [ ] Verify notifications preference read/update round-trip.
- [ ] Verify COI routes enforce chair/admin authorization.

## Verification Notes (Executed)
- Backend compile scope passed after fixing temp-file UUID dependency regression.
- Frontend lint passed after fixing profile sync effect dependencies.
- Frontend TypeScript passed after fixing `PrecheckResult` type typo in file upload precheck state.
- Frontend `next build` currently fails only due sandbox DNS restrictions fetching Google Fonts; this is environment-related, not a code type/lint failure.
