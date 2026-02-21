from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any

from scripts.cleanup_workflow import apply_cleanup_to_state, cleanup_seeded_data
from scripts.common import BackendClient, minimal_pdf_bytes, read_json, write_json
from scripts.seed_workflow import seed_dataset

DEFAULT_BASE_URL = (
    os.getenv("CS_BACKEND_BASE_URL")
    or os.getenv("BACKEND_API_BASE_URL")
    or os.getenv("NEXT_PUBLIC_API_BASE_URL")
    or "http://localhost:8080"
)
DEFAULT_STATE_FILE = Path(".tests/artifacts/e2e_seed_state.json")
DEFAULT_CLEANUP_REPORT = Path(".tests/artifacts/e2e_cleanup_report.json")


def _load_state(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    payload = read_json(path)
    if not isinstance(payload, dict):
        raise RuntimeError(f"State file must be a JSON object: {path}")
    return payload


def _write_upload_fixture(state_path: Path) -> Path:
    uploads_dir = state_path.parent / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = uploads_dir / "seed_submission.pdf"
    pdf_path.write_bytes(minimal_pdf_bytes())
    return pdf_path


def _print_cleanup_summary(report: dict[str, Any], report_path: Path) -> None:
    summary = report.get("summary", {})
    print(f"Cleanup status: {report.get('status')}")
    print(f"Cleanup report: {report_path}")
    print(f"Target conferences: {summary.get('target_count', 0)}")
    print(f"Deleted: {summary.get('deleted_count', 0)}")
    print(f"Already absent: {summary.get('already_absent_count', 0)}")
    print(f"Failures: {summary.get('failure_count', 0)}")


def run_cleanup(args: argparse.Namespace) -> int:
    base_url = args.base_url
    state_path = Path(args.state_file).resolve()
    report_path = Path(args.output).resolve()
    state = _load_state(state_path)

    client = BackendClient(base_url=base_url, timeout=args.timeout)
    report = cleanup_seeded_data(client, state=state, prefix=args.prefix)
    write_json(report_path, report)

    if state:
        updated_state = apply_cleanup_to_state(state, report)
        write_json(state_path, updated_state)

    _print_cleanup_summary(report, report_path)

    if args.print_json:
        print(json.dumps(report, indent=2, ensure_ascii=True))

    if args.strict and report.get("status") != "pass":
        return 1
    return 0


def run_reseed(args: argparse.Namespace) -> int:
    base_url = args.base_url
    state_path = Path(args.state_file).resolve()
    report_path = Path(args.cleanup_output).resolve()
    state = _load_state(state_path)

    cleanup_prefix = args.cleanup_prefix if args.cleanup_prefix is not None else args.prefix
    client = BackendClient(base_url=base_url, timeout=args.timeout)
    cleanup_report = cleanup_seeded_data(client, state=state, prefix=cleanup_prefix)
    write_json(report_path, cleanup_report)

    if state:
        updated_state = apply_cleanup_to_state(state, cleanup_report)
        write_json(state_path, updated_state)

    _print_cleanup_summary(cleanup_report, report_path)
    if args.strict_cleanup and cleanup_report.get("status") != "pass":
        return 1

    seeded = seed_dataset(
        client,
        prefix=args.prefix,
        include_discussion_seed=not args.no_discussion_seed,
        include_draft_review_seed=not args.no_draft_review_seed,
        chair_decision=args.chair_decision,
    )
    fixture_pdf = _write_upload_fixture(state_path)
    seeded["artifacts"] = {
        "state_file": str(state_path),
        "upload_pdf": str(fixture_pdf),
        "cleanup_report": str(report_path),
    }

    write_json(state_path, seeded)

    entities = seeded.get("entities", {})
    urls = seeded.get("frontend_urls", {})
    print("Reseed completed successfully.")
    print(f"State file: {state_path}")
    print(f"Conference ID: {entities.get('conference_id')}")
    print(f"Open Conference ID: {entities.get('open_conference_id')}")
    print(f"Submission ID: {entities.get('submission_id')}")
    print(f"Assignment ID: {entities.get('assignment_id')}")
    print("Suggested frontend routes:")
    for key, value in urls.items():
        if value:
            print(f"  - {key}: {value}")
    print(f"Upload fixture: {fixture_pdf}")

    if args.print_json:
        print(json.dumps(seeded, indent=2, ensure_ascii=True))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Cleanup and reseed lifecycle management for ConferenceSpace E2E datasets."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    cleanup = subparsers.add_parser("cleanup", help="Delete seeded conference data")
    cleanup.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Backend base URL")
    cleanup.add_argument("--state-file", default=str(DEFAULT_STATE_FILE), help="Seed state JSON path")
    cleanup.add_argument("--prefix", default=None, help="Optional seed prefix to clean up by acronym/title")
    cleanup.add_argument(
        "--output",
        default=str(DEFAULT_CLEANUP_REPORT),
        help="Cleanup report output JSON path",
    )
    cleanup.add_argument("--timeout", type=int, default=20, help="HTTP timeout in seconds")
    cleanup.add_argument("--strict", action="store_true", help="Exit 1 when cleanup has failures")
    cleanup.add_argument("--print-json", action="store_true", help="Print cleanup report JSON to stdout")

    reseed = subparsers.add_parser("reseed", help="Cleanup then seed a fresh dataset")
    reseed.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Backend base URL")
    reseed.add_argument("--state-file", default=str(DEFAULT_STATE_FILE), help="Seed state JSON path")
    reseed.add_argument("--prefix", default="e2e", help="Prefix used for seeded names")
    reseed.add_argument(
        "--cleanup-prefix",
        default=None,
        help="Optional separate prefix for cleanup phase (defaults to --prefix)",
    )
    reseed.add_argument(
        "--cleanup-output",
        default=str(DEFAULT_CLEANUP_REPORT),
        help="Cleanup report output JSON path",
    )
    reseed.add_argument("--timeout", type=int, default=20, help="HTTP timeout in seconds")
    reseed.add_argument(
        "--no-discussion-seed",
        action="store_true",
        help="Skip pre-seeding discussion thread/message data",
    )
    reseed.add_argument(
        "--no-draft-review-seed",
        action="store_true",
        help="Skip pre-seeding draft review content",
    )
    reseed.add_argument(
        "--chair-decision",
        choices=("accepted", "rejected"),
        default=None,
        help="Optionally set final chair decision during seeding",
    )
    reseed.add_argument(
        "--strict-cleanup",
        action="store_true",
        help="Abort reseed when cleanup phase has failures",
    )
    reseed.add_argument("--print-json", action="store_true", help="Print final seeded JSON to stdout")

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    if args.command == "cleanup":
        return run_cleanup(args)
    if args.command == "reseed":
        return run_reseed(args)
    parser.error(f"Unknown command: {args.command}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
