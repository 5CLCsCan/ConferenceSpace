from __future__ import annotations

import logging
from typing import Any, AsyncIterator

logger = logging.getLogger(__name__)


class LLMClient:
    def __init__(self, *, api_key: str, model: str) -> None:
        self.api_key = api_key
        self.model = model

    async def stream_chat(
        self,
        *,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
    ) -> AsyncIterator[dict[str, Any]]:
        acompletion = _get_acompletion()
        response = await acompletion(
            model=self.model,
            api_key=self.api_key,
            messages=messages,
            tools=tools,
            stream=True,
        )

        async for chunk in response:
            if isinstance(chunk, str):
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

            normalized: dict[str, Any] = {}
            content = payload.get("content")
            if isinstance(content, str) and content:
                normalized["content"] = content
            elif isinstance(content, list):
                text_chunks: list[str] = []
                for part in content:
                    if isinstance(part, dict) and part.get("type") == "text":
                        text_chunks.append(str(part.get("text", "")))
                if text_chunks:
                    normalized["content"] = "".join(text_chunks)

            reasoning = payload.get("reasoning_content") or payload.get("reasoning") or payload.get("thinking")
            if isinstance(reasoning, str) and reasoning:
                normalized["reasoning"] = reasoning

            tool_calls = payload.get("tool_calls")
            if isinstance(tool_calls, list) and tool_calls:
                normalized_calls: list[dict[str, Any]] = []
                for item in tool_calls:
                    if hasattr(item, "model_dump"):
                        call = item.model_dump(exclude_none=True)
                    elif isinstance(item, dict):
                        call = dict(item)
                    else:
                        continue

                    function = call.get("function")
                    if hasattr(function, "model_dump"):
                        call["function"] = function.model_dump(exclude_none=True)
                    normalized_calls.append(call)

                if normalized_calls:
                    normalized["tool_calls"] = normalized_calls

            if normalized:
                yield normalized

    async def summarize(self, *, prompt: str) -> str:
        acompletion = _get_acompletion()
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
            return " ".join(str(c.get("text", "")) for c in content if isinstance(c, dict)).strip()
        return str(content or "").strip()


def _get_acompletion():
    try:
        from litellm import acompletion
    except ModuleNotFoundError as exc:
        raise RuntimeError("litellm is not installed. Run `poetry install` in ai-service.") from exc
    return acompletion
