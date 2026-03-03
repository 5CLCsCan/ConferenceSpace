from __future__ import annotations

import json
from dataclasses import dataclass, field
from enum import Enum
from typing import Any
from uuid import uuid4


class StreamState(str, Enum):
    IDLE = "IDLE"
    TEXT_STREAMING = "TEXT_STREAMING"
    TOOL_INPUT_STREAMING = "TOOL_INPUT_STREAMING"
    AWAITING_INTERRUPT = "AWAITING_INTERRUPT"
    COMPLETED = "COMPLETED"
    ERROR = "ERROR"


@dataclass(slots=True)
class _ToolBuffer:
    tool_call_id: str
    tool_name: str = ""
    args_raw: str = ""
    emitted_input_available: bool = False


@dataclass(slots=True)
class UIStreamTranslator:
    message_id: str
    state: StreamState = StreamState.IDLE
    step_started: bool = False
    text_block_id: str | None = None
    tool_buffers: dict[int, _ToolBuffer] = field(default_factory=dict)

    def _build_part(self, part_type: str, **kwargs: Any) -> dict[str, Any]:
        payload = {"type": part_type}
        payload.update(kwargs)
        return payload

    def start(self) -> list[dict[str, Any]]:
        if self.step_started:
            return []
        self.step_started = True
        return [
            self._build_part("start", messageId=self.message_id),
            self._build_part("start-step", messageId=self.message_id),
        ]

    def feed_delta(self, delta: dict[str, Any]) -> list[dict[str, Any]]:
        parts: list[dict[str, Any]] = []

        text_content = delta.get("content")
        if text_content:
            if self.state in {StreamState.IDLE, StreamState.TOOL_INPUT_STREAMING}:
                self.text_block_id = f"text-{uuid4().hex}"
                parts.append(self._build_part("text-start", id=self.text_block_id))
                self.state = StreamState.TEXT_STREAMING
            parts.append(self._build_part("text-delta", id=self.text_block_id, delta=text_content))

        tool_calls = delta.get("tool_calls") or []
        if tool_calls:
            if self.state == StreamState.TEXT_STREAMING and self.text_block_id:
                parts.append(self._build_part("text-end", id=self.text_block_id))
                self.text_block_id = None
            self.state = StreamState.TOOL_INPUT_STREAMING
            for raw_call in tool_calls:
                idx = int(raw_call.get("index", 0))
                call_id = str(raw_call.get("id") or f"call_{uuid4().hex}")
                function = raw_call.get("function") or {}
                tool_name = str(function.get("name") or "")
                args_chunk = str(function.get("arguments") or "")

                buffer = self.tool_buffers.get(idx)
                if not buffer:
                    buffer = _ToolBuffer(tool_call_id=call_id, tool_name=tool_name)
                    self.tool_buffers[idx] = buffer
                    parts.append(
                        self._build_part(
                            "tool-input-start",
                            toolCallId=buffer.tool_call_id,
                            toolName=tool_name,
                        )
                    )

                if tool_name and not buffer.tool_name:
                    buffer.tool_name = tool_name

                if args_chunk:
                    buffer.args_raw += args_chunk

                if not buffer.emitted_input_available:
                    parsed = _safe_json_parse(buffer.args_raw)
                    if parsed is not None:
                        parts.append(
                            self._build_part(
                                "tool-input-available",
                                toolCallId=buffer.tool_call_id,
                                toolName=buffer.tool_name,
                                input=parsed,
                            )
                        )
                        buffer.emitted_input_available = True
                        self.state = StreamState.AWAITING_INTERRUPT

        return parts

    def end(self) -> list[dict[str, Any]]:
        parts: list[dict[str, Any]] = []
        if self.state == StreamState.TEXT_STREAMING and self.text_block_id:
            parts.append(self._build_part("text-end", id=self.text_block_id))
            self.text_block_id = None
        parts.append(self._build_part("finish-step", messageId=self.message_id))
        parts.append(self._build_part("finish", messageId=self.message_id))
        self.state = StreamState.COMPLETED
        return parts

    def error(self, message: str) -> list[dict[str, Any]]:
        self.state = StreamState.ERROR
        return [self._build_part("error", message=message)]

    def emit_tool_output(
        self,
        *,
        tool_call_id: str,
        tool_name: str,
        status: str,
        output: Any | None = None,
        error_text: str | None = None,
    ) -> dict[str, Any]:
        if status == "output-available":
            return self._build_part(
                "tool-output-available",
                toolCallId=tool_call_id,
                toolName=tool_name,
                output=output,
            )
        return self._build_part(
            "tool-output-error",
            toolCallId=tool_call_id,
            toolName=tool_name,
            errorText=error_text or "Tool execution failed",
        )


def _safe_json_parse(value: str) -> dict[str, Any] | list[Any] | None:
    value = value.strip()
    if not value:
        return {}
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return None

