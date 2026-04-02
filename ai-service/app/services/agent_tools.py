from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any


def pick_tool_call(tool_buffers: dict[int, dict[str, Any]]) -> dict[str, Any] | None:
    for idx in sorted(tool_buffers.keys()):
        buffer = tool_buffers[idx]
        tool_name = str(buffer.get("tool_name", "")).strip()
        if not tool_name:
            continue
        args_raw = str(buffer.get("args_raw", "")).strip()
        tool_input = _safe_json_loads(args_raw)
        normalized_input = normalize_tool_input(tool_name=tool_name, tool_input=tool_input)
        return {
            "tool_call_id": str(buffer["tool_call_id"]),
            "tool_name": tool_name,
            "input": normalized_input,
        }
    return None


def normalize_tool_input(*, tool_name: str, tool_input: Any) -> dict[str, Any]:
    if not isinstance(tool_input, dict):
        return {}

    if tool_name == "query_engine":
        normalized = dict(tool_input)
        normalized["select"] = _normalize_query_engine_field_list(tool_input.get("select"))
        normalized["group_by"] = _normalize_query_engine_field_list(tool_input.get("group_by"))
        normalized["sort"] = _normalize_query_engine_sort_list(tool_input.get("sort"))
        return {key: value for key, value in normalized.items() if value is not None}

    if tool_name not in {"performAction", "navigate"}:
        return tool_input

    nested_properties = tool_input.get("properties")
    if not isinstance(nested_properties, dict):
        return tool_input

    normalized: dict[str, Any] = {}
    keys = ("action", "ref", "text", "key", "value")
    if tool_name == "navigate":
        keys = ("destinationId", "params")

    for key in keys:
        value = tool_input.get(key, nested_properties.get(key))
        if value is not None:
            normalized[key] = value

    return normalized or tool_input


def extract_resume_from_messages(
    *,
    messages: list[dict[str, Any]],
    pending_tool: dict[str, Any],
) -> dict[str, Any] | None:
    pending_call_id = str(pending_tool.get("tool_call_id", ""))
    pending_tool_name = str(pending_tool.get("tool_name", ""))
    if not pending_call_id or not pending_tool_name:
        return None

    for msg in reversed(messages):
        parts = msg.get("parts", [])
        if not isinstance(parts, list):
            continue

        for part in reversed(parts):
            if not isinstance(part, dict):
                continue
            state = part.get("state")
            if state not in {"output-available", "output-error", "timeout"}:
                continue
            part_type = str(part.get("type", ""))
            if not part_type.startswith("tool-") and part_type != "dynamic-tool":
                continue

            tool_name = str(part.get("toolName") or part_type.replace("tool-", ""))
            tool_call_id = str(part.get("toolCallId") or part.get("id") or "")
            if tool_call_id != pending_call_id:
                continue
            if tool_name and tool_name != pending_tool_name:
                continue

            return {
                "tool_call_id": pending_call_id,
                "tool_name": pending_tool_name,
                "status": state,
                "output": part.get("output", part.get("result")),
                "error_text": part.get("errorText"),
                "received_at": _iso_now(),
            }

    return None


def tool_part_from_result(*, pending_tool_call: dict[str, Any], result: dict[str, Any]) -> dict[str, Any]:
    tool_name = str(result["tool_name"])
    tool_call_id = str(result["tool_call_id"])
    status = str(result["status"])

    tool_part: dict[str, Any] = {
        "type": f"tool-{tool_name}",
        "toolCallId": tool_call_id,
        "input": pending_tool_call.get("input", {}),
        "state": status,
    }
    if status == "output-available":
        tool_part["output"] = result.get("output")
    else:
        tool_part["errorText"] = result.get("error_text")
    return tool_part


def has_fresh_user_message(messages: list[dict[str, Any]]) -> bool:
    if not messages:
        return False
    last = messages[-1]
    if last.get("role") != "user":
        return False
    parts = last.get("parts", [])
    if not isinstance(parts, list):
        return False
    for part in parts:
        if isinstance(part, dict) and part.get("type") == "text" and str(part.get("text", "")).strip():
            return True
    return False


def _normalize_query_engine_field_list(value: Any) -> list[dict[str, Any]] | None:
    if value is None:
        return None
    if not isinstance(value, list):
        return None

    normalized: list[dict[str, Any]] = []
    for item in value:
        if isinstance(item, str):
            field = item.strip()
            if field:
                normalized.append({"field": field})
            continue
        if isinstance(item, dict):
            field = str(item.get("field", "")).strip()
            if not field:
                continue
            candidate: dict[str, Any] = {"field": field}
            alias = item.get("as")
            if isinstance(alias, str) and alias.strip():
                candidate["as"] = alias.strip()
            normalized.append(candidate)

    return normalized


def _normalize_query_engine_sort_list(value: Any) -> list[dict[str, Any]] | None:
    if value is None:
        return None
    if not isinstance(value, list):
        return None

    normalized: list[dict[str, Any]] = []
    for item in value:
        if isinstance(item, str):
            field = item.strip()
            if field:
                normalized.append({"field": field})
            continue
        if isinstance(item, dict):
            field = str(item.get("field", "")).strip()
            if not field:
                continue
            candidate: dict[str, Any] = {"field": field}
            direction = str(item.get("dir", "")).strip().lower()
            if direction in {"asc", "desc"}:
                candidate["dir"] = direction
            normalized.append(candidate)

    return normalized


def _safe_json_loads(value: str) -> Any:
    if not value:
        return {}
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return {}


def _iso_now() -> str:
    return datetime.now(tz=timezone.utc).isoformat()
