from __future__ import annotations

import logging
import json
from typing import Any, AsyncIterator

from pydantic import BaseModel, ValidationError
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
        print(f"[DEBUG] LiteLLM stream_chat started: {response}")
        thinking_parser = _ThinkingTagStreamParser()

        async for chunk in response:
            print(f"[DEBUG] LiteLLM stream chunk: {chunk}")
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
            content_text = _extract_content_text(content)

            reasoning = payload.get("reasoning_content") or payload.get("reasoning") or payload.get("thinking")
            if isinstance(reasoning, str) and reasoning:
                normalized["reasoning"] = reasoning
                thinking_parser.force_plain_text_mode()

            if content_text:
                parts = thinking_parser.consume(content_text, has_structured_reasoning="reasoning" in normalized)
                for part in parts:
                    yield part

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

        for remainder in thinking_parser.flush():
            yield remainder

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
        print(f"[DEBUG] LiteLLM summarize response: {response}")

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

    async def extract_structured_findings(
        self,
        *,
        steering_prompt: str,
        extracted_text: str,
        submission_facts: dict[str, Any],
    ) -> list[dict[str, Any]]:
        acompletion = _get_acompletion()
        response = await acompletion(
            model=self.model,
            api_key=self.api_key,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You review submission content and return only JSON. "
                        "Output a JSON array of objects with keys: rule_id, severity, reason, excerpt, remediation. "
                        "Severity must be either 'warn' or 'pass'. Never emit 'block'."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Steering prompt:\n{steering_prompt}\n\n"
                        f"Submission facts:\n{json.dumps(submission_facts, ensure_ascii=True)}\n\n"
                        f"Extracted text:\n{extracted_text}"
                    ),
                },
            ],
            stream=False,
            temperature=0,
        )
        print(f"[DEBUG] LiteLLM extract_structured_findings response: {response}")

        choices = response.get("choices") if isinstance(response, dict) else getattr(response, "choices", [])
        if not choices:
            return []
        message = choices[0].get("message") if isinstance(choices[0], dict) else getattr(choices[0], "message", None)
        if not message:
            return []
        content = message.get("content") if isinstance(message, dict) else getattr(message, "content", "")
        if isinstance(content, list):
            content = " ".join(str(c.get("text", "")) for c in content if isinstance(c, dict)).strip()
        if not content:
            return []
        try:
            parsed = json.loads(str(content))
        except json.JSONDecodeError:
            logger.warning("llm.extract_structured_findings.invalid_json")
            raise
        if not isinstance(parsed, list):
            return []
        return [item for item in parsed if isinstance(item, dict)]

    async def complete_structured(
        self,
        *,
        messages: list[dict[str, Any]],
        response_model: type[BaseModel],
        max_validation_retries: int = 1,
    ) -> BaseModel:
        acompletion = _get_acompletion()
        response_format = None
        if self._supports_native_structured_output():
            response_format = {
                "type": "json_schema",
                "json_schema": {
                    "name": response_model.__name__,
                    "strict": True,
                    "schema": response_model.model_json_schema(),
                },
            }

        base_messages = list(messages)
        if response_format is None:
            schema_text = json.dumps(response_model.model_json_schema(), ensure_ascii=True)
            base_messages = [
                *base_messages,
                {
                    "role": "system",
                    "content": (
                        "Return only JSON matching this schema exactly. "
                        f"Schema: {schema_text}"
                    ),
                },
            ]

        attempts = max_validation_retries + 1
        last_error: Exception | None = None
        current_messages = base_messages
        for attempt in range(attempts):
            request_kwargs: dict[str, Any] = {
                "model": self.model,
                "api_key": self.api_key,
                "messages": current_messages,
                "stream": False,
                "temperature": 0,
            }
            if response_format is not None:
                request_kwargs["response_format"] = response_format

            response = await acompletion(**request_kwargs)
            print(f"[DEBUG] LiteLLM complete_structured response: {response}")
            content = _extract_message_content(response)
            try:
                return response_model.model_validate_json(content)
            except ValidationError as exc:
                last_error = exc
                if attempt >= max_validation_retries:
                    raise
                current_messages = [
                    *base_messages,
                    {
                        "role": "system",
                        "content": (
                            "Corrective retry: the previous output failed schema validation. "
                            "Return only valid JSON that matches the schema exactly."
                        ),
                    },
                ]
        if last_error is not None:
            raise last_error
        raise RuntimeError("structured completion failed without a validation error")

    def _supports_native_structured_output(self) -> bool:
        model = self.model.strip().lower()
        return model.startswith("openrouter/") or model.startswith("openai/")


def _extract_message_content(response: Any) -> str:
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


def _extract_content_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        text_chunks: list[str] = []
        for part in content:
            if isinstance(part, dict) and part.get("type") == "text":
                text_chunks.append(str(part.get("text", "")))
        return "".join(text_chunks)
    return ""


class _ThinkingTagStreamParser:
    _OPEN = "<think>"
    _CLOSE = "</think>"

    def __init__(self) -> None:
        self._pending = ""
        self._in_reasoning = False

    def force_plain_text_mode(self) -> None:
        self._pending = ""
        self._in_reasoning = False

    def consume(self, chunk: str, *, has_structured_reasoning: bool) -> list[dict[str, Any]]:
        if not chunk:
            return []
        if has_structured_reasoning:
            return [{"content": chunk}]

        buffer = self._pending + chunk
        self._pending = ""
        parts: list[dict[str, Any]] = []

        while buffer:
            if self._in_reasoning:
                close_index = buffer.find(self._CLOSE)
                if close_index == -1:
                    emit_text, self._pending = _split_partial_tag_suffix(buffer, self._CLOSE)
                    if emit_text:
                        parts.append({"reasoning": emit_text})
                    break

                if close_index > 0:
                    parts.append({"reasoning": buffer[:close_index]})
                buffer = buffer[close_index + len(self._CLOSE) :]
                self._in_reasoning = False
                continue

            open_index = buffer.find(self._OPEN)
            if open_index == -1:
                emit_text, self._pending = _split_partial_tag_suffix(buffer, self._OPEN)
                if emit_text:
                    parts.append({"content": emit_text})
                break

            if open_index > 0:
                parts.append({"content": buffer[:open_index]})
            buffer = buffer[open_index + len(self._OPEN) :]
            self._in_reasoning = True

        return parts

    def flush(self) -> list[dict[str, Any]]:
        if not self._pending:
            return []

        final_text = self._pending
        self._pending = ""
        if self._in_reasoning:
            return [{"reasoning": final_text}]
        return [{"content": final_text}]


def _split_partial_tag_suffix(text: str, tag: str) -> tuple[str, str]:
    max_suffix_length = min(len(text), len(tag) - 1)
    for suffix_length in range(max_suffix_length, 0, -1):
        if text.endswith(tag[:suffix_length]):
            return text[:-suffix_length], text[-suffix_length:]
    return text, ""
