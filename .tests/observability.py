from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any

from scripts.common import BackendClient, TestUserSeed, read_json, write_json
from scripts.observability_checks import report_as_text, run_observability_checks

DEFAULT_BASE_URL = (
    os.getenv("CS_BACKEND_BASE_URL")
    or os.getenv("BACKEND_API_BASE_URL")
    or os.getenv("NEXT_PUBLIC_API_BASE_URL")
    or "http://localhost:8080"
)
DEFAULT_STATE_FILE = Path(".tests/artifacts/e2e_seed_state.json")
DEFAULT_REPORT_FILE = Path(".tests/artifacts/e2e_observability_report.json")


def _default_seed(role: str) -> TestUserSeed:
    defaults = {
        "chair": TestUserSeed("test.discussion.chair@example.com", "Test", "Chair"),
        "reviewer": TestUserSeed("test.discussion.reviewer@example.com", "Test", "Reviewer"),
        "author": TestUserSeed("test.discussion.author@example.com", "Test", "Author"),
    }
    return defaults[role]


def _resolve_seed(role: str, state: dict[str, Any]) -> TestUserSeed:
    raw = (state.get("users") or {}).get(role) or {}
    default = _default_seed(role)
    return TestUserSeed(
        email=raw.get("email") or default.email,
        first_name=raw.get("first_name") or default.first_name,
        last_name=raw.get("last_name") or default.last_name,
    )


def _parse_expected_status(raw: str | None) -> tuple[int, ...] | None:
    if not raw:
        return None
    chunks = [chunk.strip() for chunk in raw.split(",") if chunk.strip()]
    if not chunks:
        return None
    return tuple(int(chunk) for chunk in chunks)


def _parse_params(items: list[str]) -> dict[str, str]:
    params: dict[str, str] = {}
    for item in items:
        if "=" not in item:
            raise ValueError(f"Invalid --param value '{item}', expected key=value")
        key, value = item.split("=", 1)
        params[key.strip()] = value.strip()
    return params


def _parse_body(body: str | None) -> Any:
    if not body:
        return None
    if body.startswith("@"):
        body_path = Path(body[1:])
        return json.loads(body_path.read_text(encoding="utf-8"))
    return json.loads(body)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Observability tooling for ConferenceSpace frontend-v2 migration E2E validation."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    report = subparsers.add_parser("report", help="Run full backend-state observability checks")
    report.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Backend base URL")
    report.add_argument("--state-file", default=str(DEFAULT_STATE_FILE), help="Seeded state JSON path")
    report.add_argument("--output", default=str(DEFAULT_REPORT_FILE), help="Output report JSON path")
    report.add_argument(
        "--expected-submission-status",
        default=None,
        help="Expected final submission status (e.g. accepted/rejected)",
    )
    report.add_argument(
        "--min-thread-messages",
        type=int,
        default=1,
        help="Minimum expected number of discussion messages in seeded thread",
    )
    report.add_argument(
        "--strict",
        action="store_true",
        help="Exit with code 1 when any observability check fails",
    )
    report.add_argument("--print-json", action="store_true", help="Print report JSON to stdout")

    query = subparsers.add_parser("query", help="Run an ad-hoc backend query as a specific role")
    query.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Backend base URL")
    query.add_argument("--state-file", default=str(DEFAULT_STATE_FILE), help="Seeded state JSON path")
    query.add_argument("--role", choices=("chair", "reviewer", "author"), default="chair")
    query.add_argument("--method", default="GET", help="HTTP method")
    query.add_argument("--path", required=True, help="Backend API path, e.g. /api/v1/conferences/1")
    query.add_argument(
        "--param",
        action="append",
        default=[],
        help="Query string param as key=value. Repeat for multiple params.",
    )
    query.add_argument(
        "--body",
        default=None,
        help="JSON body string or @path/to/body.json",
    )
    query.add_argument(
        "--expected-status",
        default=None,
        help="Comma-separated expected status codes, e.g. 200,201",
    )

    return parser


def _load_state(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    payload = read_json(path)
    if not isinstance(payload, dict):
        raise RuntimeError(f"State file must be a JSON object: {path}")
    return payload


def run_report(args: argparse.Namespace) -> int:
    state_path = Path(args.state_file).resolve()
    state = _load_state(state_path)
    if not state:
        raise RuntimeError(
            f"State file not found or empty at {state_path}. Run `.tests/upload_mock_data.py` first."
        )

    client = BackendClient(base_url=args.base_url, timeout=20)
    report = run_observability_checks(
        client,
        state,
        expected_submission_status=args.expected_submission_status,
        min_thread_messages=args.min_thread_messages,
    )

    output_path = Path(args.output).resolve()
    write_json(output_path, report)
    print(report_as_text(report))
    print(f"Report file: {output_path}")

    if args.print_json:
        print(json.dumps(report, indent=2, ensure_ascii=True))

    if args.strict and report.get("summary", {}).get("status") != "pass":
        return 1
    return 0


def run_query(args: argparse.Namespace) -> int:
    state = _load_state(Path(args.state_file).resolve())
    role_seed = _resolve_seed(args.role, state)

    client = BackendClient(base_url=args.base_url, timeout=20)
    login = client.login_test_user(role_seed)
    token = login.get("token")
    if not token:
        raise RuntimeError(f"Failed to obtain token for role '{args.role}'")

    expected_status = _parse_expected_status(args.expected_status)
    body = _parse_body(args.body)
    params = _parse_params(args.param)

    payload, response = client.request(
        args.method,
        args.path,
        token=token,
        expected_status=expected_status,
        json_body=body,
        params=params or None,
    )

    print(f"HTTP {response.status_code}")
    if isinstance(payload, str):
        print(payload)
    else:
        print(json.dumps(payload, indent=2, ensure_ascii=True))
    return 0


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    if args.command == "report":
        return run_report(args)
    if args.command == "query":
        return run_query(args)
    parser.error(f"Unknown command: {args.command}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
