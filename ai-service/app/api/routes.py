from __future__ import annotations

import asyncio
import logging
from contextlib import suppress
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

import orjson
from fastapi import APIRouter, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy import text

from app.api.schemas import (
    ChatRequest,
    HealthResponse,
    HistoryResponse,
    HistorySessionMeta,
    ToolResultAcceptedResponse,
    ToolResultRequest,
)
from app.core.auth import AuthError, Identity, check_identity_backend_health
from app.repositories.message_repo import MessageRepository
from app.repositories.session_repo import SessionRepository
from app.repositories.tool_audit_repo import ToolAuditRepository

logger = logging.getLogger(__name__)

agent_router = APIRouter(prefix="/api/v1/agent", tags=["agent"])
status_router = APIRouter(tags=["status"])


@status_router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", checks={"service": True})


@status_router.get("/ready", response_model=HealthResponse)
async def ready(request: Request) -> Response:
    container = _get_container(request)
    checks = await _dependency_checks(container)
    ok = all(checks.values())
    payload = HealthResponse(status="ok" if ok else "degraded", checks=checks)
    return JSONResponse(
        content=payload.model_dump(),
        status_code=status.HTTP_200_OK if ok else status.HTTP_503_SERVICE_UNAVAILABLE,
    )


@agent_router.post("/chat")
async def chat(request: Request, body: ChatRequest) -> StreamingResponse:
    container = _get_container(request)
    identity = await _require_identity(request)

    checks = await _dependency_checks(container, include_identity_backend=False)
    if not checks["db"] or not checks["redis"]:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="required dependencies are unavailable",
        )

    await _enforce_rate_limit(
        container=container,
        scope="chat",
        identity=str(identity.user_id),
        limit=container.settings.max_chat_requests_per_minute,
    )

    messages = [message.model_dump(exclude_none=True) for message in body.messages]
    _validate_messages(messages=messages, max_messages=container.settings.max_messages_per_request, max_text_chars=container.settings.max_message_text_chars)

    await _enforce_pending_tool_state(
        container=container,
        identity=identity,
        thread_id=body.thread_id,
        messages=messages,
    )

    message_id = body.message_id or f"assistant-{uuid4().hex}"

    async def event_stream():
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue()
        done = asyncio.Event()

        async def emit(event: dict[str, Any]) -> None:
            await queue.put(event)

        async def runner() -> None:
            try:
                await container.runtime.run_chat_turn(
                    thread_id=body.thread_id,
                    identity=identity,
                    incoming_messages=messages,
                    message_id=message_id,
                    event_emitter=emit,
                )
            except PermissionError as exc:
                logger.warning("agent.chat.permission_error thread_id=%s user_id=%s error=%s", body.thread_id, identity.user_id, str(exc))
                await queue.put({"type": "error", "message": "thread is not accessible"})
            except ValueError as exc:
                logger.warning("agent.chat.invalid_state thread_id=%s user_id=%s error=%s", body.thread_id, identity.user_id, str(exc))
                await queue.put({"type": "error", "message": str(exc)})
            except Exception:  # noqa: BLE001
                logger.exception("agent.chat.runtime_failure thread_id=%s user_id=%s", body.thread_id, identity.user_id)
                await queue.put({"type": "error", "message": "internal runtime error"})
            finally:
                done.set()

        task = asyncio.create_task(runner())
        try:
            while True:
                if done.is_set() and queue.empty():
                    break
                try:
                    payload = await asyncio.wait_for(queue.get(), timeout=0.25)
                except asyncio.TimeoutError:
                    continue
                yield _encode_sse(payload)
            yield b"data: [DONE]\n\n"
        finally:
            if not task.done():
                task.cancel()
            with suppress(asyncio.CancelledError):
                await task

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-AI-Service-Stream-Version": "v1",
        },
    )


