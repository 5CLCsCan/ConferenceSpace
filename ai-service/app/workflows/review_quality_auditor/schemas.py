from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.workflows.reviewer_pre_read_briefing.schemas import (
    ReviewerBriefingArtifact,
    SubmissionMetadataInput,
)


class ActorPayload(BaseModel):
    user_id: int
    email: str | None = None
    role: str | None = None


class ReviewCriteriaInput(BaseModel):
    originality: int = Field(ge=1, le=10)
    technical_quality: int = Field(ge=1, le=10)
    clarity: int = Field(ge=1, le=10)
    significance: int = Field(ge=1, le=10)
    methodology: int = Field(ge=1, le=10)


class ReviewFeedbackInput(BaseModel):
    summary: str = ""
    strengths: str = ""
    weaknesses: str = ""
    questions: str = ""


class ReviewInput(BaseModel):
    criteria: ReviewCriteriaInput
    feedback: ReviewFeedbackInput
    recommendation: Literal[
        "strong_accept",
        "accept",
        "weak_accept",
        "borderline",
        "weak_reject",
        "reject",
        "strong_reject",
    ]
    confidence: Literal["high", "medium", "low"]


class ReviewPolicyInput(BaseModel):
    required_sections: list[str] = Field(default_factory=list)
    strict: bool = False


class ReviewQualityAuditResolveRequest(BaseModel):
    mode: Literal["draft_save", "submit_preflight", "submit_enforcement"]
    conference_id: int
    assignment_id: int
    submission_id: int
    actor: ActorPayload
    submission: SubmissionMetadataInput
    review_score: float | None = None
    review: ReviewInput
    policy: ReviewPolicyInput | None = None
    briefing_artifact: ReviewerBriefingArtifact | None = None


class ReviewQualityAuditFinding(BaseModel):
    code: str
    severity: Literal["warning", "blocking"]
    field: str
    rationale: str
    message: str
    suggestion: str
    condition_fingerprint: str


class ReviewQualityAuditEvaluation(BaseModel):
    summary: str = ""
    evidence_engagement: str = ""
    consistency_assessment: str = ""
    improvement_focus: str = ""


class ReviewQualityAuditResolveResponse(BaseModel):
    status: Literal["pass", "warn", "block"]
    run_id: str | None = None
    evaluation: ReviewQualityAuditEvaluation = Field(default_factory=ReviewQualityAuditEvaluation)
    findings: list[ReviewQualityAuditFinding] = Field(default_factory=list)


ReviewAuditField = Literal[
    "review",
    "recommendation",
    "confidence",
    "summary",
    "strengths",
    "weaknesses",
    "questions",
    "criteria.originality",
    "criteria.technical_quality",
    "criteria.clarity",
    "criteria.significance",
    "criteria.methodology",
]

ReviewAuditCode = Literal[
    "consistency.self_contradiction",
    "consistency.recommendation_narrative_tension",
    "consistency.confidence_support_tension",
    "justification.recommendation_unsupported",
    "justification.criteria_unsupported",
    "coverage.core_claims_not_engaged",
    "coverage.limitations_not_engaged",
    "coverage.ai003_attention_points_not_engaged",
    "quality.review_too_generic_to_submit",
    "quality.strengths_weaknesses_unbalanced",
]


class StrictSchemaModel(BaseModel):
    model_config = ConfigDict(extra="ignore", json_schema_extra={"additionalProperties": False})


class ReviewQualityAuditModelFinding(StrictSchemaModel):
    code: ReviewAuditCode = Field(
        description="Semantic issue class only. Choose the code that best matches the semantic problem in the review."
    )
    severity: Literal["warning", "blocking"] = Field(
        description="Semantic seriousness only. Use warning for reviewer-attention issues. Use blocking only when the review itself is not fit as an academic review as written. The runtime decides submit blocking policy."
    )
    field: ReviewAuditField = Field(
        description="Target the narrowest field that best matches the issue. Use review only when the issue spans the whole review."
    )
    condition_summary: str = Field(
        min_length=8,
        max_length=140,
        description="Short stable phrase describing the issue condition. Avoid quotes, filler, or wording churn.",
    )
    message: str = Field(
        min_length=12,
        max_length=280,
        description="Reviewer-facing explanation of the semantic issue. Be concrete and specific to the submission context.",
    )
    rationale: str = Field(
        min_length=20,
        max_length=500,
        description="Explain why this finding was raised, citing the relationship between the review text and submission context. Do not approve, reject, or score the paper.",
    )
    suggestion: str = Field(
        min_length=12,
        max_length=240,
        description="Actionable next step that improves the review without dictating the final recommendation or score.",
    )


class ReviewQualityAuditModelResponse(StrictSchemaModel):
    evaluation: ReviewQualityAuditEvaluation = Field(
        description="Neutral assessment of the review's specificity, evidence engagement, internal consistency, and strongest improvement opportunity."
    )
    findings: list[ReviewQualityAuditModelFinding] = Field(max_length=6)
