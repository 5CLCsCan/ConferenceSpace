from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from typing import Any

from .common import ApiError, BackendClient, TestUserSeed, unwrap_data, utc_now_iso


@dataclass
class CheckResult:
    check_id: str
    status: str
    message: str
    evidence: Any


def _to_int(value: Any) -> int | None:
    try:
        if value is None:
            return None
        return int(value)
    except (TypeError, ValueError):
        return None


def _normalize_user_seed(role: str, state: dict[str, Any]) -> TestUserSeed:
    defaults = {
        "chair": TestUserSeed("test.discussion.chair@example.com", "Test", "Chair"),
        "reviewer": TestUserSeed("test.discussion.reviewer@example.com", "Test", "Reviewer"),
        "author": TestUserSeed("test.discussion.author@example.com", "Test", "Author"),
    }
    role_data = (state.get("users") or {}).get(role) or {}
    default = defaults[role]
    return TestUserSeed(
        email=role_data.get("email") or default.email,
        first_name=role_data.get("first_name") or default.first_name,
        last_name=role_data.get("last_name") or default.last_name,
    )


def _extract_assignments(payload: Any) -> list[dict[str, Any]]:
    data = unwrap_data(payload)
    if not isinstance(data, dict):
        return []
    raw = data.get("recent_assignments")
    if isinstance(raw, list):
        return [item for item in raw if isinstance(item, dict)]
    if isinstance(raw, dict) and isinstance(raw.get("data"), list):
        return [item for item in raw.get("data") if isinstance(item, dict)]
    return []


def _first_thread_id(threads_payload: Any) -> int | None:
    data = unwrap_data(threads_payload)
    if not isinstance(data, dict):
        return None
    threads = data.get("threads")
    if not isinstance(threads, list):
        return None
    for thread in threads:
        if isinstance(thread, dict):
            thread_id = _to_int(thread.get("id"))
            if thread_id:
                return thread_id
    return None


def _format_error(exc: Exception) -> dict[str, Any]:
    if isinstance(exc, ApiError):
        return {
            "type": "ApiError",
            "message": str(exc),
            "status_code": exc.status_code,
            "payload": exc.payload,
        }
    return {"type": type(exc).__name__, "message": str(exc)}


