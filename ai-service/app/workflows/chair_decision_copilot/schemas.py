from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


DISALLOWED_VERDICT_PATTERNS = [
    r"\bshould accept\b",
    r"\bshould reject\b",
    r"\brecommend(?:s|ed)?\s+(?:accept|reject)\b",
    r"\b(?:leans?|leaning)\s+(?:accept|reject)\b",
    r"\blikely\s+(?:accept|reject)\b",
    r"\baccept this (?:paper|submission)\b",
    r"\breject this (?:paper|submission)\b",
    r"\bdecision is\s+(?:accept|reject)\b",
    r"\brecommended decision\b",
    r"\bapprove now\b",
    r"\breject now\b",
    r"\bacceptance likelihood\b",
]


def _assert_non_verdict_language(value: str) -> str:
    lowered = value.strip().lower()
    for pattern in DISALLOWED_VERDICT_PATTERNS:
        if re.search(pattern, lowered):
            raise ValueError("verdict-like language is not allowed in decision copilot artifacts")
    return value


class ActorPayload(BaseModel):
    user_id: int
    email: str | None = None
    role: str | None = None


class DecisionCopilotComponentFingerprints(BaseModel):
    submission: str
    reviews: str
    discussion: str
    rebuttal: str


class ConferenceCFPInput(BaseModel):
    name: str = ""
    acronym: str = ""
    description: str = ""
    domains: list[str] = Field(default_factory=list)
    tracks: list[str] = Field(default_factory=list)
    call_for_papers: str = ""


class SubmissionEvidenceInput(BaseModel):
    title: str
    track: str | None = None
    status: str
    keywords: list[str] = Field(default_factory=list)
    last_updated_at: str | None = None


class ReviewEvidenceInput(BaseModel):
    reviewer_id: str
    recommendation: str | None = None
    confidence: str | None = None
    score: float | None = None
    submitted_at: str | None = None
    summary: str | None = None
    strengths: str | None = None
    weaknesses: str | None = None
    questions: str | None = None
    criteria: dict[str, int] = Field(default_factory=dict)
    post_rebuttal_score: int | None = None
    post_rebuttal_recommendation: str | None = None
    post_rebuttal_comment: str | None = None
    post_rebuttal_updated_at: str | None = None


class StrictSchemaModel(BaseModel):
    model_config = ConfigDict(extra="ignore", json_schema_extra={"additionalProperties": False})


class CountMetric(StrictSchemaModel):
    label: str
    count: int


class ReviewAnalyticsInput(BaseModel):
    review_distribution: list[CountMetric] = Field(default_factory=list)
    confidence_mix: list[CountMetric] = Field(default_factory=list)
    strongest_criteria: list[str] = Field(default_factory=list)
    weakest_criteria: list[str] = Field(default_factory=list)
    review_coverage_completeness: str
    score_changes_after_rebuttal: str | None = None
    last_evidence_update: str | None = None


class DiscussionMessageInput(BaseModel):
    role: str = "unknown"
    content: str
    created_at: str | None = None


class DiscussionThreadInput(BaseModel):
    title: str
    visibility: str | None = None
    message_count: int = 0
    last_message_at: str | None = None
    messages: list[DiscussionMessageInput] = Field(default_factory=list)


class DiscussionEvidenceInput(BaseModel):
    thread_count: int = 0
    message_count: int = 0
    last_activity_at: str | None = None
    threads: list[DiscussionThreadInput] = Field(default_factory=list)


class RebuttalPointInput(BaseModel):
    assignment_id: int
    category: str | None = None
    section: str | None = None
    original_comment: str | None = None
    author_response: str | None = None
    status: str | None = None
    reviewer_acknowledged: bool = False
    reviewer_note: str | None = None


class RebuttalAssignmentInput(BaseModel):
    assignment_id: int
    rebuttal_status: str | None = None


class RebuttalEvidenceInput(BaseModel):
    status: Literal["available", "not_applicable"]
    general_response: str | None = None
    points: list[RebuttalPointInput] = Field(default_factory=list)
    assignments: list[RebuttalAssignmentInput] = Field(default_factory=list)
    summary_hint: str | None = None


