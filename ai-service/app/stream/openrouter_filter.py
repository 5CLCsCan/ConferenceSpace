from __future__ import annotations

from typing import AsyncIterator


def is_sse_comment_line(line: str) -> bool:
    # OpenRouter sends keepalive comments like ": OPENROUTER PROCESSING".
    return line.startswith(":")


async def filter_openrouter_sse_lines(lines: AsyncIterator[str]) -> AsyncIterator[str]:
    async for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if is_sse_comment_line(stripped):
            continue
        yield stripped

