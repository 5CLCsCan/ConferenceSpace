from __future__ import annotations

from datetime import datetime, timezone

from app.db.models import AiMessage
from app.repositories.message_repo import MessageRepository


class _ScalarsResult:
    def __init__(self, values):
        self._values = values

    def all(self):
        return self._values


class _ExecuteResult:
    def __init__(self, *, scalars_values=None, scalar_value=None):
        self._scalars_values = scalars_values or []
        self._scalar_value = scalar_value

    def scalars(self):
        return _ScalarsResult(self._scalars_values)

    def scalar(self):
        return self._scalar_value


class _FakeDB:
    def __init__(self, responses):
        self._responses = list(responses)
        self.added = []
        self.flush_calls = 0

    async def execute(self, _query):
        if not self._responses:
            raise AssertionError("unexpected execute() call")
        return self._responses.pop(0)

    def add(self, row):
        self.added.append(row)

    async def flush(self):
        self.flush_calls += 1


async def test_append_unseen_messages_deduplicates_existing_and_batch_duplicates() -> None:
    db = _FakeDB(
        responses=[
            _ExecuteResult(
                scalars_values=[
                    AiMessage(
                        thread_id="thread-1",
                        sequence_no=7,
                        message_id="m-1",
                        role="user",
                        parts=[{"type": "text", "text": "a"}],
                        token_count=None,
                    )
                ]
            ),
            _ExecuteResult(scalar_value=7),
        ]
    )
    repo = MessageRepository(db)  # type: ignore[arg-type]

    appended = await repo.append_unseen_messages(
        "thread-1",
        [
            {"id": "m-1", "role": "user", "parts": [{"type": "text", "text": "a"}]},
            {"id": "m-2", "role": "assistant", "parts": [{"type": "text", "text": "b"}]},
            {"id": "m-2", "role": "assistant", "parts": [{"type": "text", "text": "b"}]},
        ],
    )

    assert appended == 1
    assert len(db.added) == 1
    assert isinstance(db.added[0], AiMessage)
    assert db.added[0].sequence_no == 8
    assert db.added[0].message_id == "m-2"
    assert db.flush_calls == 1


async def test_append_unseen_messages_updates_existing_message_when_same_id_reappears() -> None:
    existing = AiMessage(
        thread_id="thread-1",
        sequence_no=4,
        message_id="assistant-1",
        role="assistant",
        parts=[{"type": "tool-getPageContext", "toolCallId": "call-1", "state": "input-available", "input": {}}],
        token_count=None,
    )
    db = _FakeDB(
        responses=[
            _ExecuteResult(scalars_values=[existing]),
            _ExecuteResult(scalar_value=4),
        ]
    )
    repo = MessageRepository(db)  # type: ignore[arg-type]

    appended = await repo.append_unseen_messages(
        "thread-1",
        [
            {
                "id": "assistant-1",
                "role": "assistant",
                "parts": [{"type": "text", "text": "Here is the final answer."}],
            }
        ],
    )

    assert appended == 0
    assert len(db.added) == 0
    assert existing.parts == [
        {"type": "tool-getPageContext", "toolCallId": "call-1", "state": "input-available", "input": {}},
        {"type": "text", "text": "Here is the final answer."},
    ]
    assert db.flush_calls == 1


async def test_append_unseen_messages_merges_duplicate_payloads_within_batch() -> None:
    db = _FakeDB(
        responses=[
            _ExecuteResult(scalars_values=[]),
            _ExecuteResult(scalar_value=2),
        ]
    )
    repo = MessageRepository(db)  # type: ignore[arg-type]

    appended = await repo.append_unseen_messages(
        "thread-1",
        [
            {
                "id": "assistant-2",
                "role": "assistant",
                "parts": [{"type": "tool-getPageContext", "toolCallId": "call-2", "state": "input-available", "input": {}}],
            },
            {
                "id": "assistant-2",
                "role": "assistant",
                "parts": [{"type": "text", "text": "Resolved response"}],
            },
        ],
    )

    assert appended == 1
    assert len(db.added) == 1
    assert db.added[0].sequence_no == 3
    assert db.added[0].parts == [
        {"type": "tool-getPageContext", "toolCallId": "call-2", "state": "input-available", "input": {}},
        {"type": "text", "text": "Resolved response"},
    ]
    assert db.flush_calls == 1


def test_to_ui_messages_includes_created_at() -> None:
    repo = MessageRepository(_FakeDB([]))  # type: ignore[arg-type]
    row = AiMessage(
        thread_id="thread-1",
        sequence_no=1,
        message_id="m-1",
        role="user",
        parts=[{"type": "text", "text": "hello"}],
        token_count=None,
        created_at=datetime(2026, 3, 4, 8, 0, 0, tzinfo=timezone.utc),
    )

    payload = repo._to_ui_messages([row])  # noqa: SLF001
    assert payload[0]["createdAt"] == "2026-03-04T08:00:00+00:00"
