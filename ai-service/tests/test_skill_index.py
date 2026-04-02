from __future__ import annotations

import json

from app.services.skill_index import SKILL_INDEX, serialize_skill_index


def test_skill_index_exposes_required_descriptor_fields() -> None:
    assert SKILL_INDEX, "expected at least one registered skill"

    for descriptor in SKILL_INDEX:
        assert set(descriptor.keys()) == {"skill_name", "skill_description", "skill_path"}
        assert isinstance(descriptor["skill_name"], str) and descriptor["skill_name"].strip()
        assert isinstance(descriptor["skill_description"], str) and descriptor["skill_description"].strip()
        assert isinstance(descriptor["skill_path"], str) and descriptor["skill_path"].strip()


def test_serialize_skill_index_returns_json_array_of_descriptors() -> None:
    payload = json.loads(serialize_skill_index())

    assert isinstance(payload, list)
    assert payload
    assert payload[0]["skill_name"] == SKILL_INDEX[0]["skill_name"]
    assert payload[0]["skill_description"] == SKILL_INDEX[0]["skill_description"]
    assert payload[0]["skill_path"] == SKILL_INDEX[0]["skill_path"]
