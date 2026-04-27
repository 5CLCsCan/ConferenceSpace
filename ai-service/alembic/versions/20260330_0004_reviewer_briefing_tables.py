"""Add reviewer briefing tables

Revision ID: 20260330_0004
Revises: 20260315_0003
Create Date: 2026-03-30 10:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260330_0004"
down_revision = "20260315_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "reviewer_briefing_runs",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("conference_id", sa.BigInteger(), nullable=False),
        sa.Column("assignment_id", sa.BigInteger(), nullable=False),
        sa.Column("submission_id", sa.BigInteger(), nullable=False),
        sa.Column("actor_id", sa.Text(), nullable=False),
        sa.Column("prompt_version", sa.Text(), nullable=False),
        sa.Column("input_fingerprint", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("request_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("error_detail", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("status IN ('completed', 'failed')", name="ck_reviewer_briefing_runs_status"),
        sa.PrimaryKeyConstraint("id"),
        schema="ai",
    )
    op.create_index(
        "idx_reviewer_briefing_runs_scope_created",
        "reviewer_briefing_runs",
        ["conference_id", "assignment_id", "created_at"],
        unique=False,
        schema="ai",
    )

    op.create_table(
        "reviewer_briefing_artifacts",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("run_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("conference_id", sa.BigInteger(), nullable=False),
        sa.Column("assignment_id", sa.BigInteger(), nullable=False),
        sa.Column("submission_id", sa.BigInteger(), nullable=False),
        sa.Column("actor_id", sa.Text(), nullable=False),
        sa.Column("submission_version", sa.Integer(), nullable=False),
        sa.Column("input_fingerprint", sa.Text(), nullable=False),
        sa.Column("artifact_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.ForeignKeyConstraint(["run_id"], ["ai.reviewer_briefing_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        schema="ai",
    )
    op.create_index(
        "idx_reviewer_briefing_artifacts_scope_generated",
        "reviewer_briefing_artifacts",
        ["conference_id", "assignment_id", "submission_id", "actor_id", "generated_at"],
        unique=False,
        schema="ai",
    )

    op.create_table(
        "reviewer_briefing_stage_records",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("run_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("stage_name", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("detail", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint(
            "status IN ('ok', 'skipped', 'blocked', 'failed')",
            name="ck_reviewer_briefing_stage_records_status",
        ),
        sa.ForeignKeyConstraint(["run_id"], ["ai.reviewer_briefing_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        schema="ai",
    )
    op.create_index(
        "idx_reviewer_briefing_stage_records_run_id",
        "reviewer_briefing_stage_records",
        ["run_id"],
        unique=False,
        schema="ai",
    )


def downgrade() -> None:
    op.drop_index("idx_reviewer_briefing_stage_records_run_id", table_name="reviewer_briefing_stage_records", schema="ai")
    op.drop_table("reviewer_briefing_stage_records", schema="ai")

    op.drop_index("idx_reviewer_briefing_artifacts_scope_generated", table_name="reviewer_briefing_artifacts", schema="ai")
    op.drop_table("reviewer_briefing_artifacts", schema="ai")

    op.drop_index("idx_reviewer_briefing_runs_scope_created", table_name="reviewer_briefing_runs", schema="ai")
    op.drop_table("reviewer_briefing_runs", schema="ai")
