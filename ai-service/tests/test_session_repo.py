from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest

from app.db.models import AiSession
from app.repositories.session_repo import SessionRepository


class _ScalarsResult:
    def __init__(self, values):
        self._values = values

    def all(self):
        return self._values


class _ExecuteResult:
    def __init__(self, *, scalars_values=None):
        self._scalars_values = scalars_values or []

    def scalars(self):
        return _ScalarsResult(self._scalars_values)


class _FakeDB:
    def __init__(self, responses=None):
        self._responses = list(responses or [])
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


def _build_session(*, thread_id: str, last_activity_at: datetime, title: str = "New Conversation") -> AiSession:
    return AiSession(
        thread_id=thread_id,
        user_id=1,
        user_email="user@example.com",
        title=title,
        model="openrouter/google/gemini-2.5-flash-lite",
        trace_id="6b8cfc4d-6be7-45d8-9203-c1363d7db5ef",
        status="active",
        last_activity_at=last_activity_at,
        started_at=last_activity_at,
        turn_count=0,
    )


def test_cursor_round_trip() -> None:
    repo = SessionRepository(_FakeDB())  # type: ignore[arg-type]
    timestamp = datetime(2026, 3, 4, 10, 15, tzinfo=timezone.utc)
    cursor = repo._encode_cursor(timestamp, "thread-9")  # noqa: SLF001
    decoded_timestamp, decoded_thread = repo._decode_cursor(cursor)  # noqa: SLF001
    assert decoded_timestamp == timestamp
    assert decoded_thread == "thread-9"


def test_decode_cursor_rejects_invalid_value() -> None:
    repo = SessionRepository(_FakeDB())  # type: ignore[arg-type]
    with pytest.raises(ValueError):
        repo._decode_cursor("not-valid-base64")  # noqa: SLF001


async def test_ensure_session_uses_initial_title_on_create() -> None:
    db = _FakeDB()
    repo = SessionRepository(db)  # type: ignore[arg-type]
    repo.get_by_thread_id = AsyncMock(return_value=None)

    session = await repo.ensure_session(
        thread_id="thread-1",
        user_id=1,
        user_email="user@example.com",
        model="openrouter/google/gemini-2.5-flash-lite",
        initial_title="  First   user question  ",
    )

    assert session.title == "First user question"
    assert len(db.added) == 1
    assert db.flush_calls == 1


async def test_list_owned_sessions_returns_next_cursor_when_more_rows() -> None:
    row_1 = _build_session(thread_id="thread-3", last_activity_at=datetime(2026, 3, 4, 10, 0, tzinfo=timezone.utc))
    row_2 = _build_session(thread_id="thread-2", last_activity_at=datetime(2026, 3, 4, 9, 0, tzinfo=timezone.utc))
    row_3 = _build_session(thread_id="thread-1", last_activity_at=datetime(2026, 3, 4, 8, 0, tzinfo=timezone.utc))
    db = _FakeDB(responses=[_ExecuteResult(scalars_values=[row_1, row_2, row_3])])
    repo = SessionRepository(db)  # type: ignore[arg-type]

    rows, next_cursor = await repo.list_owned_sessions(user_id=1, limit=2)

    assert [row.thread_id for row in rows] == ["thread-3", "thread-2"]
    assert next_cursor is not None

    decoded_time, decoded_thread = repo._decode_cursor(next_cursor)  # noqa: SLF001
    assert decoded_time == datetime(2026, 3, 4, 9, 0, tzinfo=timezone.utc)
    assert decoded_thread == "thread-2"
