from __future__ import annotations

import json
import logging
from typing import Any, AsyncIterator

from app.stream.openrouter_filter import is_sse_comment_line

logger = logging.getLogger(__name__)

class LLMClient:
    def __init__(self, *, api_key: str, model: str) -> None:
        self.api_key = api_key
        self.model = _normalize_model_name(model)

    async def stream_chat(
        self,
        *,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
    ) -> AsyncIterator[dict[str, Any]]:
        acompletion = _get_acompletion()
        logger.info("llm.stream_chat.start model=%s messages=%s tools=%s", self.model, len(messages), len(tools or []))
        response = await acompletion(
            model=self.model,
            api_key=self.api_key,
            messages=messages,
            tools=tools,
            stream=True,
        )
        chunk_count = 0

        async for chunk in response:
            chunk_count += 1
            if isinstance(chunk, str):
                if is_sse_comment_line(chunk.strip()):
                    continue
                continue

            choices = getattr(chunk, "choices", None)
            if not choices:
                continue

            delta = getattr(choices[0], "delta", None)
            if delta is None:
                continue

            if hasattr(delta, "model_dump"):
                payload = delta.model_dump(exclude_none=True)
            elif isinstance(delta, dict):
                payload = {k: v for k, v in delta.items() if v is not None}
            else:
                payload = {}

            if payload:
                yield payload

        logger.info("llm.stream_chat.done model=%s chunks=%s", self.model, chunk_count)

    async def summarize(self, *, prompt: str) -> str:
        acompletion = _get_acompletion()
        logger.info("llm.summarize.start model=%s prompt_len=%s", self.model, len(prompt))
        response = await acompletion(
            model=self.model,
            api_key=self.api_key,
            messages=[
                {
                    "role": "system",
                    "content": "You summarize conversation history accurately and compactly.",
                },
                {"role": "user", "content": prompt},
            ],
            stream=False,
            temperature=0,
        )

        choices = response.get("choices") if isinstance(response, dict) else getattr(response, "choices", [])
        if not choices:
            return ""
        message = choices[0].get("message") if isinstance(choices[0], dict) else getattr(choices[0], "message", None)
        if not message:
            return ""
        content = message.get("content") if isinstance(message, dict) else getattr(message, "content", "")
        if isinstance(content, list):
            summary = " ".join(str(c.get("text", "")) for c in content if isinstance(c, dict)).strip()
            logger.info("llm.summarize.done summary_len=%s", len(summary))
            return summary
        summary = str(content or "").strip()
        logger.info("llm.summarize.done summary_len=%s", len(summary))
        return summary


def _normalize_model_name(model: str) -> str:
    if model.startswith("openrouter/"):
        return model
    return f"openrouter/{model}"


def _get_acompletion():
    try:
        from litellm import acompletion
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            "litellm is not installed. Run `poetry install` in ai-service before starting the service."
        ) from exc
    return acompletion
