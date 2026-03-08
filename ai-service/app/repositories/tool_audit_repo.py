from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AiToolAudit


class ToolAuditRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get(self, thread_id: str, tool_call_id: str) -> AiToolAudit | None:
        result = await self.db.execute(
            select(AiToolAudit).where(AiToolAudit.thread_id == thread_id, AiToolAudit.tool_call_id == tool_call_id)
        )
        return result.scalar_one_or_none()

    async def create_requested(
        self,
        *,
        thread_id: str,
        tool_call_id: str,
        tool_name: str,
        tool_input: dict[str, Any],
        user_id: int,
        user_email: str,
        trace_id: str,
        requested_at: datetime,
    ) -> AiToolAudit:
        existing = await self.get(thread_id=thread_id, tool_call_id=tool_call_id)
        if existing:
            return existing

        row = AiToolAudit(
            thread_id=thread_id,
            tool_call_id=tool_call_id,
            tool_name=tool_name,
            tool_input=tool_input,
            status="requested",
            user_id=user_id,
            user_email=user_email,
            trace_id=trace_id,
            requested_at=requested_at,
        )
        self.db.add(row)
        await self.db.flush()
        return row

    async def mark_completed(
        self,
        *,
        thread_id: str,
        tool_call_id: str,
        status: str,
        output: Any | None,
        error_text: str | None,
        completed_at: datetime,
    ) -> None:
        row = await self.get(thread_id=thread_id, tool_call_id=tool_call_id)
        if not row:
            return
        row.status = status
        row.output = output
        row.error_text = error_text
        row.completed_at = completed_at
        await self.db.flush()