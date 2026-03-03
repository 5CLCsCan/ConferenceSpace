"""ai agent foundation schema

Revision ID: 20260301_0001
Revises:
Create Date: 2026-03-01 09:30:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20260301_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "agent_sessions",
        sa.Column("thread_id", sa.Text(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("user_email", sa.Text(), nullable=False),
        sa.Column("model", sa.String(length=128), nullable=False),
        sa.Column("trace_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("rolling_summary", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="active"),
        sa.Column("pending_tool_call", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("started_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column(
            "last_activity_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column("turn_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("redis_expires_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint(
            "status IN ('active', 'waiting_tool', 'closed', 'expired')",
            name="ck_agent_sessions_status",
        ),
        sa.PrimaryKeyConstraint("thread_id"),
    )
    op.create_index("idx_agent_sessions_user_id", "agent_sessions", ["user_id"], unique=False)
    op.create_index(
        "idx_agent_sessions_last_activity",
        "agent_sessions",
        ["last_activity_at"],
        unique=False,
    )
    op.create_index("idx_agent_sessions_status", "agent_sessions", ["status"], unique=False)

    op.create_table(
        "agent_messages",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("thread_id", sa.Text(), nullable=False),
        sa.Column("sequence_no", sa.Integer(), nullable=False),
        sa.Column("message_id", sa.Text(), nullable=False),
        sa.Column("role", sa.String(length=16), nullable=False),
        sa.Column("parts", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("token_count", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint(
            "role IN ('system', 'user', 'assistant', 'tool')",
            name="ck_agent_messages_role",
        ),
        sa.ForeignKeyConstraint(["thread_id"], ["agent_sessions.thread_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("thread_id", "sequence_no", name="uq_agent_messages_thread_seq"),
    )
    op.create_index(
        "idx_agent_messages_thread_created",
        "agent_messages",
        ["thread_id", "created_at"],
        unique=False,
    )
    op.create_index("idx_agent_messages_message_id", "agent_messages", ["message_id"], unique=False)

    op.create_table(
        "agent_tool_audit",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("thread_id", sa.Text(), nullable=False),
        sa.Column("tool_call_id", sa.Text(), nullable=False),
        sa.Column("tool_name", sa.Text(), nullable=False),
        sa.Column("tool_input", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("output", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error_text", sa.Text(), nullable=True),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("user_email", sa.Text(), nullable=False),
        sa.Column("requested_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("completed_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("trace_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("source", sa.String(length=16), nullable=False, server_default="client"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint(
            "status IN ('requested', 'output-available', 'output-error', 'timeout', 'denied', 'unregistered')",
            name="ck_agent_tool_audit_status",
        ),
        sa.ForeignKeyConstraint(["thread_id"], ["agent_sessions.thread_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("thread_id", "tool_call_id", name="uq_agent_tool_audit_call"),
    )
    op.create_index(
        "idx_agent_tool_audit_thread",
        "agent_tool_audit",
        ["thread_id", "requested_at"],
        unique=False,
    )
    op.create_index(
        "idx_agent_tool_audit_user",
        "agent_tool_audit",
        ["user_id", "requested_at"],
        unique=False,
    )
    op.create_index("idx_agent_tool_audit_tool_name", "agent_tool_audit", ["tool_name"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_agent_tool_audit_tool_name", table_name="agent_tool_audit")
    op.drop_index("idx_agent_tool_audit_user", table_name="agent_tool_audit")
    op.drop_index("idx_agent_tool_audit_thread", table_name="agent_tool_audit")
    op.drop_table("agent_tool_audit")

    op.drop_index("idx_agent_messages_message_id", table_name="agent_messages")
    op.drop_index("idx_agent_messages_thread_created", table_name="agent_messages")
    op.drop_table("agent_messages")

    op.drop_index("idx_agent_sessions_status", table_name="agent_sessions")
    op.drop_index("idx_agent_sessions_last_activity", table_name="agent_sessions")
    op.drop_index("idx_agent_sessions_user_id", table_name="agent_sessions")
    op.drop_table("agent_sessions")

