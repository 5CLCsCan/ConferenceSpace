from __future__ import annotations

from app.services.agent_tools import (
    extract_resume_from_messages,
    normalize_tool_input,
    pick_tool_call,
)


def test_extract_resume_from_messages_matches_pending_call() -> None:
    messages = [
        {
            "id": "assistant-1",
            "role": "assistant",
            "parts": [
                {
                    "type": "dynamic-tool",
                    "toolName": "performActions",
                    "toolCallId": "call_1",
                    "state": "output-available",
                    "output": {"success": True},
                }
            ],
        }
    ]
    pending = {"tool_call_id": "call_1", "tool_name": "performActions"}

    result = extract_resume_from_messages(messages=messages, pending_tool=pending)

    assert result is not None
    assert result["tool_call_id"] == "call_1"
    assert result["status"] == "output-available"
    assert result["output"] == {"success": True}


def test_pick_tool_call_unwraps_properties_wrapped_perform_actions_input() -> None:
    tool_buffers = {
        0: {
            "tool_call_id": "call_1",
            "tool_name": "performActions",
            "args_raw": '{"properties":{"actions":[{"action":"click","ref":"btn-78"}]}}',
        }
    }

    picked = pick_tool_call(tool_buffers)

    assert picked == {
        "tool_call_id": "call_1",
        "tool_name": "performActions",
        "input": {"actions": [{"action": "click", "ref": "btn-78"}]},
    }


def test_normalize_tool_input_preserves_valid_perform_actions_input() -> None:
    normalized = normalize_tool_input(
        tool_name="performActions",
        tool_input={
            "actions": [
                {"action": "clear", "ref": "input-1"},
                {"action": "type", "ref": "input-1", "text": "hello"},
            ]
        },
    )

    assert normalized == {
        "actions": [
            {"action": "clear", "ref": "input-1"},
            {"action": "type", "ref": "input-1", "text": "hello"},
        ]
    }


def test_normalize_tool_input_coerces_query_engine_select_string_array() -> None:
    normalized = normalize_tool_input(
        tool_name="query_engine",
        tool_input={
            "op": "query",
            "resource": "public_conferences",
            "select": ["title", "acronym", "cfp_text"],
        },
    )

    assert normalized == {
        "op": "query",
        "resource": "public_conferences",
        "select": [
            {"field": "title"},
            {"field": "acronym"},
            {"field": "cfp_text"},
        ],
    }
