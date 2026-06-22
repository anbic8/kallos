"""Phase 3 -- Kampf-Medien und Erfolge

Revision ID: 004
Revises: 003
Create Date: 2025-01-01
"""
import sqlalchemy as sa
from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "kampf_medien",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("kampf_id", sa.Integer(), nullable=False),
        sa.Column("typ", sa.Enum("foto", "video", name="medientyp"), nullable=False),
        sa.Column("datei_pfad", sa.String(500), nullable=True),
        sa.Column("externe_url", sa.String(1000), nullable=True),
        sa.Column("timestamp_sek", sa.Integer(), nullable=True),
        sa.Column("beschriftung", sa.String(500), nullable=True),
        sa.ForeignKeyConstraint(["kampf_id"], ["kaempfe.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_kampf_medien_kampf", "kampf_medien", ["kampf_id"])

    op.create_table(
        "erfolge",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("kaempfer_id", sa.Integer(), nullable=False),
        sa.Column("veranstaltung_id", sa.Integer(), nullable=False),
        sa.Column("gewichtsklasse_id", sa.Integer(), nullable=True),
        sa.Column("platz", sa.Integer(), nullable=False),
        sa.Column("kategorie", sa.Enum("einzel", "mannschaft", name="erfolgkategorie"), nullable=False),
        sa.Column("foto_url", sa.String(500), nullable=True),
        sa.Column("notizen", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["kaempfer_id"], ["kaempfer.id"]),
        sa.ForeignKeyConstraint(["veranstaltung_id"], ["veranstaltungen.id"]),
        sa.ForeignKeyConstraint(["gewichtsklasse_id"], ["gewichtsklassen.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_erfolge_kaempfer", "erfolge", ["kaempfer_id"])


def downgrade() -> None:
    op.drop_index("ix_erfolge_kaempfer", table_name="erfolge")
    op.drop_table("erfolge")
    op.drop_index("ix_kampf_medien_kampf", table_name="kampf_medien")
    op.drop_table("kampf_medien")
    op.execute("DROP TYPE IF EXISTS medientyp")
    op.execute("DROP TYPE IF EXISTS erfolgkategorie")