class DecisionCopilotEvidenceInput(BaseModel):
    schema_version: str
    conference_cfp: ConferenceCFPInput = Field(default_factory=ConferenceCFPInput)
    submission: SubmissionEvidenceInput
    reviews: list[ReviewEvidenceInput] = Field(default_factory=list)
    review_analytics: ReviewAnalyticsInput
    discussion: DiscussionEvidenceInput
    rebuttal: RebuttalEvidenceInput


class DecisionCopilotResolveRequest(BaseModel):
    action: Literal["lookup", "generate", "regenerate"]
    conference_id: int
    submission_id: int
    actor: ActorPayload
    evidence_fingerprint: str
    component_fingerprints: DecisionCopilotComponentFingerprints
    evidence: DecisionCopilotEvidenceInput


class DecisionCopilotEvidenceSummary(StrictSchemaModel):
    overview: str
    evidence_basis: list[str]

    _validate_overview = field_validator("overview")(_assert_non_verdict_language)

    @field_validator("evidence_basis")
    @classmethod
    def _validate_evidence_basis(cls, values: list[str]) -> list[str]:
        return [_assert_non_verdict_language(value) for value in values]


class DecisionCopilotReviewFeedbackSynthesis(StrictSchemaModel):
    summary: str
    strengths: list[str]
    weaknesses: list[str]
    questions: list[str]

    _validate_summary = field_validator("summary")(_assert_non_verdict_language)

    @field_validator("strengths", "weaknesses", "questions")
    @classmethod
    def _validate_lists(cls, values: list[str]) -> list[str]:
        return [_assert_non_verdict_language(value) for value in values]


class DecisionCopilotReviewAnalytics(StrictSchemaModel):
    review_distribution: list[CountMetric]
    confidence_mix: list[CountMetric]
    strongest_criteria: list[str]
    weakest_criteria: list[str]
    review_coverage_completeness: str
    score_changes_after_rebuttal: str | None
    last_evidence_update: str | None


class DecisionCopilotDiscussionSignals(StrictSchemaModel):
    summary: str
    thread_count: int
    message_count: int
    last_activity_at: str | None

    _validate_summary = field_validator("summary")(_assert_non_verdict_language)


class DecisionCopilotRebuttalSignals(StrictSchemaModel):
    status: Literal["available", "not_applicable"]
    summary: str

    _validate_summary = field_validator("summary")(_assert_non_verdict_language)


class DecisionCopilotDisagreementMap(StrictSchemaModel):
    areas_of_agreement: list[str]
    areas_of_disagreement: list[str]
    unresolved_concerns: list[str]
    confidence_limits: list[str]

    @field_validator("areas_of_agreement", "areas_of_disagreement", "unresolved_concerns", "confidence_limits")
    @classmethod
    def _validate_lists(cls, values: list[str]) -> list[str]:
        return [_assert_non_verdict_language(value) for value in values]


class DecisionCopilotArtifact(StrictSchemaModel):
    evidence_summary: DecisionCopilotEvidenceSummary
    review_feedback_synthesis: DecisionCopilotReviewFeedbackSynthesis
    review_analytics: DecisionCopilotReviewAnalytics
    discussion_signals: DecisionCopilotDiscussionSignals
    rebuttal_signals: DecisionCopilotRebuttalSignals
    disagreement_map: DecisionCopilotDisagreementMap
    suggested_chair_note: str
    evidence_fingerprint: str
    generated_at: str

    _validate_suggested_note = field_validator("suggested_chair_note")(_assert_non_verdict_language)


class DecisionCopilotCacheMetadata(BaseModel):
    hit: bool
    evidence_fingerprint: str
    is_stale: bool = False
    stale_reasons: list[str] = Field(default_factory=list)


class DecisionCopilotError(BaseModel):
    code: str
    message: str


class DecisionCopilotResolveResponse(BaseModel):
    status: Literal["idle", "ready", "stale", "failed"]
    run_id: str | None = None
    cache: DecisionCopilotCacheMetadata
    artifact: DecisionCopilotArtifact | None = None
    error: DecisionCopilotError | None = None
