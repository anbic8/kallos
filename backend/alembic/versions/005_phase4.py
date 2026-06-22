"""Phase 4 -- Mannschaftskaempfe und Einzelkaempfe

Revision ID: 005
Revises: 004
Create Date: 2025-01-01
"""
import sqlalchemy as sa
from alembic import op

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "mannschaftskaempfe",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("veranstaltung_id", sa.Integer(), nullable=False),
        sa.Column("verein_heim_id", sa.Integer(), nullable=False),
        sa.Column("verein_gast_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["veranstaltung_id"], ["veranstaltungen.id"]),
        sa.ForeignKeyConstraint(["verein_heim_id"], ["vereine.id"]),
        sa.ForeignKeyConstraint(["verein_gast_id"], ["vereine.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_mk_veranstaltung", "mannschaftskaempfe", ["veranstaltung_id"])

    op.create_table(
        "mannschaftskampf_einzelkaempfe",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("mannschaftskampf_id", sa.Integer(), nullable=False),
        sa.Column("gewichtsklasse_id", sa.Integer(), nullable=True),
        sa.Column("kampf_id", sa.Integer(), nullable=True),
        sa.Column(
            "kampflos_sieger",
            sa.Enum("heim", "gast", name="kampflosseite"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["mannschaftskampf_id"], ["mannschaftskaempfe.id"]),
        sa.ForeignKeyConstraint(["gewichtsklasse_id"], ["gewichtsklassen.id"]),
        sa.ForeignKeyConstraint(["kampf_id"], ["kaempfe.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ek_mk", "mannschaftskampf_einzelkaempfe", ["mannschaftskampf_id"])


def downgrade() -> None:
    op.drop_index("ix_ek_mk", table_name="mannschaftskampf_einzelkaempfe")
    op.drop_table("mannschaftskampf_einzelkaempfe")
    op.drop_index("ix_mk_veranstaltung", table_name="mannschaftskaempfe")
    op.drop_table("mannschaftskaempfe")
    op.execute("DROP TYPE IF EXISTS kampflosseite")
