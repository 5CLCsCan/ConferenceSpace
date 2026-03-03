from app.graph.nodes import _ui_to_openai_messages


def test_ui_to_openai_messages_basic_text():
    ui_messages = [
        {
            "id": "m1",
            "role": "user",
            "parts": [{"type": "text", "text": "Hello"}],
        }
    ]
    converted = _ui_to_openai_messages(ui_messages)
    assert converted == [{"role": "user", "content": "Hello"}]


def test_ui_to_openai_messages_includes_tool_trace_as_text():
    ui_messages = [
        {
            "id": "m2",
            "role": "assistant",
            "parts": [
                {
                    "type": "tool-performAction",
                    "state": "output-available",
                    "input": {"action": "click", "ref": "btn-1"},
                    "output": {"success": True},
                }
            ],
        }
    ]
    converted = _ui_to_openai_messages(ui_messages)
    assert len(converted) == 1
    assert converted[0]["role"] == "assistant"
    assert "[Tool:performAction]" in converted[0]["content"]

