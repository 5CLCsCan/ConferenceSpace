from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import logging
from typing import Any, Awaitable, Callable
from uuid import uuid4

from langgraph.types import interrupt
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import Settings
from app.graph.prompts import build_runtime_instructions, build_summary_prompt, build_system_prompt
from app.graph.state import AgentState, ToolResultEnvelope
from app.graph.tool_registry import TOOL_REGISTRY
from app.repositories.message_repo import MessageRepository
from app.repositories.runtime_store import RuntimeStore
from app.repositories.session_repo import SessionRepository
from app.repositories.tool_audit_repo import ToolAuditRepository
from app.services.context_budget import ContextBudgetService
from app.services.llm_client import LLMClient
from app.stream.ui_stream_translator import UIStreamTranslator

logger = logging.getLogger(__name__)

EventEmitter = Callable[[dict[str, Any]], Awaitable[None]]


def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _iso_now() -> str:
    return _utc_now().isoformat()


def _config_value(config: dict[str, Any] | None, key: str, default: Any = None) -> Any:
    configurable = (config or {}).get("configurable", {})
    return configurable.get(key, default)


def _model_context_window(model_name: str) -> int:
    # Conservative defaults. Can be replaced by model metadata API in later phase.
    if "gemini-2.5" in model_name:
        return 1_000_000
    return 128_000


