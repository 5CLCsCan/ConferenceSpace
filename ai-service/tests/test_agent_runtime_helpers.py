from __future__ import annotations

from app.services.agent_runtime import (
    _derive_conversation_title,
    _extract_resume_from_messages,
    _normalize_tool_input,
    _pick_tool_call,
    _ui_to_openai_messages,
)
from app.services.prompt import SYSTEM_PROMPT


def test_extract_resume_from_messages_matches_pending_call() -> None:
    messages = [
        {
            "id": "assistant-1",
            "role": "assistant",
            "parts": [
                {
                    "type": "dynamic-tool",
                    "toolName": "performAction",
                    "toolCallId": "call_1",
                    "state": "output-available",
                    "output": {"success": True},
                }
            ],
        }
    ]
    pending = {"tool_call_id": "call_1", "tool_name": "performAction"}

    result = _extract_resume_from_messages(messages=messages, pending_tool=pending)
    assert result is not None
    assert result["tool_call_id"] == "call_1"
    assert result["status"] == "output-available"
    assert result["output"] == {"success": True}


def test_derive_conversation_title_from_first_user_text_part() -> None:
    messages = [
        {"id": "m-1", "role": "assistant", "parts": [{"type": "text", "text": "Welcome"}]},
        {"id": "m-2", "role": "user", "parts": [{"type": "text", "text": "   Need   reviewer  assignment help   "}]}]
    title = _derive_conversation_title(messages)
    assert title == "Need reviewer assignment help"


def test_ui_to_openai_messages_includes_tool_metadata() -> None:
    messages = [
        {
            "id": "tool-call-1",
            "role": "tool",
            "parts": [
                {
                    "type": "tool-getPageContext",
                    "toolCallId": "call_1",
                    "state": "output-available",
                    "output": {"url": "https://example.com"},
                }
            ],
        }
    ]

    converted = _ui_to_openai_messages(messages)
    assert len(converted) == 1
    assert converted[0]["role"] == "tool"
    assert converted[0]["tool_call_id"] == "call_1"
    assert converted[0]["name"] == "getPageContext"
    assert '"url": "https://example.com"' in converted[0]["content"]


def test_ui_to_openai_messages_falls_back_when_tool_metadata_missing() -> None:
    messages = [
        {
            "id": "tool-call-2",
            "role": "tool",
            "parts": [
                {
                    "type": "dynamic-tool",
                    "state": "output-available",
                    "output": {"ok": True},
                }
            ],
        }
    ]

    converted = _ui_to_openai_messages(messages)
    assert len(converted) == 1
    assert converted[0]["role"] == "assistant"
    assert converted[0]["content"].startswith("Tool output:")


def test_pick_tool_call_unwraps_properties_wrapped_perform_action_input() -> None:
    tool_buffers = {
        0: {
            "tool_call_id": "call_1",
            "tool_name": "performAction",
            "args_raw": '{"properties":{"action":"click","ref":"btn-78"}}',
        }
    }

    picked = _pick_tool_call(tool_buffers)

    assert picked == {
        "tool_call_id": "call_1",
        "tool_name": "performAction",
        "input": {"action": "click", "ref": "btn-78"},
    }


def test_normalize_tool_input_unwraps_properties_wrapped_navigate_input() -> None:
    normalized = _normalize_tool_input(
        tool_name="navigate",
        tool_input={
            "properties": {
                "destinationId": "chair.conference.detail",
                "params": {"conferenceId": "conf-1"},
            }
        },
    )

    assert normalized == {
        "destinationId": "chair.conference.detail",
        "params": {"conferenceId": "conf-1"},
    }


def test_system_prompt_mentions_navigation_tools() -> None:
    prompt = SYSTEM_PROMPT

    assert "Use getCurrentNavigation first when route awareness matters." in prompt
    assert "Use navigate for route changes between known sitemap destinations." in prompt
    assert "Use getPageContext after navigation before performing actions on the page." in prompt


def test_system_prompt_guides_query_engine_discovery_and_public_resources() -> None:
    prompt = SYSTEM_PROMPT

    assert 'call {"op":"describe"} first' in prompt
    assert "public_conferences" in prompt
    assert "Use public_conferences for platform-wide discovery" in prompt
    assert "Use conferences for actor-scoped conference access" in prompt


def test_system_prompt_is_substantial_runtime_asset() -> None:
    prompt = SYSTEM_PROMPT

    assert len(prompt.splitlines()) >= 250
    assert "ConferenceSpace assistant" in prompt
    assert "<identity>" in prompt
    assert "<query_engine_workflow>" in prompt
    assert "<action_tool_workflow>" in prompt
    assert "<retry_and_failure_rules>" in prompt


def test_system_prompt_uses_structured_sections_and_examples() -> None:
    prompt = SYSTEM_PROMPT

    assert "<tool_selection>" in prompt
    assert "<resource_routing>" in prompt
    assert "<examples>" in prompt
    assert prompt.count("<example>") >= 4
    assert "<user_request>" in prompt
    assert "<preferred_tool_path>" in prompt
