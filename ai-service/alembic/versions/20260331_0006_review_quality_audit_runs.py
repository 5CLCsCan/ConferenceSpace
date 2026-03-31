"""Add review quality audit runs

Revision ID: 20260331_0006
Revises: 20260330_0005
Create Date: 2026-03-31 16:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260331_0006"
down_revision = "20260330_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "review_quality_audit_runs",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("conference_id", sa.BigInteger(), nullable=False),
        sa.Column("assignment_id", sa.BigInteger(), nullable=False),
        sa.Column("submission_id", sa.BigInteger(), nullable=False),
        sa.Column("actor_id", sa.Text(), nullable=False),
        sa.Column("mode", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("result_status", sa.String(length=16), nullable=True),
        sa.Column("request_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("response_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error_detail", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "mode IN ('draft_save', 'submit_preflight', 'submit_enforcement')",
            name="ck_review_quality_audit_runs_mode",
        ),
        sa.CheckConstraint("status IN ('completed', 'failed')", name="ck_review_quality_audit_runs_status"),
        sa.CheckConstraint(
            "result_status IN ('pass', 'warn', 'block') OR result_status IS NULL",
            name="ck_review_quality_audit_runs_result_status",
        ),
        sa.PrimaryKeyConstraint("id"),
        schema="ai",
    )
    op.create_index(
        "idx_review_quality_audit_runs_scope_created",
        "review_quality_audit_runs",
        ["conference_id", "assignment_id", "created_at"],
        unique=False,
        schema="ai",
    )


def downgrade() -> None:
    op.drop_index("idx_review_quality_audit_runs_scope_created", table_name="review_quality_audit_runs", schema="ai")
    op.drop_table("review_quality_audit_runs", schema="ai")