def _flatten_messages_for_summary(messages: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for msg in messages:
        role = msg.get("role", "unknown")
        parts = msg.get("parts", [])
        text_fragments: list[str] = []
        for part in parts:
            if not isinstance(part, dict):
                continue
            ptype = part.get("type")
            if ptype == "text":
                text_fragments.append(str(part.get("text", "")))
            elif ptype and str(ptype).startswith("tool-"):
                text_fragments.append(
                    f"{ptype}: input={part.get('input')} output={part.get('output')} error={part.get('errorText')}"
                )
        if text_fragments:
            lines.append(f"{role}: {' '.join(text_fragments)}")
    return "\n".join(lines)


def _flatten_ui_parts(parts: list[dict[str, Any]] | Any) -> str:
    if not isinstance(parts, list):
        return ""

    chunks: list[str] = []
    for part in parts:
        if not isinstance(part, dict):
            continue

        ptype = str(part.get("type", ""))
        if ptype == "text":
            text = str(part.get("text", "")).strip()
            if text:
                chunks.append(text)
            continue

        if ptype == "reasoning":
            text = str(part.get("text", "")).strip()
            if text:
                chunks.append(f"[Reasoning]\n{text}")
            continue

        if ptype.startswith("tool-") or ptype == "dynamic-tool":
            tool_name = part.get("toolName") or ptype.replace("tool-", "")
            state = part.get("state")
            input_payload = part.get("input", part.get("args"))
            output_payload = part.get("output", part.get("result"))
            error_text = part.get("errorText")
            chunks.append(
                f"[Tool:{tool_name}] state={state} input={input_payload} output={output_payload} error={error_text}"
            )
            continue

    return "\n".join(chunks).strip()


def _ui_to_openai_messages(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for msg in messages:
        role = str(msg.get("role", "user"))
        if role not in {"system", "user", "assistant", "tool"}:
            role = "user"

        content = _flatten_ui_parts(msg.get("parts", []))
        if not content:
            # Keep structure valid for providers even if the message has no textual part.
            continue

        out.append(
            {
                "role": role,
                "content": content,
            }
        )
    return out


def _as_async(func: EventEmitter | None) -> EventEmitter:
    if func is None:
        async def _noop(_: dict[str, Any]) -> None:
            return None
        return _noop
    return func


@dataclass(slots=True)
class AgentNodes:
    settings: Settings
    session_factory: async_sessionmaker
    runtime_store: RuntimeStore
    llm_client: LLMClient
    context_budget: ContextBudgetService

    async def authorize_and_bind_session(
        self,
        state: AgentState,
        config: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        logger.info(
            "node.authorize_and_bind_session.start thread_id=%s user_id=%s",
            state["thread_id"],
            state["user_id"],
        )
        async with self.session_factory() as db:
            sessions = SessionRepository(db)

            trace_id = state["session_meta"].get("trace_id") or str(uuid4())
            row = await sessions.ensure_session(
                thread_id=state["thread_id"],
                user_id=state["user_id"],
                user_email=state["user_email"],
                model=state["session_meta"]["model"],
                trace_id=trace_id,
            )
            await db.commit()
        logger.info(
            "node.authorize_and_bind_session.done thread_id=%s turn_count=%s",
            state["thread_id"],
            row.turn_count,
        )

        session_meta = dict(state["session_meta"])
        session_meta["trace_id"] = str(row.trace_id)
        session_meta["started_at"] = row.started_at.isoformat()
        session_meta["last_activity_at"] = _iso_now()
        session_meta["turn_count"] = int(row.turn_count)
        session_meta["model"] = row.model

        return {
            "session_meta": session_meta,
            "last_error": None,
        }

    async def load_context(
        self,
        state: AgentState,
        config: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        logger.info("node.load_context.start thread_id=%s", state["thread_id"])
        cached = await self.runtime_store.get_state(state["thread_id"])
        incoming_messages = state.get("messages", [])

        persisted_messages: list[dict[str, Any]] = []
        persisted_summary: str | None = None

        if cached:
            persisted_messages = list(cached.get("messages") or [])
            persisted_summary = cached.get("rolling_summary")
            logger.info(
                "node.load_context.cache_hit thread_id=%s cached_messages=%s",
                state["thread_id"],
                len(persisted_messages),
            )
        else:
            logger.info("node.load_context.cache_miss thread_id=%s", state["thread_id"])
            async with self.session_factory() as db:
                messages_repo = MessageRepository(db)
                sessions_repo = SessionRepository(db)
                persisted_messages = await messages_repo.list_ui_messages(state["thread_id"])
                session = await sessions_repo.get_by_thread_id(state["thread_id"])
                if session:
                    persisted_summary = session.rolling_summary

        messages = incoming_messages if len(incoming_messages) >= len(persisted_messages) else persisted_messages
        logger.info(
            "node.load_context.done thread_id=%s incoming=%s persisted=%s selected=%s",
            state["thread_id"],
            len(incoming_messages),
            len(persisted_messages),
            len(messages),
        )
        session_meta = dict(state["session_meta"])
        session_meta["last_activity_at"] = _iso_now()

        return {
            "messages": messages,
            "rolling_summary": persisted_summary,
            "session_meta": session_meta,
        }

    async def llm_step(
        self,
        state: AgentState,
        config: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        logger.info(
            "node.llm_step.start thread_id=%s messages=%s summary=%s",
            state["thread_id"],
            len(state["messages"]),
            bool(state.get("rolling_summary")),
        )
        emitter = _as_async(_config_value(config, "event_emitter"))
        message_id = _config_value(config, "message_id", f"assistant-{uuid4().hex}")
        translator = UIStreamTranslator(message_id=message_id)

        for part in translator.start():
            await emitter(part)

        system_prompt = build_system_prompt()
        runtime_instructions = build_runtime_instructions(state.get("rolling_summary"))
        history_messages = _ui_to_openai_messages(state["messages"])
        model_messages = [
            {"role": "system", "content": system_prompt},
            {"role": "system", "content": runtime_instructions},
            *history_messages,
        ]
        logger.info(
            "node.llm_step.prompt thread_id=%s history_messages=%s",
            state["thread_id"],
            len(history_messages),
        )
        tools = [
            {
                "type": "function",
                "function": {"name": spec.name, "parameters": spec.input_schema},
            }
            for spec in TOOL_REGISTRY.values()
        ]

        text_buffer: list[str] = []
        pending_tool_call: dict[str, Any] | None = None

        async for delta in self.llm_client.stream_chat(messages=model_messages, tools=tools):
            if delta.get("content"):
                text_buffer.append(str(delta.get("content")))

            for part in translator.feed_delta(delta):
                await emitter(part)
                if part["type"] == "tool-input-available":
                    now = _utc_now()
                    timeout = now + timedelta(seconds=self.settings.tool_result_timeout_seconds)
                    pending_tool_call = {
                        "tool_call_id": part["toolCallId"],
                        "tool_name": part["toolName"],
                        "input": part["input"],
                        "requested_at": now.isoformat(),
                        "timeout_at": timeout.isoformat(),
                        "interrupt_id": None,
                    }
                    logger.info(
                        "node.llm_step.tool_requested thread_id=%s tool_call_id=%s tool=%s",
                        state["thread_id"],
                        pending_tool_call["tool_call_id"],
                        pending_tool_call["tool_name"],
                    )

        for part in translator.end():
            await emitter(part)
        await emitter({"type": "done"})

        assistant_parts: list[dict[str, Any]] = []
        if text_buffer:
            assistant_parts.append({"type": "text", "text": "".join(text_buffer)})

        if pending_tool_call:
            assistant_parts.append(
                {
                    "type": f"tool-{pending_tool_call['tool_name']}",
                    "toolCallId": pending_tool_call["tool_call_id"],
                    "state": "input-available",
                    "input": pending_tool_call["input"],
                }
            )

        if assistant_parts:
            messages = list(state["messages"])
            messages.append(
                {
                    "id": message_id,
                    "role": "assistant",
                    "parts": assistant_parts,
                }
            )
        else:
            messages = list(state["messages"])

        if pending_tool_call:
            async with self.session_factory() as db:
                audit_repo = ToolAuditRepository(db)
                await audit_repo.create_requested(
                    thread_id=state["thread_id"],
                    tool_call_id=pending_tool_call["tool_call_id"],
                    tool_name=pending_tool_call["tool_name"],
                    tool_input=pending_tool_call["input"],
                    user_id=state["user_id"],
                    user_email=state["user_email"],
                    trace_id=state["session_meta"]["trace_id"],
                    requested_at=_utc_now(),
                )
                await db.commit()

        logger.info(
            "node.llm_step.done thread_id=%s text_chars=%s pending_tool=%s",
            state["thread_id"],
            len("".join(text_buffer)),
            bool(pending_tool_call),
        )

        return {
            "messages": messages,
            "pending_tool_call": pending_tool_call,
        }

    async def tool_authorization(
        self,
        state: AgentState,
        config: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        emitter = _as_async(_config_value(config, "event_emitter"))
        pending = state.get("pending_tool_call")
        if not pending:
            return {}

        tool_name = pending["tool_name"]
        logger.info(
            "node.tool_authorization.start thread_id=%s tool_call_id=%s tool=%s",
            state["thread_id"],
            pending["tool_call_id"],
            tool_name,
        )
        spec = TOOL_REGISTRY.get(tool_name)
        if not spec:
            denial = f"Tool '{tool_name}' is not registered."
            await emitter(
                {
                    "type": "tool-output-error",
                    "toolCallId": pending["tool_call_id"],
                    "toolName": tool_name,
                    "errorText": denial,
                }
            )
            messages = list(state["messages"])
            messages.append(
                {
                    "id": f"assistant-{uuid4().hex}",
                    "role": "assistant",
                    "parts": [{"type": "text", "text": denial}],
                }
            )
            async with self.session_factory() as db:
                audit_repo = ToolAuditRepository(db)
                await audit_repo.mark_completed(
                    thread_id=state["thread_id"],
                    tool_call_id=pending["tool_call_id"],
                    status="unregistered",
                    output=None,
                    error_text=denial,
                    completed_at=_utc_now(),
                )
                await db.commit()
            logger.warning(
                "node.tool_authorization.unregistered thread_id=%s tool=%s",
                state["thread_id"],
                tool_name,
            )
            return {
                "messages": messages,
                "last_error": denial,
                "pending_tool_call": None,
            }

        if spec.execution_mode != "client":
            denial = f"Tool '{tool_name}' is not allowed in client execution mode."
            await emitter(
                {
                    "type": "tool-output-error",
                    "toolCallId": pending["tool_call_id"],
                    "toolName": tool_name,
                    "errorText": denial,
                }
            )
            messages = list(state["messages"])
            messages.append(
                {
                    "id": f"assistant-{uuid4().hex}",
                    "role": "assistant",
                    "parts": [{"type": "text", "text": denial}],
                }
            )
            async with self.session_factory() as db:
                audit_repo = ToolAuditRepository(db)
                await audit_repo.mark_completed(
                    thread_id=state["thread_id"],
                    tool_call_id=pending["tool_call_id"],
                    status="denied",
                    output=None,
                    error_text=denial,
                    completed_at=_utc_now(),
                )
                await db.commit()
            logger.warning(
                "node.tool_authorization.denied thread_id=%s tool=%s mode=%s",
                state["thread_id"],
                tool_name,
                spec.execution_mode,
            )
            return {
                "messages": messages,
                "last_error": denial,
                "pending_tool_call": None,
            }

        logger.info(
            "node.tool_authorization.allowed thread_id=%s tool=%s",
            state["thread_id"],
            tool_name,
        )
        return {}

    async def interrupt_for_client_tool(
        self,
        state: AgentState,
        config: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        pending = state.get("pending_tool_call")
        if not pending:
            return {}

        pending = dict(pending)
        pending["interrupt_id"] = pending["tool_call_id"]
        logger.info(
            "node.interrupt_for_client_tool thread_id=%s tool_call_id=%s tool=%s",
            state["thread_id"],
            pending["tool_call_id"],
            pending["tool_name"],
        )
        await self.runtime_store.set_pending_tool(state["thread_id"], pending)
        runtime_state = deepcopy(state)
        runtime_state["pending_tool_call"] = pending
        await self.runtime_store.set_state(state["thread_id"], runtime_state)

        resume_payload = interrupt(
            {
                "tool_call_id": pending["tool_call_id"],
                "tool_name": pending["tool_name"],
                "input": pending["input"],
                "timeout_at": pending["timeout_at"],
            }
        )

        return {
            "pending_tool_call": pending,
            "tool_result": resume_payload,
        }

    async def apply_tool_result(
        self,
        state: AgentState,
        config: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        emitter = _as_async(_config_value(config, "event_emitter"))
        pending = state.get("pending_tool_call")
        result = state.get("tool_result")

        if not pending or not result:
            return {}

        if result["tool_call_id"] != pending["tool_call_id"]:
            raise ValueError("tool_call_id mismatch on resume")

        status = result["status"]
        tool_name = result["tool_name"]
        tool_call_id = result["tool_call_id"]
        logger.info(
            "node.apply_tool_result thread_id=%s tool_call_id=%s tool=%s status=%s",
            state["thread_id"],
            tool_call_id,
            tool_name,
            status,
        )

        tool_part: dict[str, Any] = {
            "type": f"tool-{tool_name}",
            "toolCallId": tool_call_id,
            "input": pending["input"],
            "state": status,
        }
        if status == "output-available":
            tool_part["output"] = result.get("output")
            await emitter(
                {
                    "type": "tool-output-available",
                    "toolCallId": tool_call_id,
                    "toolName": tool_name,
                    "output": result.get("output"),
                }
            )
        else:
            tool_part["errorText"] = result.get("error_text")
            await emitter(
                {
                    "type": "tool-output-error",
                    "toolCallId": tool_call_id,
                    "toolName": tool_name,
                    "errorText": result.get("error_text"),
                }
            )

        messages = list(state["messages"])
        messages.append(
            {
                "id": f"tool-{tool_call_id}",
                "role": "tool",
                "parts": [tool_part],
            }
        )

        async with self.session_factory() as db:
            audit_repo = ToolAuditRepository(db)
            await audit_repo.mark_completed(
                thread_id=state["thread_id"],
                tool_call_id=tool_call_id,
                status=status,
                output=result.get("output"),
                error_text=result.get("error_text"),
                completed_at=_utc_now(),
            )
            await db.commit()

        await self.runtime_store.clear_pending_tool(state["thread_id"])
        logger.info("node.apply_tool_result.done thread_id=%s tool_call_id=%s", state["thread_id"], tool_call_id)
        return {
            "messages": messages,
            "pending_tool_call": None,
            "tool_result": None,
        }

    async def finalize_and_persist(
        self,
        state: AgentState,
        config: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        logger.info(
            "node.finalize_and_persist.start thread_id=%s messages=%s",
            state["thread_id"],
            len(state["messages"]),
        )
        messages = list(state["messages"])
        rolling_summary = state.get("rolling_summary")

        # Persist full raw history before runtime compaction.
        async with self.session_factory() as db:
            sessions_repo = SessionRepository(db)
            message_repo = MessageRepository(db)
            session = await sessions_repo.get_owned_session(state["thread_id"], state["user_id"])
            if session is None:
                raise PermissionError("thread not owned by current user")
            await message_repo.replace_thread_messages(state["thread_id"], messages)
            await db.flush()

        system_prompt = build_system_prompt()
        estimated_tokens = self.context_budget.estimate_tokens(
            system_prompt=system_prompt,
            rolling_summary=rolling_summary,
            messages=messages,
            tool_schemas=[spec.input_schema for spec in TOOL_REGISTRY.values()],
        )
        max_context = _model_context_window(state["session_meta"]["model"])
        logger.info(
            "node.finalize_and_persist.budget thread_id=%s estimated_tokens=%s max_context=%s threshold_ratio=%s",
            state["thread_id"],
            estimated_tokens,
            max_context,
            self.context_budget.threshold_ratio,
        )

        runtime_messages = messages
        if self.context_budget.should_compact(
            estimated_tokens=estimated_tokens,
            model_context_window=max_context,
        ):
            logger.info("node.finalize_and_persist.compaction_triggered thread_id=%s", state["thread_id"])
            older_messages, runtime_messages = self.context_budget.split_for_compaction(messages)
            if older_messages:
                try:
                    summary_prompt = build_summary_prompt(
                        existing_summary=rolling_summary,
                        history_to_summarize=_flatten_messages_for_summary(older_messages),
                    )
                    new_summary = await self.llm_client.summarize(prompt=summary_prompt)
                    if new_summary:
                        rolling_summary = new_summary
                        logger.info(
                            "node.finalize_and_persist.compaction_done thread_id=%s older=%s kept=%s",
                            state["thread_id"],
                            len(older_messages),
                            len(runtime_messages),
                        )
                except Exception as exc:  # noqa: BLE001
                    # Non-fatal compaction failure.
                    state["last_error"] = f"context compaction failed: {exc}"
                    logger.exception(
                        "node.finalize_and_persist.compaction_error thread_id=%s error=%s",
                        state["thread_id"],
                        str(exc),
                    )

        session_meta = dict(state["session_meta"])
        session_meta["turn_count"] = int(session_meta.get("turn_count", 0)) + 1
        session_meta["last_activity_at"] = _iso_now()

        async with self.session_factory() as db:
            sessions_repo = SessionRepository(db)
            await sessions_repo.update_runtime(
                state["thread_id"],
                rolling_summary=rolling_summary,
                status="active",
                pending_tool_call=None,
                turn_count=session_meta["turn_count"],
            )
            await db.commit()

        runtime_state = deepcopy(state)
        runtime_state["messages"] = runtime_messages
        runtime_state["rolling_summary"] = rolling_summary
        runtime_state["session_meta"] = session_meta
        runtime_state["last_error"] = None
        runtime_state["pending_tool_call"] = None
        runtime_state["tool_result"] = None
        await self.runtime_store.set_state(state["thread_id"], runtime_state)
        logger.info(
            "node.finalize_and_persist.done thread_id=%s turn_count=%s runtime_messages=%s",
            state["thread_id"],
            session_meta["turn_count"],
            len(runtime_messages),
        )

        return {
            "messages": runtime_messages,
            "rolling_summary": rolling_summary,
            "session_meta": session_meta,
            "last_error": None,
            "pending_tool_call": None,
            "tool_result": None,
        }

    async def inject_resume_result(
        self,
        state: AgentState,
        config: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        # Helper node for explicit resume paths if needed.
        pending = state.get("pending_tool_call")
        if not pending:
            return {}
        payload = await self.runtime_store.pop_tool_result(state["thread_id"], pending["tool_call_id"])
        if not payload:
            now = _iso_now()
            payload = {
                "tool_call_id": pending["tool_call_id"],
                "tool_name": pending["tool_name"],
                "status": "timeout",
                "output": None,
                "error_text": "Tool result timed out",
                "received_at": now,
            }
        return {"tool_result": payload}
