from __future__ import annotations

from typing import Any

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AiMessage


class MessageRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_by_thread_id(self, thread_id: str) -> list[AiMessage]:
        result = await self.db.execute(
            select(AiMessage).where(AiMessage.thread_id == thread_id).order_by(AiMessage.sequence_no.asc())
        )
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
        await self.db.execute(delete(AiMessage).where(AiMessage.thread_id == thread_id))
        for idx, msg in enumerate(messages):
            self.db.add(
                AiMessage(
                    thread_id=thread_id,
                    sequence_no=idx + 1,
                    message_id=str(msg.get("id", f"{thread_id}-msg-{idx+1}")),
                    role=str(msg.get("role", "assistant")),
                    parts=msg.get("parts", []),
                    token_count=None,
                )
            )
        await self.db.flush()

    async def count_messages(self, thread_id: str) -> int:
        result = await self.db.execute(select(func.count()).select_from(AiMessage).where(AiMessage.thread_id == thread_id))
        return int(result.scalar_one() or 0)