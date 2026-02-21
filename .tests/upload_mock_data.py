from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from scripts.common import BackendClient, minimal_pdf_bytes, write_json
from scripts.seed_workflow import seed_dataset

DEFAULT_BASE_URL = (
    os.getenv("CS_BACKEND_BASE_URL")
    or os.getenv("BACKEND_API_BASE_URL")
    or os.getenv("NEXT_PUBLIC_API_BASE_URL")
    or "http://localhost:8080"
)
DEFAULT_OUTPUT = Path(".tests/artifacts/e2e_seed_state.json")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Seed ConferenceSpace E2E data through real backend APIs, including multipart paper upload."
        )
    )
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Backend base URL")
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT),
        help="Path to write seeded IDs/state JSON",
    )
    parser.add_argument(
        "--prefix",
        default="e2e",
        help="Prefix used for seeded conference/submission naming",
    )
    parser.add_argument(
        "--no-discussion-seed",
        action="store_true",
        help="Skip pre-seeding discussion thread/message data",
    )
    parser.add_argument(
        "--no-draft-review-seed",
        action="store_true",
        help="Skip pre-seeding draft review content",
    )
    parser.add_argument(
        "--chair-decision",
        choices=("accepted", "rejected"),
        default=None,
        help="Optionally set final chair decision during seeding",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=20,
        help="HTTP request timeout in seconds",
    )
    parser.add_argument(
        "--print-json",
        action="store_true",
        help="Print final seeded state JSON to stdout",
    )
    return parser.parse_args()


def _write_upload_fixture(output_path: Path) -> Path:
    uploads_dir = output_path.parent / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = uploads_dir / "seed_submission.pdf"
    pdf_path.write_bytes(minimal_pdf_bytes())
    return pdf_path


def main() -> int:
    args = parse_args()
    output_path = Path(args.output).resolve()

    client = BackendClient(base_url=args.base_url, timeout=args.timeout)
    seeded = seed_dataset(
        client,
        prefix=args.prefix,
        include_discussion_seed=not args.no_discussion_seed,
        include_draft_review_seed=not args.no_draft_review_seed,
        chair_decision=args.chair_decision,
    )

    fixture_pdf = _write_upload_fixture(output_path)
    seeded["artifacts"] = {
        "state_file": str(output_path),
        "upload_pdf": str(fixture_pdf),
    }

    write_json(output_path, seeded)

    entities = seeded.get("entities", {})
    urls = seeded.get("frontend_urls", {})
    print("Seed completed successfully.")
    print(f"State file: {output_path}")
    print(f"Conference ID: {entities.get('conference_id')}")
    print(f"Submission ID: {entities.get('submission_id')}")
    print(f"Assignment ID: {entities.get('assignment_id')}")
    print(f"Thread ID: {entities.get('thread_id')}")
    print("Suggested frontend routes:")
    for key, value in urls.items():
        if value:
            print(f"  - {key}: {value}")
    print(f"Upload fixture: {fixture_pdf}")

    if args.print_json:
        print(json.dumps(seeded, indent=2, ensure_ascii=True))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
