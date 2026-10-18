#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

: "${DEPLOY_HOST:?Define DEPLOY_HOST con el nombre o IP del servidor}"
DEPLOY_USER="${DEPLOY_USER:-comidas}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/comidas}"
REMOTE="${DEPLOY_USER}@${DEPLOY_HOST}"

command -v rsync >/dev/null || { echo "Falta rsync" >&2; exit 1; }
command -v ssh >/dev/null || { echo "Falta ssh" >&2; exit 1; }

echo ">>> Comprobando servidor y creando copia de seguridad previa..."
ssh "$REMOTE" "test -f '$DEPLOY_DIR/.env' && command -v docker >/dev/null"
ssh "$REMOTE" "if test -f '$DEPLOY_DIR/deploy/docker-compose.prod.yml'; then cd '$DEPLOY_DIR' && mkdir -p deploy/backups && docker compose --env-file .env -f deploy/docker-compose.prod.yml exec -T db pg_dump -U comidas -d comidas -Fc > 'deploy/backups/predeploy-\$(date +%Y%m%d-%H%M%S).dump'; fi"

echo ">>> Sincronizando código..."
rsync -az --delete-delay \
  --exclude='.git' --exclude='.env' --exclude='node_modules' --exclude='dist' \
  --exclude='coverage' --exclude='backups' --exclude='.initialized' --exclude='private' --exclude='.claude' --exclude='CLAUDE.md' \
  ./ "$REMOTE:$DEPLOY_DIR/"

echo ">>> Validando, construyendo y actualizando servicios..."
ssh "$REMOTE" "cd '$DEPLOY_DIR' && docker compose --env-file .env -f deploy/docker-compose.prod.yml config --quiet && docker compose --env-file .env -f deploy/docker-compose.prod.yml build && docker compose --env-file .env -f deploy/docker-compose.prod.yml up -d --remove-orphans && docker compose --env-file .env -f deploy/docker-compose.prod.yml ps"

echo "Despliegue completado: https://${DOMAIN:-$DEPLOY_HOST}"
echo "Backoffice: crea un túnel con: ssh -L 8080:127.0.0.1:8080 $REMOTE"
