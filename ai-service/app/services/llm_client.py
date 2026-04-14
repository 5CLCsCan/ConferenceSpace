from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Any, AsyncIterator

from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)
_DEFAULT_REQUEST_TIMEOUT_SECONDS = 60.0


@dataclass(frozen=True, slots=True)
class _ProviderConfig:
    name: str
    litellm_model: str
    public_model: str
    api_key: str
    api_base: str | None = None


class LLMClient:
    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        openai_api_key: str = "",
        openai_base_url: str = "",
        openai_model: str = "",
        request_timeout_seconds: float = _DEFAULT_REQUEST_TIMEOUT_SECONDS,
    ) -> None:
        self.api_key = api_key.strip()
        self.model = model.strip()
        self.openai_api_key = openai_api_key.strip()
        self.openai_base_url = openai_base_url.strip().rstrip("/")
        self.openai_model = openai_model.strip()
        self.request_timeout_seconds = float(request_timeout_seconds)
        self._providers = self._build_provider_configs()

    @property
    def primary_model(self) -> str:
        return self._providers[0].public_model

    async def stream_chat(
        self,
        *,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
    ) -> AsyncIterator[dict[str, Any]]:
        thinking_parser = _ThinkingTagStreamParser()

        async for chunk in self._astream_completion(messages=messages, tools=tools):
            normalized = _normalize_stream_chunk(chunk)
            if not normalized:
                continue

            reasoning = normalized.get("reasoning")
            if isinstance(reasoning, str) and reasoning:
                thinking_parser.force_plain_text_mode()

            content_text = _extract_content_text(normalized.get("content"))
            if content_text:
                parts = thinking_parser.consume(
                    content_text,
                    has_structured_reasoning=isinstance(reasoning, str) and bool(reasoning),
                )
                for part in parts:
                    yield part

            payload: dict[str, Any] = {}
            if isinstance(reasoning, str) and reasoning:
                payload["reasoning"] = reasoning
            tool_calls = normalized.get("tool_calls")
            if tool_calls:
                payload["tool_calls"] = tool_calls
            if payload:
                yield payload

        for remainder in thinking_parser.flush():
            yield remainder

    async def summarize(self, *, prompt: str) -> str:
        response = await self._acompletion(
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
        return _extract_message_content(response)

    async def complete_json(
        self,
        *,
        messages: list[dict[str, Any]],
        max_validation_retries: int = 0,
    ) -> Any:
        attempts = max_validation_retries + 1
        current_messages = list(messages)
        last_error: json.JSONDecodeError | None = None

        for attempt in range(attempts):
            response = await self._acompletion(
                messages=current_messages,
                stream=False,
                temperature=0,
            )
            content = _extract_message_content(response)
            if not content:
                return None
            try:
                return json.loads(str(content))
            except json.JSONDecodeError as exc:
                logger.warning("llm.complete_json.invalid_json")
                last_error = exc
                if attempt >= max_validation_retries:
                    raise
                current_messages = [
                    *messages,
                    {
                        "role": "system",
                        "content": "Corrective retry: return valid JSON only.",
                    },
                ]

        if last_error is not None:
            raise last_error
        raise RuntimeError("json completion failed without a validation error")

    async def complete_structured(
        self,
        *,
        messages: list[dict[str, Any]],
        response_model: type[BaseModel],
        max_validation_retries: int = 1,
    ) -> BaseModel:
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
                "messages": current_messages,
                "stream": False,
                "temperature": 0,
            }
            if response_format is not None:
                request_kwargs["response_format"] = response_format

            response = await self._acompletion(**request_kwargs)
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
        return all(
            provider.litellm_model.lower().startswith(("openrouter/", "openai/"))
            for provider in self._providers
        )

    async def _acompletion(
        self,
        *,
        messages: list[dict[str, Any]],
        stream: bool,
        tools: list[dict[str, Any]] | None = None,
        temperature: int | float | None = None,
        response_format: dict[str, Any] | None = None,
    ) -> Any:
        acompletion = _get_acompletion()
        last_error: Exception | None = None

        for index, provider in enumerate(self._providers):
            request_kwargs = self._build_request_kwargs(
                provider=provider,
                messages=messages,
                stream=stream,
                tools=tools,
                temperature=temperature,
                response_format=response_format,
            )
            try:
                return await acompletion(**request_kwargs)
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                if index >= len(self._providers) - 1:
                    raise
                logger.warning(
                    "llm.provider_request_failed provider=%s model=%s fallback_provider=%s",
                    provider.name,
                    provider.public_model,
                    self._providers[index + 1].public_model,
                )

        if last_error is not None:
            raise last_error
        raise RuntimeError("llm completion failed without attempting a provider")

    async def _astream_completion(
        self,
        *,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        temperature: int | float | None = None,
        response_format: dict[str, Any] | None = None,
    ) -> AsyncIterator[Any]:
        acompletion = _get_acompletion()
        last_error: Exception | None = None

        for index, provider in enumerate(self._providers):
            request_kwargs = self._build_request_kwargs(
                provider=provider,
                messages=messages,
                stream=True,
                tools=tools,
                temperature=temperature,
                response_format=response_format,
            )
            emitted_any_chunk = False
            try:
                response = await acompletion(**request_kwargs)
                async for chunk in response:
                    emitted_any_chunk = True
                    yield chunk
                return
            except Exception as exc:  # noqa: BLE001
                if emitted_any_chunk:
                    raise
                last_error = exc
                if index >= len(self._providers) - 1:
                    raise
                logger.warning(
                    "llm.provider_stream_failed provider=%s model=%s fallback_provider=%s",
                    provider.name,
                    provider.public_model,
                    self._providers[index + 1].public_model,
                )

        if last_error is not None:
            raise last_error
        raise RuntimeError("llm stream failed without attempting a provider")

    def _build_provider_configs(self) -> list[_ProviderConfig]:
        providers: list[_ProviderConfig] = []

        if self.openai_api_key and self.openai_base_url and self.openai_model:
            providers.append(
                _ProviderConfig(
                    name="openai",
                    litellm_model=f"openai/{self.openai_model}",
                    public_model=self.openai_model,
                    api_key=self.openai_api_key,
                    api_base=self.openai_base_url,
                )
            )

        if self.api_key and self.model:
            providers.append(
                _ProviderConfig(
                    name="openrouter",
                    litellm_model=self.model,
                    public_model=self.model,
                    api_key=self.api_key,
                )
            )

        if not providers:
            raise ValueError("LLMClient requires at least one configured provider")

        return providers

    def _build_request_kwargs(
        self,
        *,
        provider: _ProviderConfig,
        messages: list[dict[str, Any]],
        stream: bool,
        tools: list[dict[str, Any]] | None,
        temperature: int | float | None,
        response_format: dict[str, Any] | None,
    ) -> dict[str, Any]:
        request_kwargs: dict[str, Any] = {
            "model": provider.litellm_model,
            "api_key": provider.api_key,
            "messages": messages,
            "stream": stream,
            "timeout": self.request_timeout_seconds,
            "num_retries": 0,
        }
        if provider.api_base:
            request_kwargs["api_base"] = provider.api_base
        if stream:
            request_kwargs["stream_timeout"] = self.request_timeout_seconds
        if tools is not None:
            request_kwargs["tools"] = tools
        if temperature is not None:
            request_kwargs["temperature"] = temperature
        if response_format is not None:
            request_kwargs["response_format"] = response_format
        return request_kwargs



