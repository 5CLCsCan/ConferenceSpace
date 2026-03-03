from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class RequestMetadata(BaseModel):
    client: str | None = None
    path: str | None = None
    user_agent: str | None = None


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    thread_id: str
    messages: list[dict[str, Any]]
    trigger: Literal["submit-message", "regenerate-message"] | None = None
    message_id: str | None = None
    request_metadata: RequestMetadata | None = None


class ToolResultPayload(BaseModel):
    tool_name: str
    status: Literal["output-available", "output-error", "timeout"]
    output: Any | None = None
    error_text: str | None = None


class ToolResultRequest(BaseModel):
    thread_id: str
    tool_call_id: str
    result: ToolResultPayload


class SessionMetaResponse(BaseModel):
    started_at: datetime
    last_activity_at: datetime
    turn_count: int
    model: str
    trace_id: str


class HistoryResponse(BaseModel):
    thread_id: str
    messages: list[dict[str, Any]]
    rolling_summary: str | None = None
    session_meta: SessionMetaResponse
