from __future__ import annotations

from dataclasses import dataclass, field
from threading import Lock


@dataclass
class MetricsStore:
    lock: Lock = field(default_factory=Lock)
    chat_requests_total: int = 0
    chat_errors_total: int = 0
    tool_result_requests_total: int = 0
    tool_timeouts_total: int = 0
    resume_attempts_total: int = 0
    resume_success_total: int = 0
    ttft_ms_samples: list[int] = field(default_factory=list)
    stream_duration_ms_samples: list[int] = field(default_factory=list)

    def inc(self, field_name: str, amount: int = 1) -> None:
        with self.lock:
            setattr(self, field_name, getattr(self, field_name) + amount)

    def add_ttft(self, ms: int) -> None:
        with self.lock:
            self.ttft_ms_samples.append(ms)

    def add_stream_duration(self, ms: int) -> None:
        with self.lock:
            self.stream_duration_ms_samples.append(ms)

    def snapshot(self) -> dict:
        with self.lock:
            resume_rate = (
                self.resume_success_total / self.resume_attempts_total
                if self.resume_attempts_total > 0
                else 0.0
            )
            return {
                "chat_requests_total": self.chat_requests_total,
                "chat_errors_total": self.chat_errors_total,
                "tool_result_requests_total": self.tool_result_requests_total,
                "tool_timeouts_total": self.tool_timeouts_total,
                "resume_attempts_total": self.resume_attempts_total,
                "resume_success_total": self.resume_success_total,
                "resume_success_rate": resume_rate,
                "ttft_ms_avg": _avg(self.ttft_ms_samples),
                "stream_duration_ms_avg": _avg(self.stream_duration_ms_samples),
                "ttft_ms_samples": len(self.ttft_ms_samples),
                "stream_duration_ms_samples": len(self.stream_duration_ms_samples),
            }


def _avg(values: list[int]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)