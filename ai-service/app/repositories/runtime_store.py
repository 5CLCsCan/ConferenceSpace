from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import orjson
from redis.asyncio import Redis


def _iso_now() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


class RuntimeStore:
    def __init__(
        self,
        redis: Redis,
        *,
        session_ttl_minutes: int,
        tool_result_timeout_seconds: int,
    ) -> None:
        self.redis = redis
        self.session_ttl_seconds = session_ttl_minutes * 60
        self.tool_result_timeout_seconds = tool_result_timeout_seconds

    @staticmethod
    def state_key(thread_id: str) -> str:
        return f"ai:session:{thread_id}:state"

    @staticmethod
    def pending_tool_key(thread_id: str) -> str:
        return f"ai:session:{thread_id}:pending_tool"

    @staticmethod
    def tool_result_key(thread_id: str, tool_call_id: str) -> str:
        return f"ai:session:{thread_id}:tool_result:{tool_call_id}"

    async def set_state(self, thread_id: str, state: dict[str, Any]) -> None:
        await self.redis.set(
            self.state_key(thread_id),
            orjson.dumps(state),
            ex=self.session_ttl_seconds,
        )

    async def get_state(self, thread_id: str) -> dict[str, Any] | None:
        raw = await self.redis.get(self.state_key(thread_id))
        if not raw:
            return None
        await self.redis.expire(self.state_key(thread_id), self.session_ttl_seconds)
        return orjson.loads(raw)

    async def delete_state(self, thread_id: str) -> None:
        await self.redis.delete(self.state_key(thread_id))

    async def set_pending_tool(self, thread_id: str, pending_tool: dict[str, Any]) -> None:
        await self.redis.set(
            self.pending_tool_key(thread_id),
            orjson.dumps(pending_tool),
            ex=self.tool_result_timeout_seconds,
        )

    async def get_pending_tool(self, thread_id: str) -> dict[str, Any] | None:
        raw = await self.redis.get(self.pending_tool_key(thread_id))
        if not raw:
            return None
        return orjson.loads(raw)

    async def clear_pending_tool(self, thread_id: str) -> None:
        await self.redis.delete(self.pending_tool_key(thread_id))

    async def set_tool_result(
        self,
        thread_id: str,
        tool_call_id: str,
        payload: dict[str, Any],
    ) -> None:
        payload = dict(payload)
        payload.setdefault("received_at", _iso_now())
        await self.redis.set(
            self.tool_result_key(thread_id, tool_call_id),
            orjson.dumps(payload),
            ex=300,
        )

    async def pop_tool_result(self, thread_id: str, tool_call_id: str) -> dict[str, Any] | None:
        key = self.tool_result_key(thread_id, tool_call_id)
        async with self.redis.pipeline(transaction=True) as pipe:
            pipe.get(key)
            pipe.delete(key)
            raw, _ = await pipe.execute()
        if not raw:
            return None
        return orjson.loads(raw)

    async def expire_session_runtime(self, thread_id: str) -> None:
        now = datetime.now(tz=timezone.utc)
        expires = now + timedelta(seconds=self.session_ttl_seconds)
        await self.redis.expire(self.state_key(thread_id), self.session_ttl_seconds)
        return expires

