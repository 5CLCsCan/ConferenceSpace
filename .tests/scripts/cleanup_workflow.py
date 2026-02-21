from __future__ import annotations

import copy
from typing import Any

from .common import ApiError, BackendClient, TestUserSeed, unwrap_data, utc_now_iso

DEFAULT_CHAIR_SEED = TestUserSeed(
    email="test.discussion.chair@example.com",
    first_name="Test",
    last_name="Chair",
)


def _to_int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _extract_conference_ids(value: Any) -> list[int]:
    if not isinstance(value, list):
        return []
    result: list[int] = []
    for item in value:
        parsed = _to_int(item)
        if parsed is not None and parsed not in result:
            result.append(parsed)
    return result


def collect_state_conference_ids(state: dict[str, Any]) -> list[int]:
    entities = state.get("entities") if isinstance(state, dict) else None
    cleanup_targets = state.get("cleanup_targets") if isinstance(state, dict) else None

    ids: list[int] = []

    if isinstance(entities, dict):
        for key in ("conference_id", "open_conference_id"):
            parsed = _to_int(entities.get(key))
            if parsed is not None and parsed not in ids:
                ids.append(parsed)
        for key in ("conference_ids", "seeded_conference_ids"):
            for parsed in _extract_conference_ids(entities.get(key)):
                if parsed not in ids:
                    ids.append(parsed)

    if isinstance(cleanup_targets, dict):
        for parsed in _extract_conference_ids(cleanup_targets.get("conference_ids")):
            if parsed not in ids:
                ids.append(parsed)

    return sorted(ids)


def _extract_conference_rows(payload: Any) -> tuple[list[dict[str, Any]], int | None]:
    data = unwrap_data(payload)
    if isinstance(data, list):
        rows = [item for item in data if isinstance(item, dict)]
        return rows, len(rows)

    if not isinstance(data, dict):
        return [], None

    raw_rows = data.get("conferences")
    rows: list[dict[str, Any]] = []
    if isinstance(raw_rows, list):
        rows = [item for item in raw_rows if isinstance(item, dict)]
    elif isinstance(raw_rows, dict) and isinstance(raw_rows.get("data"), list):
        rows = [item for item in raw_rows.get("data") if isinstance(item, dict)]

    total = _to_int(data.get("total"))
    return rows, total


def _conference_matches_prefix(conference: dict[str, Any], prefix: str) -> bool:
    normalized_prefix = prefix.strip().upper()
    if not normalized_prefix:
        return False

    acronym_prefix = normalized_prefix[:6]
    acronym = str(conference.get("acronym") or "").upper()
    title = str(conference.get("title") or conference.get("name") or "").upper()
    return acronym.startswith(acronym_prefix) or title.startswith(normalized_prefix)


def find_conferences_by_prefix(client: BackendClient, token: str, prefix: str) -> list[int]:
    if not prefix.strip():
        return []

    limit = 100
    discovered: list[int] = []

    for base_params in (
        {"limit": str(limit), "myConferences": "true"},
        {"limit": str(limit)},
    ):
        offset = 0
        while True:
            params = dict(base_params)
            params["offset"] = str(offset)
            try:
                payload, _ = client.request(
                    "GET",
                    "/api/v1/conferences",
                    token=token,
                    params=params,
                    expected_status=(200, 201),
                )
            except ApiError:
                break

            conferences, total = _extract_conference_rows(payload)
            for conference in conferences:
                conference_id = _to_int(conference.get("id"))
                if conference_id is None:
                    continue
                if _conference_matches_prefix(conference, prefix) and conference_id not in discovered:
                    discovered.append(conference_id)

            if not conferences:
                break
            if total is not None and (offset + len(conferences)) >= total:
                break
            if len(conferences) < limit:
                break
            offset += limit

    return sorted(discovered)


def cleanup_seeded_data(
    client: BackendClient,
    *,
    state: dict[str, Any] | None = None,
    prefix: str | None = None,
    chair_seed: TestUserSeed = DEFAULT_CHAIR_SEED,
) -> dict[str, Any]:
    state_data = state or {}
    state_ids = collect_state_conference_ids(state_data)

    login = client.login_test_user(chair_seed)
    token = login.get("token")
    if not token:
        raise RuntimeError("Unable to obtain chair token for cleanup")

    prefix_ids = find_conferences_by_prefix(client, token, prefix or "") if prefix else []
    target_ids = sorted(set(state_ids + prefix_ids))

    deleted: list[int] = []
    already_absent: list[int] = []
    failures: list[dict[str, Any]] = []

    for conference_id in target_ids:
        try:
            _, response = client.request(
                "DELETE",
                f"/api/v1/conferences/{conference_id}",
                token=token,
                expected_status=(200, 201, 202, 204, 404),
            )
            if response.status_code == 404:
                already_absent.append(conference_id)
            else:
                deleted.append(conference_id)
        except ApiError as exc:
            if exc.status_code == 404:
                already_absent.append(conference_id)
            else:
                failures.append(
                    {
                        "conference_id": conference_id,
                        "status_code": exc.status_code,
                        "error": str(exc),
                        "payload": exc.payload,
                    }
                )
        except Exception as exc:  # noqa: BLE001
            failures.append({"conference_id": conference_id, "error": str(exc)})

    status = "pass" if not failures else "partial"
    return {
        "generated_at": utc_now_iso(),
        "base_url": client.base_url,
        "status": status,
        "input": {
            "prefix": prefix,
            "state_conference_ids": state_ids,
            "prefix_conference_ids": prefix_ids,
        },
        "summary": {
            "target_count": len(target_ids),
            "deleted_count": len(deleted),
            "already_absent_count": len(already_absent),
            "failure_count": len(failures),
        },
        "results": {
            "deleted_conference_ids": deleted,
            "already_absent_conference_ids": already_absent,
            "failed": failures,
        },
    }


def apply_cleanup_to_state(state: dict[str, Any], cleanup_report: dict[str, Any]) -> dict[str, Any]:
    cleaned_ids = {
        *(
            cleanup_report.get("results", {}).get("deleted_conference_ids", [])
            if isinstance(cleanup_report, dict)
            else []
        ),
        *(
            cleanup_report.get("results", {}).get("already_absent_conference_ids", [])
            if isinstance(cleanup_report, dict)
            else []
        ),
    }
    normalized_cleaned_ids = {parsed for parsed in (_to_int(value) for value in cleaned_ids) if parsed is not None}

    updated = copy.deepcopy(state)
    entities = updated.get("entities")
    if isinstance(entities, dict):
        for key in ("conference_id", "open_conference_id"):
            parsed = _to_int(entities.get(key))
            if parsed is not None and parsed in normalized_cleaned_ids:
                entities[key] = None

        for key in ("conference_ids", "seeded_conference_ids"):
            value = entities.get(key)
            if isinstance(value, list):
                entities[key] = [
                    item
                    for item in value
                    if (_to_int(item) is None or _to_int(item) not in normalized_cleaned_ids)
                ]

    updated["cleanup"] = {
        "updated_at": utc_now_iso(),
        "status": cleanup_report.get("status"),
        "summary": cleanup_report.get("summary"),
        "removed_conference_ids": sorted(normalized_cleaned_ids),
    }
    return updated
