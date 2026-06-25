#!/bin/bash
# JudoApp Backup -- Datenbank + Medien
# Ausfuehren auf dem Docker-Host: bash backup.sh [ziel-verzeichnis]

set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${1:-/opt/backup/judoapp}"
COMPOSE_DIR="$(dirname "$(realpath "$0")")"

mkdir -p "$BACKUP_DIR"
echo "[JudoApp Backup] $DATE -> $BACKUP_DIR"

# Datenbankdump
echo "  [1/2] PostgreSQL-Dump..."
docker compose -f "$COMPOSE_DIR/docker-compose.yml" exec -T db \
  pg_dump -U judoapp judoapp > "$BACKUP_DIR/db_$DATE.sql"
echo "        -> db_$DATE.sql ($(du -h "$BACKUP_DIR/db_$DATE.sql" | cut -f1))"

# Medien-Volume
echo "  [2/2] Media-Volume..."
docker run --rm \
  -v judoapp_media_data:/data:ro \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf "/backup/media_$DATE.tar.gz" /data 2>/dev/null
echo "        -> media_$DATE.tar.gz ($(du -h "$BACKUP_DIR/media_$DATE.tar.gz" | cut -f1))"

# Alte Backups aufraemen (behalte letzte 10)
echo "  [~] Alte Backups aufraemen (behalte letzte 10)..."
ls -t "$BACKUP_DIR"/db_*.sql 2>/dev/null | tail -n +11 | xargs -r rm
ls -t "$BACKUP_DIR"/media_*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm

echo "[JudoApp Backup] Fertig."

# Wiederherstellung:
#   docker compose exec -T db psql -U judoapp judoapp < db_DATUM.sql
#   docker run --rm -v judoapp_media_data:/data -v /pfad:/backup alpine \
#     tar xzf /backup/media_DATUM.tar.gz -C / --strip-components=0
