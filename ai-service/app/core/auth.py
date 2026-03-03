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
    def __init__(
        self,
        backend_base_url: str,
        ttl_seconds: int = 60,
        request_timeout_seconds: float = 3.0,
        allow_unavailable_backend: bool = False,
        fallback_identity: Identity | None = None,
    ) -> None:
        self._backend_base_url = backend_base_url.rstrip("/")
        self._ttl_seconds = ttl_seconds
        self._request_timeout_seconds = request_timeout_seconds
        self._allow_unavailable_backend = allow_unavailable_backend
        self._fallback_identity = fallback_identity
        self._cache: dict[str, _CacheEntry] = {}

    async def validate_token(self, token: str) -> Identity:
        token = _normalize_token(token)
        fingerprint = _token_fingerprint(token)
        now = time()
        cached = self._cache.get(token)
        if cached and cached.expires_at > now:
            logger.info("auth.validate_token cache_hit token=%s user_id=%s", fingerprint, cached.identity.user_id)
            return cached.identity

        url = f"{self._backend_base_url}/api/v1/users/me"
        headers = {"Authorization": f"Bearer {token}"}

        logger.info("auth.validate_token cache_miss token=%s url=%s", fingerprint, url)
        try:
            async with httpx.AsyncClient(timeout=self._request_timeout_seconds) as client:
                response = await client.get(url, headers=headers)
        except httpx.HTTPError as exc:
            logger.exception("auth.validate_token upstream_error token=%s error=%s", fingerprint, str(exc))
            if self._allow_unavailable_backend and self._fallback_identity is not None:
                logger.warning(
                    "auth.validate_token bypass_enabled token=%s fallback_user_id=%s",
                    fingerprint,
                    self._fallback_identity.user_id,
                )
                return self._fallback_identity
            raise AuthError("identity service unavailable", code="unavailable") from exc

        if response.status_code != 200:
            logger.warning(
                "auth.validate_token rejected token=%s status=%s body=%s",
                fingerprint,
                response.status_code,
                response.text[:200],
            )
            raise AuthError("invalid or expired token", code="unauthorized")

        payload = response.json()
        identity_payload = _extract_identity_payload(payload)
        user_id = identity_payload.get("id")
        user_email = identity_payload.get("email")

        if user_id is None or not user_email:
            logger.warning("auth.validate_token malformed_payload token=%s payload=%s", fingerprint, payload)
            raise AuthError("backend identity payload is missing required fields", code="unauthorized")

        identity = Identity(user_id=int(user_id), user_email=str(user_email))
        self._cache[token] = _CacheEntry(identity=identity, expires_at=now + self._ttl_seconds)
        logger.info("auth.validate_token success token=%s user_id=%s email=%s", fingerprint, identity.user_id, identity.user_email)
        return identity


def _normalize_token(token: str) -> str:
    value = token.strip()
    if value.lower().startswith("bearer "):
        return value.split(" ", 1)[1].strip()
    return value


def _extract_identity_payload(payload: dict[str, Any]) -> dict[str, Any]:
    # Backend standard response is usually {"data": {...}}.
    candidate = payload.get("data", payload)
    if isinstance(candidate, dict):
        return candidate
    return payload


def _token_fingerprint(token: str) -> str:
    if not token:
        return "empty"
    return f"{token[:6]}...{token[-6:]}"
