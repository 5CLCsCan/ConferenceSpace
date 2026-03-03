from __future__ import annotations

from dataclasses import dataclass
from typing import Any


def _estimate_text_tokens(text: str) -> int:
    if not text:
        return 0
    # Heuristic for quick budgeting without tokenizer dependency.
    return max(1, int(len(text) / 4))


def _flatten_message(msg: dict[str, Any]) -> str:
    parts = msg.get("parts", [])
    chunks: list[str] = []
    for part in parts:
        if not isinstance(part, dict):
            continue
        t = part.get("type")
        if t == "text":
            chunks.append(str(part.get("text", "")))
        elif t and str(t).startswith("tool-"):
            chunks.append(str(part.get("toolName", t)))
            if "input" in part:
                chunks.append(str(part.get("input")))
            if "output" in part:
                chunks.append(str(part.get("output")))
    return "\n".join(chunks)


@dataclass(slots=True)
class ContextBudgetService:
    threshold_ratio: float = 0.70
    keep_recent_exchanges: int = 12

    def estimate_tokens(
        self,
        *,
        system_prompt: str,
        rolling_summary: str | None,
        messages: list[dict[str, Any]],
        tool_schemas: list[dict[str, Any]],
    ) -> int:
        total = 0
        total += _estimate_text_tokens(system_prompt)
        total += _estimate_text_tokens(rolling_summary or "")
        total += _estimate_text_tokens(str(tool_schemas))
        for msg in messages:
            total += _estimate_text_tokens(_flatten_message(msg))
        return total

    def should_compact(self, *, estimated_tokens: int, model_context_window: int) -> bool:
        if model_context_window <= 0:
            return False
        return estimated_tokens >= int(model_context_window * self.threshold_ratio)

    def split_for_compaction(
        self,
        messages: list[dict[str, Any]],
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        # Keep latest N exchanges (user+assistant ~= 2 messages per exchange).
        keep_messages = max(self.keep_recent_exchanges * 2, 1)
        if len(messages) <= keep_messages:
            return [], messages
        cutoff = len(messages) - keep_messages
        return messages[:cutoff], messages[cutoff:]

