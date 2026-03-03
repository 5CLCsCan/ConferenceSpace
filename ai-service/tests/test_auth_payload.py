from app.core.auth import _extract_identity_payload, _normalize_token


def test_extract_identity_payload_from_wrapped_response():
    payload = {"data": {"id": 7, "email": "user@example.com"}}
    extracted = _extract_identity_payload(payload)
    assert extracted["id"] == 7
    assert extracted["email"] == "user@example.com"


def test_extract_identity_payload_from_unwrapped_response():
    payload = {"id": 8, "email": "direct@example.com"}
    extracted = _extract_identity_payload(payload)
    assert extracted["id"] == 8
    assert extracted["email"] == "direct@example.com"


def test_normalize_token_strips_bearer_prefix():
    assert _normalize_token("Bearer abc.xyz") == "abc.xyz"
    assert _normalize_token("abc.xyz") == "abc.xyz"

