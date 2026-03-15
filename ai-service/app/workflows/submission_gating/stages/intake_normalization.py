from __future__ import annotations

import hashlib
import json
from uuid import uuid4

from app.workflows.submission_gating.models.policy import ActorContext, PolicySnapshot
from app.workflows.submission_gating.models.state import GatingState
from app.workflows.submission_gating.schemas import GatingRunRequest


def run(request: GatingRunRequest, *, file_bytes: bytes, filename: str) -> GatingState:
    normalized_request = request.model_copy(
        deep=True,
        update={
            "file_metadata": request.file_metadata.model_copy(
                update={
                    "original_filename": filename or request.file_metadata.original_filename,
                    "size_bytes": len(file_bytes),
                }
            )
        },
    )

    actor = ActorContext.from_request(normalized_request)
    policy_snapshot = PolicySnapshot.from_request(normalized_request)
    input_fingerprint = "sha256:" + hashlib.sha256(
        file_bytes
        + json.dumps(
            normalized_request.model_dump(mode="json", exclude_none=True),
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
    ).hexdigest()
    policy_hash = "sha256:" + hashlib.sha256(
        json.dumps(policy_snapshot.to_dict(), sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()

    return GatingState(
        run_id=str(uuid4()),
        mode=normalized_request.mode,
        source=normalized_request.source,
        conference_id=normalized_request.conference_id,
        submission_id=normalized_request.submission_id,
        actor=actor,
        input_fingerprint=input_fingerprint,
        policy_hash=policy_hash,
        normalized_request=normalized_request,
        policy_snapshot=policy_snapshot,
    )
