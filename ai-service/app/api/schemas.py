from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


ToolResultStatus = Literal["output-available", "output-error", "timeout"]


class UIMessagePayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str | None = None
    role: Literal["system", "user", "assistant", "tool"]
    parts: list[dict[str, Any]] = Field(default_factory=list)


class ChatRequestMetadata(BaseModel):
    model_config = ConfigDict(extra="forbid")

    client: str | None = None
    path: str | None = None
    user_agent: str | None = None


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    thread_id: str = Field(min_length=1)
    messages: list[UIMessagePayload] = Field(default_factory=list)
    trigger: Literal["submit-message", "regenerate-message"] | None = None
    message_id: str | None = None
    request_metadata: ChatRequestMetadata | None = None


class ToolResultEnvelope(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tool_name: str = Field(min_length=1)
    status: ToolResultStatus
    output: Any | None = None
    error_text: str | None = None

    @model_validator(mode="after")
    def validate_error_text(self):
        if self.status in {"output-error", "timeout"} and not (self.error_text and self.error_text.strip()):
            raise ValueError("error_text is required for output-error and timeout statuses")
        return self


class ToolResultRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    thread_id: str = Field(min_length=1)
    tool_call_id: str = Field(min_length=1)
    result: ToolResultEnvelope


class ToolResultAcceptedResponse(BaseModel):
    status: Literal["accepted"]
    idempotent: bool = False


class HistorySessionMeta(BaseModel):
    title: str
    started_at: str
    last_activity_at: str
    turn_count: int
    model: str
    trace_id: str


class HistoryResponse(BaseModel):
    thread_id: str
    messages: list[dict[str, Any]]
    rolling_summary: str | None
    session_meta: HistorySessionMeta


class SessionListItem(BaseModel):
    thread_id: str
    title: str
    started_at: str
    last_activity_at: str
    turn_count: int
    model: str
    status: str


class SessionListResponse(BaseModel):
    items: list[SessionListItem]
    next_cursor: str | None = None


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    checks: dict[str, bool]
