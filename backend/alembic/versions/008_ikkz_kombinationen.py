"""IKKZ: Kombinationstechnik und Reihenfolge

Revision ID: 008
Revises: 007
Create Date: 2025-01-01
"""
import sqlalchemy as sa
from alembic import op

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("kampfkonzept_eintraege", sa.Column("kombinations_technik_id", sa.Integer(), nullable=True))
    op.add_column("kampfkonzept_eintraege", sa.Column("kombinations_technik_frei", sa.String(255), nullable=True))
    op.add_column("kampfkonzept_eintraege", sa.Column(
        "hauptwaffe_position",
        sa.Enum("erst", "zweit", name="hauptwaffeposition"),
        nullable=True,
    ))
    op.create_foreign_key(None, "kampfkonzept_eintraege", "techniken", ["kombinations_technik_id"], ["id"])


def downgrade() -> None:
    op.drop_column("kampfkonzept_eintraege", "hauptwaffe_position")
    op.drop_column("kampfkonzept_eintraege", "kombinations_technik_frei")
    op.drop_column("kampfkonzept_eintraege", "kombinations_technik_id")
    op.execute("DROP TYPE IF EXISTS hauptwaffeposition")
