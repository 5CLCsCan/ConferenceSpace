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
    uses_openai_responses: bool = False


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
            normalized = chunk if _is_normalized_delta(chunk) else _normalize_stream_chunk(chunk)
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
            strict_schema = _ensure_strict_json_schema(response_model.model_json_schema())
            response_format = {
                "type": "json_schema",
                "json_schema": {
                    "name": response_model.__name__,
                    "strict": True,
                    "schema": strict_schema,
                },
            }

        base_messages = list(messages)
        if response_format is None:
            schema_text = json.dumps(
                _ensure_strict_json_schema(response_model.model_json_schema()),
                ensure_ascii=True,
            )
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
        last_error: Exception | None = None

        for index, provider in enumerate(self._providers):
            if provider.uses_openai_responses:
                try:
                    return await self._aresponses_create(
                        messages=messages,
                        stream=False,
                        tools=tools,
                        temperature=temperature,
                        response_format=response_format,
                    )
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
                    continue

            acompletion = _get_acompletion()
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
        last_error: Exception | None = None

        for index, provider in enumerate(self._providers):
            if provider.uses_openai_responses:
                emitted_any_chunk = False
                try:
                    async for chunk in self._astream_openai_responses(messages=messages, tools=tools):
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
                    continue

            acompletion = _get_acompletion()
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

    async def _astream_openai_responses(
        self,
        *,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
    ) -> AsyncIterator[dict[str, Any]]:
        stream = await self._aresponses_create(
            messages=messages,
            stream=True,
            tools=tools,
        )
        async for event in stream:
            normalized = _normalize_response_stream_event(event)
            if normalized:
                yield normalized

    async def _aresponses_create(
        self,
        *,
        messages: list[dict[str, Any]],
        stream: bool,
        tools: list[dict[str, Any]] | None = None,
        temperature: int | float | None = None,
        response_format: dict[str, Any] | None = None,
    ) -> Any:
        if not self.openai_api_key or not self.openai_model:
            raise RuntimeError("OpenAI Responses API requires OPENAI_API_KEY and OPENAI_MODEL")

        async_openai = _get_async_openai()
        client = async_openai(
            api_key=self.openai_api_key,
            base_url=self.openai_base_url or None,
            timeout=self.request_timeout_seconds,
            max_retries=0,
        )
        request_kwargs: dict[str, Any] = {
            "model": self.openai_model,
            "input": _to_openai_response_input(messages),
            "stream": stream,
        }
        converted_tools = _to_openai_response_tools(tools)
        if converted_tools:
            request_kwargs["tools"] = converted_tools
        if temperature is not None:
            request_kwargs["temperature"] = temperature
        if response_format is not None:
            request_kwargs["text"] = {"format": _to_openai_response_text_format(response_format)}
        try:
            return await client.responses.create(**request_kwargs)
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "llm.openai_responses_failed model=%s stream=%s input=%s tools=%s error=%s body=%s",
                self.openai_model,
                stream,
                _summarize_response_input(request_kwargs.get("input")),
                _summarize_response_tools(request_kwargs.get("tools")),
                exc.__class__.__name__,
                _extract_error_body(exc),
            )
            raise

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
                    uses_openai_responses=True,
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
    output_text = _get_value(response, "output_text")
    if isinstance(output_text, str):
        return output_text.strip()

    response_output = _get_value(response, "output", [])
    if isinstance(response_output, list):
        text = _extract_response_output_text(response_output).strip()
        if text:
            return text

    choices = _get_value(response, "choices", [])
    if not choices:
        return ""
    message = _get_value(choices[0], "message")
    if not message:
        return ""
    return _extract_content_text(_get_value(message, "content", "")).strip()


