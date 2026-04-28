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


def test_ui_to_openai_messages_preserves_assistant_tool_call_request() -> None:
    messages = [
        {
            "id": "assistant-1",
            "role": "assistant",
            "parts": [
                {
                    "type": "tool-query_engine",
                    "toolCallId": "call_123",
                    "state": "input-available",
                    "input": {"query": "accepted papers"},
                }
            ],
        }
    ]

    converted = ui_to_openai_messages(messages)

    assert converted == [
        {
            "role": "assistant",
            "content": "",
            "tool_calls": [
                {
                    "id": "call_123",
                    "type": "function",
                    "function": {
                        "name": "query_engine",
                        "arguments": '{"query": "accepted papers"}',
                    },
                    "index": 0,
                }
            ],
        }
    ]


def test_ui_to_openai_messages_converts_reconstructed_tool_call_pair() -> None:
    messages = [
        {
            "id": "assistant-call_123",
            "role": "assistant",
            "parts": [
                {
                    "type": "tool-query_engine",
                    "toolCallId": "call_123",
                    "state": "input-available",
                    "input": {"query": "accepted papers"},
                }
            ],
        },
        {
            "id": "tool-call_123",
            "role": "tool",
            "parts": [
                {
                    "type": "tool-query_engine",
                    "toolCallId": "call_123",
                    "state": "output-available",
                    "output": {"papers": []},
                }
            ],
        },
    ]

    converted = ui_to_openai_messages(messages)

    assert converted[0]["tool_calls"][0]["id"] == "call_123"
    assert converted[1]["role"] == "tool"
    assert converted[1]["tool_call_id"] == "call_123"


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


def test_ui_to_openai_messages_preserves_user_file_parts_for_responses_api() -> None:
    messages = [
        {
            "id": "m-1",
            "role": "user",
            "parts": [
                {"type": "text", "text": "Summarize this paper."},
                {
                    "type": "file",
                    "filename": "paper.pdf",
                    "mediaType": "application/pdf",
                    "url": "data:application/pdf;base64,JVBERi0x",
                },
            ],
        }
    ]

    converted = ui_to_openai_messages(messages)

    assert converted == [
        {
            "role": "user",
            "content": [
                {"type": "input_text", "text": "Summarize this paper."},
                {
                    "type": "input_file",
                    "filename": "paper.pdf",
                    "file_data": "data:application/pdf;base64,JVBERi0x",
                },
            ],
        }
    ]
