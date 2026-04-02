from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Awaitable, Callable
from uuid import uuid4

from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.auth import Identity
from app.core.config import Settings
from app.repositories.message_repo import MessageRepository
from app.repositories.runtime_store import RuntimeStore
from app.repositories.session_repo import SessionRepository
from app.repositories.tool_audit_repo import ToolAuditRepository
from app.services.query_engine_client import QueryEngineClient, QueryEngineClientError
from app.services.compaction import CompactionPolicy, estimate_tokens_from_messages
from app.services.llm_client import LLMClient
from app.services.metrics import MetricsStore
from app.services.prompt import SYSTEM_PROMPT
from app.services.tool_registry import TOOL_REGISTRY

logger = logging.getLogger(__name__)

EventEmitter = Callable[[dict[str, Any]], Awaitable[None]]


@dataclass(slots=True)
class AgentRuntime:
    settings: Settings
    session_factory: async_sessionmaker
    runtime_store: RuntimeStore
    llm_client: LLMClient
    metrics: MetricsStore
    query_engine_client: QueryEngineClient

    async def run_chat_turn(
        self,
        *,
        thread_id: str,
        identity: Identity,
        access_token: str,
        incoming_messages: list[dict[str, Any]],
        message_id: str,
        event_emitter: EventEmitter,
    ) -> None:
        self.metrics.inc("chat_requests_total")
        stream_started_at = _utc_now()
        initial_title = _derive_conversation_title(incoming_messages)

        async with self.session_factory() as db:
            sessions = SessionRepository(db)
            message_repo = MessageRepository(db)

            session = await sessions.ensure_session(
                thread_id=thread_id,
                user_id=identity.user_id,
                user_email=identity.user_email,
                model=self.settings.agent_model,
                initial_title=initial_title,
            )
            await message_repo.append_unseen_messages(thread_id, incoming_messages)
            persisted_messages = await message_repo.list_recent_ui_messages(
                thread_id,
                limit=_context_message_limit(self.settings.keep_recent_exchanges),
            )
            rolling_summary = session.rolling_summary
            pending_tool_call = session.pending_tool_call
            await db.commit()

        messages = persisted_messages
        if pending_tool_call and len(incoming_messages) > len(messages):
            messages = incoming_messages

        if pending_tool_call:
            self.metrics.inc("resume_attempts_total")
            messages, pending_tool_call = await self._resume_if_needed(
                thread_id=thread_id,
                identity=identity,
                messages=messages,
                pending_tool_call=pending_tool_call,
                event_emitter=event_emitter,
            )

        await event_emitter({"type": "start", "thread_id": thread_id, "message_id": message_id})

        for iteration in range(self.settings.max_iterations):
            elapsed = (_utc_now() - stream_started_at).total_seconds()
            if elapsed > self.settings.max_turn_duration_seconds:
                self.metrics.inc("chat_errors_total")
                await event_emitter({"type": "error", "message": "turn timeout exceeded"})
                await event_emitter({"type": "done", "thread_id": thread_id})
                self.metrics.add_stream_duration(int((_utc_now() - stream_started_at).total_seconds() * 1000))
                return

            iteration_result = await self._llm_iteration(
                thread_id=thread_id,
                identity=identity,
                access_token=access_token,
                messages=messages,
                rolling_summary=rolling_summary,
                message_id=message_id,
                event_emitter=event_emitter,
                iteration=iteration,
            )
            messages = iteration_result.messages
            rolling_summary = iteration_result.rolling_summary
            pending = iteration_result.pending_tool_call
            if pending is not None:
                await self._persist_pending(
                    thread_id=thread_id,
                    identity=identity,
                    messages=messages,
                    rolling_summary=rolling_summary,
                    pending_tool_call=pending,
                )
                await event_emitter({"type": "done", "thread_id": thread_id})
                self.metrics.add_stream_duration(int((_utc_now() - stream_started_at).total_seconds() * 1000))
                return

            if iteration_result.continue_turn:
                continue

            await self._finalize_and_persist(
                thread_id=thread_id,
                identity=identity,
                messages=messages,
                rolling_summary=rolling_summary,
            )
            await event_emitter({"type": "done", "thread_id": thread_id})
            self.metrics.add_stream_duration(int((_utc_now() - stream_started_at).total_seconds() * 1000))
            return

        self.metrics.inc("chat_errors_total")
        await event_emitter({"type": "error", "message": "max iterations reached"})
        await event_emitter({"type": "done", "thread_id": thread_id})
        self.metrics.add_stream_duration(int((_utc_now() - stream_started_at).total_seconds() * 1000))

    async def _resume_if_needed(
        self,
        *,
        thread_id: str,
        identity: Identity,
        messages: list[dict[str, Any]],
        pending_tool_call: dict[str, Any],
        event_emitter: EventEmitter,
    ) -> tuple[list[dict[str, Any]], dict[str, Any] | None]:
        tool_call_id = str(pending_tool_call.get("tool_call_id", ""))
        if not tool_call_id:
            return messages, None

        resume_payload = await self.runtime_store.pop_tool_result(thread_id, tool_call_id)
        if not resume_payload:
            resume_payload = _extract_resume_from_messages(messages=messages, pending_tool=pending_tool_call)

        if not resume_payload:
            timeout_at = datetime.fromisoformat(pending_tool_call["timeout_at"])
            if _utc_now() >= timeout_at:
                self.metrics.inc("tool_timeouts_total")
                resume_payload = {
                    "tool_call_id": pending_tool_call["tool_call_id"],
                    "tool_name": pending_tool_call["tool_name"],
                    "status": "timeout",
                    "output": None,
                    "error_text": "Tool result timed out",
                    "received_at": _iso_now(),
                }
            elif _has_fresh_user_message(messages):
                await self._clear_pending(thread_id=thread_id, identity=identity)
                return messages, None
            else:
                raise ValueError("pending tool call requires tool-result before chat resume")

        self.metrics.inc("resume_success_total")
        messages = await self._apply_tool_result(
            thread_id=thread_id,
            identity=identity,
            messages=messages,
            pending_tool_call=pending_tool_call,
            result=resume_payload,
            event_emitter=event_emitter,
        )
        return messages, None

    async def _llm_iteration(
        self,
        *,
        thread_id: str,
        identity: Identity,
        access_token: str,
        messages: list[dict[str, Any]],
        rolling_summary: str | None,
        message_id: str,
        event_emitter: EventEmitter,
        iteration: int,
    ) -> "_IterationResult":
        model_messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "system", "content": _runtime_instructions(rolling_summary)},
            *_ui_to_openai_messages(messages),
        ]
        tools = [
            {
                "type": "function",
                "function": {
                    "name": spec.name,
                    "parameters": spec.input_schema,
                },
            }
            for spec in TOOL_REGISTRY.values()
        ]

        text_buffer: list[str] = []
        reasoning_open = False
        reasoning_id = f"reasoning-{uuid4().hex}"
        first_token_at: datetime | None = None
        llm_started_at = _utc_now()

        tool_buffers: dict[int, dict[str, Any]] = {}

        async for delta in self.llm_client.stream_chat(messages=model_messages, tools=tools):
            content = delta.get("content")
            if content:
                if first_token_at is None:
                    first_token_at = _utc_now()
                text_buffer.append(str(content))
                await event_emitter({"type": "token", "content": str(content), "thread_id": thread_id})

            reasoning = delta.get("reasoning")
            if reasoning and self.settings.enable_reasoning_stream:
                if not reasoning_open:
                    reasoning_open = True
                    await event_emitter({"type": "reasoning_start", "id": reasoning_id, "thread_id": thread_id})
                await event_emitter(
                    {
                        "type": "reasoning_token",
                        "id": reasoning_id,
                        "content": str(reasoning),
                        "thread_id": thread_id,
                    }
                )

            for raw_call in delta.get("tool_calls", []) or []:
                if not isinstance(raw_call, dict):
                    continue
                idx = int(raw_call.get("index", 0))
                function = raw_call.get("function") or {}
                tool_name = str(function.get("name") or "")
                args_chunk = str(function.get("arguments") or "")

                buffer = tool_buffers.get(idx)
                if not buffer:
                    buffer = {
                        "tool_call_id": str(raw_call.get("id") or f"call_{uuid4().hex}"),
                        "tool_name": tool_name,
                        "args_raw": "",
                    }
                    tool_buffers[idx] = buffer

                if tool_name and not buffer.get("tool_name"):
                    buffer["tool_name"] = tool_name
                if args_chunk:
                    buffer["args_raw"] += args_chunk

        if first_token_at is not None:
            self.metrics.add_ttft(int((first_token_at - llm_started_at).total_seconds() * 1000))

        if reasoning_open:
            await event_emitter({"type": "reasoning_end", "id": reasoning_id, "thread_id": thread_id})

        tool_candidate = _pick_tool_call(tool_buffers)
        if tool_candidate:
            tool_name = str(tool_candidate["tool_name"])
            tool_call_id = str(tool_candidate["tool_call_id"])
            tool_input = tool_candidate["input"]

            if tool_name not in TOOL_REGISTRY:
                await event_emitter(
                    {
                        "type": "tool_end",
                        "thread_id": thread_id,
                        "tool_call_id": tool_call_id,
                        "tool": tool_name,
                        "status": "output-error",
                        "error": f"Tool '{tool_name}' is not registered",
                    }
                )
                messages = list(messages)
                messages.append(
                    {
                        "id": f"assistant-{uuid4().hex}",
                        "role": "assistant",
                        "parts": [{"type": "text", "text": f"Tool '{tool_name}' is not registered."}],
                    }
                )
                return _IterationResult(messages=messages, rolling_summary=rolling_summary)

            spec = TOOL_REGISTRY[tool_name]
            if spec.execution_mode == "server":
                return await self._execute_server_tool(
                    thread_id=thread_id,
                    identity=identity,
                    access_token=access_token,
                    messages=messages,
                    rolling_summary=rolling_summary,
                    tool_name=tool_name,
                    tool_call_id=tool_call_id,
                    tool_input=tool_input,
                    event_emitter=event_emitter,
                )

            now = _utc_now()
            timeout = now + timedelta(seconds=self.settings.tool_result_timeout_seconds)
            pending = {
                "tool_call_id": tool_call_id,
                "tool_name": tool_name,
                "input": tool_input,
                "requested_at": now.isoformat(),
                "timeout_at": timeout.isoformat(),
            }

            await event_emitter(
                {
                    "type": "tool_start",
                    "thread_id": thread_id,
                    "tool_call_id": tool_call_id,
                    "tool": tool_name,
                    "input": tool_input,
                    "started_at": now.isoformat(),
                }
            )

            messages = list(messages)
            messages.append(
                {
                    "id": message_id,
                    "role": "assistant",
                    "parts": [
                        {
                            "type": f"tool-{tool_name}",
                            "toolCallId": tool_call_id,
                            "state": "input-available",
                            "input": tool_input,
                        }
                    ],
                }
            )

            async with self.session_factory() as db:
                audit_repo = ToolAuditRepository(db)
                await audit_repo.create_requested(
                    thread_id=thread_id,
                    tool_call_id=tool_call_id,
                    tool_name=tool_name,
                    tool_input=tool_input,
                    user_id=identity.user_id,
                    user_email=identity.user_email,
                    trace_id=str(uuid4()),
                    requested_at=now,
                )
                await db.commit()

            return _IterationResult(
                messages=messages,
                rolling_summary=rolling_summary,
                pending_tool_call=pending,
            )

        if text_buffer:
            messages = list(messages)
            messages.append(
                {
                    "id": message_id,
                    "role": "assistant",
                    "parts": [{"type": "text", "text": "".join(text_buffer)}],
                }
            )

        return _IterationResult(messages=messages, rolling_summary=rolling_summary)

    async def _execute_server_tool(
        self,
        *,
        thread_id: str,
        identity: Identity,
        access_token: str,
        messages: list[dict[str, Any]],
        rolling_summary: str | None,
        tool_name: str,
        tool_call_id: str,
        tool_input: dict[str, Any],
        event_emitter: EventEmitter,
    ) -> "_IterationResult":
        started_at = _utc_now()
        await event_emitter(
            {
                "type": "tool_start",
                "thread_id": thread_id,
                "tool_call_id": tool_call_id,
                "tool": tool_name,
                "input": tool_input,
                "started_at": started_at.isoformat(),
            }
        )

        async with self.session_factory() as db:
            audit_repo = ToolAuditRepository(db)
            await audit_repo.create_requested(
                thread_id=thread_id,
                tool_call_id=tool_call_id,
                tool_name=tool_name,
                tool_input=tool_input,
                user_id=identity.user_id,
                user_email=identity.user_email,
                trace_id=str(uuid4()),
                requested_at=started_at,
            )
            await db.commit()

        try:
            output = await self._dispatch_server_tool(
                tool_name=tool_name,
                tool_input=tool_input,
                access_token=access_token,
            )
            result = {
                "tool_call_id": tool_call_id,
                "tool_name": tool_name,
                "status": "output-available",
                "output": output,
                "error_text": None,
            }
        except QueryEngineClientError as exc:
            result = {
                "tool_call_id": tool_call_id,
                "tool_name": tool_name,
                "status": "output-error",
                "output": None,
                "error_text": str(exc),
            }
        except Exception as exc:  # noqa: BLE001
            logger.exception("runtime.server_tool_failed tool=%s thread_id=%s error=%s", tool_name, thread_id, str(exc))
            result = {
                "tool_call_id": tool_call_id,
                "tool_name": tool_name,
                "status": "output-error",
                "output": None,
                "error_text": "internal server tool error",
            }

        payload = {
            "type": "tool_end",
            "thread_id": thread_id,
            "tool_call_id": tool_call_id,
            "tool": tool_name,
            "status": str(result["status"]),
            "finished_at": _iso_now(),
        }
        if result["status"] == "output-available":
            payload["result"] = result["output"]
        else:
            payload["error"] = result["error_text"]
        await event_emitter(payload)

        updated_messages = list(messages)
        updated_messages.append(
            {
                "id": f"tool-{tool_call_id}",
                "role": "tool",
                "parts": [_tool_part_from_result(pending_tool_call={"input": tool_input}, result=result)],
            }
        )

        async with self.session_factory() as db:
            audit_repo = ToolAuditRepository(db)
            await audit_repo.mark_completed(
                thread_id=thread_id,
                tool_call_id=tool_call_id,
                status=str(result["status"]),
                output=result.get("output"),
                error_text=result.get("error_text"),
                completed_at=_utc_now(),
            )
            await db.commit()

        return _IterationResult(
            messages=updated_messages,
            rolling_summary=rolling_summary,
            continue_turn=True,
        )

    async def _dispatch_server_tool(
        self,
        *,
        tool_name: str,
        tool_input: dict[str, Any],
        access_token: str,
    ) -> dict[str, Any]:
        if tool_name == "query_engine":
            return await self.query_engine_client.execute(access_token=access_token, payload=tool_input)
        raise QueryEngineClientError(f"Tool '{tool_name}' is not supported for server execution")

    async def _apply_tool_result(
        self,
        *,
        thread_id: str,
        identity: Identity,
        messages: list[dict[str, Any]],
        pending_tool_call: dict[str, Any],
        result: dict[str, Any],
        event_emitter: EventEmitter,
    ) -> list[dict[str, Any]]:
        tool_name = str(result["tool_name"])
        tool_call_id = str(result["tool_call_id"])
        status = str(result["status"])

        payload = {
            "type": "tool_end",
            "thread_id": thread_id,
            "tool_call_id": tool_call_id,
            "tool": tool_name,
            "status": status,
            "finished_at": _iso_now(),
        }
        if status == "output-available":
            payload["result"] = result.get("output")
        else:
            payload["error"] = result.get("error_text")

        await event_emitter(payload)

        messages = list(messages)
        messages.append(
            {
                "id": f"tool-{tool_call_id}",
                "role": "tool",
                "parts": [_tool_part_from_result(pending_tool_call=pending_tool_call, result=result)],
            }
        )

        async with self.session_factory() as db:
            audit_repo = ToolAuditRepository(db)
            await audit_repo.mark_completed(
                thread_id=thread_id,
                tool_call_id=tool_call_id,
                status=status,
                output=result.get("output"),
                error_text=result.get("error_text"),
                completed_at=_utc_now(),
            )
            sessions = SessionRepository(db)
            await sessions.update_runtime(thread_id, pending_tool_call=None, status="active")
            await db.commit()

        return messages

    async def _persist_pending(
        self,
        *,
        thread_id: str,
        identity: Identity,
        messages: list[dict[str, Any]],
        rolling_summary: str | None,
        pending_tool_call: dict[str, Any],
    ) -> None:
        async with self.session_factory() as db:
            sessions = SessionRepository(db)
            message_repo = MessageRepository(db)

            session = await sessions.get_owned_session(thread_id, identity.user_id)
            if not session:
                raise PermissionError("thread not owned by current user")

            await message_repo.append_unseen_messages(thread_id, messages)
            await sessions.update_runtime(
                thread_id,
                rolling_summary=rolling_summary,
                status="waiting_tool",
                pending_tool_call=pending_tool_call,
                turn_count=session.turn_count,
            )
            await db.commit()

    async def _finalize_and_persist(
        self,
        *,
        thread_id: str,
        identity: Identity,
        messages: list[dict[str, Any]],
        rolling_summary: str | None,
    ) -> None:
        updated_summary = rolling_summary
        policy = CompactionPolicy(
            threshold_ratio=self.settings.context_compaction_threshold,
            keep_recent_exchanges=self.settings.keep_recent_exchanges,
        )
        estimated_tokens = estimate_tokens_from_messages(messages)
        context_window = _model_context_window(self.settings.agent_model)

        if policy.should_compact(estimated_tokens, context_window):
            older, _ = policy.split(messages)
            if older:
                summary_prompt = _summary_prompt(
                    existing_summary=updated_summary,
                    history_to_summarize=_flatten_for_summary(older),
                )
                try:
                    new_summary = await self.llm_client.summarize(prompt=summary_prompt)
                    if new_summary:
                        updated_summary = new_summary
                except Exception as exc:  # noqa: BLE001
                    logger.exception("runtime.compaction_failed thread_id=%s error=%s", thread_id, str(exc))

        async with self.session_factory() as db:
            sessions = SessionRepository(db)
            message_repo = MessageRepository(db)
            session = await sessions.get_owned_session(thread_id, identity.user_id)
            if not session:
                raise PermissionError("thread not owned by current user")

            await message_repo.append_unseen_messages(thread_id, messages)
            await sessions.update_runtime(
                thread_id,
                rolling_summary=updated_summary,
                status="active",
                pending_tool_call=None,
                turn_count=int(session.turn_count) + 1,
            )
            await db.commit()

    async def _clear_pending(self, *, thread_id: str, identity: Identity) -> None:
        async with self.session_factory() as db:
            sessions = SessionRepository(db)
            session = await sessions.get_owned_session(thread_id, identity.user_id)
            if session:
                await sessions.update_runtime(thread_id, pending_tool_call=None, status="active")
                await db.commit()


