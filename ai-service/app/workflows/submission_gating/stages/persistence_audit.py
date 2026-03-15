from __future__ import annotations

from app.workflows.submission_gating.models.state import GatingState


async def run(state: GatingState, *, repo) -> GatingState:
    await repo.save_run(state)
    return state
