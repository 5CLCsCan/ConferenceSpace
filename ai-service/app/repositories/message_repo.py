from __future__ import annotations

from datetime import datetime, timezone
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
        return self._to_ui_messages(rows)

    async def list_recent_ui_messages(self, thread_id: str, *, limit: int) -> list[dict[str, Any]]:
        if limit <= 0:
            return []
        result = await self.db.execute(
            select(AiMessage)
            .where(AiMessage.thread_id == thread_id)
            .order_by(AiMessage.sequence_no.desc())
            .limit(limit)
        )
        rows = list(result.scalars().all())
        rows.reverse()
        return self._to_ui_messages(rows)

    async def append_unseen_messages(self, thread_id: str, messages: list[dict[str, Any]]) -> int:
        if not messages:
            return 0

        normalized_messages: list[dict[str, Any]] = []
        for idx, msg in enumerate(messages):
            message_id = self._message_id(thread_id=thread_id, message=msg, idx=idx)
            role = str(msg.get("role", "user"))
            if role not in {"system", "user", "assistant", "tool"}:
                role = "user"
            parts = msg.get("parts", [])
            normalized_parts = parts if isinstance(parts, list) else [parts]
            normalized_messages.append(
                {
                    "message_id": message_id,
                    "role": role,
                    "parts": normalized_parts,
                }
            )

        message_ids = [msg["message_id"] for msg in normalized_messages]
        existing_result = await self.db.execute(
            select(AiMessage.message_id).where(
                AiMessage.thread_id == thread_id,
                AiMessage.message_id.in_(message_ids),
            )
        )
        existing_ids = {str(message_id) for message_id in existing_result.scalars().all()}

        sequence_result = await self.db.execute(
            select(func.max(AiMessage.sequence_no)).where(AiMessage.thread_id == thread_id)
        )
        next_sequence = int(sequence_result.scalar() or 0) + 1
        seen_batch_ids: set[str] = set()
        appended = 0

        for message in normalized_messages:
            message_id = str(message["message_id"])
            if message_id in existing_ids or message_id in seen_batch_ids:
                continue

            self.db.add(
                AiMessage(
                    thread_id=thread_id,
                    sequence_no=next_sequence,
                    message_id=message_id,
                    role=str(message["role"]),
                    parts=message["parts"],
                    token_count=None,
                )
            )
            seen_batch_ids.add(message_id)
            next_sequence += 1
            appended += 1

        if appended:
            await self.db.flush()
        return appended

    async def replace_thread_messages(self, thread_id: str, messages: list[dict[str, Any]]) -> None:
        # Legacy method kept for compatibility with older callers.
        await self.db.execute(delete(AiMessage).where(AiMessage.thread_id == thread_id))
        for idx, msg in enumerate(messages):
            self.db.add(
                AiMessage(
                    thread_id=thread_id,
                    sequence_no=idx + 1,
                    message_id=self._message_id(thread_id=thread_id, message=msg, idx=idx),
                    role=str(msg.get("role", "assistant")),
                    parts=msg.get("parts", []),
                    token_count=None,
                )
            )
        await self.db.flush()

    async def count_messages(self, thread_id: str) -> int:
        result = await self.db.execute(select(func.count()).select_from(AiMessage).where(AiMessage.thread_id == thread_id))
        return int(result.scalar_one() or 0)

    def _to_ui_messages(self, rows: list[AiMessage]) -> list[dict[str, Any]]:
        return [
            {
                "id": row.message_id,
                "role": row.role,
                "parts": row.parts if isinstance(row.parts, list) else [row.parts],
                "createdAt": self._to_iso(row.created_at),
            }
            for row in rows
        ]

    def _message_id(self, *, thread_id: str, message: dict[str, Any], idx: int) -> str:
        raw_id = str(message.get("id", "")).strip()
        if raw_id:
            return raw_id
        return f"{thread_id}-msg-{idx + 1}"

    def _to_iso(self, value: datetime) -> str:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc).isoformat()
        return value.astimezone(timezone.utc).isoformat()
