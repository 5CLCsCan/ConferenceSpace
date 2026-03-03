from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.api.routes import _extract_bearer_token, _has_fresh_user_message, _validate_messages


def test_extract_bearer_token() -> None:
    assert _extract_bearer_token("Bearer abc123") == "abc123"
    assert _extract_bearer_token("bearer xyz") == "xyz"
    assert _extract_bearer_token("token") is None
    assert _extract_bearer_token(None) is None


def test_has_fresh_user_message() -> None:
    messages = [
        {"role": "assistant", "parts": [{"type": "text", "text": "hello"}]},
        {"role": "user", "parts": [{"type": "text", "text": " new input "}]}]
    assert _has_fresh_user_message(messages) is True

    empty_text_messages = [{"role": "user", "parts": [{"type": "text", "text": "   "}]}]
    assert _has_fresh_user_message(empty_text_messages) is False


def test_validate_messages_rejects_limits() -> None:
    with pytest.raises(HTTPException) as too_many:
        _validate_messages(messages=[{}] * 3, max_messages=2, max_text_chars=10)
    assert too_many.value.status_code == 422

    with pytest.raises(HTTPException) as too_long:
        _validate_messages(
            messages=[{"parts": [{"type": "text", "text": "x" * 11}]}],
            max_messages=5,
            max_text_chars=10,
        )
    assert too_long.value.status_code == 422

