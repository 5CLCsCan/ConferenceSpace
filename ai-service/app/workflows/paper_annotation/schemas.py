from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.workflows.reviewer_pre_read_briefing.schemas import (
    ActorPayload,
    FileMetadataInput,
    SubmissionMetadataInput,
)


class PaperAnnotationResolveRequest(BaseModel):
    action: Literal["lookup", "generate"]
    conference_id: int
    assignment_id: int
    submission_id: int
    actor: ActorPayload
    submission_state_fingerprint: str
    submission: SubmissionMetadataInput
    file_metadata: FileMetadataInput
    domain_tags: list[str] = Field(default_factory=list)


class PaperAnnotationItem(BaseModel):
    category: Literal["strength", "weakness", "suggestion", "question"] = Field(
        description="Type of annotation."
    )
    severity: Literal["minor", "moderate", "major"] | None = Field(
        default=None,
        description="Severity for weakness and suggestion categories. Null for strength and question.",
    )
    quoted_passage: str = Field(
        description="Exact text quoted from the manuscript that this annotation refers to."
    )
    commentary: str = Field(
        description="Explanation of why this passage is noteworthy and what it means for the review."
    )
    reviewer_hint: str | None = Field(
        default=None,
        description="Optional actionable suggestion for what the reviewer might investigate further.",
    )


class PaperAnnotationSection(BaseModel):
    section_name: str = Field(description="Name of the manuscript section being annotated.")
    summary: str = Field(description="Brief assessment of this section overall.")
    annotations: list[PaperAnnotationItem] = Field(
        default_factory=list,
        description="Passage-level annotations within this section.",
    )


class PaperAnnotationGuardrails(BaseModel):
    advisory_only: bool = Field(description="Always true. Annotations are suggestions, not directives.")
    no_recommendation: bool = Field(description="Always true. Must not recommend accept or reject.")
    bias_notices: list[str] = Field(
        default_factory=list,
        description="Any bias caveats the reviewer should be aware of.",
    )


class PaperAnnotationArtifact(BaseModel):
    overall_impression: str = Field(
        description="High-level summary of key observations across all sections."
    )
    domain_context: str | None = Field(
        default=None,
        description="Domain or track used for tailored analysis, if available.",
    )
    sections: list[PaperAnnotationSection] = Field(
        default_factory=list,
        description="Section-by-section analysis with passage-level annotations.",
    )
    guardrails: PaperAnnotationGuardrails = Field(
        description="Non-negotiable constraints for interpreting annotations."
    )


class PaperAnnotationCacheMetadata(BaseModel):
    hit: bool
    submission_state_fingerprint: str


class PaperAnnotationError(BaseModel):
    code: str
    message: str


class PaperAnnotationResolveResponse(BaseModel):
    status: Literal["idle", "ready", "stale", "failed"]
    run_id: str | None = None
    cache: PaperAnnotationCacheMetadata
    artifact: PaperAnnotationArtifact | None = None
    error: PaperAnnotationError | None = None
