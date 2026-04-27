from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.services.llm_client import LLMClient


class _FakeStreamResponse:
    def __init__(self, chunks):
        self._chunks = chunks

    def __aiter__(self):
        return self._iterate()

    async def _iterate(self):
        for chunk in self._chunks:
            yield chunk


def _make_chunk(delta):
    return SimpleNamespace(choices=[SimpleNamespace(delta=delta)])


@pytest.mark.asyncio
async def test_stream_chat_yields_plain_text_deltas(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_acompletion(**kwargs):
        return _FakeStreamResponse(
            [
                _make_chunk({"content": "Hello"}),
                _make_chunk({"content": " world"}),
            ]
        )

    monkeypatch.setattr("app.services.llm_client._get_acompletion", lambda: fake_acompletion)

    client = LLMClient(api_key="test-key", model="openrouter/google/gemini-2.5-flash-lite")
    chunks = [chunk async for chunk in client.stream_chat(messages=[])]

    assert chunks == [{"content": "Hello"}, {"content": " world"}]


@pytest.mark.asyncio
async def test_stream_chat_yields_explicit_reasoning_deltas(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_acompletion(**kwargs):
        return _FakeStreamResponse(
            [
                _make_chunk({"reasoning_content": "First thought"}),
                _make_chunk({"content": "Visible answer"}),
            ]
        )

    monkeypatch.setattr("app.services.llm_client._get_acompletion", lambda: fake_acompletion)

    client = LLMClient(api_key="test-key", model="openrouter/google/gemini-2.5-flash-lite")
    chunks = [chunk async for chunk in client.stream_chat(messages=[])]

    assert chunks == [{"reasoning": "First thought"}, {"content": "Visible answer"}]


@pytest.mark.asyncio
async def test_stream_chat_splits_inline_think_tags_into_reasoning_and_text(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_acompletion(**kwargs):
        return _FakeStreamResponse([_make_chunk({"content": "<think>Plan</think>Answer"})])

    monkeypatch.setattr("app.services.llm_client._get_acompletion", lambda: fake_acompletion)

    client = LLMClient(api_key="test-key", model="openrouter/google/gemini-2.5-flash-lite")
    chunks = [chunk async for chunk in client.stream_chat(messages=[])]

    assert chunks == [{"reasoning": "Plan"}, {"content": "Answer"}]


@pytest.mark.asyncio
async def test_stream_chat_handles_think_tags_split_across_chunk_boundaries(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_acompletion(**kwargs):
        return _FakeStreamResponse(
            [
                _make_chunk({"content": "<th"}),
                _make_chunk({"content": "ink>Pl"}),
                _make_chunk({"content": "an</thi"}),
                _make_chunk({"content": "nk>Ans"}),
                _make_chunk({"content": "wer"}),
            ]
        )

    monkeypatch.setattr("app.services.llm_client._get_acompletion", lambda: fake_acompletion)

    client = LLMClient(api_key="test-key", model="openrouter/google/gemini-2.5-flash-lite")
    chunks = [chunk async for chunk in client.stream_chat(messages=[])]

    assert chunks == [
        {"reasoning": "Pl"},
        {"reasoning": "an"},
        {"content": "Ans"},
        {"content": "wer"},
    ]


@pytest.mark.asyncio
async def test_stream_chat_reads_text_parts_from_object_content_lists(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_acompletion(**kwargs):
        return _FakeStreamResponse(
            [
                _make_chunk(
                    {
                        "content": [
                            SimpleNamespace(type="text", text="Hello"),
                            SimpleNamespace(type="text", text=" world"),
                        ]
                    }
                )
            ]
        )

    monkeypatch.setattr("app.services.llm_client._get_acompletion", lambda: fake_acompletion)

    client = LLMClient(api_key="test-key", model="openrouter/google/gemini-2.5-flash-lite")
    chunks = [chunk async for chunk in client.stream_chat(messages=[])]

    assert chunks == [{"content": "Hello world"}]


@pytest.mark.asyncio
async def test_summarize_reads_text_parts_from_object_content_lists(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_acompletion(**kwargs):
        return {
            "choices": [
                {
                    "message": {
                        "content": [
                            SimpleNamespace(type="text", text="Short"),
                            SimpleNamespace(type="text", text=" summary"),
                        ]
                    }
                }
            ]
        }

    monkeypatch.setattr("app.services.llm_client._get_acompletion", lambda: fake_acompletion)

    client = LLMClient(api_key="test-key", model="openrouter/google/gemini-2.5-flash-lite")
    summary = await client.summarize(prompt="Summarize this")

    assert summary == "Short summary"


@pytest.mark.asyncio
async def test_complete_json_parses_json_array_response(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured: dict[str, object] = {}

    async def fake_acompletion(**kwargs):
        captured.update(kwargs)
        return {"choices": [{"message": {"content": '[{"rule_id":"page_limit"}]'}}]}

    monkeypatch.setattr("app.services.llm_client._get_acompletion", lambda: fake_acompletion)

    client = LLMClient(api_key="test-key", model="openrouter/google/gemini-2.5-flash-lite")
    payload = await client.complete_json(
        messages=[
            {"role": "system", "content": "Return JSON only."},
            {"role": "user", "content": "Check the page limit."},
        ]
    )

    assert payload == [{"rule_id": "page_limit"}]
    messages = captured["messages"]
    assert isinstance(messages, list)
    assert messages[0]["role"] == "system"
    assert messages[1]["role"] == "user"


@pytest.mark.asyncio
async def test_complete_json_prefers_openai_compatible_primary_when_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls: list[dict[str, object]] = []

    async def fake_acompletion(**kwargs):
        calls.append(kwargs)
        return {"choices": [{"message": {"content": '{"provider":"openai"}'}}]}

    monkeypatch.setattr("app.services.llm_client._get_acompletion", lambda: fake_acompletion)

    client = LLMClient(
        api_key="openrouter-key",
        model="openrouter/google/gemini-2.5-flash-lite",
        openai_api_key="openai-key",
        openai_base_url="http://localhost:20128/v1",
        openai_model="cx/gpt-5.4-mini",
    )
    payload = await client.complete_json(messages=[{"role": "user", "content": "hello"}])

    assert payload == {"provider": "openai"}
    assert len(calls) == 1
    assert calls[0]["model"] == "openai/cx/gpt-5.4-mini"
    assert calls[0]["api_key"] == "openai-key"
    assert calls[0]["api_base"] == "http://localhost:20128/v1"
    assert calls[0]["timeout"] == 60
    assert calls[0]["num_retries"] == 0


@pytest.mark.asyncio
async def test_complete_json_falls_back_to_openrouter_when_primary_fails(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls: list[dict[str, object]] = []

    async def fake_acompletion(**kwargs):
        calls.append(kwargs)
        if len(calls) == 1:
            raise TimeoutError("primary provider timed out")
        return {"choices": [{"message": {"content": '{"provider":"openrouter"}'}}]}

    monkeypatch.setattr("app.services.llm_client._get_acompletion", lambda: fake_acompletion)

    client = LLMClient(
        api_key="openrouter-key",
        model="openrouter/google/gemini-2.5-flash-lite",
        openai_api_key="openai-key",
        openai_base_url="http://localhost:20128/v1",
        openai_model="cx/gpt-5.4-mini",
    )
    payload = await client.complete_json(messages=[{"role": "user", "content": "hello"}])

    assert payload == {"provider": "openrouter"}
    assert [call["model"] for call in calls] == [
        "openai/cx/gpt-5.4-mini",
        "openrouter/google/gemini-2.5-flash-lite",
    ]
    assert calls[0]["api_key"] == "openai-key"
    assert calls[1]["api_key"] == "openrouter-key"
    assert calls[0]["timeout"] == 60
    assert calls[1]["timeout"] == 60
    assert calls[0]["num_retries"] == 0
    assert calls[1]["num_retries"] == 0
    assert "api_base" not in calls[1]


@pytest.mark.asyncio
async def test_stream_chat_falls_back_to_openrouter_when_primary_stream_times_out(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls: list[dict[str, object]] = []

    async def fake_acompletion(**kwargs):
        calls.append(kwargs)
        if len(calls) == 1:
            raise TimeoutError("no primary stream response")
        return _FakeStreamResponse([_make_chunk({"content": "Fallback answer"})])

    monkeypatch.setattr("app.services.llm_client._get_acompletion", lambda: fake_acompletion)

    client = LLMClient(
        api_key="openrouter-key",
        model="openrouter/google/gemini-2.5-flash-lite",
        openai_api_key="openai-key",
        openai_base_url="http://localhost:20128/v1",
        openai_model="cx/gpt-5.4-mini",
    )
    chunks = [chunk async for chunk in client.stream_chat(messages=[])]

    assert chunks == [{"content": "Fallback answer"}]
    assert [call["model"] for call in calls] == [
        "openai/cx/gpt-5.4-mini",
        "openrouter/google/gemini-2.5-flash-lite",
    ]
    assert calls[0]["stream"] is True
    assert calls[1]["stream"] is True
    assert calls[0]["stream_timeout"] == 60
    assert calls[1]["stream_timeout"] == 60


@pytest.mark.asyncio
async def test_stream_chat_with_file_inputs_uses_openai_responses_stream(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured: dict[str, object] = {}

    class _FakeAsyncResponses:
        async def create(self, **kwargs):
            captured.update(kwargs)
            return _FakeStreamResponse(
                [
                    SimpleNamespace(type="response.output_text.delta", delta="File "),
                    SimpleNamespace(type="response.output_text.delta", delta="summary"),
                    SimpleNamespace(type="response.completed"),
                ]
            )

    class _FakeAsyncOpenAI:
        def __init__(self, **kwargs):
            captured["client"] = kwargs
            self.responses = _FakeAsyncResponses()

    monkeypatch.setattr("app.services.llm_client._get_async_openai", lambda: _FakeAsyncOpenAI)

    client = LLMClient(
        api_key="openrouter-key",
        model="openrouter/google/gemini-2.5-flash-lite",
        openai_api_key="openai-key",
        openai_base_url="https://api.openai.com/v1",
        openai_model="gpt-5.5",
    )
    chunks = [
        chunk
        async for chunk in client.stream_chat(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": "Summarize this."},
                        {
                            "type": "input_file",
                            "filename": "paper.pdf",
                            "file_data": "JVBERi0x",
                        },
                    ],
                }
            ]
        )
    ]

    assert chunks == [{"content": "File "}, {"content": "summary"}]
    assert captured["client"] == {
        "api_key": "openai-key",
        "base_url": "https://api.openai.com/v1",
        "timeout": 60,
        "max_retries": 0,
    }
    assert captured["model"] == "gpt-5.5"
    assert captured["stream"] is True
    assert captured["input"] == [
        {
            "role": "user",
            "content": [
                {"type": "input_text", "text": "Summarize this."},
                {
                    "type": "input_file",
                    "filename": "paper.pdf",
                    "file_data": "JVBERi0x",
                },
            ],
        }
    ]
