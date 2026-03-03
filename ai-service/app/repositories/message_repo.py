from __future__ import annotations

from typing import Any

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AgentMessage


class MessageRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_by_thread_id(self, thread_id: str) -> list[AgentMessage]:
        stmt = (
            select(AgentMessage)
            .where(AgentMessage.thread_id == thread_id)
            .order_by(AgentMessage.sequence_no.asc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_ui_messages(self, thread_id: str) -> list[dict[str, Any]]:
        rows = await self.list_by_thread_id(thread_id)
        return [
            {
                "id": row.message_id,
                "role": row.role,
                "parts": row.parts if isinstance(row.parts, list) else [row.parts],
            }
            for row in rows
        ]

    async def replace_thread_messages(self, thread_id: str, messages: list[dict[str, Any]]) -> None:
        await self.db.execute(delete(AgentMessage).where(AgentMessage.thread_id == thread_id))
        for idx, msg in enumerate(messages):
            row = AgentMessage(
                thread_id=thread_id,
                sequence_no=idx + 1,
                message_id=str(msg.get("id", f"{thread_id}-msg-{idx+1}")),
                role=str(msg.get("role", "assistant")),
                parts=msg.get("parts", []),
                token_count=None,
            )
            self.db.add(row)
        await self.db.flush()

    async def count_messages(self, thread_id: str) -> int:
        stmt = select(func.count()).select_from(AgentMessage).where(AgentMessage.thread_id == thread_id)
        result = await self.db.execute(stmt)
        return int(result.scalar_one() or 0)

