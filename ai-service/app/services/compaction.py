from __future__ import annotations

from dataclasses import dataclass
from typing import Any


def estimate_tokens_from_messages(messages: list[dict[str, Any]]) -> int:
    total_chars = 0
    for msg in messages:
        for part in msg.get("parts", []):
            if isinstance(part, dict):
                if part.get("type") == "text":
                    total_chars += len(str(part.get("text", "")))
                elif part.get("type", "").startswith("tool-"):
                    total_chars += len(str(part.get("input", "")))
                    total_chars += len(str(part.get("output", "")))
    return max(1, total_chars // 4)


@dataclass(slots=True)
class CompactionPolicy:
    threshold_ratio: float = 0.70
    keep_recent_exchanges: int = 12

    def should_compact(self, estimated_tokens: int, context_window: int) -> bool:
        if context_window <= 0:
            return False
        return estimated_tokens >= int(context_window * self.threshold_ratio)

    def split(self, messages: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        keep_messages = max(self.keep_recent_exchanges * 2, 1)
        if len(messages) <= keep_messages:
            return [], messages
        cutoff = len(messages) - keep_messages
        return messages[:cutoff], messages[cutoff:]