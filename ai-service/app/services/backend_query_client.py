from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class BackendQueryClientError(Exception):
    pass


class BackendQueryClient:
    def __init__(
        self,
        *,
        base_url: str,
        service_token: str,
        timeout_seconds: float = 10.0,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._service_token = service_token.strip()
        self._timeout_seconds = timeout_seconds
        self._http_client = http_client

    async def execute(self, *, access_token: str, payload: dict[str, Any]) -> dict[str, Any]:
        if not self._service_token:
            raise BackendQueryClientError("agent backend service token is not configured")

        headers = {
            "Authorization": f"Bearer {access_token.strip()}",
            "X-Agent-Service-Token": self._service_token,
        }

        try:
            if self._http_client is not None:
                response = await self._http_client.post("/api/v1/agent/query", json=payload, headers=headers)
            else:
                async with httpx.AsyncClient(base_url=self._base_url, timeout=self._timeout_seconds) as client:
                    response = await client.post("/api/v1/agent/query", json=payload, headers=headers)
        except httpx.HTTPError as exc:
            logger.exception("backend_query.request_failed error=%s", str(exc))
            raise BackendQueryClientError("backend query engine unavailable") from exc

        data = _parse_response_json(response)
        if response.status_code != 200:
            message = _extract_error_message(data) or response.text or "backend query failed"
            raise BackendQueryClientError(f"backend query failed status={response.status_code}: {message}")

        candidate = data.get("data", data)
        if not isinstance(candidate, dict):
            raise BackendQueryClientError("backend query response missing object payload")
        return candidate


def _parse_response_json(response: httpx.Response) -> dict[str, Any]:
    try:
        payload = response.json()
    except ValueError:
        return {}
    return payload if isinstance(payload, dict) else {}


def _extract_error_message(payload: dict[str, Any]) -> str:
    for key in ("error", "detail", "message"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""
