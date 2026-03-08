"""Add conversation title and listing indexes

Revision ID: 20260304_0002
Revises: 20260303_0001
Create Date: 2026-03-04 09:10:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260304_0002"
down_revision = "20260303_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "ai_sessions",
        sa.Column("title", sa.Text(), nullable=False, server_default="New Conversation"),
        schema="ai",
    )
    op.create_index(
        "idx_ai_sessions_user_last_activity_thread",
        "ai_sessions",
        ["user_id", "last_activity_at", "thread_id"],
        unique=False,
        schema="ai",
    )
    op.create_unique_constraint(
        "uq_ai_messages_thread_message_id",
        "ai_messages",
        ["thread_id", "message_id"],
        schema="ai",
    )

    op.execute(
        """
        WITH first_user_message AS (
            SELECT DISTINCT ON (m.thread_id)
                m.thread_id,
                LEFT(
                    REGEXP_REPLACE(
                        BTRIM(
                            COALESCE(
                                (
                                    SELECT p->>'text'
                                    FROM jsonb_array_elements(
                                        CASE
                                            WHEN jsonb_typeof(m.parts) = 'array' THEN m.parts
                                            WHEN jsonb_typeof(m.parts) = 'object' THEN jsonb_build_array(m.parts)
                                            ELSE '[]'::jsonb
                                        END
                                    ) AS p
                                    WHERE p->>'type' = 'text'
                                      AND BTRIM(COALESCE(p->>'text', '')) <> ''
                                    LIMIT 1
                                ),
                                ''
                            )
                        ),
                        E'\\s+',
                        ' ',
                        'g'
                    ),
                    80
                ) AS generated_title
            FROM ai.ai_messages AS m
            WHERE m.role = 'user'
            ORDER BY m.thread_id, m.sequence_no ASC
        )
        UPDATE ai.ai_sessions AS s
        SET title = COALESCE(NULLIF(f.generated_title, ''), 'New Conversation')
        FROM first_user_message AS f
        WHERE s.thread_id = f.thread_id;
        """
    )


def downgrade() -> None:
    op.drop_constraint("uq_ai_messages_thread_message_id", "ai_messages", schema="ai", type_="unique")
    op.drop_index("idx_ai_sessions_user_last_activity_thread", table_name="ai_sessions", schema="ai")
    op.drop_column("ai_sessions", "title", schema="ai")
