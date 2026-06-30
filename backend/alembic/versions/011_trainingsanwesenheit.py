"""Trainingsgruppen und Anwesenheitskontrolle

Revision ID: 011
Revises: 010
Create Date: 2025-01-01
"""
import sqlalchemy as sa
from alembic import op

revision = "011"
down_revision = "010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "trainingsgruppen",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("gruppe_id", sa.Integer(), nullable=False),
        sa.Column(
            "wochentag",
            sa.Enum("montag", "dienstag", "mittwoch", "donnerstag", "freitag", "samstag", "sonntag", name="wochentag"),
            nullable=False,
        ),
        sa.Column("uhrzeit", sa.Time(), nullable=False),
        sa.ForeignKeyConstraint(["gruppe_id"], ["gruppen.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "trainings_anwesenheit",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("trainingsgruppe_id", sa.Integer(), nullable=False),
        sa.Column("kaempfer_id", sa.Integer(), nullable=False),
        sa.Column("datum", sa.Date(), nullable=False),
        sa.Column("anwesend", sa.Boolean(), nullable=False, server_default="true"),
        sa.ForeignKeyConstraint(["trainingsgruppe_id"], ["trainingsgruppen.id"]),
        sa.ForeignKeyConstraint(["kaempfer_id"], ["kaempfer.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("trainingsgruppe_id", "kaempfer_id", "datum", name="uq_anwesenheit"),
    )
    op.create_index("ix_anwesenheit_tg", "trainings_anwesenheit", ["trainingsgruppe_id"])
    op.create_index("ix_anwesenheit_kaempfer", "trainings_anwesenheit", ["kaempfer_id"])


def downgrade() -> None:
    op.drop_index("ix_anwesenheit_kaempfer", table_name="trainings_anwesenheit")
    op.drop_index("ix_anwesenheit_tg", table_name="trainings_anwesenheit")
    op.drop_table("trainings_anwesenheit")
    op.drop_table("trainingsgruppen")
    op.execute("DROP TYPE IF EXISTS wochentag")
