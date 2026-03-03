from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

import orjson
from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import ChatRequest, HistoryResponse, SessionMetaResponse, ToolResultRequest
from app.core.auth import AuthError, Identity
from app.repositories.message_repo import MessageRepository
from app.repositories.session_repo import SessionRepository

router = APIRouter(prefix="/api/v1/agent", tags=["agent"])
logger = logging.getLogger(__name__)


def _sse_line(payload: dict[str, Any] | str) -> bytes:
    if isinstance(payload, str):
        body = payload
    else:
        body = orjson.dumps(payload).decode("utf-8")
    return f"data: {body}\n\n".encode("utf-8")


def _extract_bearer(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing authorization header")
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid authorization header")
    return parts[1].strip()


async def _get_identity(request: Request, authorization: str | None = Header(default=None)) -> Identity:
    token = _extract_bearer(authorization)
    provider = request.app.state.identity_provider
    try:
        return await provider.validate_token(token)
    except AuthError as exc:
        if exc.code == "unavailable":
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


async def _get_db_session(request: Request) -> AsyncSession:
    session_factory = request.app.state.session_factory
    async with session_factory() as db:
        yield db


@router.post("/chat")
async def post_chat(
    payload: ChatRequest,
    request: Request,
    identity: Identity = Depends(_get_identity),
):
    runtime = request.app.state.agent_graph_runtime
    thread_id = payload.thread_id
    incoming_messages = payload.messages
    message_id = payload.message_id or f"assistant-{uuid4().hex}"
    logger.info(
        "chat.start thread_id=%s user_id=%s messages=%s trigger=%s",
        thread_id,
        identity.user_id,
        len(incoming_messages),
        payload.trigger,
    )

    try:
        async with request.app.state.session_factory() as db:
            session_repo = SessionRepository(db)
            existing = await session_repo.get_by_thread_id(thread_id)
            if existing and existing.user_id != identity.user_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="thread ownership mismatch")
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("chat.preflight_db_error thread_id=%s error=%s", thread_id, str(exc))
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="database unavailable") from exc

    queue: asyncio.Queue[dict[str, Any] | str] = asyncio.Queue()
    emitted_parts = 0

    async def emit(part: dict[str, Any]) -> None:
        nonlocal emitted_parts
        emitted_parts += 1
        if part.get("type") in {"start", "tool-input-available", "tool-output-available", "tool-output-error", "finish", "error"}:
            logger.info(
                "chat.event thread_id=%s type=%s emitted_parts=%s",
                thread_id,
                part.get("type"),
                emitted_parts,
            )
        await queue.put(part)

    async def run_graph() -> None:
        try:
            logger.info("chat.graph_invoke thread_id=%s", thread_id)
            await runtime.invoke_chat_turn(
                thread_id=thread_id,
                identity=identity,
                incoming_messages=incoming_messages,
                message_id=message_id,
                event_emitter=emit,
            )
            logger.info("chat.graph_complete thread_id=%s emitted_parts=%s", thread_id, emitted_parts)
        except Exception as exc:  # noqa: BLE001
            logger.exception("chat.graph_error thread_id=%s error=%s", thread_id, str(exc))
            await queue.put({"type": "error", "message": str(exc)})
        finally:
            await queue.put("__END__")

    task = asyncio.create_task(run_graph())

    async def event_generator():
        while True:
            item = await queue.get()
            if item == "__END__":
                break
            yield _sse_line(item)
        await task
        yield _sse_line("[DONE]")

    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "x-vercel-ai-ui-message-stream": "v1",
    }
    return StreamingResponse(event_generator(), media_type="text/event-stream", headers=headers)


@router.post("/tool-result")
async def post_tool_result(
    payload: ToolResultRequest,
    request: Request,
    x_conferencespace_proxy: str | None = Header(default=None),
    identity: Identity = Depends(_get_identity),
    db: AsyncSession = Depends(_get_db_session),
) -> dict[str, str]:
    logger.info(
        "tool_result.start thread_id=%s tool_call_id=%s user_id=%s",
        payload.thread_id,
        payload.tool_call_id,
        identity.user_id,
    )
    if x_conferencespace_proxy != "next-chat-adapter":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="tool-result is proxy-only")

    session_repo = SessionRepository(db)
    session = await session_repo.get_owned_session(payload.thread_id, identity.user_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="thread ownership mismatch")

    runtime_store = request.app.state.runtime_store
    pending = await runtime_store.get_pending_tool(payload.thread_id)
    if not pending:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="no pending tool call")
    if pending["tool_call_id"] != payload.tool_call_id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="tool_call_id mismatch")
    if pending["tool_name"] != payload.result.tool_name:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="tool_name mismatch")
    timeout_at = datetime.fromisoformat(pending["timeout_at"])
    if datetime.now(tz=timezone.utc) > timeout_at:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="pending tool call already timed out")

    envelope = {
        "tool_call_id": payload.tool_call_id,
        "tool_name": payload.result.tool_name,
        "status": payload.result.status,
        "output": payload.result.output,
        "error_text": payload.result.error_text,
        "received_at": datetime.now(tz=timezone.utc).isoformat(),
    }
    await runtime_store.set_tool_result(payload.thread_id, payload.tool_call_id, envelope)
    logger.info(
        "tool_result.accepted thread_id=%s tool_call_id=%s status=%s",
        payload.thread_id,
        payload.tool_call_id,
        payload.result.status,
    )
    return {"status": "accepted"}


@router.get("/sessions/{thread_id}/history", response_model=HistoryResponse)
async def get_session_history(
    thread_id: str,
    identity: Identity = Depends(_get_identity),
    db: AsyncSession = Depends(_get_db_session),
) -> HistoryResponse:
    logger.info("history.start thread_id=%s user_id=%s", thread_id, identity.user_id)
    session_repo = SessionRepository(db)
    message_repo = MessageRepository(db)

    session = await session_repo.get_owned_session(thread_id, identity.user_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="thread not found")

    messages = await message_repo.list_ui_messages(thread_id)
    meta = SessionMetaResponse(
        started_at=session.started_at,
        last_activity_at=session.last_activity_at,
        turn_count=session.turn_count,
        model=session.model,
        trace_id=str(session.trace_id),
    )
    return HistoryResponse(
        thread_id=thread_id,
        messages=messages,
        rolling_summary=session.rolling_summary,
        session_meta=meta,
    )


@router.delete("/sessions/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session_runtime(
    thread_id: str,
    request: Request,
    identity: Identity = Depends(_get_identity),
    db: AsyncSession = Depends(_get_db_session),
) -> Response:
    logger.info("session.delete thread_id=%s user_id=%s", thread_id, identity.user_id)
    session_repo = SessionRepository(db)
    session = await session_repo.get_owned_session(thread_id, identity.user_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="thread not found")

    runtime_store = request.app.state.runtime_store
    await runtime_store.delete_state(thread_id)
    await runtime_store.clear_pending_tool(thread_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
