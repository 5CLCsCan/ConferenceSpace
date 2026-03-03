from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AgentSession


class SessionRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_thread_id(self, thread_id: str) -> AgentSession | None:
        stmt = select(AgentSession).where(AgentSession.thread_id == thread_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_owned_session(self, thread_id: str, user_id: int) -> AgentSession | None:
        stmt = select(AgentSession).where(
            AgentSession.thread_id == thread_id,
            AgentSession.user_id == user_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def ensure_session(
        self,
        thread_id: str,
        user_id: int,
        user_email: str,
        model: str,
        trace_id: str,
    ) -> AgentSession:
        existing = await self.get_by_thread_id(thread_id)
        if existing:
            if existing.user_id != user_id:
                raise PermissionError("thread belongs to a different user")
            existing.last_activity_at = datetime.now(tz=timezone.utc)
            existing.model = model
            existing.trace_id = trace_id
            await self.db.flush()
            return existing

        row = AgentSession(
            thread_id=thread_id,
            user_id=user_id,
            user_email=user_email,
            model=model,
            trace_id=trace_id,
            status="active",
            last_activity_at=datetime.now(tz=timezone.utc),
        )
        self.db.add(row)
        await self.db.flush()
        return row

    async def update_runtime(
        self,
        thread_id: str,
        *,
        rolling_summary: str | None = None,
        status: str | None = None,
        pending_tool_call: dict | None = None,
        turn_count: int | None = None,
        touch_last_activity: bool = True,
    ) -> None:
        row = await self.get_by_thread_id(thread_id)
        if not row:
            return

        if rolling_summary is not None:
            row.rolling_summary = rolling_summary
        if status is not None:
            row.status = status
        row.pending_tool_call = pending_tool_call
        if turn_count is not None:
            row.turn_count = turn_count
        if touch_last_activity:
            row.last_activity_at = datetime.now(tz=timezone.utc)
        await self.db.flush()