def run_observability_checks(
    client: BackendClient,
    state: dict[str, Any],
    *,
    expected_submission_status: str | None = None,
    min_thread_messages: int = 1,
) -> dict[str, Any]:
    conference_id = _to_int((state.get("entities") or {}).get("conference_id"))
    submission_id = _to_int((state.get("entities") or {}).get("submission_id"))
    assignment_id = _to_int((state.get("entities") or {}).get("assignment_id"))
    seed_thread_id = _to_int((state.get("entities") or {}).get("thread_id"))

    if not conference_id or not submission_id:
        raise RuntimeError(
            "State file is missing required ids: entities.conference_id and entities.submission_id"
        )

    chair_seed = _normalize_user_seed("chair", state)
    reviewer_seed = _normalize_user_seed("reviewer", state)
    author_seed = _normalize_user_seed("author", state)

    chair_login = client.login_test_user(chair_seed)
    reviewer_login = client.login_test_user(reviewer_seed)
    author_login = client.login_test_user(author_seed)

    chair_token = chair_login.get("token")
    reviewer_token = reviewer_login.get("token")
    author_token = author_login.get("token")

    if not chair_token or not reviewer_token or not author_token:
        raise RuntimeError("Test-login failed: missing chair/reviewer/author token")

    checks: list[CheckResult] = []

    def run_check(check_id: str, message: str, fn) -> Any:
        try:
            evidence = fn()
            checks.append(CheckResult(check_id=check_id, status="pass", message=message, evidence=evidence))
            return evidence
        except Exception as exc:  # noqa: BLE001
            checks.append(
                CheckResult(
                    check_id=check_id,
                    status="fail",
                    message=message,
                    evidence=_format_error(exc),
                )
            )
            return None

    conference_snapshot = run_check(
        "OBS-001",
        "Chair can load conference detail",
        lambda: unwrap_data(
            client.request(
                "GET",
                f"/api/v1/conferences/{conference_id}",
                token=chair_token,
                expected_status=(200, 201),
            )[0]
        ),
    )

    reviewers_snapshot = run_check(
        "OBS-002",
        "Chair can load conference reviewers",
        lambda: unwrap_data(
            client.request(
                "GET",
                f"/api/v1/conferences/{conference_id}/reviewers",
                token=chair_token,
                params={"limit": 50, "offset": 0},
                expected_status=(200, 201),
            )[0]
        ),
    )

    submission_snapshot = run_check(
        "OBS-003",
        "Chair can load submission detail",
        lambda: unwrap_data(
            client.request(
                "GET",
                f"/api/v1/conferences/{conference_id}/submissions/{submission_id}",
                token=chair_token,
                expected_status=(200, 201),
            )[0]
        ),
    )

    def _check_submission_status() -> dict[str, Any]:
        if not isinstance(submission_snapshot, dict):
            raise RuntimeError("Submission snapshot unavailable")
        current_status = str(submission_snapshot.get("status") or "").lower()
        result = {"submission_id": submission_id, "status": current_status}
        if expected_submission_status:
            expected = expected_submission_status.lower()
            if current_status != expected:
                raise RuntimeError(
                    f"Submission status mismatch: expected '{expected}', got '{current_status or 'unknown'}'"
                )
            result["expected_status"] = expected
        return result

    run_check("OBS-004", "Submission status check", _check_submission_status)

    reviewer_dashboard_snapshot = run_check(
        "OBS-005",
        "Reviewer can load dashboard assignments",
        lambda: unwrap_data(
            client.request(
                "GET",
                f"/api/v1/reviewer/{reviewer_seed.email}/dashboard",
                token=reviewer_token,
                expected_status=(200, 201),
            )[0]
        ),
    )

    def _check_assignment_presence() -> dict[str, Any]:
        dashboard_payload = reviewer_dashboard_snapshot
        assignments = _extract_assignments({"data": dashboard_payload})
        found_assignment_id = assignment_id
        found_for_submission = None

        for assignment in assignments:
            candidate_assignment_id = _to_int(assignment.get("assignment_id") or assignment.get("id"))
            candidate_submission_id = _to_int(assignment.get("paper_id") or assignment.get("submission_id"))
            if candidate_submission_id == submission_id:
                found_for_submission = candidate_assignment_id
                break

        if found_assignment_id is None:
            found_assignment_id = found_for_submission

        if found_assignment_id is None:
            raise RuntimeError("No reviewer assignment found for seeded submission")

        return {
            "assignment_id": found_assignment_id,
            "assignment_for_submission": found_for_submission,
            "assignment_count": len(assignments),
        }

    assignment_evidence = run_check("OBS-006", "Reviewer assignment for seeded submission exists", _check_assignment_presence)
    resolved_assignment_id = None
    if isinstance(assignment_evidence, dict):
        resolved_assignment_id = _to_int(assignment_evidence.get("assignment_id"))

    if resolved_assignment_id is not None:
        run_check(
            "OBS-007",
            "Reviewer can load assignment review detail",
            lambda: unwrap_data(
                client.request(
                    "GET",
                    f"/api/v1/conferences/{conference_id}/assignments/{resolved_assignment_id}/review",
                    token=reviewer_token,
                    expected_status=(200, 201),
                )[0]
            ),
        )
    else:
        checks.append(
            CheckResult(
                check_id="OBS-007",
                status="fail",
                message="Reviewer can load assignment review detail",
                evidence={"type": "MissingAssignment", "message": "Assignment id could not be resolved"},
            )
        )

    threads_payload = run_check(
        "OBS-008",
        "Discussion threads are readable by reviewer",
        lambda: unwrap_data(
            client.request(
                "GET",
                f"/api/v1/conferences/{conference_id}/submissions/{submission_id}/threads",
                token=reviewer_token,
                expected_status=(200, 201),
            )[0]
        ),
    )

    run_check(
        "OBS-009",
        "Discussion threads are readable by author and chair",
        lambda: {
            "author_threads": unwrap_data(
                client.request(
                    "GET",
                    f"/api/v1/conferences/{conference_id}/submissions/{submission_id}/threads",
                    token=author_token,
                    expected_status=(200, 201),
                )[0]
            ).get("threads", []),
            "chair_threads": unwrap_data(
                client.request(
                    "GET",
                    f"/api/v1/conferences/{conference_id}/submissions/{submission_id}/threads",
                    token=chair_token,
                    expected_status=(200, 201),
                )[0]
            ).get("threads", []),
        },
    )

    def _check_messages() -> dict[str, Any]:
        thread_id = seed_thread_id or _first_thread_id({"data": threads_payload})
        if thread_id is None:
            raise RuntimeError("No thread id available for message check")
        messages_payload = unwrap_data(
            client.request(
                "GET",
                f"/api/v1/threads/{thread_id}/messages",
                token=reviewer_token,
                expected_status=(200, 201),
            )[0]
        )
        messages = messages_payload.get("messages", []) if isinstance(messages_payload, dict) else []
        if len(messages) < min_thread_messages:
            raise RuntimeError(
                f"Expected at least {min_thread_messages} messages in thread {thread_id}, got {len(messages)}"
            )
        return {"thread_id": thread_id, "message_count": len(messages)}

    run_check("OBS-010", "Discussion thread contains messages", _check_messages)

    def _notifications(token: str) -> dict[str, Any]:
        unread = unwrap_data(
            client.request(
                "GET",
                "/api/v1/notifications/unread-count",
                token=token,
                expected_status=(200, 201),
            )[0]
        )
        listing = unwrap_data(
            client.request(
                "GET",
                "/api/v1/notifications",
                token=token,
                params={"limit": 5, "offset": 0},
                expected_status=(200, 201),
            )[0]
        )
        return {
            "unread_count": unread.get("count") if isinstance(unread, dict) else None,
            "sample_notification_count": len(listing.get("notifications", []))
            if isinstance(listing, dict)
            else 0,
        }

    run_check("OBS-011", "Author notifications API check", lambda: _notifications(author_token))
    run_check("OBS-012", "Reviewer notifications API check", lambda: _notifications(reviewer_token))
    run_check("OBS-013", "Chair notifications API check", lambda: _notifications(chair_token))

    run_check(
        "OBS-014",
        "Chair COI dashboard endpoint check",
        lambda: unwrap_data(
            client.request(
                "GET",
                f"/api/v1/coi/dashboard/stats/{conference_id}",
                token=chair_token,
                expected_status=(200, 201),
            )[0]
        ),
    )

    def _profile_checks() -> dict[str, Any]:
        me = unwrap_data(
            client.request(
                "GET",
                "/api/v1/users/me",
                token=author_token,
                expected_status=(200, 201),
            )[0]
        )
        academic_resp, academic_http = client.request(
            "GET",
            "/api/v1/users/me/academic-profile",
            token=author_token,
            expected_status=(200, 404),
        )
        academic_data = unwrap_data(academic_resp) if academic_http.status_code == 200 else None
        return {
            "me_email": me.get("email") if isinstance(me, dict) else None,
            "academic_profile_status": academic_http.status_code,
            "academic_profile_present": academic_http.status_code == 200 and bool(academic_data),
        }

    run_check("OBS-015", "Profile + academic profile endpoint check", _profile_checks)

    pass_count = sum(1 for check in checks if check.status == "pass")
    fail_count = len(checks) - pass_count

    report = {
        "generated_at": utc_now_iso(),
        "base_url": client.base_url,
        "entities": {
            "conference_id": conference_id,
            "submission_id": submission_id,
            "assignment_id": resolved_assignment_id or assignment_id,
        },
        "summary": {
            "total": len(checks),
            "pass": pass_count,
            "fail": fail_count,
            "status": "pass" if fail_count == 0 else "fail",
        },
        "checks": [asdict(check) for check in checks],
    }

    return report


def report_as_text(report: dict[str, Any]) -> str:
    summary = report.get("summary", {})
    lines = [
        f"Observability status: {summary.get('status', 'unknown').upper()}",
        f"Checks: {summary.get('pass', 0)}/{summary.get('total', 0)} passed",
    ]
    for check in report.get("checks", []):
        status = str(check.get("status", "")).upper()
        lines.append(f"[{status}] {check.get('check_id')}: {check.get('message')}")
        if status == "FAIL":
            evidence = check.get("evidence")
            lines.append(f"  evidence: {json.dumps(evidence, ensure_ascii=True)}")
    return "\n".join(lines)
