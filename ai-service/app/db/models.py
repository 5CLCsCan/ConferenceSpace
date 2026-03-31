from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    BIGINT,
    DateTime,
    CheckConstraint,
    Float,
    ForeignKey,
    Index,
    Integer,
    Text,
    UniqueConstraint,
    VARCHAR,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


SCHEMA = "ai"


class Base(DeclarativeBase):
    pass


class AiSession(Base):
    __tablename__ = "ai_sessions"
    __table_args__ = (
        CheckConstraint("status IN ('active', 'waiting_tool', 'closed', 'expired')", name="ck_ai_sessions_status"),
        Index("idx_ai_sessions_last_activity", "last_activity_at"),
        Index("idx_ai_sessions_status", "status"),
        Index("idx_ai_sessions_user_last_activity_thread", "user_id", "last_activity_at", "thread_id"),
        {"schema": SCHEMA},
    )

    thread_id: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[int] = mapped_column(BIGINT, nullable=False, index=True)
    user_email: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False, default="New Conversation", server_default="New Conversation")
    model: Mapped[str] = mapped_column(VARCHAR(128), nullable=False)
    trace_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, default=lambda: str(uuid4()))
    rolling_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(VARCHAR(16), nullable=False, default="active")
    pending_tool_call: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_activity_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    turn_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


