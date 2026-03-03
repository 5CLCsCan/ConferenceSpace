from app.graph.builder import _extract_resume_from_messages, _has_fresh_user_message


def test_extract_resume_from_tool_part():
    pending = {"tool_call_id": "call_123", "tool_name": "performAction"}
    messages = [
        {
            "role": "assistant",
            "parts": [
                {
                    "type": "tool-performAction",
                    "toolCallId": "call_123",
                    "state": "output-available",
                    "output": {"success": True},
                }
            ],
        }
    ]
    resume = _extract_resume_from_messages(messages=messages, pending_tool=pending)
    assert resume is not None
    assert resume["tool_call_id"] == "call_123"
    assert resume["status"] == "output-available"


def test_has_fresh_user_message():
    assert _has_fresh_user_message(
        [
            {
                "role": "user",
                "parts": [{"type": "text", "text": "hello"}],
            }
        ]
    )
    assert not _has_fresh_user_message(
        [{"role": "assistant", "parts": [{"type": "text", "text": "x"}]}]
    )

