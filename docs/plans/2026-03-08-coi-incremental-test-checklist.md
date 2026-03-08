# COI Incremental Refresh QA Checklist

Date: 2026-03-08  
Scope: COI dirty-scope refresh (`submission` / `reviewer`) + existing COI APIs/UI behavior

## 1. Compile / static checks

- [ ] Backend compile passes: `GOCACHE=/tmp/go-build go build ./...` (run in `backend`).
- [ ] Frontend typecheck passes: `npm exec -- tsc --noEmit` (run in `frontend`).
- [ ] Frontend lint passes: `npm run lint` (run in `frontend`).

## 2. Migration checks

- [ ] Apply migration `000029_create_coi_dirty_scopes.up.sql` successfully.
- [ ] Confirm table exists: `coi_dirty_scopes`.
- [ ] Confirm constraints:
  - [ ] `scope_type` only allows `conference`, `submission`, `reviewer`.
  - [ ] `PRIMARY KEY (conference_id, scope_type, scope_key)`.
  - [ ] integrity check for `submission_id` / `reviewer_id` per scope type.
- [ ] Confirm index exists: `idx_coi_dirty_scopes_conference_updated`.

## 3. API smoke checks (chair/admin user)

- [ ] `GET /api/v1/coi/dashboard/stats/:conference_id` returns 200.
- [ ] `GET /api/v1/coi/relationships?conference_id=...` returns 200.
- [ ] `GET /api/v1/coi/papers?conference_id=...` returns 200.
- [ ] `GET /api/v1/coi/check/reviewer/:reviewer_id/author/:author_email?conference_id=...` returns 200.
- [ ] `POST /api/v1/coi/conferences/:conference_id/rebuild` returns 200 and counts.

## 4. Authorization checks

- [ ] Non-chair and non-admin user gets 403 for:
  - [ ] dashboard stats
  - [ ] relationships
  - [ ] papers
  - [ ] pair check
  - [ ] rebuild
- [ ] Chair/co-chair can access all above endpoints.
- [ ] Admin token/user can access all above endpoints.

## 5. Dirty-scope creation on writes

### 5.1 Submission write paths
- [ ] Create submission -> one dirty row exists with `scope_type='submission'`.
- [ ] Update submission metadata/file -> dirty submission row exists/updated.
- [ ] Publish submission -> dirty submission row exists/updated.
- [ ] Delete submission -> dirty submission row exists/updated.
- [ ] Update submission status -> dirty submission row exists/updated.

### 5.2 Reviewer write paths
- [ ] Invite reviewer with accepted status -> dirty reviewer row exists.
- [ ] Update reviewer status (accepted/rejected) -> dirty reviewer row exists/updated.
- [ ] Delete reviewer -> dirty reviewer row exists/updated.

## 6. Incremental refresh behavior

### 6.1 Submission scope refresh
- [ ] Create/modify one submission and mark dirty.
- [ ] Call one COI read endpoint (`/relationships` or `/check`).
- [ ] Verify only relationships for that submission are recomputed:
  - [ ] old rows for that submission removed
  - [ ] new rows inserted for that submission
  - [ ] other submissions’ COI rows unchanged
- [ ] Verify dirty row for that submission is removed after successful refresh.

### 6.2 Reviewer scope refresh
- [ ] Change one reviewer and mark dirty.
- [ ] Call one COI read endpoint.
- [ ] Verify only relationships for that reviewer are recomputed:
  - [ ] old rows for that reviewer removed
  - [ ] new rows inserted for that reviewer
  - [ ] other reviewers’ COI rows unchanged
- [ ] Verify dirty row for that reviewer is removed after successful refresh.

### 6.3 Pair check freshness
- [ ] Mark dirty scope.
- [ ] Call `GET /coi/check/reviewer/.../author/...`.
- [ ] Verify dirty scope is processed before response (no stale pair result).

## 7. Full rebuild fallback behavior

- [ ] Set `coi_refresh_state.last_rebuild_at` older than 5 minutes and no dirty scopes.
- [ ] Call COI read endpoint.
- [ ] Verify full rebuild executes and `last_rebuild_at` updates.
- [ ] Insert a `conference` dirty scope (`scope_key='all'`), call read endpoint, verify:
  - [ ] full rebuild runs
  - [ ] all dirty scopes are cleared.

## 8. UI checks (Chair COI page)

- [ ] COI tab loads without errors.
- [ ] Rebuild button works and shows completion/failure message.
- [ ] Severity filter updates table correctly.
- [ ] Search input works (table refreshes without crash).
- [ ] Empty state renders when no relationships.
- [ ] Error state renders if API fails.

## 9. Regression checks

- [ ] Assignment suggestion flow still works.
- [ ] Manual add suggestion still shows COI warning when applicable.
- [ ] Auto-assign still completes and COI data is available afterward.
- [ ] Existing precheck/submit flow unaffected.

## 10. Observability / debugging checks

- [ ] No unexpected panic in COI refresh paths.
- [ ] Warnings are logged if dirty refresh fails.
- [ ] Repeated writes on same scope do not create duplicate dirty rows (upsert works).

## Suggested execution order

1. Compile and migration checks.  
2. API smoke + auth checks.  
3. Dirty-scope write checks.  
4. Incremental refresh checks (submission then reviewer).  
5. Full rebuild fallback checks.  
6. UI and regression checks.