class AiMessage(Base):
    __tablename__ = "ai_messages"
    __table_args__ = (
        UniqueConstraint("thread_id", "sequence_no", name="uq_ai_messages_thread_seq"),
        UniqueConstraint("thread_id", "message_id", name="uq_ai_messages_thread_message_id"),
        CheckConstraint("role IN ('system', 'user', 'assistant', 'tool')", name="ck_ai_messages_role"),
        Index("idx_ai_messages_thread_created", "thread_id", "created_at"),
        {"schema": SCHEMA},
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    thread_id: Mapped[str] = mapped_column(
        Text,
        ForeignKey(f"{SCHEMA}.ai_sessions.thread_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sequence_no: Mapped[int] = mapped_column(Integer, nullable=False)
    message_id: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    role: Mapped[str] = mapped_column(VARCHAR(16), nullable=False)
    parts: Mapped[dict | list] = mapped_column(JSONB, nullable=False)
    token_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class AiToolAudit(Base):
    __tablename__ = "ai_tool_audit"
    __table_args__ = (
        UniqueConstraint("thread_id", "tool_call_id", name="uq_ai_tool_audit_call"),
        CheckConstraint(
            "status IN ('requested', 'output-available', 'output-error', 'timeout', 'denied', 'unregistered')",
            name="ck_ai_tool_audit_status",
        ),
        Index("idx_ai_tool_audit_thread", "thread_id", "requested_at"),
        Index("idx_ai_tool_audit_user", "user_id", "requested_at"),
        Index("idx_ai_tool_audit_tool_name", "tool_name"),
        {"schema": SCHEMA},
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    thread_id: Mapped[str] = mapped_column(
        Text,
        ForeignKey(f"{SCHEMA}.ai_sessions.thread_id", ondelete="CASCADE"),
        nullable=False,
    )
    tool_call_id: Mapped[str] = mapped_column(Text, nullable=False)
    tool_name: Mapped[str] = mapped_column(Text, nullable=False)
    tool_input: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[str] = mapped_column(VARCHAR(32), nullable=False)
    output: Mapped[dict | list | str | int | float | bool | None] = mapped_column(JSONB, nullable=True)
    error_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_id: Mapped[int] = mapped_column(BIGINT, nullable=False)
    user_email: Mapped[str] = mapped_column(Text, nullable=False)
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    trace_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    source: Mapped[str] = mapped_column(VARCHAR(16), nullable=False, default="client")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class GatingRun(Base):
    __tablename__ = "gating_runs"
    __table_args__ = (
        CheckConstraint("mode IN ('advisory', 'gate')", name="ck_gating_runs_mode"),
        CheckConstraint("verdict IN ('pass', 'warn', 'block', 'error')", name="ck_gating_runs_verdict"),
        Index("idx_gating_runs_conference_created_at", "conference_id", "created_at"),
        Index(
            "idx_gating_runs_submission_id",
            "submission_id",
            postgresql_where=text("submission_id IS NOT NULL"),
        ),
        {"schema": SCHEMA},
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    conference_id: Mapped[int] = mapped_column(BIGINT, nullable=False)
    submission_id: Mapped[int | None] = mapped_column(BIGINT, nullable=True)
    actor_id: Mapped[str] = mapped_column(Text, nullable=False)
    mode: Mapped[str] = mapped_column(VARCHAR(16), nullable=False)
    source: Mapped[str] = mapped_column(Text, nullable=False)
    verdict: Mapped[str] = mapped_column(VARCHAR(16), nullable=False)
    decision: Mapped[str | None] = mapped_column(Text, nullable=True)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    policy_hash: Mapped[str] = mapped_column(Text, nullable=False)
    input_fingerprint: Mapped[str] = mapped_column(Text, nullable=False)
    error_detail: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class GatingStageRecord(Base):
    __tablename__ = "gating_stage_records"
    __table_args__ = (
        CheckConstraint("status IN ('ok', 'skipped', 'blocked', 'failed')", name="ck_gating_stage_records_status"),
        Index("idx_gating_stage_records_run_id", "run_id"),
        {"schema": SCHEMA},
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    run_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey(f"{SCHEMA}.gating_runs.id", ondelete="CASCADE"),
        nullable=False,
    )
    stage_name: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(VARCHAR(16), nullable=False)
    input_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    output_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    detail: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class ReviewerBriefingRun(Base):
    __tablename__ = "reviewer_briefing_runs"
    __table_args__ = (
        CheckConstraint("status IN ('completed', 'failed')", name="ck_reviewer_briefing_runs_status"),
        Index("idx_reviewer_briefing_runs_scope_created", "conference_id", "assignment_id", "created_at"),
        {"schema": SCHEMA},
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    conference_id: Mapped[int] = mapped_column(BIGINT, nullable=False)
    assignment_id: Mapped[int] = mapped_column(BIGINT, nullable=False)
    submission_id: Mapped[int] = mapped_column(BIGINT, nullable=False)
    actor_id: Mapped[str] = mapped_column(Text, nullable=False)
    submission_state_fingerprint: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(VARCHAR(16), nullable=False)
    request_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    error_detail: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ReviewerBriefingArtifact(Base):
    __tablename__ = "reviewer_briefing_artifacts"
    __table_args__ = (
        Index(
            "idx_reviewer_briefing_artifacts_scope_generated",
            "conference_id",
            "assignment_id",
            "submission_id",
            "actor_id",
            "generated_at",
        ),
        {"schema": SCHEMA},
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    run_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey(f"{SCHEMA}.reviewer_briefing_runs.id", ondelete="CASCADE"),
        nullable=False,
    )
    conference_id: Mapped[int] = mapped_column(BIGINT, nullable=False)
    assignment_id: Mapped[int] = mapped_column(BIGINT, nullable=False)
    submission_id: Mapped[int] = mapped_column(BIGINT, nullable=False)
    actor_id: Mapped[str] = mapped_column(Text, nullable=False)
    submission_state_fingerprint: Mapped[str] = mapped_column(Text, nullable=False)
    artifact_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class ReviewerBriefingStageRecord(Base):
    __tablename__ = "reviewer_briefing_stage_records"
    __table_args__ = (
        CheckConstraint(
            "status IN ('ok', 'skipped', 'blocked', 'failed')",
            name="ck_reviewer_briefing_stage_records_status",
        ),
        Index("idx_reviewer_briefing_stage_records_run_id", "run_id"),
        {"schema": SCHEMA},
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    run_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey(f"{SCHEMA}.reviewer_briefing_runs.id", ondelete="CASCADE"),
        nullable=False,
    )
    stage_name: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(VARCHAR(16), nullable=False)
    detail: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class DecisionCopilotRun(Base):
    __tablename__ = "decision_copilot_runs"
    __table_args__ = (
        CheckConstraint("status IN ('completed', 'failed')", name="ck_decision_copilot_runs_status"),
        CheckConstraint("action IN ('lookup', 'generate', 'regenerate')", name="ck_decision_copilot_runs_action"),
        Index("idx_decision_copilot_runs_scope_created", "conference_id", "submission_id", "created_at"),
        {"schema": SCHEMA},
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    conference_id: Mapped[int] = mapped_column(BIGINT, nullable=False)
    submission_id: Mapped[int] = mapped_column(BIGINT, nullable=False)
    actor_id: Mapped[str] = mapped_column(Text, nullable=False)
    action: Mapped[str] = mapped_column(VARCHAR(16), nullable=False)
    evidence_fingerprint: Mapped[str] = mapped_column(Text, nullable=False)
    component_fingerprints: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[str] = mapped_column(VARCHAR(16), nullable=False)
    request_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    artifact_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error_detail: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class DecisionCopilotCurrentArtifact(Base):
    __tablename__ = "decision_copilot_current_artifacts"
    __table_args__ = (
        UniqueConstraint("conference_id", "submission_id", name="uq_decision_copilot_current_scope"),
        Index("idx_decision_copilot_current_scope", "conference_id", "submission_id"),
        {"schema": SCHEMA},
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    conference_id: Mapped[int] = mapped_column(BIGINT, nullable=False)
    submission_id: Mapped[int] = mapped_column(BIGINT, nullable=False)
    run_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey(f"{SCHEMA}.decision_copilot_runs.id", ondelete="CASCADE"),
        nullable=False,
    )
    evidence_fingerprint: Mapped[str] = mapped_column(Text, nullable=False)
    component_fingerprints: Mapped[dict] = mapped_column(JSONB, nullable=False)
    artifact_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
