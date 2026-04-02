from __future__ import annotations

from contextlib import asynccontextmanager
from types import SimpleNamespace

from app.core.auth import Identity
from app.services.agent_runtime import AgentRuntime
from app.services.metrics import MetricsStore


class _FakeSession:
    def __init__(self) -> None:
        self.rolling_summary = None
        self.pending_tool_call = None
        self.turn_count = 0


class _FakeSessionRepo:
    def __init__(self, session: _FakeSession) -> None:
        self._session = session
        self.runtime_updates: list[dict[str, object]] = []

    async def ensure_session(self, **_kwargs):
        return self._session

    async def get_owned_session(self, _thread_id: str, _user_id: int):
        return self._session

    async def update_runtime(self, thread_id: str, **kwargs) -> None:
        self.runtime_updates.append({"thread_id": thread_id, **kwargs})


class _FakeMessageRepo:
    def __init__(self, initial_messages: list[dict[str, object]]) -> None:
        self._messages = list(initial_messages)
        self.appended: list[list[dict[str, object]]] = []

    async def append_unseen_messages(self, _thread_id: str, messages):
        self.appended.append(list(messages))
        self._messages = list(messages)
        return len(messages)

    async def list_recent_ui_messages(self, _thread_id: str, *, limit: int):
        return self._messages[-limit:]


class _FakeAuditRepo:
    def __init__(self) -> None:
        self.created: list[dict[str, object]] = []
        self.completed: list[dict[str, object]] = []

    async def create_requested(self, **kwargs):
        self.created.append(kwargs)
        return None

    async def mark_completed(self, **kwargs):
        self.completed.append(kwargs)


class _FakeDBSession:
    def __init__(self) -> None:
        self.commits = 0

    async def commit(self) -> None:
        self.commits += 1


class _FakeRuntimeStore:
    async def pop_tool_result(self, _thread_id: str, _tool_call_id: str):
        return None


class _FakeQueryEngineClient:
    def __init__(self) -> None:
        self.calls: list[dict[str, object]] = []

    async def execute(self, *, access_token: str, payload: dict[str, object]):
        self.calls.append({"access_token": access_token, "payload": payload})
        return {
            "resource": "submissions",
            "rows": [{"id": 7, "status": "reviewing"}],
            "meta": {"row_count": 1},
        }


class _UnexpectedQueryEngineClient:
    async def execute(self, *, access_token: str, payload: dict[str, object]):
        raise AssertionError(f"query engine should not have been called: {access_token=} {payload=}")


class _FakeLLMClient:
    def __init__(self) -> None:
        self.calls = 0
        self.messages_per_call: list[list[dict[str, object]]] = []

    async def stream_chat(self, *, messages, tools):  # type: ignore[override]
        self.calls += 1
        self.messages_per_call.append(messages)
        if self.calls == 1:
            yield {
                "tool_calls": [
                    {
                        "id": "call_query_1",
                        "index": 0,
                        "function": {
                            "name": "query_engine",
                            "arguments": '{"op":"query","resource":"submissions","select":[{"field":"id"}]}',
                        },
                    }
                ]
            }
            return

        yield {"content": "You have 1 submission in review."}

    async def summarize(self, *, prompt: str) -> str:
        return prompt


async def test_run_chat_turn_executes_server_tool_and_continues(monkeypatch) -> None:
    fake_session = _FakeSession()
    fake_db = _FakeDBSession()
    fake_message_repo = _FakeMessageRepo(
        [{"id": "user-1", "role": "user", "parts": [{"type": "text", "text": "Check my submissions"}]}]
    )
    fake_session_repo = _FakeSessionRepo(fake_session)
    fake_audit_repo = _FakeAuditRepo()

    monkeypatch.setattr("app.services.agent_runtime.SessionRepository", lambda _db: fake_session_repo)
    monkeypatch.setattr("app.services.agent_runtime.MessageRepository", lambda _db: fake_message_repo)
    monkeypatch.setattr("app.services.agent_runtime.ToolAuditRepository", lambda _db: fake_audit_repo)

    @asynccontextmanager
    async def _session_factory():
        yield fake_db

    query_engine_client = _FakeQueryEngineClient()
    llm_client = _FakeLLMClient()
    runtime = AgentRuntime(
        settings=SimpleNamespace(
            agent_model="openrouter/google/gemini-2.5-flash-lite",
            keep_recent_exchanges=12,
            max_iterations=4,
            max_turn_duration_seconds=120,
            tool_result_timeout_seconds=90,
            context_compaction_threshold=0.7,
            enable_reasoning_stream=False,
        ),
        session_factory=_session_factory,
        runtime_store=_FakeRuntimeStore(),
        llm_client=llm_client,
        metrics=MetricsStore(),
        query_engine_client=query_engine_client,
    )

    events: list[dict[str, object]] = []

    async def _emit(event: dict[str, object]) -> None:
        events.append(event)

    await runtime.run_chat_turn(
        thread_id="thread-1",
        identity=Identity(user_id=123, user_email="author@example.com"),
        access_token="user-token",
        incoming_messages=[
            {"id": "user-1", "role": "user", "parts": [{"type": "text", "text": "Check my submissions"}]}
        ],
        message_id="assistant-1",
        event_emitter=_emit,
    )

    assert query_engine_client.calls == [
        {
            "access_token": "user-token",
            "payload": {"op": "query", "resource": "submissions", "select": [{"field": "id"}]},
        }
    ]
    assert llm_client.calls == 2
    assert any(event["type"] == "tool_start" and event["tool"] == "query_engine" for event in events)
    assert any(
        event["type"] == "tool_end"
        and event["tool"] == "query_engine"
        and event["status"] == "output-available"
        for event in events
    )
    assert any(event["type"] == "token" and event["content"] == "You have 1 submission in review." for event in events)

    tool_messages = [message for batch in fake_message_repo.appended for message in batch if message.get("role") == "tool"]
    assert tool_messages, "expected server tool output to be appended as a tool message"
    tool_part = tool_messages[-1]["parts"][0]
    assert tool_part["type"] == "tool-query_engine"
    assert tool_part["state"] == "output-available"
    assert tool_part["output"]["rows"] == [{"id": 7, "status": "reviewing"}]