def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _iso_now() -> str:
    return _utc_now().isoformat()


def _model_context_window(model_name: str) -> int:
    if "gemini-2.5" in model_name or "gemini-3" in model_name:
        return 1_000_000
    return 128_000


def _context_message_limit(keep_recent_exchanges: int) -> int:
    # One exchange is user + assistant, but tool interactions add extra messages.
    return max(20, int(keep_recent_exchanges) * 4)


def _derive_conversation_title(messages: list[dict[str, Any]]) -> str:
    for message in messages:
        if str(message.get("role", "")).strip() != "user":
            continue
        parts = message.get("parts", [])
        if not isinstance(parts, list):
            continue
        for part in parts:
            if not isinstance(part, dict) or part.get("type") != "text":
                continue
            text = " ".join(str(part.get("text", "")).split()).strip()
            if text:
                return text[:80]
    return "New Conversation"

def _runtime_instructions(rolling_summary: str | None) -> str:
    if not rolling_summary:
        return "No prior summary."
    return f"Conversation summary:\n{rolling_summary}"


def _summary_prompt(*, existing_summary: str | None, history_to_summarize: str) -> str:
    prior = existing_summary or "No previous summary."
    return f"""Update the summary with new history.

Previous summary:
{prior}

New history:
{history_to_summarize}

Output only the updated summary.
"""