@agent_router.post("/tool-result", response_model=ToolResultAcceptedResponse)
async def submit_tool_result(request: Request, body: ToolResultRequest) -> ToolResultAcceptedResponse:
    container = _get_container(request)
    identity = await _require_identity(request)

    checks = await _dependency_checks(container, include_identity_backend=False)
    if not checks["db"] or not checks["redis"]:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="required dependencies are unavailable",
        )

    await _enforce_rate_limit(
        container=container,
        scope="tool-result",
        identity=str(identity.user_id),
        limit=container.settings.max_tool_result_requests_per_minute,
    )
    container.metrics.inc("tool_result_requests_total")

    async with container.session_factory() as db:
        sessions = SessionRepository(db)
        audits = ToolAuditRepository(db)

        session = await sessions.get_by_thread_id(body.thread_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="thread not found")
        if session.user_id != identity.user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="thread is not accessible")

        pending = session.pending_tool_call or {}
        pending_call_id = str(pending.get("tool_call_id") or "")
        pending_tool_name = str(pending.get("tool_name") or "")

        if not pending_call_id:
            audit = await audits.get(thread_id=body.thread_id, tool_call_id=body.tool_call_id)
            if (
                audit
                and audit.tool_name == body.result.tool_name
                and audit.status == body.result.status
            ):
                return ToolResultAcceptedResponse(status="accepted", idempotent=True)
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="no pending tool call for thread")

        if pending_call_id != body.tool_call_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"tool_call_id mismatch; expected '{pending_call_id}'",
            )
        if pending_tool_name != body.result.tool_name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"tool_name mismatch; expected '{pending_tool_name}'",
            )

        result_payload: dict[str, Any] = {
            "tool_call_id": body.tool_call_id,
            "tool_name": body.result.tool_name,
            "status": body.result.status,
            "output": body.result.output,
            "error_text": body.result.error_text,
            "received_at": _iso_now(),
        }

        await container.runtime_store.set_tool_result(
            thread_id=body.thread_id,
            tool_call_id=body.tool_call_id,
            payload=result_payload,
        )

        await sessions.update_runtime(
            body.thread_id,
            status="waiting_tool",
            pending_tool_call=session.pending_tool_call,
            turn_count=session.turn_count,
        )
        await db.commit()

    return ToolResultAcceptedResponse(status="accepted")


@agent_router.get("/sessions/{thread_id}/history", response_model=HistoryResponse)
async def get_history(thread_id: str, request: Request) -> HistoryResponse:
    container = _get_container(request)
    identity = await _require_identity(request)

    checks = await _dependency_checks(container, include_identity_backend=False)
    if not checks["db"]:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="database is unavailable",
        )

    async with container.session_factory() as db:
        sessions = SessionRepository(db)
        message_repo = MessageRepository(db)
        session = await sessions.get_owned_session(thread_id, identity.user_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="thread not found")

        messages = await message_repo.list_ui_messages(thread_id)

    return HistoryResponse(
        thread_id=thread_id,
        messages=messages,
        rolling_summary=session.rolling_summary,
        session_meta=HistorySessionMeta(
            started_at=_to_iso(session.started_at),
            last_activity_at=_to_iso(session.last_activity_at),
            turn_count=int(session.turn_count),
            model=session.model,
            trace_id=str(session.trace_id),
        ),
    )


@agent_router.delete("/sessions/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(thread_id: str, request: Request) -> Response:
    container = _get_container(request)
    identity = await _require_identity(request)

    checks = await _dependency_checks(container, include_identity_backend=False)
    if not checks["db"]:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="database is unavailable",
        )

    pending_tool_call_id: str | None = None
    async with container.session_factory() as db:
        sessions = SessionRepository(db)
        session = await sessions.get_owned_session(thread_id, identity.user_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="thread not found")
        pending = session.pending_tool_call or {}
        pending_tool_call_id = str(pending.get("tool_call_id")) if pending.get("tool_call_id") else None

        deleted = await sessions.delete_session(thread_id, identity.user_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="thread not found")
        await db.commit()

    if pending_tool_call_id:
        await container.runtime_store.clear_tool_result(thread_id, pending_tool_call_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@agent_router.get("/metrics")
async def metrics(request: Request) -> dict[str, Any]:
    container = _get_container(request)
    return container.metrics.snapshot()


def _get_container(request: Request) -> Any:
    container = getattr(request.app.state, "container", None)
    if container is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="service container not initialized")
    return container


