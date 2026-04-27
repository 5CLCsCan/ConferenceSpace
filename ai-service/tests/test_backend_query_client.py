from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.services.query_engine_client import QueryEngineClient, QueryEngineClientError


async def test_backend_query_client_posts_payload_with_service_token() -> None:
    captured: dict[str, object] = {}

    async def app(scope, receive, send):  # type: ignore[no-untyped-def]
        assert scope["type"] == "http"
        headers = {key.decode("latin-1"): value.decode("latin-1") for key, value in scope["headers"]}
        captured["authorization"] = headers.get("authorization")
        captured["service_token"] = headers.get("x-agent-service-token")

        body = b""
        while True:
            message = await receive()
            if message["type"] != "http.request":
                continue
            body += message.get("body", b"")
            if not message.get("more_body", False):
                break
        captured["body"] = body.decode("utf-8")

        await send(
            {
                "type": "http.response.start",
                "status": 200,
                "headers": [(b"content-type", b"application/json")],
            }
        )
        await send(
            {
                "type": "http.response.body",
                "body": b'{"data":{"resource":"submissions","rows":[{"id":7}]}}',
            }
        )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as http_client:
        client = QueryEngineClient(
            base_url="http://testserver",
            service_token="agent-secret",
            timeout_seconds=5.0,
            http_client=http_client,
        )

        response = await client.execute(
            access_token="user-token",
            payload={"op": "query", "resource": "submissions"},
        )

    assert captured["authorization"] == "Bearer user-token"
    assert captured["service_token"] == "agent-secret"
    assert '"resource":"submissions"' in str(captured["body"])
    assert response == {"resource": "submissions", "rows": [{"id": 7}]}


async def test_backend_query_client_raises_error_on_non_success() -> None:
    async def app(scope, receive, send):  # type: ignore[no-untyped-def]
        assert scope["type"] == "http"
        while True:
            message = await receive()
            if message["type"] == "http.request" and not message.get("more_body", False):
                break

        await send(
            {
                "type": "http.response.start",
                "status": 422,
                "headers": [(b"content-type", b"application/json")],
            }
        )
        await send(
            {
                "type": "http.response.body",
                "body": b'{"error":"invalid query"}',
            }
        )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as http_client:
        client = QueryEngineClient(
            base_url="http://testserver",
            service_token="agent-secret",
            timeout_seconds=5.0,
            http_client=http_client,
        )

        with pytest.raises(QueryEngineClientError) as exc:
            await client.execute(
                access_token="user-token",
                payload={"op": "query", "resource": "submissions"},
            )

    assert "status=422" in str(exc.value)
    assert "invalid query" in str(exc.value)
