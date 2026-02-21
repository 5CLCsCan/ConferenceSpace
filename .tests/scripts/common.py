from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import requests

DEFAULT_TIMEOUT_SECONDS = 20


class ApiError(RuntimeError):
    def __init__(self, method: str, path: str, status_code: int, payload: Any):
        message = f"{method.upper()} {path} failed with status {status_code}"
        super().__init__(message)
        self.method = method.upper()
        self.path = path
        self.status_code = status_code
        self.payload = payload


@dataclass
class TestUserSeed:
    email: str
    first_name: str
    last_name: str


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def ensure_parent_dir(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write_json(path: Path, payload: Any) -> None:
    ensure_parent_dir(path)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def unwrap_data(payload: Any) -> Any:
    if isinstance(payload, dict) and "data" in payload:
        return payload["data"]
    return payload


def minimal_pdf_bytes() -> bytes:
    return (
        b"%PDF-1.4\n"
        b"%\xe2\xe3\xcf\xd3\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R >>\nendobj\n"
        b"4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 72 96 Td (ConferenceSpace E2E Seed) Tj ET\nendstream\nendobj\n"
        b"xref\n0 5\n0000000000 65535 f \n0000000015 00000 n \n0000000068 00000 n \n0000000127 00000 n \n0000000225 00000 n \n"
        b"trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n321\n%%EOF\n"
    )


def _normalize_status(expected_status: int | Iterable[int] | None) -> set[int]:
    if expected_status is None:
        return set()
    if isinstance(expected_status, int):
        return {expected_status}
    return {int(code) for code in expected_status}


class BackendClient:
    def __init__(self, base_url: str, timeout: int = DEFAULT_TIMEOUT_SECONDS):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.session = requests.Session()

    def _to_url(self, path: str) -> str:
        if path.startswith("http://") or path.startswith("https://"):
            return path
        if not path.startswith("/"):
            path = "/" + path
        return f"{self.base_url}{path}"

    def request(
        self,
        method: str,
        path: str,
        *,
        token: str | None = None,
        expected_status: int | Iterable[int] | None = None,
        json_body: Any | None = None,
        data: dict[str, Any] | None = None,
        files: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> tuple[Any, requests.Response]:
        req_headers = dict(headers or {})
        if token:
            req_headers["Authorization"] = f"Bearer {token}"

        response = self.session.request(
            method=method.upper(),
            url=self._to_url(path),
            headers=req_headers,
            json=json_body,
            data=data,
            files=files,
            params=params,
            timeout=self.timeout,
        )

        content_type = (response.headers.get("Content-Type") or "").lower()
        if "application/json" in content_type:
            payload: Any = response.json()
        else:
            payload = response.text

        accepted = _normalize_status(expected_status)
        if not accepted:
            ok = 200 <= response.status_code < 300
        else:
            ok = response.status_code in accepted

        if not ok:
            raise ApiError(method, path, response.status_code, payload)

        return payload, response

    def login_test_user(self, user: TestUserSeed) -> dict[str, Any]:
        payload, _ = self.request(
            "POST",
            "/api/v1/auth/test-login",
            json_body={
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
            expected_status=(200, 201),
        )
        return unwrap_data(payload)
