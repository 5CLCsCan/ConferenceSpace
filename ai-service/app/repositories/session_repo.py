from __future__ import annotations

import base64
import json
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import and_, delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AiSession


class SessionRepository:
    _DEFAULT_TITLE = "New Conversation"

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

    async def ensure_session(
        self,
        thread_id: str,
        user_id: int,
        user_email: str,
        model: str,
        trace_id: str | None = None,
        initial_title: str | None = None,
    ) -> AiSession:
        title = self._normalize_title(initial_title)
        existing = await self.get_by_thread_id(thread_id)
        if existing:
            if existing.user_id != user_id:
                raise PermissionError("thread belongs to a different user")
            existing.last_activity_at = datetime.now(tz=timezone.utc)
            existing.model = model
            if trace_id:
                existing.trace_id = trace_id
            if existing.title == self._DEFAULT_TITLE and title != self._DEFAULT_TITLE:
                existing.title = title
            await self.db.flush()
            return existing

        row = AiSession(
            thread_id=thread_id,
            user_id=user_id,
            user_email=user_email,
            title=title,
            model=model,
            trace_id=trace_id or str(uuid4()),
            status="active",
            last_activity_at=datetime.now(tz=timezone.utc),
        )
        self.db.add(row)
        await self.db.flush()
        return row

    async def list_owned_sessions(
        self,
        user_id: int,
        *,
        limit: int,
        cursor: str | None = None,
    ) -> tuple[list[AiSession], str | None]:
        query = select(AiSession).where(AiSession.user_id == user_id)
        if cursor:
            cursor_last_activity, cursor_thread_id = self._decode_cursor(cursor)
            query = query.where(
                or_(
                    AiSession.last_activity_at < cursor_last_activity,
                    and_(
                        AiSession.last_activity_at == cursor_last_activity,
                        AiSession.thread_id < cursor_thread_id,
                    ),
                )
            )

        query = query.order_by(AiSession.last_activity_at.desc(), AiSession.thread_id.desc()).limit(limit + 1)
        result = await self.db.execute(query)
        rows = list(result.scalars().all())

        has_more = len(rows) > limit
        page_rows = rows[:limit]
        if not has_more or not page_rows:
            return page_rows, None

        last = page_rows[-1]
        return page_rows, self._encode_cursor(last.last_activity_at, last.thread_id)

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

    def _normalize_title(self, title: str | None) -> str:
        if not title:
            return self._DEFAULT_TITLE
        normalized = " ".join(title.split()).strip()
        return normalized[:80] if normalized else self._DEFAULT_TITLE

    def _encode_cursor(self, last_activity_at: datetime, thread_id: str) -> str:
        timestamp = (
            last_activity_at.replace(tzinfo=timezone.utc).isoformat()
            if last_activity_at.tzinfo is None
            else last_activity_at.astimezone(timezone.utc).isoformat()
        )
        payload = {
            "last_activity_at": timestamp,
            "thread_id": thread_id,
        }
        encoded = base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8")
        return encoded.rstrip("=")

    def _decode_cursor(self, cursor: str) -> tuple[datetime, str]:
        if not cursor.strip():
            raise ValueError("cursor is empty")

        padding = "=" * (-len(cursor) % 4)
        try:
            raw = base64.urlsafe_b64decode(cursor + padding).decode("utf-8")
            payload = json.loads(raw)
            last_activity_at = datetime.fromisoformat(str(payload["last_activity_at"]))
            if last_activity_at.tzinfo is None:
                last_activity_at = last_activity_at.replace(tzinfo=timezone.utc)
            thread_id = str(payload["thread_id"]).strip()
        except Exception as exc:  # noqa: BLE001
            raise ValueError("invalid cursor") from exc

        if not thread_id:
            raise ValueError("invalid cursor")
        return last_activity_at, thread_id
