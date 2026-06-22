"""Phase 1 -- Initialschema

Revision ID: 001
Revises:
Create Date: 2025-01-01
"""
import sqlalchemy as sa
from alembic import op

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("rolle", sa.Enum("admin", "trainer", "athlet", name="userrolle"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "vereine",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("ort", sa.String(255), nullable=True),
        sa.Column("verband", sa.String(255), nullable=True),
        sa.Column("logo_url", sa.String(500), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "kaempfer",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("verein_id", sa.Integer(), nullable=True),
        sa.Column("vorname", sa.String(100), nullable=False),
        sa.Column("nachname", sa.String(100), nullable=False),
        sa.Column("geburtsjahr", sa.Integer(), nullable=True),
        sa.Column("geschlecht", sa.Enum("m", "w", "d", name="geschlecht"), nullable=True),
        sa.Column(
            "aktueller_guertel",
            sa.Enum("weiss", "gelb", "orange", "gruen", "blau", "braun", "schwarz", "dan2", "dan3", "dan4", "dan5", name="guertel"),
            nullable=True,
        ),
        sa.Column("foto_url", sa.String(500), nullable=True),
        sa.Column("notizen", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["verein_id"], ["vereine.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "gewichtsklassen",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("bezeichnung", sa.String(50), nullable=False),
        sa.Column("max_kg", sa.Float(), nullable=True),
        sa.Column("geschlecht", sa.Enum("m", "w", name="gkgeschlecht"), nullable=True),
        sa.Column("altersklasse", sa.Enum("U15", "U18", "U21", "Senior", name="altersklasse"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "techniken",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column(
            "kategorie",
            sa.Enum("nage-waza", "katame-waza", "atemi-waza", "sonstiges", name="technikkategorie"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )


def downgrade() -> None:
    op.drop_table("techniken")
    op.drop_table("gewichtsklassen")
    op.drop_table("kaempfer")
    op.drop_table("vereine")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS userrolle")
    op.execute("DROP TYPE IF EXISTS geschlecht")
    op.execute("DROP TYPE IF EXISTS guertel")
    op.execute("DROP TYPE IF EXISTS gkgeschlecht")
    op.execute("DROP TYPE IF EXISTS altersklasse")
    op.execute("DROP TYPE IF EXISTS technikkategorie")
