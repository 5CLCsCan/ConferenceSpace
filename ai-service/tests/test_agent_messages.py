from __future__ import annotations

from app.services.agent_messages import derive_conversation_title, ui_to_openai_messages


def test_derive_conversation_title_from_first_user_text_part() -> None:
    messages = [
        {"id": "m-1", "role": "assistant", "parts": [{"type": "text", "text": "Welcome"}]},
        {"id": "m-2", "role": "user", "parts": [{"type": "text", "text": "   Need   reviewer  assignment help   "}]},
    ]

    title = derive_conversation_title(messages)

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

    converted = ui_to_openai_messages(messages)

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

    converted = ui_to_openai_messages(messages)

    assert len(converted) == 1
    assert converted[0]["role"] == "assistant"
    assert converted[0]["content"].startswith("Tool output:")
