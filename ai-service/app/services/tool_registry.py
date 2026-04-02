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
    "getCurrentNavigation": ToolSpec(
        name="getCurrentNavigation",
        execution_mode="client",
        input_schema={"type": "object", "properties": {}, "additionalProperties": False},
        timeout_seconds=90,
    ),
    "navigate": ToolSpec(
        name="navigate",
        execution_mode="client",
        input_schema={
            "type": "object",
            "properties": {
                "destinationId": {"type": "string"},
                "params": {
                    "type": "object",
                    "additionalProperties": {"type": "string"},
                },
            },
            "required": ["destinationId"],
            "additionalProperties": False,
        },
        timeout_seconds=90,
    ),
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
                "action": {"type": "string", "enum": ["click", "type", "press", "select", "clear"]},
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
    "query_backend": ToolSpec(
        name="query_backend",
        execution_mode="server",
        input_schema={
            "type": "object",
            "properties": {
                "op": {"type": "string", "enum": ["describe", "query"]},
                "resource": {"type": "string"},
                "select": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "field": {"type": "string"},
                            "as": {"type": "string"},
                        },
                        "required": ["field"],
                        "additionalProperties": False,
                    },
                },
                "filter": {"type": "object"},
                "group_by": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "field": {"type": "string"},
                            "as": {"type": "string"},
                        },
                        "required": ["field"],
                        "additionalProperties": False,
                    },
                },
                "aggregates": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "fn": {"type": "string"},
                            "field": {"type": "string"},
                            "as": {"type": "string"},
                        },
                        "required": ["fn", "field"],
                        "additionalProperties": False,
                    },
                },
                "sort": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "field": {"type": "string"},
                            "dir": {"type": "string", "enum": ["asc", "desc"]},
                        },
                        "required": ["field"],
                        "additionalProperties": False,
                    },
                },
                "limit": {"type": "integer", "minimum": 1},
                "offset": {"type": "integer", "minimum": 0},
            },
            "required": ["op"],
            "additionalProperties": False,
        },
        timeout_seconds=30,
    ),
}