def _extract_message_content(response: Any) -> str:
    choices = _get_value(response, "choices", [])
    if not choices:
        return ""
    message = _get_value(choices[0], "message")
    if not message:
        return ""
    return _extract_content_text(_get_value(message, "content", "")).strip()


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
        return "".join(_extract_text_part(part) for part in content)
    return ""


def _extract_text_part(part: Any) -> str:
    if _get_value(part, "type") != "text":
        return ""
    return str(_get_value(part, "text", ""))


def _normalize_stream_chunk(chunk: Any) -> dict[str, Any]:
    if isinstance(chunk, str):
        return {}

    choices = _get_value(chunk, "choices", [])
    if not choices:
        return {}

    delta = _get_value(choices[0], "delta")
    if delta is None:
        return {}

    payload = _to_dict(delta)
    if not payload:
        return {}

    normalized: dict[str, Any] = {}
    content = payload.get("content")
    if content is not None:
        normalized["content"] = content

    reasoning = payload.get("reasoning_content") or payload.get("reasoning") or payload.get("thinking")
    if isinstance(reasoning, str) and reasoning:
        normalized["reasoning"] = reasoning

    tool_calls = _normalize_tool_calls(payload.get("tool_calls"))
    if tool_calls:
        normalized["tool_calls"] = tool_calls

    return normalized


def _normalize_tool_calls(tool_calls: Any) -> list[dict[str, Any]]:
    if not isinstance(tool_calls, list):
        return []

    normalized_calls: list[dict[str, Any]] = []
    for item in tool_calls:
        call = _to_dict(item)
        if not call:
            continue
        function = _to_dict(call.get("function"))
        if function:
            call["function"] = function
        normalized_calls.append(call)
    return normalized_calls


def _to_dict(value: Any) -> dict[str, Any]:
    if hasattr(value, "model_dump"):
        dumped = value.model_dump(exclude_none=True)
        if isinstance(dumped, dict):
            return dumped
        return {}
    if isinstance(value, dict):
        return {key: item for key, item in value.items() if item is not None}
    return {}


def _get_value(value: Any, key: str, default: Any = None) -> Any:
    if isinstance(value, dict):
        return value.get(key, default)
    return getattr(value, key, default)


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
