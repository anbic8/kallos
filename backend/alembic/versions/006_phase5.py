"""Phase 5 -- IKKZ und Leistungstests

Revision ID: 006
Revises: 005
Create Date: 2025-01-01
"""
import sqlalchemy as sa
from alembic import op

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "kampfkonzept_eintraege",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("kaempfer_id", sa.Integer(), nullable=False),
        sa.Column("technik_id", sa.Integer(), nullable=True),
        sa.Column("technik_frei", sa.String(255), nullable=True),
        sa.Column("richtung", sa.Enum("links", "rechts", "beide", name="ikkkzrichtung"), nullable=False),
        sa.Column(
            "situation",
            sa.Enum("angriff", "konter", "aufsetzer", "ne_waza_einstieg", "sonstiges", name="ikkzsituation"),
            nullable=False,
        ),
        sa.Column("prioritaet", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("notizen", sa.Text(), nullable=True),
        sa.Column("erstellt_von", sa.Integer(), nullable=True),
        sa.Column("datum", sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(["kaempfer_id"], ["kaempfer.id"]),
        sa.ForeignKeyConstraint(["technik_id"], ["techniken.id"]),
        sa.ForeignKeyConstraint(["erstellt_von"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ikkz_kaempfer", "kampfkonzept_eintraege", ["kaempfer_id"])

    op.create_table(
        "leistungstests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("kaempfer_id", sa.Integer(), nullable=False),
        sa.Column("datum", sa.Date(), nullable=False),
        sa.Column("testtyp", sa.String(255), nullable=False),
        sa.Column("messwert_zahl", sa.Float(), nullable=True),
        sa.Column("messwert_text", sa.String(255), nullable=True),
        sa.Column("einheit", sa.String(50), nullable=True),
        sa.Column("notizen", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["kaempfer_id"], ["kaempfer.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_leistungstest_kaempfer", "leistungstests", ["kaempfer_id"])


def downgrade() -> None:
    op.drop_index("ix_leistungstest_kaempfer", table_name="leistungstests")
    op.drop_table("leistungstests")
    op.drop_index("ix_ikkz_kaempfer", table_name="kampfkonzept_eintraege")
    op.drop_table("kampfkonzept_eintraege")
    op.execute("DROP TYPE IF EXISTS ikkkzrichtung")
    op.execute("DROP TYPE IF EXISTS ikkzsituation")
