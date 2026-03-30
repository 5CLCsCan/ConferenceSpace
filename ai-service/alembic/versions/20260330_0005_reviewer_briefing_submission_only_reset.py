"""Reset reviewer briefing tables to submission-only fingerprint contract

Revision ID: 20260330_0005
Revises: 20260330_0004
Create Date: 2026-03-30 17:30:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260330_0005"
down_revision = "20260330_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("reviewer_briefing_runs", "prompt_version", schema="ai")
    op.alter_column(
        "reviewer_briefing_runs",
        "input_fingerprint",
        new_column_name="submission_state_fingerprint",
        schema="ai",
    )
    op.drop_column("reviewer_briefing_artifacts", "submission_version", schema="ai")
    op.alter_column(
        "reviewer_briefing_artifacts",
        "input_fingerprint",
        new_column_name="submission_state_fingerprint",
        schema="ai",
    )


def downgrade() -> None:
    op.alter_column(
        "reviewer_briefing_artifacts",
        "submission_state_fingerprint",
        new_column_name="input_fingerprint",
        schema="ai",
    )
    op.add_column(
        "reviewer_briefing_artifacts",
        sa.Column("submission_version", sa.Integer(), nullable=False, server_default="0"),
        schema="ai",
    )
    op.alter_column(
        "reviewer_briefing_artifacts",
        "submission_version",
        server_default=None,
        schema="ai",
    )
    op.alter_column(
        "reviewer_briefing_runs",
        "submission_state_fingerprint",
        new_column_name="input_fingerprint",
        schema="ai",
    )
    op.add_column(
        "reviewer_briefing_runs",
        sa.Column("prompt_version", sa.Text(), nullable=False, server_default="legacy"),
        schema="ai",
    )
    op.alter_column(
        "reviewer_briefing_runs",
        "prompt_version",
        server_default=None,
        schema="ai",
    )
