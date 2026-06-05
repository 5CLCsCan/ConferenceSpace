from __future__ import annotations

import json
from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel

from app.workflows.chair_decision_copilot.prompts import DECISION_COPILOT_SYSTEM_PROMPT
from app.workflows.chair_decision_copilot.schemas import (
    DecisionCopilotArtifact,
    DecisionCopilotCacheMetadata,
    DecisionCopilotError,
    DecisionCopilotResolveRequest,
    DecisionCopilotResolveResponse,
)


class DecisionCopilotRunner:
    def __init__(self, *, repo, llm_client) -> None:
        self._repo = repo
        self._llm_client = llm_client

    async def resolve(self, *, request: DecisionCopilotResolveRequest) -> DecisionCopilotResolveResponse:
        current = await self._repo.get_current_artifact(
            conference_id=request.conference_id,
            submission_id=request.submission_id,
        )

        if request.action == "lookup":
            return self._build_lookup_response(request=request, current=current)

        if request.action == "generate" and self._matches_current(request=request, current=current):
            return DecisionCopilotResolveResponse.model_validate(
                {
                    "status": "ready",
                    "run_id": current["run_id"],
                    "cache": {
                        "hit": True,
                        "evidence_fingerprint": request.evidence_fingerprint,
                        "is_stale": False,
                        "stale_reasons": [],
                    },
                    "artifact": current["artifact"],
                    "error": None,
                }
            )

        try:
            artifact = await self._generate_artifact(request=request)
        except Exception as exc:  # noqa: BLE001
            return await self._save_failed(
                request=request,
                current=current,
                code="generation_failed",
                message=str(exc),
            )

        run_id = str(uuid4())
        response_payload = {
            "status": "ready",
            "run_id": run_id,
            "cache": {
                "hit": False,
                "evidence_fingerprint": request.evidence_fingerprint,
                "is_stale": False,
                "stale_reasons": [],
            },
            "artifact": artifact.model_dump(mode="json"),
            "error": None,
        }
        await self._repo.save_completed_run(
            request_payload=request.model_dump(mode="json"),
            response_payload=response_payload,
        )
        return DecisionCopilotResolveResponse.model_validate(response_payload)

    def _build_lookup_response(
        self,
        *,
        request: DecisionCopilotResolveRequest,
        current: dict | None,
    ) -> DecisionCopilotResolveResponse:
        if current is None:
            return DecisionCopilotResolveResponse(
                status="idle",
                cache=DecisionCopilotCacheMetadata(
                    hit=False,
                    evidence_fingerprint=request.evidence_fingerprint,
                    is_stale=False,
                    stale_reasons=[],
                ),
            )

        if self._matches_current(request=request, current=current):
            return DecisionCopilotResolveResponse.model_validate(
                {
                    "status": "ready",
                    "run_id": current["run_id"],
                    "cache": {
                        "hit": True,
                        "evidence_fingerprint": request.evidence_fingerprint,
                        "is_stale": False,
                        "stale_reasons": [],
                    },
                    "artifact": current["artifact"],
                    "error": None,
                }
            )

        stale_reasons = self._diff_component_fingerprints(
            previous=current.get("component_fingerprints") or {},
            current=request.component_fingerprints.model_dump(mode="json"),
        )
        return DecisionCopilotResolveResponse.model_validate(
            {
                "status": "stale",
                "run_id": current["run_id"],
                "cache": {
                    "hit": False,
                    "evidence_fingerprint": request.evidence_fingerprint,
                    "is_stale": True,
                    "stale_reasons": stale_reasons,
                },
                "artifact": current["artifact"],
                "error": None,
            }
        )

    def _matches_current(self, *, request: DecisionCopilotResolveRequest, current: dict | None) -> bool:
        return bool(current and current.get("evidence_fingerprint") == request.evidence_fingerprint)

    async def _generate_artifact(self, *, request: DecisionCopilotResolveRequest) -> DecisionCopilotArtifact:
        payload = await self._llm_client.complete_structured(
            messages=[
                {"role": "system", "content": DECISION_COPILOT_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": json.dumps(
                        self._build_generation_context(request=request),
                        ensure_ascii=True,
                        sort_keys=True,
                        separators=(",", ":"),
                    ),
                },
            ],
            response_model=DecisionCopilotArtifact,
        )
        artifact_payload = payload.model_dump(mode="json") if isinstance(payload, BaseModel) else payload
        artifact_payload["review_analytics"] = request.evidence.review_analytics.model_dump(mode="json")
        artifact_payload["rebuttal_signals"]["status"] = request.evidence.rebuttal.status
        if request.evidence.rebuttal.status == "not_applicable" and not artifact_payload["rebuttal_signals"].get("summary"):
            artifact_payload["rebuttal_signals"]["summary"] = request.evidence.rebuttal.summary_hint or "Rebuttal is not applicable."
        artifact_payload["evidence_fingerprint"] = request.evidence_fingerprint
        artifact_payload["generated_at"] = datetime.now(tz=timezone.utc).isoformat()
        return DecisionCopilotArtifact.model_validate(artifact_payload)

    def _build_generation_context(self, *, request: DecisionCopilotResolveRequest) -> dict:
        evidence = request.evidence
        return {
            "conference_cfp": evidence.conference_cfp.call_for_papers,
            "submission": {
                "title": evidence.submission.title,
                "track": evidence.submission.track,
                "keywords": evidence.submission.keywords,
            },
            "reviews": [
                {
                    "recommendation": review.recommendation,
                    "confidence": review.confidence,
                    "score": review.score,
                    "summary": review.summary,
                    "strengths": review.strengths,
                    "weaknesses": review.weaknesses,
                    "questions": review.questions,
                    "criteria": review.criteria,
                    "post_rebuttal_score": review.post_rebuttal_score,
                    "post_rebuttal_recommendation": review.post_rebuttal_recommendation,
                    "post_rebuttal_comment": review.post_rebuttal_comment,
                }
                for review in evidence.reviews
            ],
            "discussion": {
                "threads": [
                    {
                        "messages": [
                            {
                                "role": message.role,
                                "content": message.content,
                            }
                            for message in thread.messages
                        ]
                    }
                    for thread in evidence.discussion.threads
                ]
            },
            "rebuttal": {
                "general_response": evidence.rebuttal.general_response,
                "points": [
                    {
                        "category": point.category,
                        "section": point.section,
                        "original_comment": point.original_comment,
                        "author_response": point.author_response,
                        "status": point.status,
                        "reviewer_acknowledged": point.reviewer_acknowledged,
                        "reviewer_note": point.reviewer_note,
                    }
                    for point in evidence.rebuttal.points
                ],
            },
        }

    async def _save_failed(
        self,
        *,
        request: DecisionCopilotResolveRequest,
        current: dict | None,
        code: str,
        message: str,
    ) -> DecisionCopilotResolveResponse:
        run_id = str(uuid4())
        stale_reasons = self._diff_component_fingerprints(
            previous=(current or {}).get("component_fingerprints") or {},
            current=request.component_fingerprints.model_dump(mode="json"),
        ) if current else []
        response = DecisionCopilotResolveResponse(
            status="failed",
            run_id=run_id,
            cache=DecisionCopilotCacheMetadata(
                hit=False,
                evidence_fingerprint=request.evidence_fingerprint,
                is_stale=bool(current and current.get("evidence_fingerprint") != request.evidence_fingerprint),
                stale_reasons=stale_reasons,
            ),
            artifact=DecisionCopilotArtifact.model_validate(current["artifact"]) if current and current.get("artifact") else None,
            error=DecisionCopilotError(code=code, message=message),
        )
        await self._repo.save_failed_run(
            run_id=run_id,
            request_payload=request.model_dump(mode="json"),
            error_detail=response.error.model_dump(mode="json") if response.error else {},
        )
        return response

    def _diff_component_fingerprints(self, *, previous: dict, current: dict) -> list[str]:
        changed = []
        for key in ("submission", "reviews", "discussion", "rebuttal"):
            if previous.get(key) != current.get(key):
                changed.append(key)
        return changed
