from __future__ import annotations

from app.workflows.paper_annotation.schemas import PaperAnnotationArtifact


def test_artifact_schema_is_strict_for_openai_responses() -> None:
    schema = PaperAnnotationArtifact.model_json_schema()

    assert _schema_object_property_mismatches(schema) == []


def _schema_object_property_mismatches(schema: dict) -> list[tuple[str | None, list[str], list[str]]]:
    mismatches: list[tuple[str | None, list[str], list[str]]] = []
    stack: list[object] = [schema, *schema.get("$defs", {}).values()]
    while stack:
        current = stack.pop()
        if isinstance(current, dict):
            if current.get("type") == "object":
                properties = set(current.get("properties", {}))
                required = set(current.get("required", []))
                if current.get("additionalProperties") is not False or properties != required:
                    mismatches.append((current.get("title"), sorted(properties - required), sorted(required - properties)))
            stack.extend(value for value in current.values() if isinstance(value, (dict, list)))
        elif isinstance(current, list):
            stack.extend(value for value in current if isinstance(value, (dict, list)))
    return mismatches
