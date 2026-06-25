"""Gruppen fuer Kaempfer (m:n)

Revision ID: 010
Revises: 009
Create Date: 2025-01-01
"""
import sqlalchemy as sa
from alembic import op

revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "gruppen",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("beschreibung", sa.String(500), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_table(
        "kaempfer_gruppen",
        sa.Column("kaempfer_id", sa.Integer(), nullable=False),
        sa.Column("gruppe_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["kaempfer_id"], ["kaempfer.id"]),
        sa.ForeignKeyConstraint(["gruppe_id"], ["gruppen.id"]),
        sa.PrimaryKeyConstraint("kaempfer_id", "gruppe_id"),
    )


def downgrade() -> None:
    op.drop_table("kaempfer_gruppen")
    op.drop_table("gruppen")
