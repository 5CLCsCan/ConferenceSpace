from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class CheckpointResources:
    redis_checkpointer: Any | None = None
    postgres_checkpointer: Any | None = None
    entered_contexts: list[Any] = field(default_factory=list)

    async def setup(self) -> None:
        for saver in (self.redis_checkpointer, self.postgres_checkpointer):
            if saver is not None and hasattr(saver, "setup"):
                await saver.setup()

    async def close(self) -> None:
        # Exit context managers created by from_conn_string(...) when applicable.
        for ctx in reversed(self.entered_contexts):
            if hasattr(ctx, "__aexit__"):
                await ctx.__aexit__(None, None, None)

        for saver in (self.redis_checkpointer, self.postgres_checkpointer):
            if saver is not None and hasattr(saver, "aclose"):
                await saver.aclose()
            elif saver is not None and hasattr(saver, "close"):
                saver.close()


async def create_checkpoint_resources(
    *,
    redis_url: str,
    postgres_dsn: str,
    session_ttl_minutes: int,
) -> CheckpointResources:
    entered_contexts: list[Any] = []

    redis_saver = await _create_redis_saver(
        redis_url=redis_url,
        ttl_minutes=session_ttl_minutes,
        entered_contexts=entered_contexts,
    )
    postgres_saver = await _create_postgres_saver(
        postgres_dsn=postgres_dsn,
        entered_contexts=entered_contexts,
    )

    resources = CheckpointResources(
        redis_checkpointer=redis_saver,
        postgres_checkpointer=postgres_saver,
        entered_contexts=entered_contexts,
    )
    await resources.setup()
    logger.info(
        "checkpoint.setup redis=%s postgres=%s",
        type(redis_saver).__name__ if redis_saver else "none",
        type(postgres_saver).__name__ if postgres_saver else "none",
    )
    return resources


async def _create_redis_saver(
    *,
    redis_url: str,
    ttl_minutes: int,
    entered_contexts: list[Any],
) -> Any | None:
    try:
        from langgraph.checkpoint.redis import AsyncRedisSaver

        saver_or_ctx = AsyncRedisSaver.from_conn_string(redis_url)
        saver = await _enter_if_context_manager(saver_or_ctx, entered_contexts)
        if hasattr(saver, "configure_ttl"):
            await saver.configure_ttl(default_ttl=ttl_minutes, refresh_on_read=True)
        return saver
    except Exception as exc:  # noqa: BLE001
        logger.warning("checkpoint.redis_unavailable error=%s", str(exc))
        return None


async def _create_postgres_saver(
    *,
    postgres_dsn: str,
    entered_contexts: list[Any],
) -> Any | None:
    try:
        from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

        saver_or_ctx = AsyncPostgresSaver.from_conn_string(postgres_dsn)
        return await _enter_if_context_manager(saver_or_ctx, entered_contexts)
    except Exception as exc:  # noqa: BLE001
        logger.warning("checkpoint.postgres_unavailable error=%s", str(exc))
        return None


async def _enter_if_context_manager(candidate: Any, entered_contexts: list[Any]) -> Any:
    if hasattr(candidate, "__aenter__") and hasattr(candidate, "__aexit__"):
        entered = await candidate.__aenter__()
        entered_contexts.append(candidate)
        return entered
    return candidate

