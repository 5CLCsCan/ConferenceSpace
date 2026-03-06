from __future__ import annotations

import logging
from dataclasses import dataclass
from time import time
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class AuthError(Exception):
    def __init__(self, message: str, *, code: str = "unauthorized") -> None:
        super().__init__(message)
        self.code = code


@dataclass(slots=True)
class Identity:
    user_id: int
    user_email: str


@dataclass(slots=True)
class _CacheEntry:
    identity: Identity
    expires_at: float


class IdentityProvider:
    def __init__(self, backend_base_url: str, ttl_seconds: int = 60, request_timeout_seconds: float = 3.0) -> None:
        self._backend_base_url = backend_base_url.rstrip("/")
        self._ttl_seconds = ttl_seconds
        self._request_timeout_seconds = request_timeout_seconds
        self._cache: dict[str, _CacheEntry] = {}

    async def validate_token(self, token: str) -> Identity:
        token = _normalize_token(token)
        fingerprint = _token_fingerprint(token)
        now = time()

        cached = self._cache.get(token)
        if cached and cached.expires_at > now:
            return cached.identity

        url = f"{self._backend_base_url}/api/v1/users/me"
        headers = {"Authorization": f"Bearer {token}"}

        try:
            async with httpx.AsyncClient(timeout=self._request_timeout_seconds) as client:
                response = await client.get(url, headers=headers)
        except httpx.HTTPError as exc:
            logger.exception("auth.upstream_error token=%s error=%s", fingerprint, str(exc))
            raise AuthError("identity service unavailable", code="unavailable") from exc

        if response.status_code != 200:
            logger.warning("auth.rejected token=%s status=%s", fingerprint, response.status_code)
            raise AuthError("invalid or expired token", code="unauthorized")

        payload = response.json()
        identity_payload = _extract_identity_payload(payload)
        user_id = identity_payload.get("id")
        user_email = identity_payload.get("email")
        if user_id is None or not user_email:
            raise AuthError("backend identity payload missing required fields", code="unauthorized")

        identity = Identity(user_id=int(user_id), user_email=str(user_email))
        self._cache[token] = _CacheEntry(identity=identity, expires_at=now + self._ttl_seconds)
        return identity


async def check_identity_backend_health(backend_base_url: str, timeout_seconds: float) -> bool:
    url = f"{backend_base_url.rstrip('/')}/api/v1/users/me"
    try:
        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            response = await client.get(url)
        return response.status_code in {200, 401, 403}
    except httpx.HTTPError:
        return False


def _normalize_token(token: str) -> str:
    value = token.strip()
    if value.lower().startswith("bearer "):
        return value.split(" ", 1)[1].strip()
    return value


def _extract_identity_payload(payload: dict[str, Any]) -> dict[str, Any]:
    candidate = payload.get("data", payload)
    if isinstance(candidate, dict):
        return candidate
    return payload


def _token_fingerprint(token: str) -> str:
    if not token:
        return "empty"
    return f"{token[:6]}...{token[-6:]}"