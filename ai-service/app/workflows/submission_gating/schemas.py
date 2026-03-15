from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ActorPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    user_id: int | str
    email: str | None = None
    role: str | None = None


class ConflictDeclarationPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    email: str
    reason: str


class SubmissionInformationPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    keywords: list[str] = Field(default_factory=list)
    co_authors: list[str] = Field(default_factory=list)
    declared_conflicts: list[ConflictDeclarationPayload] = Field(default_factory=list)
    paper_type: str | None = None
    track_name: str | None = None
    additional_notes: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class SubmissionPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    title: str = ""
    abstract: str = ""
    track: str | None = None
    status: str | None = None
    information: SubmissionInformationPayload = Field(default_factory=SubmissionInformationPayload)


class DeskRejectionCustomRulesPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    min_datasets: int | None = None
    minimum_tables: int | None = None
    author_anonymization_required: bool | None = None
    critical_keywords_required: list[str] = Field(default_factory=list)
    banned_phrases: list[str] = Field(default_factory=list)


class DeskRejectionSettingsPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    enabled: bool = False
    min_references: int | None = None
    required_sections: list[str] = Field(default_factory=list)
    thresholds: dict[str, float] = Field(default_factory=dict)
    weights: dict[str, float] = Field(default_factory=dict)
    custom_rules: DeskRejectionCustomRulesPayload = Field(default_factory=DeskRejectionCustomRulesPayload)
    prompt_fragments: list[str] = Field(default_factory=list)

    @field_validator("required_sections", "prompt_fragments", mode="before")
    @classmethod
    def _coerce_string_list(cls, value: Any) -> list[str]:
        if value is None:
            return []
        if isinstance(value, str):
            parts = [item.strip() for item in value.split(",")]
            return [item for item in parts if item]
        return [str(item).strip() for item in value if str(item).strip()]


class WorkflowSettingsPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    strict_deadlines: bool = False


class FormatConfigPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    min_body_font_pt: float | None = None
    min_margin_in: float | None = None
    required_paper_size: str | None = None  # "letter" | "a4"
    max_columns: int | None = None


class PolicyPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    maximum_pages: int | None = None
    submission_format: list[str] = Field(default_factory=list)
    review_type: str | None = None
    desk_rejection_settings: DeskRejectionSettingsPayload = Field(default_factory=DeskRejectionSettingsPayload)
    workflow_settings: WorkflowSettingsPayload = Field(default_factory=WorkflowSettingsPayload)
    format_config: FormatConfigPayload | None = None

    @field_validator("submission_format", mode="before")
    @classmethod
    def _normalize_submission_format(cls, value: Any) -> list[str]:
        if value is None:
            return []
        if isinstance(value, str):
            parts = [item.strip() for item in value.split(",")]
            return [item for item in parts if item]
        return [str(item).strip() for item in value if str(item).strip()]


class FileMetadataPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    original_filename: str
    size_bytes: int | None = None
    content_type: str | None = None


class GatingRunRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    mode: Literal["advisory", "gate"]
    source: Literal["author_precheck", "submission_create", "submission_publish"]
    conference_id: int
    submission_id: int | None = None
    actor: ActorPayload
    submission: SubmissionPayload
    policy: PolicyPayload
    file_metadata: FileMetadataPayload


class FindingPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    rule_id: str
    source: str
    severity: Literal["pass", "warn", "block"]
    message: str
    remediation: str | None = None
    evidence: dict[str, Any] | None = None
    excerpt: str | None = None


class GuidancePayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    rule_id: str
    source: str
    severity: Literal["pass", "warn", "block"]
    message: str
    remediation: str


class GatingRunResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    run_id: str
    input_fingerprint: str
    policy_hash: str
    verdict: Literal["pass", "warn", "block", "error"]
    decision: str | None = None
    score: float | None = None
    summary: dict[str, int]
    findings: list[FindingPayload] = Field(default_factory=list)
    guidance: list[GuidancePayload] = Field(default_factory=list)
    stage_timings: dict[str, int] = Field(default_factory=dict)
    determinism: dict[str, Any] = Field(default_factory=dict)
    completed_at: str | None = None
