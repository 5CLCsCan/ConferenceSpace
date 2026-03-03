from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AiSession


class SessionRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_thread_id(self, thread_id: str) -> AiSession | None:
        result = await self.db.execute(select(AiSession).where(AiSession.thread_id == thread_id))
        return result.scalar_one_or_none()

    async def get_owned_session(self, thread_id: str, user_id: int) -> AiSession | None:
        result = await self.db.execute(
            select(AiSession).where(AiSession.thread_id == thread_id, AiSession.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def ensure_session(self, thread_id: str, user_id: int, user_email: str, model: str, trace_id: str | None = None) -> AiSession:
        existing = await self.get_by_thread_id(thread_id)
        if existing:
            if existing.user_id != user_id:
                raise PermissionError("thread belongs to a different user")
            existing.last_activity_at = datetime.now(tz=timezone.utc)
            existing.model = model
            if trace_id:
                existing.trace_id = trace_id
            await self.db.flush()
            return existing

        row = AiSession(
            thread_id=thread_id,
            user_id=user_id,
            user_email=user_email,
            model=model,
            trace_id=trace_id or str(uuid4()),
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

    async def delete_session(self, thread_id: str, user_id: int) -> bool:
        row = await self.get_owned_session(thread_id, user_id)
        if not row:
            return False
        await self.db.execute(delete(AiSession).where(AiSession.thread_id == thread_id, AiSession.user_id == user_id))
        await self.db.flush()
        return True