class _FakeSkillLLMClient:
    def __init__(self) -> None:
        self.calls = 0

    async def stream_chat(self, *, messages, tools):  # type: ignore[override]
        self.calls += 1
        if self.calls == 1:
            yield {
                "tool_calls": [
                    {
                        "id": "call_skill_1",
                        "index": 0,
                        "function": {
                            "name": "get_skill",
                            "arguments": '{"skill_name":"workload_risk_insight"}',
                        },
                    }
                ]
            }
            return

        yield {"content": "Skill loaded."}

    async def summarize(self, *, prompt: str) -> str:
        return prompt


async def test_run_chat_turn_executes_get_skill_server_tool_and_trims_ui_result(monkeypatch) -> None:
    fake_session = _FakeSession()
    fake_db = _FakeDBSession()
    fake_message_repo = _FakeMessageRepo(
        [{"id": "user-1", "role": "user", "parts": [{"type": "text", "text": "Help me assess review risk"}]}]
    )
    fake_session_repo = _FakeSessionRepo(fake_session)
    fake_audit_repo = _FakeAuditRepo()

    monkeypatch.setattr("app.services.agent_runtime.SessionRepository", lambda _db: fake_session_repo)
    monkeypatch.setattr("app.services.agent_runtime.MessageRepository", lambda _db: fake_message_repo)
    monkeypatch.setattr("app.services.agent_runtime.ToolAuditRepository", lambda _db: fake_audit_repo)
    monkeypatch.setattr(
        "app.services.agent_runtime.load_skill_content",
        lambda skill_name: {
            "skill_name": skill_name,
            "content": "# workload risk insight\nUse query_engine.",
        },
    )

    @asynccontextmanager
    async def _session_factory():
        yield fake_db

    runtime = AgentRuntime(
        settings=SimpleNamespace(
            agent_model="openrouter/google/gemini-2.5-flash-lite",
            keep_recent_exchanges=12,
            max_iterations=4,
            max_turn_duration_seconds=120,
            tool_result_timeout_seconds=90,
            context_compaction_threshold=0.7,
            enable_reasoning_stream=False,
        ),
        session_factory=_session_factory,
        runtime_store=_FakeRuntimeStore(),
        llm_client=_FakeSkillLLMClient(),
        metrics=MetricsStore(),
        query_engine_client=_UnexpectedQueryEngineClient(),
    )

    events: list[dict[str, object]] = []

    async def _emit(event: dict[str, object]) -> None:
        events.append(event)

    await runtime.run_chat_turn(
        thread_id="thread-1",
        identity=Identity(user_id=123, user_email="reviewer@example.com"),
        access_token="user-token",
        incoming_messages=[
            {"id": "user-1", "role": "user", "parts": [{"type": "text", "text": "Help me assess review risk"}]}
        ],
        message_id="assistant-1",
        event_emitter=_emit,
    )

    tool_messages = [message for batch in fake_message_repo.appended for message in batch if message.get("role") == "tool"]
    assert tool_messages, "expected get_skill tool output to be appended as a tool message"
    tool_part = tool_messages[-1]["parts"][0]
    assert tool_part["type"] == "tool-get_skill"
    assert tool_part["state"] == "output-available"
    assert tool_part["output"] == {
        "skill_name": "workload_risk_insight",
        "content": "# workload risk insight\nUse query_engine.",
    }

    skill_end_events = [event for event in events if event.get("type") == "tool_end" and event.get("tool") == "get_skill"]
    assert len(skill_end_events) == 1
    assert skill_end_events[0]["status"] == "output-available"
    assert skill_end_events[0]["result"] == {
        "skill_name": "workload_risk_insight",
        "status": "output-available",
    }
