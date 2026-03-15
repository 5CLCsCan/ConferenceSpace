from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class RuleFinding:
    rule_id: str
    source: str
    severity: str
    message: str
    evidence: dict[str, Any] = field(default_factory=dict)
    remediation_key: str | None = None


@dataclass(slots=True)
class ContentFinding:
    rule_id: str
    source: str
    severity: str
    message: str
    excerpt: str | None = None
    remediation: str | None = None


@dataclass(slots=True)
class GuidanceItem:
    rule_id: str
    source: str
    severity: str
    message: str
    remediation: str


@dataclass(slots=True)
class VerdictBundle:
    verdict: str
    decision: str
    score: float
    summary: dict[str, int]
