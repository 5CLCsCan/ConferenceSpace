from __future__ import annotations

import json
from pathlib import Path
from typing import TypedDict


class SkillDescriptor(TypedDict):
    skill_name: str
    skill_description: str
    skill_path: str


SERVICES_ROOT = Path(__file__).resolve().parent
SKILL_REGISTRY_ROOT = (SERVICES_ROOT / "skill_registry").resolve()


SKILL_INDEX: list[SkillDescriptor] = [
    {
        "skill_name": "workload_risk_insight",
        "skill_description": (
            "Assess workload, deadline risk, and SLA pressure from assignments, invitations, due dates, and completion signals, then return a concise risk summary with mitigations."
        ),
        "skill_path": "skill_registry/workload_risk_insight.md",
    }
]


def serialize_skill_index() -> str:
    return json.dumps(SKILL_INDEX, ensure_ascii=True, indent=2)


def load_skill_content(skill_name: str) -> dict[str, str]:
    descriptor = _get_skill_descriptor(skill_name)
    skill_path = _resolve_skill_path(descriptor)
    content = skill_path.read_text(encoding="utf-8").strip()
    if not content:
        raise ValueError(f"Skill file is empty for skill_name '{skill_name}'")
    return {
        "skill_name": descriptor["skill_name"],
        "content": content,
    }


def _get_skill_descriptor(skill_name: str) -> SkillDescriptor:
    matches = [descriptor for descriptor in SKILL_INDEX if descriptor["skill_name"] == skill_name]
    if not matches:
        raise ValueError(f"Unknown skill_name '{skill_name}'")
    if len(matches) > 1:
        raise ValueError(f"Duplicate skill_name '{skill_name}' in skill index")
    return matches[0]


def _resolve_skill_path(descriptor: SkillDescriptor) -> Path:
    candidate = (SERVICES_ROOT / descriptor["skill_path"]).resolve()
    if not candidate.is_relative_to(SKILL_REGISTRY_ROOT):
        raise ValueError(
            f"Resolved skill path for skill_name '{descriptor['skill_name']}' is outside the skill registry"
        )
    if not candidate.is_file():
        raise FileNotFoundError(f"Skill file not found for skill_name '{descriptor['skill_name']}': {candidate}")
    return candidate