def _flatten_for_summary(messages: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for msg in messages:
        role = msg.get("role", "unknown")
        lines.append(f"{role}: {_flatten_ui_parts(msg.get('parts', []))}")
    return "\n".join(lines)


def _flatten_ui_parts(parts: list[dict[str, Any]] | Any) -> str:
    if not isinstance(parts, list):
        return ""
    chunks: list[str] = []
    for part in parts:
        if not isinstance(part, dict):
            continue
        part_type = str(part.get("type", ""))
        if part_type == "text":
            chunks.append(str(part.get("text", "")))
        elif part_type.startswith("tool-"):
            chunks.append(f"{part_type} input={part.get('input')} output={part.get('output')} error={part.get('errorText')}")
    return " ".join(chunks).strip()


def _ui_to_openai_messages(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for msg in messages:
        role = str(msg.get("role", "user"))
        if role not in {"system", "user", "assistant", "tool"}:
            role = "user"
        parts = msg.get("parts", [])

        if role == "tool":
            out.extend(_tool_parts_to_openai_messages(parts=parts))
            continue

        content = _flatten_ui_parts(parts)
        if not content:
            continue
        out.append({"role": role, "content": content})
    return out


def _tool_parts_to_openai_messages(*, parts: Any) -> list[dict[str, Any]]:
    if not isinstance(parts, list):
        return []

    out: list[dict[str, Any]] = []
    for part in parts:
        if not isinstance(part, dict):
            continue

        content = _tool_part_content(part)
        if not content:
            continue

        tool_call_id = str(part.get("toolCallId") or part.get("id") or "").strip()
        tool_name = str(part.get("toolName") or _tool_name_from_part_type(str(part.get("type", ""))) or "").strip()

        if not tool_call_id and not tool_name:
            # Providers reject role=tool without metadata; keep context as assistant text instead.
            out.append({"role": "assistant", "content": f"Tool output: {content}"})
            continue

        payload: dict[str, Any] = {"role": "tool", "content": content}
        if tool_call_id:
            payload["tool_call_id"] = tool_call_id
        if tool_name:
            payload["name"] = tool_name
        out.append(payload)

    return out


def _tool_part_content(part: dict[str, Any]) -> str:
    state = str(part.get("state") or "")
    if state == "output-available":
        return _safe_json_dumps(part.get("output", part.get("result")))
    if state in {"output-error", "timeout"}:
        error_text = str(part.get("errorText") or "").strip()
        if error_text:
            return error_text
    return _flatten_ui_parts([part])


def _tool_name_from_part_type(part_type: str) -> str:
    if part_type.startswith("tool-") and len(part_type) > 5:
        return part_type[5:]
    return ""


def _safe_json_dumps(value: Any) -> str:
    try:
        return json.dumps(value, ensure_ascii=True)
    except TypeError:
        return str(value)


def _pick_tool_call(tool_buffers: dict[int, dict[str, Any]]) -> dict[str, Any] | None:
    for idx in sorted(tool_buffers.keys()):
        buffer = tool_buffers[idx]
        tool_name = str(buffer.get("tool_name", "")).strip()
        if not tool_name:
            continue
        args_raw = str(buffer.get("args_raw", "")).strip()
        tool_input = _safe_json_loads(args_raw)
        normalized_input = _normalize_tool_input(tool_name=tool_name, tool_input=tool_input)
        return {
            "tool_call_id": str(buffer["tool_call_id"]),
            "tool_name": tool_name,
            "input": normalized_input,
        }
    return None


def _normalize_tool_input(*, tool_name: str, tool_input: Any) -> dict[str, Any]:
    if not isinstance(tool_input, dict):
        return {}

    if tool_name == "query_engine":
        normalized = dict(tool_input)
        normalized["select"] = _normalize_query_engine_field_list(tool_input.get("select"))
        normalized["group_by"] = _normalize_query_engine_field_list(tool_input.get("group_by"))
        normalized["sort"] = _normalize_query_engine_sort_list(tool_input.get("sort"))
        return {key: value for key, value in normalized.items() if value is not None}

    if tool_name not in {"performAction", "navigate"}:
        return tool_input

    nested_properties = tool_input.get("properties")
    if not isinstance(nested_properties, dict):
        return tool_input

    normalized: dict[str, Any] = {}
    keys = ("action", "ref", "text", "key", "value")
    if tool_name == "navigate":
        keys = ("destinationId", "params")

    for key in keys:
        value = tool_input.get(key, nested_properties.get(key))
        if value is not None:
            normalized[key] = value

    return normalized or tool_input


def _normalize_query_engine_field_list(value: Any) -> list[dict[str, Any]] | None:
    if value is None:
        return None
    if not isinstance(value, list):
        return None

    normalized: list[dict[str, Any]] = []
    for item in value:
        if isinstance(item, str):
            field = item.strip()
            if field:
                normalized.append({"field": field})
            continue
        if isinstance(item, dict):
            field = str(item.get("field", "")).strip()
            if not field:
                continue
            candidate: dict[str, Any] = {"field": field}
            alias = item.get("as")
            if isinstance(alias, str) and alias.strip():
                candidate["as"] = alias.strip()
            normalized.append(candidate)

    return normalized


def _normalize_query_engine_sort_list(value: Any) -> list[dict[str, Any]] | None:
    if value is None:
        return None
    if not isinstance(value, list):
        return None

    normalized: list[dict[str, Any]] = []
    for item in value:
        if isinstance(item, str):
            field = item.strip()
            if field:
                normalized.append({"field": field})
            continue
        if isinstance(item, dict):
            field = str(item.get("field", "")).strip()
            if not field:
                continue
            candidate: dict[str, Any] = {"field": field}
            direction = str(item.get("dir", "")).strip().lower()
            if direction in {"asc", "desc"}:
                candidate["dir"] = direction
            normalized.append(candidate)

    return normalized


def _safe_json_loads(value: str) -> Any:
    if not value:
        return {}
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return {}


def _extract_resume_from_messages(*, messages: list[dict[str, Any]], pending_tool: dict[str, Any]) -> dict[str, Any] | None:
    pending_call_id = str(pending_tool.get("tool_call_id", ""))
    pending_tool_name = str(pending_tool.get("tool_name", ""))
    if not pending_call_id or not pending_tool_name:
        return None

    for msg in reversed(messages):
        parts = msg.get("parts", [])
        if not isinstance(parts, list):
            continue

        for part in reversed(parts):
            if not isinstance(part, dict):
                continue
            state = part.get("state")
            if state not in {"output-available", "output-error", "timeout"}:
                continue
            part_type = str(part.get("type", ""))
            if not part_type.startswith("tool-") and part_type != "dynamic-tool":
                continue

            tool_name = str(part.get("toolName") or part_type.replace("tool-", ""))
            tool_call_id = str(part.get("toolCallId") or part.get("id") or "")
            if tool_call_id != pending_call_id:
                continue
            if tool_name and tool_name != pending_tool_name:
                continue

            return {
                "tool_call_id": pending_call_id,
                "tool_name": pending_tool_name,
                "status": state,
                "output": part.get("output", part.get("result")),
                "error_text": part.get("errorText"),
                "received_at": _iso_now(),
            }

    return None


@dataclass(slots=True)
class _IterationResult:
    messages: list[dict[str, Any]]
    rolling_summary: str | None
    pending_tool_call: dict[str, Any] | None = None
    continue_turn: bool = False


def _tool_part_from_result(*, pending_tool_call: dict[str, Any], result: dict[str, Any]) -> dict[str, Any]:
    tool_name = str(result["tool_name"])
    tool_call_id = str(result["tool_call_id"])
    status = str(result["status"])

    tool_part: dict[str, Any] = {
        "type": f"tool-{tool_name}",
        "toolCallId": tool_call_id,
        "input": pending_tool_call.get("input", {}),
        "state": status,
    }
    if status == "output-available":
        tool_part["output"] = result.get("output")
    else:
        tool_part["errorText"] = result.get("error_text")
    return tool_part


def _has_fresh_user_message(messages: list[dict[str, Any]]) -> bool:
    if not messages:
        return False
    last = messages[-1]
    if last.get("role") != "user":
        return False
    parts = last.get("parts", [])
    if not isinstance(parts, list):
        return False
    for part in parts:
        if isinstance(part, dict) and part.get("type") == "text" and str(part.get("text", "")).strip():
            return True
    return False
