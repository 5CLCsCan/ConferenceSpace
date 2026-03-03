from __future__ import annotations

from typing import Any, Literal
from typing_extensions import TypedDict


class PendingToolCall(TypedDict):
    tool_call_id: str
    tool_name: str
    input: dict[str, Any]
    requested_at: str
    timeout_at: str
    interrupt_id: str | None


class ToolResultEnvelope(TypedDict):
    tool_call_id: str
    tool_name: str
    status: Literal["output-available", "output-error", "timeout"]
    output: Any | None
    error_text: str | None
    received_at: str


class SessionMeta(TypedDict):
    started_at: str
    last_activity_at: str
    turn_count: int
    model: str
    trace_id: str


class AgentState(TypedDict):
    thread_id: str
    user_id: int
    user_email: str
    messages: list[dict[str, Any]]
    rolling_summary: str | None
    pending_tool_call: PendingToolCall | None
    tool_result: ToolResultEnvelope | None
    session_meta: SessionMeta
    last_error: str | None

