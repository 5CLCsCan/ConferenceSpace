from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    BIGINT,
    DateTime,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    Text,
    UniqueConstraint,
    VARCHAR,
    func,
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
        {"schema": SCHEMA},
    )

    thread_id: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[int] = mapped_column(BIGINT, nullable=False, index=True)
    user_email: Mapped[str] = mapped_column(Text, nullable=False)
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
