"""Phase 2 Fixes -- yuko, U9/U11/U13, Gewichtsklassen

Revision ID: 003
Revises: 002
Create Date: 2025-01-01
"""
import sqlalchemy as sa
from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None

# ALTER TYPE ADD VALUE muss vor dem Transaktions-COMMIT laufen (PG 12+: erlaubt in Transaktion,
# aber neue Werte sind erst nach COMMIT in anderen Sessions sichtbar).
# Fuer INSERT in derselben Migration: commit + begin.


def upgrade() -> None:
    bind = op.get_bind()

    # Enum-Erweiterungen
    bind.execute(sa.text("COMMIT"))
    bind.execute(sa.text("ALTER TYPE ereignistyp ADD VALUE IF NOT EXISTS 'yuko'"))
    bind.execute(sa.text("ALTER TYPE altersklasse ADD VALUE IF NOT EXISTS 'U9'"))
    bind.execute(sa.text("ALTER TYPE altersklasse ADD VALUE IF NOT EXISTS 'U11'"))
    bind.execute(sa.text("ALTER TYPE altersklasse ADD VALUE IF NOT EXISTS 'U13'"))
    bind.execute(sa.text("BEGIN"))

    # U9 Gewichtsklassen
    bind.execute(sa.text("""
        INSERT INTO gewichtsklassen (bezeichnung, max_kg, geschlecht, altersklasse) VALUES
        ('-25', 25, 'm', 'U9'),  ('-28', 28, 'm', 'U9'),  ('-32', 32, 'm', 'U9'),
        ('-36', 36, 'm', 'U9'),  ('-40', 40, 'm', 'U9'),  ('-45', 45, 'm', 'U9'),  ('+45', NULL, 'm', 'U9'),
        ('-25', 25, 'w', 'U9'),  ('-28', 28, 'w', 'U9'),  ('-32', 32, 'w', 'U9'),
        ('-36', 36, 'w', 'U9'),  ('-40', 40, 'w', 'U9'),  ('-45', 45, 'w', 'U9'),  ('+45', NULL, 'w', 'U9')
    """))

    # U11 Gewichtsklassen
    bind.execute(sa.text("""
        INSERT INTO gewichtsklassen (bezeichnung, max_kg, geschlecht, altersklasse) VALUES
        ('-28', 28, 'm', 'U11'), ('-31', 31, 'm', 'U11'), ('-34', 34, 'm', 'U11'),
        ('-38', 38, 'm', 'U11'), ('-42', 42, 'm', 'U11'), ('-46', 46, 'm', 'U11'), ('+46', NULL, 'm', 'U11'),
        ('-28', 28, 'w', 'U11'), ('-31', 31, 'w', 'U11'), ('-34', 34, 'w', 'U11'),
        ('-38', 38, 'w', 'U11'), ('-42', 42, 'w', 'U11'), ('-46', 46, 'w', 'U11'), ('+46', NULL, 'w', 'U11')
    """))

    # U13 Gewichtsklassen
    bind.execute(sa.text("""
        INSERT INTO gewichtsklassen (bezeichnung, max_kg, geschlecht, altersklasse) VALUES
        ('-34', 34, 'm', 'U13'), ('-38', 38, 'm', 'U13'), ('-42', 42, 'm', 'U13'),
        ('-46', 46, 'm', 'U13'), ('-50', 50, 'm', 'U13'), ('-55', 55, 'm', 'U13'),
        ('-60', 60, 'm', 'U13'), ('+60', NULL, 'm', 'U13'),
        ('-36', 36, 'w', 'U13'), ('-40', 40, 'w', 'U13'), ('-44', 44, 'w', 'U13'),
        ('-48', 48, 'w', 'U13'), ('-52', 52, 'w', 'U13'), ('-57', 57, 'w', 'U13'), ('+57', NULL, 'w', 'U13')
    """))


def downgrade() -> None:
    bind = op.get_bind()
    bind.execute(sa.text("DELETE FROM gewichtsklassen WHERE altersklasse IN ('U9', 'U11', 'U13')"))
