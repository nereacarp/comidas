#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/deploy/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
[[ "$BACKUP_RETENTION_DAYS" =~ ^[0-9]+$ ]] || {
  echo "BACKUP_RETENTION_DAYS debe ser un número entero" >&2
  exit 1
}
mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUTPUT="$BACKUP_DIR/comidas-$STAMP.dump"

cd "$ROOT_DIR"
docker compose --env-file .env -f deploy/docker-compose.prod.yml exec -T db \
  pg_dump -U comidas -d comidas -Fc > "$OUTPUT"
test -s "$OUTPUT" || { echo "La copia está vacía" >&2; exit 1; }
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'comidas-*.dump' \
  -mtime "+$BACKUP_RETENTION_DAYS" -delete
echo "$OUTPUT"
