from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.api.schemas import ToolResultEnvelope


def test_tool_result_envelope_allows_output_available_without_error() -> None:
    envelope = ToolResultEnvelope(
        tool_name="getPageContext",
        status="output-available",
        output={"ok": True},
    )
    assert envelope.status == "output-available"


@pytest.mark.parametrize("status", ["output-error", "timeout"])
def test_tool_result_envelope_requires_error_text_for_non_success(status: str) -> None:
    with pytest.raises(ValidationError):
        ToolResultEnvelope(
            tool_name="performAction",
            status=status,  # type: ignore[arg-type]
            output=None,
        )

