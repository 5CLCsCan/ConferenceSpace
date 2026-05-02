from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


Confidence = Literal["high", "medium", "low", "not_found"]


class StrictSchemaModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ActorPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    user_id: int | str
    email: str | None = None
    role: str | None = None


class AutofillFileMetadata(BaseModel):
    model_config = ConfigDict(extra="allow")

    file_id: str
    original_filename: str
    size_bytes: int
    content_type: str | None = None


class ConferenceContext(StrictSchemaModel):
    name: str
    acronym: str
    description: str
    domain: list[str]
    cfp_text: str
    tracks: list[str]


class SubmissionAutofillRunRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    conference_id: int
    actor: ActorPayload
    extra_details: str | None = None
    available_tracks: list[str] = Field(default_factory=list)
    conference_context: ConferenceContext | None = None
    files: list[AutofillFileMetadata]

    @field_validator("available_tracks", mode="before")
    @classmethod
    def _normalize_tracks(cls, value):
        if value is None:
            return []
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return [str(item).strip() for item in value if str(item).strip()]


class AutofillEvidence(StrictSchemaModel):
    file_id: str
    source_type: str | None
    quote_or_signal: str
    location_hint: str | None


class AutofillField(StrictSchemaModel):
    value: str
    confidence: Confidence
    evidence: list[AutofillEvidence]
    warnings: list[str]


class AutofillStringListField(StrictSchemaModel):
    value: list[str]
    confidence: Confidence
    evidence: list[AutofillEvidence]
    warnings: list[str]


class SubmissionAutofillFields(StrictSchemaModel):
    title: AutofillField
    abstract: AutofillField
    keywords: AutofillStringListField
    paper_type: AutofillField
    additional_notes: AutofillField


class AutofillTrackRanking(StrictSchemaModel):
    track_name: str
    confidence: float = Field(..., ge=1.0, le=10.0)
    rationale: str
    evidence: list[AutofillEvidence]
    warnings: list[str]


class AutofillAuthor(StrictSchemaModel):
    name: str
    email: str | None
    affiliation: str | None
    country: str | None
    ordinal: int | None
    confidence: Confidence
    evidence: list[AutofillEvidence]
    warnings: list[str]


class AutofillConflict(StrictSchemaModel):
    name: str
    email: str | None
    institution: str | None
    reason: str
    confidence: Confidence
    evidence: list[AutofillEvidence]
    warnings: list[str]


class AutofillMaterial(StrictSchemaModel):
    file_id: str
    filename: str
    content_type: str | None
    size_bytes: int
    role: Literal["primary", "supplementary"]
    extraction_status: Literal["ok", "failed", "low_text_coverage"]
    text_coverage_ratio: float | None
    page_count: int | None
    warnings: list[str]


class SubmissionAutofillError(StrictSchemaModel):
    code: str
    message: str


class SubmissionAutofillRunResponse(StrictSchemaModel):
    run_id: str
    status: Literal["ready", "failed"]
    fields: SubmissionAutofillFields
    track_rankings: list[AutofillTrackRanking]
    authors: list[AutofillAuthor]
    possible_conflicts: list[AutofillConflict]
    materials: list[AutofillMaterial]
    warnings: list[str]
    error: SubmissionAutofillError | None


class SubmissionAutofillArtifact(StrictSchemaModel):
    fields: SubmissionAutofillFields
    track_rankings: list[AutofillTrackRanking]
    authors: list[AutofillAuthor]
    possible_conflicts: list[AutofillConflict]
    warnings: list[str]
