from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import orjson
from redis.asyncio import Redis


def _iso_now() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


class RuntimeStore:
    def __init__(self, redis: Redis, *, tool_result_timeout_seconds: int) -> None:
        self.redis = redis
        self.tool_result_timeout_seconds = tool_result_timeout_seconds

    @staticmethod
    def tool_result_key(thread_id: str, tool_call_id: str) -> str:
        return f"ai:v1:tool_result:{thread_id}:{tool_call_id}"

    @staticmethod
    def rate_limit_key(scope: str, identity: str, minute_bucket: str) -> str:
        return f"ai:v1:ratelimit:{scope}:{identity}:{minute_bucket}"

    async def set_tool_result(self, thread_id: str, tool_call_id: str, payload: dict[str, Any]) -> None:
        payload = dict(payload)
        payload.setdefault("received_at", _iso_now())
        await self.redis.set(
            self.tool_result_key(thread_id, tool_call_id),
            orjson.dumps(payload),
            ex=self.tool_result_timeout_seconds,
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

    async def clear_tool_result(self, thread_id: str, tool_call_id: str) -> None:
        await self.redis.delete(self.tool_result_key(thread_id, tool_call_id))

    async def check_rate_limit(self, *, scope: str, identity: str, limit: int) -> tuple[bool, int]:
        now = datetime.now(tz=timezone.utc)
        minute_bucket = now.strftime("%Y%m%d%H%M")
        key = self.rate_limit_key(scope, identity, minute_bucket)
        current = await self.redis.incr(key)
        if current == 1:
            await self.redis.expire(key, 65)
        return current <= limit, int(current)