from __future__ import annotations

from app.workflows.submission_gating.models.findings import GuidanceItem
from app.workflows.submission_gating.models.state import GatingState
from app.workflows.submission_gating.schemas import GatingRunRequest
from app.workflows.submission_gating.stages import intake_normalization

from tests.submission_gating_helpers import MINIMAL_PDF_BYTES, make_request_payload


def test_gating_state_uses_isolated_default_collections() -> None:
    request = GatingRunRequest.model_validate(make_request_payload())

    left = intake_normalization.run(
        request,
        file_bytes=MINIMAL_PDF_BYTES,
        filename="submission.pdf",
    )
    right = intake_normalization.run(
        request,
        file_bytes=MINIMAL_PDF_BYTES,
        filename="submission.pdf",
    )

    left.guidance.append(
        GuidanceItem(
            rule_id="min_references",
            source="deterministic",
            severity="block",
            message="Only 5 references detected.",
            remediation="Add more references.",
        )
    )

    assert right.guidance == []
    assert left.input_fingerprint.startswith("sha256:")
    assert left.policy_hash.startswith("sha256:")


def test_intake_normalization_populates_state_identity_and_policy_snapshot() -> None:
    request = GatingRunRequest.model_validate(make_request_payload(prompt_fragments=["Flag missing ethics statements."]))

    state = intake_normalization.run(
        request,
        file_bytes=MINIMAL_PDF_BYTES,
        filename="submission.pdf",
    )

    assert isinstance(state, GatingState)
    assert state.conference_id == 42
    assert state.submission_id == 7
    assert state.normalized_request.file_metadata.original_filename == "submission.pdf"
    assert state.policy_snapshot.desk_rejection_settings.enabled is True
    assert state.policy_snapshot.desk_rejection_settings.prompt_fragments == [
        "Flag missing ethics statements."
    ]