async def _require_identity(request: Request) -> Identity:
    auth_header = request.headers.get("Authorization")
    token = _extract_bearer_token(auth_header)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing bearer token")

    container = _get_container(request)
    try:
        return await container.identity_provider.validate_token(token)
    except AuthError as exc:
        if exc.code == "unauthorized":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


async def _dependency_checks(container: Any, *, include_identity_backend: bool = True) -> dict[str, bool]:
    checks = {"db": False, "redis": False, "identity_backend": True}

    try:
        async with container.session_factory() as db:
            await db.execute(text("SELECT 1"))
        checks["db"] = True
    except Exception:  # noqa: BLE001
        logger.exception("health.db_failed")

    try:
        pong = await container.redis.ping()
        checks["redis"] = bool(pong)
    except Exception:  # noqa: BLE001
        logger.exception("health.redis_failed")

    if include_identity_backend:
        checks["identity_backend"] = await check_identity_backend_health(
            container.settings.backend_api_base_url,
            timeout_seconds=container.settings.identity_request_timeout_seconds,
        )
    return checks


async def _enforce_rate_limit(*, container: Any, scope: str, identity: str, limit: int) -> None:
    allowed, current = await container.runtime_store.check_rate_limit(
        scope=scope,
        identity=identity,
        limit=limit,
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"rate limit exceeded for {scope}; limit={limit}/min current={current}",
        )


def _validate_messages(*, messages: list[dict[str, Any]], max_messages: int, max_text_chars: int) -> None:
    if len(messages) > max_messages:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"messages length exceeds limit ({max_messages})",
        )

    for idx, message in enumerate(messages):
        parts = message.get("parts", [])
        if not isinstance(parts, list):
            continue
        for part_idx, part in enumerate(parts):
            if not isinstance(part, dict):
                continue
            if part.get("type") != "text":
                continue
            text_value = str(part.get("text", ""))
            if len(text_value) > max_text_chars:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"text part too large at messages[{idx}].parts[{part_idx}] (limit={max_text_chars})",
                )


async def _enforce_pending_tool_state(
    *,
    container: Any,
    identity: Identity,
    thread_id: str,
    messages: list[dict[str, Any]],
) -> None:
    async with container.session_factory() as db:
        sessions = SessionRepository(db)
        session = await sessions.get_by_thread_id(thread_id)
        if not session:
            return
        if session.user_id != identity.user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="thread is not accessible")

        pending = session.pending_tool_call or {}
        pending_call_id = str(pending.get("tool_call_id", ""))
        if not pending_call_id:
            return

    has_resume_payload = await container.redis.exists(container.runtime_store.tool_result_key(thread_id, pending_call_id))
    if has_resume_payload:
        return
    if _has_completed_tool_output(messages, pending_call_id):
        return
    if _has_fresh_user_message(messages):
        return

    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="thread is waiting for tool-result before chat can resume",
    )


def _extract_bearer_token(header: str | None) -> str | None:
    if not header:
        return None
    value = header.strip()
    if not value:
        return None
    if value.lower().startswith("bearer "):
        token = value.split(" ", 1)[1].strip()
        return token or None
    return None


def _encode_sse(payload: dict[str, Any]) -> bytes:
    return b"data: " + orjson.dumps(payload) + b"\n\n"


def _has_fresh_user_message(messages: list[dict[str, Any]]) -> bool:
    if not messages:
        return False
    last = messages[-1]
    if str(last.get("role")) != "user":
        return False
    for part in last.get("parts", []) or []:
        if isinstance(part, dict) and part.get("type") == "text" and str(part.get("text", "")).strip():
            return True
    return False


def _has_completed_tool_output(messages: list[dict[str, Any]], tool_call_id: str) -> bool:
    if not tool_call_id:
        return False
    for message in reversed(messages):
        parts = message.get("parts", [])
        if not isinstance(parts, list):
            continue
        for part in reversed(parts):
            if not isinstance(part, dict):
                continue
            state = str(part.get("state") or "")
            if state not in {"output-available", "output-error", "timeout"}:
                continue
            part_call_id = str(part.get("toolCallId") or part.get("id") or "")
            if part_call_id == tool_call_id:
                return True
    return False


def _iso_now() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


def _to_iso(value: datetime) -> str:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc).isoformat()
    return value.astimezone(timezone.utc).isoformat()
