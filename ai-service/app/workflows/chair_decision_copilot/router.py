from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request, status

from app.api.routes import _get_container, _require_identity
from app.workflows.chair_decision_copilot.schemas import (
    DecisionCopilotResolveRequest,
    DecisionCopilotResolveResponse,
)


router = APIRouter(prefix="/api/v1/workflows/chair-decision-copilot", tags=["chair-decision-copilot"])


@router.post("/resolve", response_model=DecisionCopilotResolveResponse)
async def resolve(request: Request) -> DecisionCopilotResolveResponse:
    await _require_identity(request)
    container = _get_container(request)
    runner = _get_runner(container)

    try:
        body = DecisionCopilotResolveRequest.model_validate(await request.json())
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    return await runner.resolve(request=body)


def _get_runner(container: Any):
    runner = getattr(container, "decision_copilot_runner", None)
    if runner is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="decision copilot runner not initialized",
        )
    return runner
