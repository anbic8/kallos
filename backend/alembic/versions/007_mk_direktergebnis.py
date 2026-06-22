"""Mannschaftskampf: siege_heim/gast als direkte Felder

Revision ID: 007
Revises: 006
Create Date: 2025-01-01
"""
import sqlalchemy as sa
from alembic import op

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("mannschaftskaempfe", sa.Column("siege_heim_direkt", sa.Integer(), nullable=True))
    op.add_column("mannschaftskaempfe", sa.Column("siege_gast_direkt", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("mannschaftskaempfe", "siege_gast_direkt")
    op.drop_column("mannschaftskaempfe", "siege_heim_direkt")
