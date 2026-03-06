"""Create ai schema tables

Revision ID: 20260303_0001
Revises:
Create Date: 2026-03-03 16:20:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20260303_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS ai")

    op.create_table(
        "ai_sessions",
        sa.Column("thread_id", sa.Text(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("user_email", sa.Text(), nullable=False),
        sa.Column("model", sa.String(length=128), nullable=False),
        sa.Column("trace_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("rolling_summary", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="active"),
        sa.Column("pending_tool_call", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("last_activity_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("turn_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint("status IN ('active', 'waiting_tool', 'closed', 'expired')", name="ck_ai_sessions_status"),
        sa.PrimaryKeyConstraint("thread_id"),
        schema="ai",
    )
    op.create_index("idx_ai_sessions_last_activity", "ai_sessions", ["last_activity_at"], unique=False, schema="ai")
    op.create_index("idx_ai_sessions_status", "ai_sessions", ["status"], unique=False, schema="ai")
    op.create_index("ix_ai_ai_sessions_user_id", "ai_sessions", ["user_id"], unique=False, schema="ai")

    op.create_table(
        "ai_messages",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("thread_id", sa.Text(), nullable=False),
        sa.Column("sequence_no", sa.Integer(), nullable=False),
        sa.Column("message_id", sa.Text(), nullable=False),
        sa.Column("role", sa.String(length=16), nullable=False),
        sa.Column("parts", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("token_count", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint("role IN ('system', 'user', 'assistant', 'tool')", name="ck_ai_messages_role"),
        sa.ForeignKeyConstraint(["thread_id"], ["ai.ai_sessions.thread_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("thread_id", "sequence_no", name="uq_ai_messages_thread_seq"),
        schema="ai",
    )
    op.create_index("idx_ai_messages_thread_created", "ai_messages", ["thread_id", "created_at"], unique=False, schema="ai")
    op.create_index("ix_ai_ai_messages_message_id", "ai_messages", ["message_id"], unique=False, schema="ai")
    op.create_index("ix_ai_ai_messages_thread_id", "ai_messages", ["thread_id"], unique=False, schema="ai")

    op.create_table(
        "ai_tool_audit",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("thread_id", sa.Text(), nullable=False),
        sa.Column("tool_call_id", sa.Text(), nullable=False),
        sa.Column("tool_name", sa.Text(), nullable=False),
        sa.Column("tool_input", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("output", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error_text", sa.Text(), nullable=True),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("user_email", sa.Text(), nullable=False),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("trace_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("source", sa.String(length=16), nullable=False, server_default="client"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint(
            "status IN ('requested', 'output-available', 'output-error', 'timeout', 'denied', 'unregistered')",
            name="ck_ai_tool_audit_status",
        ),
        sa.ForeignKeyConstraint(["thread_id"], ["ai.ai_sessions.thread_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("thread_id", "tool_call_id", name="uq_ai_tool_audit_call"),
        schema="ai",
    )
    op.create_index("idx_ai_tool_audit_thread", "ai_tool_audit", ["thread_id", "requested_at"], unique=False, schema="ai")
    op.create_index("idx_ai_tool_audit_tool_name", "ai_tool_audit", ["tool_name"], unique=False, schema="ai")
    op.create_index("idx_ai_tool_audit_user", "ai_tool_audit", ["user_id", "requested_at"], unique=False, schema="ai")


def downgrade() -> None:
    op.drop_index("idx_ai_tool_audit_user", table_name="ai_tool_audit", schema="ai")
    op.drop_index("idx_ai_tool_audit_tool_name", table_name="ai_tool_audit", schema="ai")
    op.drop_index("idx_ai_tool_audit_thread", table_name="ai_tool_audit", schema="ai")
    op.drop_table("ai_tool_audit", schema="ai")

    op.drop_index("ix_ai_ai_messages_thread_id", table_name="ai_messages", schema="ai")
    op.drop_index("ix_ai_ai_messages_message_id", table_name="ai_messages", schema="ai")
    op.drop_index("idx_ai_messages_thread_created", table_name="ai_messages", schema="ai")
    op.drop_table("ai_messages", schema="ai")

    op.drop_index("ix_ai_ai_sessions_user_id", table_name="ai_sessions", schema="ai")
    op.drop_index("idx_ai_sessions_status", table_name="ai_sessions", schema="ai")
    op.drop_index("idx_ai_sessions_last_activity", table_name="ai_sessions", schema="ai")
    op.drop_table("ai_sessions", schema="ai")

    op.execute("DROP SCHEMA IF EXISTS ai CASCADE")

