"""Add decision copilot persistence tables

Revision ID: 20260801_0009
Revises: 20260604_0008
Create Date: 2026-07-28
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "20260801_0009"
down_revision = "20260604_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "decision_copilot_runs",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("conference_id", sa.BIGINT(), nullable=False),
        sa.Column("submission_id", sa.BIGINT(), nullable=False),
        sa.Column("actor_id", sa.Text(), nullable=False),
        sa.Column("action", sa.VARCHAR(length=16), nullable=False),
        sa.Column("evidence_fingerprint", sa.Text(), nullable=False),
        sa.Column("component_fingerprints", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("status", sa.VARCHAR(length=16), nullable=False),
        sa.Column("request_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("artifact_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error_detail", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("status IN ('completed', 'failed')", name="ck_decision_copilot_runs_status"),
        sa.CheckConstraint("action IN ('lookup', 'generate', 'regenerate')", name="ck_decision_copilot_runs_action"),
        schema="ai",
    )
    op.create_index(
        "idx_decision_copilot_runs_scope_created",
        "decision_copilot_runs",
        ["conference_id", "submission_id", "created_at"],
        unique=False,
        schema="ai",
    )

    op.create_table(
        "decision_copilot_current_artifacts",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("conference_id", sa.BIGINT(), nullable=False),
        sa.Column("submission_id", sa.BIGINT(), nullable=False),
        sa.Column("run_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("evidence_fingerprint", sa.Text(), nullable=False),
        sa.Column("component_fingerprints", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("artifact_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["run_id"], ["ai.decision_copilot_runs.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("conference_id", "submission_id", name="uq_decision_copilot_current_scope"),
        schema="ai",
    )
    op.create_index(
        "idx_decision_copilot_current_scope",
        "decision_copilot_current_artifacts",
        ["conference_id", "submission_id"],
        unique=False,
        schema="ai",
    )


def downgrade() -> None:
    op.drop_index(
        "idx_decision_copilot_current_scope",
        table_name="decision_copilot_current_artifacts",
        schema="ai",
    )
    op.drop_table("decision_copilot_current_artifacts", schema="ai")
    op.drop_index(
        "idx_decision_copilot_runs_scope_created",
        table_name="decision_copilot_runs",
        schema="ai",
    )
    op.drop_table("decision_copilot_runs", schema="ai")
