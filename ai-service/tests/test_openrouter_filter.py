import pytest

from app.stream.openrouter_filter import filter_openrouter_sse_lines


@pytest.mark.asyncio
async def test_filters_openrouter_comment_lines():
    async def _lines():
        for line in [
            ": OPENROUTER PROCESSING",
            "data: {\"ok\":true}",
            ": ping",
            "data: {\"delta\":\"x\"}",
        ]:
            yield line

    out = []
    async for line in filter_openrouter_sse_lines(_lines()):
        out.append(line)

    assert out == ["data: {\"ok\":true}", "data: {\"delta\":\"x\"}"]

