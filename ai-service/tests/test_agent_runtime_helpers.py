from __future__ import annotations

from app.services.agent_runtime import _derive_conversation_title, _extract_resume_from_messages


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
