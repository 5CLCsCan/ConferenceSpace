from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.api.schemas import HistorySessionMeta, ToolResultEnvelope
from app.services.tool_registry import TOOL_REGISTRY


def test_tool_result_envelope_allows_output_available_without_error() -> None:
    envelope = ToolResultEnvelope(
        tool_name="getPageContext",
        status="output-available",
        output={"ok": True},
    )
    assert envelope.status == "output-available"


@pytest.mark.parametrize("status", ["output-error", "timeout"])
def test_tool_result_envelope_requires_error_text_for_non_success(status: str) -> None:
    with pytest.raises(ValidationError):
        ToolResultEnvelope(
            tool_name="performActions",
            status=status,  # type: ignore[arg-type]
            output=None,
        )


def test_history_session_meta_requires_title() -> None:
    with pytest.raises(ValidationError):
        HistorySessionMeta(
            started_at="2026-03-04T00:00:00+00:00",
            last_activity_at="2026-03-04T00:00:00+00:00",
            turn_count=1,
            model="openrouter/google/gemini-2.5-flash-lite",
            trace_id="trace-1",
        )


def test_tool_registry_includes_get_current_navigation_client_tool() -> None:
    spec = TOOL_REGISTRY["getCurrentNavigation"]

    assert spec.execution_mode == "client"
    assert spec.input_schema == {
        "type": "object",
        "properties": {},
        "additionalProperties": False,
    }


def test_tool_registry_includes_navigate_client_tool() -> None:
    spec = TOOL_REGISTRY["navigate"]

    assert spec.execution_mode == "client"
    assert spec.input_schema["required"] == ["destinationId"]
    assert spec.input_schema["properties"]["destinationId"] == {"type": "string"}
    assert spec.input_schema["properties"]["params"] == {
        "type": "object",
        "additionalProperties": {"type": "string"},
    }


def test_tool_registry_replaces_perform_action_with_perform_actions() -> None:
    assert "performAction" not in TOOL_REGISTRY

    spec = TOOL_REGISTRY["performActions"]

    assert spec.execution_mode == "client"
    assert spec.input_schema["required"] == ["actions"]
    assert spec.input_schema["properties"]["actions"]["type"] == "array"
    assert spec.input_schema["properties"]["actions"]["minItems"] == 1

    item_schema = spec.input_schema["properties"]["actions"]["items"]
    assert item_schema["required"] == ["action"]
    assert item_schema["additionalProperties"] is False
    assert item_schema["properties"] == {
        "action": {"type": "string", "enum": ["click", "type", "press", "select", "clear"]},
        "ref": {"type": "string"},
        "text": {"type": "string"},
        "key": {"type": "string"},
        "value": {"type": "string"},
    }


def test_tool_registry_includes_query_engine_server_tool() -> None:
    spec = TOOL_REGISTRY["query_engine"]

    assert spec.execution_mode == "server"
    assert spec.input_schema["required"] == ["op"]
    assert spec.input_schema["properties"]["op"] == {
        "type": "string",
        "enum": ["describe", "query"],
    }
    assert spec.input_schema["properties"]["resource"] == {"type": "string"}


def test_tool_registry_includes_get_skill_server_tool() -> None:
    spec = TOOL_REGISTRY["get_skill"]

    assert spec.execution_mode == "server"
    assert spec.input_schema == {
        "type": "object",
        "properties": {
            "skill_name": {"type": "string"},
        },
        "required": ["skill_name"],
        "additionalProperties": False,
    }
