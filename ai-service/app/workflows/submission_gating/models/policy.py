from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.workflows.submission_gating.schemas import GatingRunRequest


@dataclass(slots=True)
class ActorContext:
    user_id: str
    email: str
    role: str

    @classmethod
    def from_request(cls, request: GatingRunRequest) -> "ActorContext":
        return cls(
            user_id=str(request.actor.user_id),
            email=request.actor.email or "",
            role=request.actor.role or "",
        )


@dataclass(slots=True)
class DeskRejectionCustomRules:
    min_datasets: int | None = None
    minimum_tables: int | None = None
    author_anonymization_required: bool = False
    critical_keywords_required: list[str] = field(default_factory=list)
    banned_phrases: list[str] = field(default_factory=list)


@dataclass(slots=True)
class FormatConfig:
    """Optional format compliance configuration for the format_compliance stage."""
    min_body_font_pt: float | None = None
    min_margin_in: float | None = None
    required_paper_size: str | None = None  # "letter" | "a4"
    max_columns: int | None = None


@dataclass(slots=True)
class DeskRejectionConfig:
    enabled: bool = False
    min_references: int | None = None
    required_sections: list[str] = field(default_factory=list)
    thresholds: dict[str, float] = field(default_factory=dict)
    weights: dict[str, float] = field(default_factory=dict)
    custom_rules: DeskRejectionCustomRules = field(default_factory=DeskRejectionCustomRules)
    prompt_fragments: list[str] = field(default_factory=list)

    @property
    def steering_prompt(self) -> str:
        return "\n\n".join(fragment.strip() for fragment in self.prompt_fragments if fragment.strip())


@dataclass(slots=True)
class PolicySnapshot:
    maximum_pages: int | None
    submission_format: list[str]
    review_type: str
    desk_rejection_settings: DeskRejectionConfig
    format_config: FormatConfig | None = None
    workflow_settings: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_request(cls, request: GatingRunRequest) -> "PolicySnapshot":
        payload = request.policy
        custom_rules = payload.desk_rejection_settings.custom_rules
        desk_settings = DeskRejectionConfig(
            enabled=payload.desk_rejection_settings.enabled,
            min_references=payload.desk_rejection_settings.min_references,
            required_sections=list(payload.desk_rejection_settings.required_sections),
            thresholds=dict(payload.desk_rejection_settings.thresholds),
            weights=dict(payload.desk_rejection_settings.weights),
            custom_rules=DeskRejectionCustomRules(
                min_datasets=custom_rules.min_datasets,
                minimum_tables=custom_rules.minimum_tables,
                author_anonymization_required=bool(custom_rules.author_anonymization_required),
                critical_keywords_required=list(custom_rules.critical_keywords_required),
                banned_phrases=list(custom_rules.banned_phrases),
            ),
            prompt_fragments=list(payload.desk_rejection_settings.prompt_fragments),
        )
        fmt_payload = getattr(payload, "format_config", None)
        format_config: FormatConfig | None = None
        if fmt_payload is not None:
            format_config = FormatConfig(
                min_body_font_pt=getattr(fmt_payload, "min_body_font_pt", None),
                min_margin_in=getattr(fmt_payload, "min_margin_in", None),
                required_paper_size=getattr(fmt_payload, "required_paper_size", None),
                max_columns=getattr(fmt_payload, "max_columns", None),
            )
        return cls(
            maximum_pages=payload.maximum_pages,
            submission_format=[item.upper() for item in payload.submission_format] or ["PDF"],
            review_type=(payload.review_type or "").lower(),
            desk_rejection_settings=desk_settings,
            format_config=format_config,
            workflow_settings=payload.workflow_settings.model_dump(mode="json", exclude_none=True),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "maximum_pages": self.maximum_pages,
            "submission_format": self.submission_format,
            "review_type": self.review_type,
            "desk_rejection_settings": {
                "enabled": self.desk_rejection_settings.enabled,
                "min_references": self.desk_rejection_settings.min_references,
                "required_sections": self.desk_rejection_settings.required_sections,
                "thresholds": self.desk_rejection_settings.thresholds,
                "weights": self.desk_rejection_settings.weights,
                "custom_rules": {
                    "min_datasets": self.desk_rejection_settings.custom_rules.min_datasets,
                    "minimum_tables": self.desk_rejection_settings.custom_rules.minimum_tables,
                    "author_anonymization_required": self.desk_rejection_settings.custom_rules.author_anonymization_required,
                    "critical_keywords_required": self.desk_rejection_settings.custom_rules.critical_keywords_required,
                    "banned_phrases": self.desk_rejection_settings.custom_rules.banned_phrases,
                },
                "prompt_fragments": self.desk_rejection_settings.prompt_fragments,
            },
            "workflow_settings": self.workflow_settings,
        }
