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
