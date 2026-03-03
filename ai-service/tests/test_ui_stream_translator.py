from app.stream.ui_stream_translator import StreamState, UIStreamTranslator


def test_text_stream_translation():
    t = UIStreamTranslator(message_id="m1")
    parts = t.start()
    assert parts[0]["type"] == "start"
    assert parts[1]["type"] == "start-step"

    delta_parts = t.feed_delta({"content": "Hello"})
    assert delta_parts[0]["type"] == "text-start"
    assert delta_parts[1]["type"] == "text-delta"

    end_parts = t.end()
    assert any(p["type"] == "text-end" for p in end_parts)
    assert end_parts[-1]["type"] == "finish"
    assert t.state == StreamState.COMPLETED


def test_tool_call_translation_with_partial_args():
    t = UIStreamTranslator(message_id="m1")
    t.start()
    p1 = t.feed_delta(
        {
            "tool_calls": [
                {
                    "index": 0,
                    "id": "call_1",
                    "function": {
                        "name": "performAction",
                        "arguments": "{\"action\":\"click\",",
                    },
                }
            ]
        }
    )
    assert p1[0]["type"] == "tool-input-start"

    p2 = t.feed_delta(
        {
            "tool_calls": [
                {
                    "index": 0,
                    "function": {
                        "arguments": "\"ref\":\"btn-1\"}",
                    },
                }
            ]
        }
    )
    assert p2[0]["type"] == "tool-input-available"
    assert p2[0]["input"]["ref"] == "btn-1"

