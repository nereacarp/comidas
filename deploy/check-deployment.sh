#!/usr/bin/env bash
set -Eeuo pipefail
: "${PUBLIC_URL:?Define PUBLIC_URL, por ejemplo https://comidas.example.com}"
BACKOFFICE_URL="${BACKOFFICE_URL:-http://localhost:8080}"
curl --fail --silent --show-error --max-time 15 "$PUBLIC_URL/api/health" | grep -q '"ok":true'
curl --fail --silent --show-error --max-time 15 "$PUBLIC_URL/" | grep -qi '<div id="root"'
curl --fail --silent --show-error --max-time 15 "$BACKOFFICE_URL/" | grep -qi '<div id="root"'
curl --fail --silent --show-error --max-time 15 "$BACKOFFICE_URL/admin-api/health" | grep -q '"ok":true'
echo "Frontend, API pública, backoffice y proxy administrativo responden correctamente."
