from __future__ import annotations

from pathlib import Path

import pytest

from app.services import skill_index


def test_load_skill_content_returns_named_skill_with_markdown_body() -> None:
    payload = skill_index.load_skill_content("workload_risk_insight")

    assert payload["skill_name"] == "workload_risk_insight"
    assert "Workload / Deadline-Risk / SLA Insights" in payload["content"]
    assert "query_engine" in payload["content"]
    assert "If you use `group_by`, you must also use `aggregates`" in payload["content"]


def test_load_skill_content_raises_for_unknown_skill_name() -> None:
    with pytest.raises(ValueError, match="Unknown skill_name"):
        skill_index.load_skill_content("does_not_exist")


def test_load_skill_content_rejects_duplicate_skill_names(monkeypatch: pytest.MonkeyPatch) -> None:
    duplicate_index = [
        {
            "skill_name": "duplicate",
            "skill_description": "first",
            "skill_path": "skill_registry/example_skill.md",
        },
        {
            "skill_name": "duplicate",
            "skill_description": "second",
            "skill_path": "skill_registry/example_skill.md",
        },
    ]

    monkeypatch.setattr(skill_index, "SKILL_INDEX", duplicate_index)

    with pytest.raises(ValueError, match="Duplicate skill_name"):
        skill_index.load_skill_content("duplicate")


def test_load_skill_content_rejects_paths_outside_registry(monkeypatch: pytest.MonkeyPatch) -> None:
    escape_index = [
        {
            "skill_name": "escape",
            "skill_description": "escape attempt",
            "skill_path": "..\\..\\..\\secrets.md",
        }
    ]

    monkeypatch.setattr(skill_index, "SKILL_INDEX", escape_index)

    with pytest.raises(ValueError, match="outside the skill registry"):
        skill_index.load_skill_content("escape")


def test_load_skill_content_raises_for_missing_file(monkeypatch: pytest.MonkeyPatch) -> None:
    missing_index = [
        {
            "skill_name": "missing",
            "skill_description": "missing file",
            "skill_path": "skill_registry/missing_skill.md",
        }
    ]

    monkeypatch.setattr(skill_index, "SKILL_INDEX", missing_index)

    with pytest.raises(FileNotFoundError, match="Skill file not found"):
        skill_index.load_skill_content("missing")


def test_registered_skill_paths_point_under_skill_registry() -> None:
    registry_root = skill_index.SKILL_REGISTRY_ROOT.resolve()

    for descriptor in skill_index.SKILL_INDEX:
        resolved = (skill_index.SERVICES_ROOT / descriptor["skill_path"]).resolve()
        assert resolved.is_relative_to(registry_root)
        assert resolved.suffix == ".md"
        assert Path(resolved).name
