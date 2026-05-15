"""psych assessment tables

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-14 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "psych_invites",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()::text")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("token", sa.String(36), nullable=False),
        sa.Column("application_id", sa.String(36), sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("token"),
    )
    op.create_index("ix_psych_invites_token", "psych_invites", ["token"])
    op.create_index("ix_psych_invites_application_id", "psych_invites", ["application_id"])

    op.create_table(
        "psych_responses",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()::text")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("invite_id", sa.String(36), sa.ForeignKey("psych_invites.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("big_five_answers", sa.JSON, nullable=False, server_default="{}"),
        sa.Column("stress_answers", sa.JSON, nullable=False, server_default="{}"),
        sa.Column("depression_answers", sa.JSON, nullable=False, server_default="{}"),
        sa.Column("motivators_answers", sa.JSON, nullable=False, server_default="{}"),
        sa.Column("disc_answers", sa.JSON, nullable=False, server_default="{}"),
        sa.Column("qa_answers", sa.JSON, nullable=False, server_default="{}"),
        sa.Column("scores", sa.JSON, nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_psych_responses_invite_id", "psych_responses", ["invite_id"])


def downgrade() -> None:
    op.drop_table("psych_responses")
    op.drop_table("psych_invites")
