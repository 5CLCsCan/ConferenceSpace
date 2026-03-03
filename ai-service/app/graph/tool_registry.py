from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal


@dataclass(slots=True)
class ToolSpec:
    name: str
    execution_mode: Literal["client", "server"]
    input_schema: dict[str, Any]
    timeout_seconds: int


TOOL_REGISTRY: dict[str, ToolSpec] = {
    "getPageContext": ToolSpec(
        name="getPageContext",
        execution_mode="client",
        input_schema={"type": "object", "properties": {}, "additionalProperties": False},
        timeout_seconds=90,
    ),
    "performAction": ToolSpec(
        name="performAction",
        execution_mode="client",
        input_schema={
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["click", "type", "press", "select", "clear"],
                },
                "ref": {"type": "string"},
                "text": {"type": "string"},
                "key": {"type": "string"},
                "value": {"type": "string"},
            },
            "required": ["action"],
            "additionalProperties": False,
        },
        timeout_seconds=90,
    ),
}


def is_registered_tool(name: str) -> bool:
    return name in TOOL_REGISTRY
