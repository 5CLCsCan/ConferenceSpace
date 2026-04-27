from __future__ import annotations

import base64
import json
from typing import Any


def model_context_window(model_name: str) -> int:
    if "gemini-2.5" in model_name or "gemini-3" in model_name:
        return 1_000_000
    return 128_000


def context_message_limit(keep_recent_exchanges: int) -> int:
    # One exchange is user + assistant, but tool interactions add extra messages.
    return max(20, int(keep_recent_exchanges) * 4)


def derive_conversation_title(messages: list[dict[str, Any]]) -> str:
    for message in messages:
        if str(message.get("role", "")).strip() != "user":
            continue
        parts = message.get("parts", [])
        if not isinstance(parts, list):
            continue
        for part in parts:
            if not isinstance(part, dict) or part.get("type") != "text":
                continue
            text = " ".join(str(part.get("text", "")).split()).strip()
            if text:
                return text[:80]
    return "New Conversation"


def runtime_instructions(rolling_summary: str | None) -> str:
    if not rolling_summary:
        return "No prior summary."
    return f"Conversation summary:\n{rolling_summary}"


def summary_prompt(*, existing_summary: str | None, history_to_summarize: str) -> str:
    prior = existing_summary or "No previous summary."
    return f"""Update the summary with new history.

Previous summary:
{prior}

New history:
{history_to_summarize}

Output only the updated summary.
"""


def flatten_for_summary(messages: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for msg in messages:
        role = msg.get("role", "unknown")
        lines.append(f"{role}: {flatten_ui_parts(msg.get('parts', []))}")
    return "\n".join(lines)


def flatten_ui_parts(parts: list[dict[str, Any]] | Any) -> str:
    if not isinstance(parts, list):
        return ""
    chunks: list[str] = []
    for part in parts:
        if not isinstance(part, dict):
            continue
        part_type = str(part.get("type", ""))
        if part_type == "text":
            chunks.append(str(part.get("text", "")))
        elif part_type == "file":
            filename = str(part.get("filename") or part.get("name") or "attached file").strip()
            if filename:
                chunks.append(f"[Attached file: {filename}]")
        elif part_type.startswith("tool-"):
            chunks.append(
                f"{part_type} input={part.get('input')} output={part.get('output')} error={part.get('errorText')}"
            )
    return " ".join(chunks).strip()


def ui_to_openai_messages(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for msg in messages:
        role = str(msg.get("role", "user"))
        if role not in {"system", "user", "assistant", "tool"}:
            role = "user"
        parts = msg.get("parts", [])

        if role == "tool":
            out.extend(_tool_parts_to_openai_messages(parts=parts))
            continue

        content = _ui_parts_to_openai_content(parts)
        if not content:
            continue
        out.append({"role": role, "content": content})
    return out


def _ui_parts_to_openai_content(parts: Any) -> str | list[dict[str, Any]]:
    if not isinstance(parts, list):
        return ""

    content: list[dict[str, Any]] = []
    for part in parts:
        if not isinstance(part, dict):
            continue
        part_type = str(part.get("type", ""))
        if part_type == "text":
            text = str(part.get("text", ""))
            if text:
                content.append({"type": "input_text", "text": text})
        elif part_type == "file":
            file_part = _file_part_to_openai_input(part)
            if file_part is not None:
                content.append(file_part)

    if not content:
        return ""
    if all(item.get("type") == "input_text" for item in content):
        return "".join(str(item.get("text", "")) for item in content).strip()
    return content


def _file_part_to_openai_input(part: dict[str, Any]) -> dict[str, Any] | None:
    filename = str(part.get("filename") or part.get("name") or "attachment").strip()
    url = str(part.get("url") or part.get("data") or "").strip()
    file_id = str(part.get("fileId") or part.get("file_id") or "").strip()

    payload: dict[str, Any] = {"type": "input_file"}
    if filename:
        payload["filename"] = filename
    if file_id:
        payload["file_id"] = file_id
        return payload
    if url.startswith("data:"):
        file_data = _base64_payload_from_data_url(url)
        if file_data:
            payload["file_data"] = file_data
            return payload
    if url.startswith(("http://", "https://")):
        payload["file_url"] = url
        return payload
    return None


def _base64_payload_from_data_url(value: str) -> str:
    _header, separator, payload = value.partition(",")
    if not separator:
        return ""
    try:
        base64.b64decode(payload, validate=True)
    except Exception:  # noqa: BLE001
        return ""
    return value


def _tool_parts_to_openai_messages(*, parts: Any) -> list[dict[str, Any]]:
    if not isinstance(parts, list):
        return []

    out: list[dict[str, Any]] = []
    for part in parts:
        if not isinstance(part, dict):
            continue

        content = _tool_part_content(part)
        if not content:
            continue

        tool_call_id = str(part.get("toolCallId") or part.get("id") or "").strip()
        tool_name = str(part.get("toolName") or _tool_name_from_part_type(str(part.get("type", ""))) or "").strip()

        if not tool_call_id and not tool_name:
            # Providers reject role=tool without metadata; keep context as assistant text instead.
            out.append({"role": "assistant", "content": f"Tool output: {content}"})
            continue

        payload: dict[str, Any] = {"role": "tool", "content": content}
        if tool_call_id:
            payload["tool_call_id"] = tool_call_id
        if tool_name:
            payload["name"] = tool_name
        out.append(payload)

    return out


def _tool_part_content(part: dict[str, Any]) -> str:
    state = str(part.get("state") or "")
    if state == "output-available":
        return _safe_json_dumps(part.get("output", part.get("result")))
    if state in {"output-error", "timeout"}:
        error_text = str(part.get("errorText") or "").strip()
        if error_text:
            return error_text
    return flatten_ui_parts([part])


def _tool_name_from_part_type(part_type: str) -> str:
    if part_type.startswith("tool-") and len(part_type) > 5:
        return part_type[5:]
    return ""


def _safe_json_dumps(value: Any) -> str:
    try:
        return json.dumps(value, ensure_ascii=True)
    except TypeError:
        return str(value)
