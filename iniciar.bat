@echo off
title Comidas - Iniciando...
cd /d "%~dp0"

echo Arrancando servicios Docker...
docker compose up -d

echo Esperando al backend...
:wait_backend
timeout /t 3 /nobreak >nul
curl -s -o nul http://localhost:3001
if %errorlevel% neq 0 goto wait_backend

if exist .initialized goto open_app

echo Primera vez: creando usuario...
docker compose exec -T backend pnpm db:seed
echo. > .initialized

:open_app
echo Esperando al frontend...
:wait_frontend
timeout /t 3 /nobreak >nul
curl -s -o nul http://localhost:5175
if %errorlevel% neq 0 goto wait_frontend

echo Abriendo la app...
start http://localhost:5175
