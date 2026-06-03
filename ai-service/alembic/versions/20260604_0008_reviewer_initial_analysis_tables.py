"""Add reviewer initial analysis tables

Revision ID: 20260604_0008
Revises: 20260418_0007
Create Date: 2026-06-04 00:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260604_0008"
down_revision = "20260418_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "reviewer_initial_analysis_runs",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("conference_id", sa.BigInteger(), nullable=False),
        sa.Column("assignment_id", sa.BigInteger(), nullable=False),
        sa.Column("submission_id", sa.BigInteger(), nullable=False),
        sa.Column("actor_id", sa.Text(), nullable=False),
        sa.Column("submission_state_fingerprint", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("request_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("error_detail", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("status IN ('completed', 'failed')", name="ck_reviewer_initial_analysis_runs_status"),
        sa.PrimaryKeyConstraint("id"),
        schema="ai",
    )
    op.create_index(
        "idx_reviewer_initial_analysis_runs_scope_created",
        "reviewer_initial_analysis_runs",
        ["conference_id", "assignment_id", "created_at"],
        unique=False,
        schema="ai",
    )

    op.create_table(
        "reviewer_initial_analysis_artifacts",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("run_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("conference_id", sa.BigInteger(), nullable=False),
        sa.Column("assignment_id", sa.BigInteger(), nullable=False),
        sa.Column("submission_id", sa.BigInteger(), nullable=False),
        sa.Column("actor_id", sa.Text(), nullable=False),
        sa.Column("submission_state_fingerprint", sa.Text(), nullable=False),
        sa.Column("artifact_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.ForeignKeyConstraint(["run_id"], ["ai.reviewer_initial_analysis_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        schema="ai",
    )
    op.create_index(
        "idx_reviewer_initial_analysis_artifacts_scope_generated",
        "reviewer_initial_analysis_artifacts",
        ["conference_id", "assignment_id", "submission_id", "actor_id", "generated_at"],
        unique=False,
        schema="ai",
    )

    op.create_table(
        "reviewer_initial_analysis_stage_records",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("run_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("stage_name", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("detail", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint(
            "status IN ('ok', 'skipped', 'blocked', 'failed')",
            name="ck_reviewer_initial_analysis_stage_records_status",
        ),
        sa.ForeignKeyConstraint(["run_id"], ["ai.reviewer_initial_analysis_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        schema="ai",
    )
    op.create_index(
        "idx_reviewer_initial_analysis_stage_records_run_id",
        "reviewer_initial_analysis_stage_records",
        ["run_id"],
        unique=False,
        schema="ai",
    )


def downgrade() -> None:
    op.drop_index(
        "idx_reviewer_initial_analysis_stage_records_run_id",
        table_name="reviewer_initial_analysis_stage_records",
        schema="ai",
    )
    op.drop_table("reviewer_initial_analysis_stage_records", schema="ai")

    op.drop_index(
        "idx_reviewer_initial_analysis_artifacts_scope_generated",
        table_name="reviewer_initial_analysis_artifacts",
        schema="ai",
    )
    op.drop_table("reviewer_initial_analysis_artifacts", schema="ai")

    op.drop_index(
        "idx_reviewer_initial_analysis_runs_scope_created",
        table_name="reviewer_initial_analysis_runs",
        schema="ai",
    )
    op.drop_table("reviewer_initial_analysis_runs", schema="ai")
