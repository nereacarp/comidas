#!/bin/bash
# Script de despliegue para Comidas en Linode
# Ejecutar desde el directorio raíz del proyecto: bash deploy.sh

set -e

SERVER_IP="72.232.53.23"
SERVER_USER="root"
DEPLOY_DIR="/opt/comidas"

echo ""
echo "=================================="
echo "  Despliegue de Comidas"
echo "  Servidor: $SERVER_IP"
echo "=================================="
echo ""

# 1. Subir código al servidor (excluye node_modules, dist, etc)
echo ">>> Subiendo código al servidor..."
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='.env' \
  --exclude='coverage' \
  ./ "$SERVER_USER@$SERVER_IP:$DEPLOY_DIR/"

echo ""
echo ">>> Configurando e iniciando servicios en el servidor..."

# 2. Ejecutar setup en el servidor
ssh "$SERVER_USER@$SERVER_IP" bash << 'REMOTE'
set -e

DEPLOY_DIR="/opt/comidas"
cd "$DEPLOY_DIR"

# Instalar Docker si no está instalado
if ! command -v docker &> /dev/null; then
  echo "--- Instalando Docker..."
  apt-get update -qq
  apt-get install -y -qq docker.io docker-compose-plugin curl
  systemctl enable docker
  systemctl start docker
  echo "--- Docker instalado"
else
  echo "--- Docker ya está instalado: $(docker --version)"
fi

# Verificar docker compose plugin
if ! docker compose version &> /dev/null; then
  echo "--- Instalando docker-compose-plugin..."
  apt-get install -y -qq docker-compose-plugin
fi

# Detener contenedores anteriores si existen
echo "--- Deteniendo contenedores anteriores..."
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Construir y levantar
echo "--- Construyendo imágenes de producción (esto puede tardar varios minutos)..."
SERVER_IP=$(hostname -I | awk '{print $1}') \
  docker compose -f docker-compose.prod.yml build --no-cache

echo "--- Iniciando servicios..."
SERVER_IP=$(hostname -I | awk '{print $1}') \
  docker compose -f docker-compose.prod.yml up -d

echo ""
echo "--- Esperando a que los servicios arranquen..."
sleep 10

echo "--- Estado de los contenedores:"
docker compose -f docker-compose.prod.yml ps

REMOTE

echo ""
echo "=================================="
echo "  ¡Despliegue completado!"
echo ""
echo "  Frontend:   http://$SERVER_IP"
echo "  Backend:    http://$SERVER_IP:3001"
echo "  Backoffice: http://$SERVER_IP:8080"
echo "=================================="
echo ""
echo "IMPORTANTE: Cambia la contraseña del servidor después de esto."