def _to_openai_response_input(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    converted: list[dict[str, Any]] = []
    seen_function_call_ids: set[str] = set()
    for message in messages:
        if message.get("role") == "assistant":
            response_tool_calls = _assistant_message_to_response_function_calls(message)
            if response_tool_calls:
                converted.extend(response_tool_calls)
                seen_function_call_ids.update(str(call.get("call_id") or "") for call in response_tool_calls)
                continue

        if message.get("role") == "tool":
            call_id = str(message.get("tool_call_id") or "").strip()
            if call_id:
                if call_id not in seen_function_call_ids:
                    synthetic_call = _tool_message_to_response_function_call(message)
                    if synthetic_call:
                        converted.append(synthetic_call)
                        seen_function_call_ids.add(call_id)
                converted.append(
                    {
                        "type": "function_call_output",
                        "call_id": call_id,
                        "output": _extract_content_text(message.get("content", "")),
                    }
                )
                continue

            converted.append(
                {
                    "role": "assistant",
                    "content": f"Tool output: {_extract_content_text(message.get('content', ''))}",
                }
            )
            continue

        converted.append(message)
    return converted


def _tool_message_to_response_function_call(message: dict[str, Any]) -> dict[str, Any]:
    call_id = str(message.get("tool_call_id") or "").strip()
    name = str(message.get("name") or "").strip()
    if not call_id or not name:
        return {}

    tool_input = message.get("input")
    return {
        "type": "function_call",
        "call_id": call_id,
        "name": name,
        "arguments": json.dumps(tool_input if isinstance(tool_input, dict) else {}, ensure_ascii=True),
    }


def _assistant_message_to_response_function_calls(message: dict[str, Any]) -> list[dict[str, Any]]:
    tool_calls = message.get("tool_calls")
    if not isinstance(tool_calls, list):
        return []

    calls: list[dict[str, Any]] = []
    for tool_call in tool_calls:
        payload = _to_dict(tool_call)
        if payload.get("type") != "function":
            continue

        function = _to_dict(payload.get("function"))
        call_id = str(payload.get("id") or "").strip()
        name = str(function.get("name") or "").strip()
        if not call_id or not name:
            continue

        calls.append(
            {
                "type": "function_call",
                "call_id": call_id,
                "name": name,
                "arguments": str(function.get("arguments") or ""),
            }
        )
    return calls


def _summarize_response_input(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return [{"type": type(value).__name__}]

    summary: list[dict[str, Any]] = []
    for item in value:
        payload = _to_dict(item)
        item_summary: dict[str, Any] = {
            "type": payload.get("type"),
            "role": payload.get("role"),
        }
        if payload.get("type") in {"function_call", "function_call_output"}:
            item_summary["call_id"] = payload.get("call_id")
            item_summary["name"] = payload.get("name")
            item_summary["arguments_len"] = len(str(payload.get("arguments") or ""))
            item_summary["output_len"] = len(str(payload.get("output") or ""))
        if isinstance(payload.get("tool_calls"), list):
            item_summary["tool_call_count"] = len(payload["tool_calls"])
        summary.append({key: val for key, val in item_summary.items() if val is not None})
    return summary


def _summarize_response_tools(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    names: list[str] = []
    for tool in value:
        payload = _to_dict(tool)
        name = str(payload.get("name") or payload.get("type") or "").strip()
        if name:
            names.append(name)
    return names


def _extract_error_body(exc: Exception) -> str:
    response = getattr(exc, "response", None)
    if response is not None:
        text = str(getattr(response, "text", "") or "")
        if text:
            return text[:2000]

    body = getattr(exc, "body", None)
    if body:
        return str(body)[:2000]

    message = str(exc)
    return message[:2000]


def _get_acompletion():
    try:
        from litellm import acompletion
    except ModuleNotFoundError as exc:
        raise RuntimeError("litellm is not installed. Run `poetry install` in ai-service.") from exc
    return acompletion


def _get_async_openai():
    try:
        from openai import AsyncOpenAI
    except ModuleNotFoundError as exc:
        raise RuntimeError("openai is not installed. Run `poetry add openai` in ai-service.") from exc
    return AsyncOpenAI


def _extract_content_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(_extract_text_part(part) for part in content)
    return ""


def _ensure_strict_json_schema(schema: Any) -> Any:
    if isinstance(schema, dict):
        normalized = {key: _ensure_strict_json_schema(value) for key, value in schema.items()}
        if normalized.get("type") == "object" or "properties" in normalized:
            normalized.setdefault("additionalProperties", False)
            properties = normalized.get("properties")
            if isinstance(properties, dict):
                normalized["required"] = list(properties.keys())
        return normalized
    if isinstance(schema, list):
        return [_ensure_strict_json_schema(item) for item in schema]
    return schema


def _is_normalized_delta(chunk: Any) -> bool:
    if not isinstance(chunk, dict):
        return False
    return any(key in chunk for key in ("content", "reasoning", "tool_calls"))


def _normalize_response_stream_event(event: Any) -> dict[str, Any]:
    event_type = str(_get_value(event, "type", ""))
    if event_type in {"response.output_text.delta", "response.text_delta"}:
        delta = str(_get_value(event, "delta", ""))
        return {"content": delta} if delta else {}
    if event_type in {"response.reasoning_text.delta", "response.reasoning_text_delta"}:
        delta = str(_get_value(event, "delta", ""))
        return {"reasoning": delta} if delta else {}
    if event_type in {"response.function_call_arguments.delta", "response.function_call_arguments_delta"}:
        item_id = str(_get_value(event, "item_id", ""))
        output_index = int(_get_value(event, "output_index", 0) or 0)
        delta = str(_get_value(event, "delta", ""))
        return {
            "tool_calls": [
                {
                    "index": output_index,
                    "id": item_id,
                    "function": {"arguments": delta},
                }
            ]
        }
    if event_type in {"response.output_item.added", "response.output_item_added"}:
        item = _to_dict(_get_value(event, "item"))
        if item.get("type") != "function_call":
            return {}
        output_index = int(_get_value(event, "output_index", 0) or 0)
        return {
            "tool_calls": [
                {
                    "index": output_index,
                    "id": item.get("call_id") or item.get("id") or "",
                    "function": {"name": item.get("name") or "", "arguments": ""},
                }
            ]
        }
    return {}


def _extract_response_output_text(output: list[Any]) -> str:
    chunks: list[str] = []
    for item in output:
        payload = _to_dict(item)
        content = payload.get("content")
        if not isinstance(content, list):
            continue
        for part in content:
            part_payload = _to_dict(part)
            if part_payload.get("type") in {"output_text", "text"}:
                chunks.append(str(part_payload.get("text", "")))
    return "".join(chunks)


def _to_openai_response_tools(tools: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    if not tools:
        return []

    converted: list[dict[str, Any]] = []
    for tool in tools:
        if not isinstance(tool, dict):
            continue
        if tool.get("type") != "function":
            converted.append(tool)
            continue

        function = _to_dict(tool.get("function"))
        name = str(function.get("name") or "").strip()
        if not name:
            continue
        converted.append(
            {
                "type": "function",
                "name": name,
                "description": function.get("description", ""),
                "parameters": function.get("parameters", {"type": "object", "properties": {}}),
            }
        )
    return converted


def _to_openai_response_text_format(response_format: dict[str, Any]) -> dict[str, Any]:
    if response_format.get("type") != "json_schema":
        return response_format

    json_schema = _to_dict(response_format.get("json_schema"))
    if not json_schema:
        return response_format
    return {
        "type": "json_schema",
        "name": json_schema.get("name", "response"),
        "schema": json_schema.get("schema", {}),
        "strict": json_schema.get("strict", True),
    }


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
