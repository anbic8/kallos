"""Phase 2 -- Veranstaltungen, Kaempfe, Kampf-Ereignisse

Revision ID: 002
Revises: 001
Create Date: 2025-01-01
"""
import sqlalchemy as sa
from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "veranstaltungen",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column(
            "typ",
            sa.Enum("liga", "turnier", "meisterschaft", "kampftag", "pokal", "sonstiges", name="veranstaltungstyp"),
            nullable=False,
        ),
        sa.Column("datum", sa.Date(), nullable=True),
        sa.Column("ort", sa.String(255), nullable=True),
        sa.Column("veranstalter", sa.String(255), nullable=True),
        sa.Column("notizen", sa.Text(), nullable=True),
        sa.Column("parent_liga_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["parent_liga_id"], ["veranstaltungen.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "kaempfe",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("veranstaltung_id", sa.Integer(), nullable=False),
        sa.Column("kaempfer_weiss_id", sa.Integer(), nullable=False),
        sa.Column("kaempfer_blau_id", sa.Integer(), nullable=False),
        sa.Column("gewichtsklasse_id", sa.Integer(), nullable=True),
        sa.Column(
            "runde",
            sa.Enum("vorrunde", "viertelfinale", "halbfinale", "finale", "gruppenphase", "direktkampf", "sonstiges", name="kampfrunde"),
            nullable=True,
        ),
        sa.Column("uhrzeit", sa.Time(), nullable=True),
        sa.Column(
            "sieger",
            sa.Enum("weiss", "blau", "unentschieden", name="sieger"),
            nullable=False,
        ),
        sa.Column(
            "abschluss",
            sa.Enum("ippon", "waza_ari", "yusei_gachi", "shido", "hansoku_make", "aufgabe", "sonstiges", name="abschluss"),
            nullable=False,
        ),
        sa.Column("sieger_technik_id", sa.Integer(), nullable=True),
        sa.Column("sieger_technik_frei", sa.String(255), nullable=True),
        sa.Column("kampfzeit_sek", sa.Integer(), nullable=True),
        sa.Column("is_scouting", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("notizen", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["veranstaltung_id"], ["veranstaltungen.id"]),
        sa.ForeignKeyConstraint(["kaempfer_weiss_id"], ["kaempfer.id"]),
        sa.ForeignKeyConstraint(["kaempfer_blau_id"], ["kaempfer.id"]),
        sa.ForeignKeyConstraint(["gewichtsklasse_id"], ["gewichtsklassen.id"]),
        sa.ForeignKeyConstraint(["sieger_technik_id"], ["techniken.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_kaempfe_veranstaltung", "kaempfe", ["veranstaltung_id"])
    op.create_index("ix_kaempfe_weiss", "kaempfe", ["kaempfer_weiss_id"])
    op.create_index("ix_kaempfe_blau", "kaempfe", ["kaempfer_blau_id"])

    op.create_table(
        "kampf_ereignisse",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("kampf_id", sa.Integer(), nullable=False),
        sa.Column("zeitpunkt_sek", sa.Integer(), nullable=True),
        sa.Column(
            "typ",
            sa.Enum("ippon", "waza_ari", "shido", "hansoku_make", "golden_score", "medizin", "sonstiges", name="ereignistyp"),
            nullable=False,
        ),
        sa.Column(
            "farbe",
            sa.Enum("weiss", "blau", name="kaempferfarbe"),
            nullable=False,
        ),
        sa.Column("technik_id", sa.Integer(), nullable=True),
        sa.Column("technik_frei", sa.String(255), nullable=True),
        sa.Column("notiz", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["kampf_id"], ["kaempfe.id"]),
        sa.ForeignKeyConstraint(["technik_id"], ["techniken.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ereignisse_kampf", "kampf_ereignisse", ["kampf_id"])


def downgrade() -> None:
    op.drop_index("ix_ereignisse_kampf", table_name="kampf_ereignisse")
    op.drop_table("kampf_ereignisse")
    op.drop_index("ix_kaempfe_blau", table_name="kaempfe")
    op.drop_index("ix_kaempfe_weiss", table_name="kaempfe")
    op.drop_index("ix_kaempfe_veranstaltung", table_name="kaempfe")
    op.drop_table("kaempfe")
    op.drop_table("veranstaltungen")
    op.execute("DROP TYPE IF EXISTS veranstaltungstyp")
    op.execute("DROP TYPE IF EXISTS kampfrunde")
    op.execute("DROP TYPE IF EXISTS sieger")
    op.execute("DROP TYPE IF EXISTS abschluss")
    op.execute("DROP TYPE IF EXISTS ereignistyp")
    op.execute("DROP TYPE IF EXISTS kaempferfarbe")
