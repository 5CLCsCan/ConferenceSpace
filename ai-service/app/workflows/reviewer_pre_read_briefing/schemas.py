from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ActorPayload(BaseModel):
    user_id: int
    email: str | None = None
    role: str | None = None


class SubmissionMetadataInput(BaseModel):
    title: str
    abstract: str
    keywords: list[str] = Field(default_factory=list)
    track: str | None = None


class FileMetadataInput(BaseModel):
    original_filename: str
    content_type: str | None = None
    size_bytes: int | None = None


class ReviewerBriefingResolveRequest(BaseModel):
    action: Literal["lookup", "generate"]
    conference_id: int
    assignment_id: int
    submission_id: int
    actor: ActorPayload
    submission_state_fingerprint: str
    submission: SubmissionMetadataInput
    file_metadata: FileMetadataInput


class StrictSchemaModel(BaseModel):
    model_config = ConfigDict(extra="ignore", json_schema_extra={"additionalProperties": False})


class ReviewerBriefingSubmissionSnapshot(StrictSchemaModel):
    title: str = Field(description="Submission title used for reviewer orientation.")
    abstract_summary: str = Field(
        description="Conservative summary of the submission abstract, focusing on problem, method idea, and claimed outcome."
    )
    manuscript_overview: str = Field(
        description="High-level overview of what the manuscript appears to cover based on extracted paper content."
    )
    keywords: list[str] = Field(
        description="Distinct keywords useful for topical orientation.",
    )
    track: str | None = Field(
        description="Reviewer-visible track label when available.",
    )


class ReviewerBriefingContribution(StrictSchemaModel):
    label: str = Field(description="One concrete contribution or capability the submission appears to claim.")
    evidence: list[str] = Field(
        description="Short supporting evidence statements grounded in the submission or extracted manuscript content.",
    )
    source: Literal["submission", "derived"] = Field(
        description="Primary provenance for this contribution item.",
    )


class ReviewerBriefingNotableElement(StrictSchemaModel):
    label: str = Field(description="A notable aspect of the submission the reviewer should notice early.")
    detail: str = Field(description="Factual explanation of why this element stands out in the manuscript.")
    source: Literal["submission", "derived"] = Field(
        description="Primary provenance for this notable element.",
    )


class ReviewerBriefingAttentionPoint(StrictSchemaModel):
    focus: str = Field(description="Specific area the reviewer should verify carefully during manual review.")
    reason: str | None = Field(
        description="Why the reviewer should verify this area carefully or what uncertainty remains.",
    )
    source: Literal["submission", "derived"] = Field(
        description="Primary provenance for this reviewer attention point.",
    )


class ReviewerBriefingScopeLimitation(StrictSchemaModel):
    label: str = Field(description="A stated scope boundary, limitation, or assumption surfaced from the submission.")
    detail: str = Field(description="Compact factual explanation grounded in the submission or manuscript.")
    source: Literal["submission", "derived"] = Field(
        description="Primary provenance for this scope or limitation item.",
    )


class ReviewerBriefingGuardrails(StrictSchemaModel):
    no_recommendation: bool = Field(description="Always true. The artifact must not recommend accept or reject.")
    no_score: bool = Field(description="Always true. The artifact must not predict or assign scores.")
    bias_notice: str = Field(description="Reviewer-facing reminder that the briefing is assistive and non-binding.")


class ReviewerBriefingReadinessSignal(StrictSchemaModel):
    label: str = Field(
        description="Neutral reviewer-useful signal category such as claim support, evaluation coverage, reproducibility path, or limitations disclosure."
    )
    status: Literal["present", "partial", "not_found", "not_applicable"] = Field(
        description="Evidence status for this signal based only on the supplied submission and manuscript content."
    )
    detail: str = Field(
        description="Compact factual note describing what evidence was found, missing, or only partially visible."
    )
    source: Literal["submission", "derived"] = Field(
        description="Primary provenance for this readiness signal.",
    )


class ReviewerBriefingArtifact(StrictSchemaModel):
    submission_snapshot: ReviewerBriefingSubmissionSnapshot = Field(
        description="High-level submission orientation for the reviewer."
    )
    review_readiness_signals: list[ReviewerBriefingReadinessSignal] = Field(
        description="Neutral evidence signals that help the reviewer understand what appears well-supported versus what may need closer verification.",
    )
    claimed_contributions: list[ReviewerBriefingContribution] = Field(
        description="Concrete contributions or capabilities the submission appears to claim.",
    )
    notable_elements: list[ReviewerBriefingNotableElement] = Field(
        description="High-signal manuscript elements that stand out during pre-read.",
    )
    reviewer_attention_points: list[ReviewerBriefingAttentionPoint] = Field(
        description="Priority checks the reviewer should keep in mind during deeper reading.",
    )
    stated_scope_and_limitations: list[ReviewerBriefingScopeLimitation] = Field(
        description="Scope boundaries, limitations, or assumptions stated or implied by the submission.",
    )
    guardrails: ReviewerBriefingGuardrails = Field(
        description="Non-negotiable constraints that govern how the artifact should be interpreted."
    )


class ReviewerBriefingCacheMetadata(BaseModel):
    hit: bool
    submission_state_fingerprint: str


class ReviewerBriefingError(BaseModel):
    code: str
    message: str


class ReviewerBriefingResolveResponse(BaseModel):
    status: Literal["idle", "ready", "stale", "failed"]
    run_id: str | None = None
    cache: ReviewerBriefingCacheMetadata
    artifact: ReviewerBriefingArtifact | None = None
    error: ReviewerBriefingError | None = None
