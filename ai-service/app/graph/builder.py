from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import logging
from typing import Any
from uuid import uuid4

from langgraph.graph import END, START, StateGraph
from langgraph.types import Command

from app.core.auth import Identity
from app.core.config import Settings
from app.graph.nodes import AgentNodes
from app.graph.state import AgentState
from app.repositories.runtime_store import RuntimeStore

logger = logging.getLogger(__name__)


def _iso_now() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


def _route_after_llm(state: AgentState) -> str:
    return "tool_authorization" if state.get("pending_tool_call") else "finalize_and_persist"


def _route_after_tool_authorization(state: AgentState) -> str:
    return "interrupt_for_client_tool" if state.get("pending_tool_call") else "llm_step"


@dataclass(slots=True)
class AgentGraphRuntime:
    graph: Any
    runtime_store: RuntimeStore
    settings: Settings

    async def invoke_chat_turn(
        self,
        *,
        thread_id: str,
        identity: Identity,
        incoming_messages: list[dict[str, Any]],
        message_id: str,
        event_emitter: Any,
    ) -> dict[str, Any]:
        logger.info(
            "graph.invoke thread_id=%s user_id=%s incoming_messages=%s",
            thread_id,
            identity.user_id,
            len(incoming_messages),
        )
        config = {
            "configurable": {
                "thread_id": thread_id,
                "message_id": message_id,
                "event_emitter": event_emitter,
            }
        }

        # Resume path: tool result already posted and pending tool call exists.
        pending_tool = await self.runtime_store.get_pending_tool(thread_id)
        if pending_tool:
            logger.info(
                "graph.resume_pending thread_id=%s tool_call_id=%s tool_name=%s",
                thread_id,
                pending_tool.get("tool_call_id"),
                pending_tool.get("tool_name"),
            )
            resume_payload = await self.runtime_store.pop_tool_result(
                thread_id,
                pending_tool["tool_call_id"],
            )
            if resume_payload:
                logger.info("graph.resume_with_tool_result thread_id=%s", thread_id)
                command = Command(resume=resume_payload)
                return await self.graph.ainvoke(command, config=config)

            # Fallback: recover tool output directly from incoming UI messages
            # if adapter-side /tool-result extraction missed it.
            inline_resume = _extract_resume_from_messages(
                messages=incoming_messages,
                pending_tool=pending_tool,
            )
            if inline_resume:
                logger.info("graph.resume_from_inline_messages thread_id=%s", thread_id)
                command = Command(resume=inline_resume)
                return await self.graph.ainvoke(command, config=config)

            timeout_at = datetime.fromisoformat(pending_tool["timeout_at"])
            if datetime.now(tz=timezone.utc) >= timeout_at:
                logger.warning("graph.resume_timeout thread_id=%s", thread_id)
                timeout_payload = {
                    "tool_call_id": pending_tool["tool_call_id"],
                    "tool_name": pending_tool["tool_name"],
                    "status": "timeout",
                    "output": None,
                    "error_text": "Tool result timed out",
                    "received_at": _iso_now(),
                }
                command = Command(resume=timeout_payload)
                return await self.graph.ainvoke(command, config=config)

            # Stale pending-call recovery: if user already sent a fresh message
            # and there is no tool result to resume, clear pending runtime and continue.
            if _has_fresh_user_message(incoming_messages):
                logger.warning("graph.clearing_stale_pending_tool thread_id=%s", thread_id)
                await self.runtime_store.clear_pending_tool(thread_id)
            else:
                raise ValueError("pending tool call requires tool-result before chat resume")

        initial_state: AgentState = {
            "thread_id": thread_id,
            "user_id": identity.user_id,
            "user_email": identity.user_email,
            "messages": incoming_messages,
            "rolling_summary": None,
            "pending_tool_call": None,
            "tool_result": None,
            "session_meta": {
                "started_at": _iso_now(),
                "last_activity_at": _iso_now(),
                "turn_count": 0,
                "model": self.settings.agent_model,
                "trace_id": str(uuid4()),
            },
            "last_error": None,
        }
        logger.info("graph.start_fresh_turn thread_id=%s", thread_id)
        return await self.graph.ainvoke(initial_state, config=config)


def _extract_resume_from_messages(
    *,
    messages: list[dict[str, Any]],
    pending_tool: dict[str, Any],
) -> dict[str, Any] | None:
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

            part_type = str(part.get("type", ""))
            state = part.get("state")
            if state not in {"output-available", "output-error", "timeout"}:
                continue

            tool_name = ""
            if part_type == "dynamic-tool":
                tool_name = str(part.get("toolName", ""))
            elif part_type.startswith("tool-"):
                tool_name = part_type.replace("tool-", "")
            else:
                continue

            tool_call_id = str(
                part.get("toolCallId")
                or part.get("id")
                or (part.get("toolInvocation") or {}).get("toolCallId")
                or ""
            )

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


def build_agent_graph(*, nodes: AgentNodes, checkpointer: Any | None = None) -> AgentGraphRuntime:
    graph = StateGraph(AgentState)

    graph.add_node("authorize_and_bind_session", nodes.authorize_and_bind_session)
    graph.add_node("load_context", nodes.load_context)
    graph.add_node("llm_step", nodes.llm_step)
    graph.add_node("tool_authorization", nodes.tool_authorization)
    graph.add_node("interrupt_for_client_tool", nodes.interrupt_for_client_tool)
    graph.add_node("apply_tool_result", nodes.apply_tool_result)
    graph.add_node("finalize_and_persist", nodes.finalize_and_persist)

    graph.add_edge(START, "authorize_and_bind_session")
    graph.add_edge("authorize_and_bind_session", "load_context")
    graph.add_edge("load_context", "llm_step")
    graph.add_conditional_edges(
        "llm_step",
        _route_after_llm,
        {
            "tool_authorization": "tool_authorization",
            "finalize_and_persist": "finalize_and_persist",
        },
    )
    graph.add_conditional_edges(
        "tool_authorization",
        _route_after_tool_authorization,
        {
            "interrupt_for_client_tool": "interrupt_for_client_tool",
            "llm_step": "llm_step",
        },
    )
    graph.add_edge("interrupt_for_client_tool", "apply_tool_result")
    graph.add_edge("apply_tool_result", "llm_step")
    graph.add_edge("finalize_and_persist", END)

    compiled = graph.compile(checkpointer=checkpointer)
    return AgentGraphRuntime(graph=compiled, runtime_store=nodes.runtime_store, settings=nodes.settings)
