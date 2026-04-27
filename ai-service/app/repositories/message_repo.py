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

        coalesced_messages = self._coalesce_messages_by_id(normalized_messages)
        message_ids = [msg["message_id"] for msg in coalesced_messages]
        existing_result = await self.db.execute(
            select(AiMessage).where(
                AiMessage.thread_id == thread_id,
                AiMessage.message_id.in_(message_ids),
            )
        )
        existing_rows = list(existing_result.scalars().all())
        existing_by_id = {str(row.message_id): row for row in existing_rows}

        sequence_result = await self.db.execute(
            select(func.max(AiMessage.sequence_no)).where(AiMessage.thread_id == thread_id)
        )
        next_sequence = int(sequence_result.scalar() or 0) + 1
        mutated = False
        appended = 0

        for message in coalesced_messages:
            message_id = str(message["message_id"])
            existing = existing_by_id.get(message_id)
            if existing is not None:
                merged_parts = self._merge_message_parts(existing.parts, message["parts"])
                if existing.role != str(message["role"]) or existing.parts != merged_parts:
                    existing.role = str(message["role"])
                    existing.parts = merged_parts
                    mutated = True
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
            next_sequence += 1
            appended += 1
            mutated = True

        if mutated:
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

    def _coalesce_messages_by_id(self, messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
        ordered_messages: list[dict[str, Any]] = []
        index_by_id: dict[str, int] = {}

        for message in messages:
            message_id = str(message["message_id"])
            existing_index = index_by_id.get(message_id)
            if existing_index is None:
                index_by_id[message_id] = len(ordered_messages)
                ordered_messages.append(message)
                continue

            existing_message = ordered_messages[existing_index]
            ordered_messages[existing_index] = {
                **message,
                "parts": self._merge_message_parts(existing_message["parts"], message["parts"]),
            }

        return ordered_messages

    def _merge_message_parts(self, existing_parts: Any, incoming_parts: Any) -> list[Any]:
        existing_list = list(existing_parts) if isinstance(existing_parts, list) else [existing_parts]
        incoming_list = list(incoming_parts) if isinstance(incoming_parts, list) else [incoming_parts]

        merged = list(existing_list)
        tool_index_by_call_id: dict[str, int] = {}
        seen_part_signatures = {self._part_signature(part) for part in merged}

        for index, part in enumerate(merged):
            if not isinstance(part, dict):
                continue
            tool_call_id = str(part.get("toolCallId") or part.get("id") or "").strip()
            part_type = str(part.get("type") or "")
            if tool_call_id and part_type.startswith("tool-"):
                tool_index_by_call_id[tool_call_id] = index

        for part in incoming_list:
            if not isinstance(part, dict):
                signature = self._part_signature(part)
                if signature not in seen_part_signatures:
                    merged.append(part)
                    seen_part_signatures.add(signature)
                continue

            tool_call_id = str(part.get("toolCallId") or part.get("id") or "").strip()
            part_type = str(part.get("type") or "")
            if tool_call_id and part_type.startswith("tool-"):
                existing_index = tool_index_by_call_id.get(tool_call_id)
                if existing_index is not None:
                    merged[existing_index] = part
                    seen_part_signatures = {self._part_signature(item) for item in merged}
                    continue

                tool_index_by_call_id[tool_call_id] = len(merged)

            signature = self._part_signature(part)
            if signature in seen_part_signatures:
                continue

            merged.append(part)
            seen_part_signatures.add(signature)

        return merged

    def _part_signature(self, part: Any) -> Any:
        if isinstance(part, dict):
            return tuple(sorted((str(key), self._part_signature(value)) for key, value in part.items()))
        if isinstance(part, list):
            return tuple(self._part_signature(item) for item in part)
        return part

    def _to_iso(self, value: datetime) -> str:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc).isoformat()
        return value.astimezone(timezone.utc).isoformat()
