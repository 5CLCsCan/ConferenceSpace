"""Add submission material gating tables

Revision ID: 20260315_0003
Revises: 20260304_0002
Create Date: 2026-03-15 11:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260315_0003"
down_revision = "20260304_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "gating_runs",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("conference_id", sa.BigInteger(), nullable=False),
        sa.Column("submission_id", sa.BigInteger(), nullable=True),
        sa.Column("actor_id", sa.Text(), nullable=False),
        sa.Column("mode", sa.String(length=16), nullable=False),
        sa.Column("source", sa.Text(), nullable=False),
        sa.Column("verdict", sa.String(length=16), nullable=False),
        sa.Column("decision", sa.Text(), nullable=True),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("policy_hash", sa.Text(), nullable=False),
        sa.Column("input_fingerprint", sa.Text(), nullable=False),
        sa.Column("error_detail", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("mode IN ('advisory', 'gate')", name="ck_gating_runs_mode"),
        sa.CheckConstraint("verdict IN ('pass', 'warn', 'block', 'error')", name="ck_gating_runs_verdict"),
        sa.PrimaryKeyConstraint("id"),
        schema="ai",
    )
    op.create_index(
        "idx_gating_runs_conference_created_at",
        "gating_runs",
        ["conference_id", "created_at"],
        unique=False,
        schema="ai",
    )
    op.create_index(
        "idx_gating_runs_submission_id",
        "gating_runs",
        ["submission_id"],
        unique=False,
        schema="ai",
        postgresql_where=sa.text("submission_id IS NOT NULL"),
    )

    op.create_table(
        "gating_stage_records",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("run_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("stage_name", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("input_hash", sa.Text(), nullable=True),
        sa.Column("output_hash", sa.Text(), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("detail", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint("status IN ('ok', 'skipped', 'blocked', 'failed')", name="ck_gating_stage_records_status"),
        sa.ForeignKeyConstraint(["run_id"], ["ai.gating_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        schema="ai",
    )
    op.create_index(
        "idx_gating_stage_records_run_id",
        "gating_stage_records",
        ["run_id"],
        unique=False,
        schema="ai",
    )


def downgrade() -> None:
    op.drop_index("idx_gating_stage_records_run_id", table_name="gating_stage_records", schema="ai")
    op.drop_table("gating_stage_records", schema="ai")

    op.drop_index("idx_gating_runs_submission_id", table_name="gating_runs", schema="ai")
    op.drop_index("idx_gating_runs_conference_created_at", table_name="gating_runs", schema="ai")
    op.drop_table("gating_runs", schema="ai")
