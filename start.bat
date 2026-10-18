@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Comidas - Iniciando...
cd /d "%~dp0"

where docker >nul 2>&1 || (
  echo ERROR: Docker no esta instalado o no esta en PATH.
  pause
  exit /b 1
)

docker info >nul 2>&1 || (
  echo ERROR: Docker Desktop no esta iniciado.
  pause
  exit /b 1
)

echo Arrancando servicios Docker...
docker compose up -d --build
if errorlevel 1 (
  echo ERROR: Docker no ha podido arrancar el proyecto.
  docker compose ps
  pause
  exit /b 1
)

call :wait_url "http://localhost:3001/health" "backend" 60
if errorlevel 1 exit /b 1

if not exist .initialized (
  echo Primera vez: cargando datos iniciales...
  docker compose exec -T backend pnpm db:seed
  if errorlevel 1 (
    echo ERROR: No se pudieron cargar los datos iniciales. No se ha marcado la instalacion como completada.
    pause
    exit /b 1
  )
  type nul > .initialized
)

call :wait_url "http://localhost:5175" "frontend" 60
if errorlevel 1 exit /b 1

echo Abriendo la app en http://localhost:5175 ...
start "" "http://localhost:5175"
exit /b 0

:wait_url
echo Esperando al %~2...
for /L %%i in (1,1,%~3) do (
  curl.exe --fail --silent --output nul "%~1" >nul 2>&1 && exit /b 0
  timeout /t 2 /nobreak >nul
)
echo ERROR: %~2 no respondio a tiempo.
docker compose ps
pause
exit /b 1
