"""KampfEreignis: video_timestamp_sek fuer Video-Sync

Revision ID: 009
Revises: 008
Create Date: 2025-01-01
"""
import sqlalchemy as sa
from alembic import op

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("kampf_ereignisse", sa.Column("video_timestamp_sek", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("kampf_ereignisse", "video_timestamp_sek")
