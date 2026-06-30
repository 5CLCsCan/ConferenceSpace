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


class ReviewerInitialAnalysisResolveRequest(BaseModel):
    action: Literal["lookup", "generate"]
    conference_id: int
    assignment_id: int
    submission_id: int
    actor: ActorPayload
    submission_state_fingerprint: str
    submission: SubmissionMetadataInput
    file_metadata: FileMetadataInput
    domain_tags: list[str] = Field(default_factory=list)


class StrictSchemaModel(BaseModel):
    model_config = ConfigDict(extra="ignore", json_schema_extra={"additionalProperties": False})


class ReviewerInitialSubmissionSnapshot(StrictSchemaModel):
    title: str
    abstract_summary: str
    manuscript_overview: str
    keywords: list[str]
    track: str | None = None


class ReviewerInitialReadinessSignal(StrictSchemaModel):
    label: str
    status: Literal["present", "partial", "not_found", "not_applicable"]
    detail: str
    source: Literal["submission", "derived"]


class ReviewerInitialContribution(StrictSchemaModel):
    label: str
    evidence: list[str]
    source: Literal["submission", "derived"]


class ReviewerInitialNotableElement(StrictSchemaModel):
    label: str
    detail: str
    source: Literal["submission", "derived"]


class ReviewerInitialAttentionPoint(StrictSchemaModel):
    focus: str
    reason: str | None = None
    source: Literal["submission", "derived"]


class ReviewerInitialScopeLimitation(StrictSchemaModel):
    label: str
    detail: str
    source: Literal["submission", "derived"]


class ReviewerInitialBriefing(StrictSchemaModel):
    submission_snapshot: ReviewerInitialSubmissionSnapshot
    review_readiness_signals: list[ReviewerInitialReadinessSignal]
    claimed_contributions: list[ReviewerInitialContribution]
    notable_elements: list[ReviewerInitialNotableElement]
    reviewer_attention_points: list[ReviewerInitialAttentionPoint]
    stated_scope_and_limitations: list[ReviewerInitialScopeLimitation]


class ReviewerInitialAnnotationItem(StrictSchemaModel):
    category: Literal["strength", "weakness", "suggestion", "question"]
    severity: Literal["minor", "moderate", "major"] | None = None
    quoted_passage: str
    commentary: str
    reviewer_hint: str | None = None


class ReviewerInitialAnnotationSection(StrictSchemaModel):
    section_name: str
    summary: str
    annotations: list[ReviewerInitialAnnotationItem]


class ReviewerInitialAnnotations(StrictSchemaModel):
    overall_impression: str
    domain_context: str | None = None
    sections: list[ReviewerInitialAnnotationSection]


class ReviewerInitialAnalysisArtifact(StrictSchemaModel):
    briefing: ReviewerInitialBriefing
    annotations: ReviewerInitialAnnotations


class ReviewerInitialAnalysisCacheMetadata(BaseModel):
    hit: bool
    submission_state_fingerprint: str


class ReviewerInitialAnalysisError(BaseModel):
    code: str
    message: str


class ReviewerInitialAnalysisResolveResponse(BaseModel):
    status: Literal["idle", "ready", "stale", "failed"]
    run_id: str | None = None
    cache: ReviewerInitialAnalysisCacheMetadata
    artifact: ReviewerInitialAnalysisArtifact | None = None
    error: ReviewerInitialAnalysisError | None = None
