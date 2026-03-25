from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from app.workflows.submission_gating.models.facts import ExtractedDocument, FileFacts, SubmissionFacts
from app.workflows.submission_gating.models.findings import ContentFinding, GuidanceItem, RuleFinding, VerdictBundle
from app.workflows.submission_gating.models.policy import ActorContext, PolicySnapshot
from app.workflows.submission_gating.schemas import GatingRunRequest


@dataclass(slots=True)
class StageError:
    stage_name: str
    message: str


@dataclass(slots=True)
class StageRecord:
    stage_name: str
    status: Literal["ok", "skipped", "blocked", "failed"]
    input_hash: str | None = None
    output_hash: str | None = None
    duration_ms: int | None = None
    detail: dict = field(default_factory=dict)


@dataclass(slots=True)
class GatingState:
    run_id: str
    mode: Literal["advisory", "gate"]
    source: Literal["author_precheck", "submission_create", "submission_publish"]
    conference_id: int
    submission_id: int | None
    actor: ActorContext
    input_fingerprint: str
    policy_hash: str
    normalized_request: GatingRunRequest
    policy_snapshot: PolicySnapshot
    file_facts: FileFacts | None = None
    extracted_document: ExtractedDocument | None = None
    submission_facts: SubmissionFacts | None = None
    content_findings: list[ContentFinding] = field(default_factory=list)
    rule_findings: list[RuleFinding] = field(default_factory=list)
    verdict_bundle: VerdictBundle | None = None
    guidance: list[GuidanceItem] = field(default_factory=list)
    stage_timings: dict[str, int] = field(default_factory=dict)
    determinism_metadata: dict[str, str] = field(default_factory=dict)
    error: StageError | None = None
    stage_records: list[StageRecord] = field(default_factory=list)
