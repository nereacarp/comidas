#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DUMP_FILE="${1:-}"
[[ -n "$DUMP_FILE" && -s "$DUMP_FILE" ]] || { echo "Uso: $0 deploy/backups/comidas-AAAAMMDD-HHMMSS.dump" >&2; exit 1; }
RESTORE_DB="comidas_restore_check_$(date +%s)_$$"
[[ "$RESTORE_DB" =~ ^comidas_restore_check_[0-9_]+$ ]] || exit 1
cd "$ROOT_DIR"
cleanup() { docker compose --env-file .env -f deploy/docker-compose.prod.yml exec -T db dropdb -U comidas --if-exists "$RESTORE_DB" >/dev/null 2>&1 || true; }
trap cleanup EXIT
docker compose --env-file .env -f deploy/docker-compose.prod.yml exec -T db createdb -U comidas "$RESTORE_DB"
docker compose --env-file .env -f deploy/docker-compose.prod.yml exec -T db pg_restore -U comidas -d "$RESTORE_DB" --clean --if-exists --no-owner < "$DUMP_FILE"
TABLE_COUNT="$(docker compose --env-file .env -f deploy/docker-compose.prod.yml exec -T db psql -U comidas -d "$RESTORE_DB" -Atc "select count(*) from information_schema.tables where table_schema='public';")"
[[ "$TABLE_COUNT" =~ ^[0-9]+$ && "$TABLE_COUNT" -gt 0 ]] || { echo "La restauración no contiene tablas públicas" >&2; exit 1; }
docker compose --env-file .env -f deploy/docker-compose.prod.yml exec -T db psql -U comidas -d "$RESTORE_DB" -v ON_ERROR_STOP=1 -Atc 'select count(*) from "User"; select count(*) from "Household"; select count(*) from "Recipe";'
echo "Restauración verificada en una base temporal ($TABLE_COUNT tablas)."
