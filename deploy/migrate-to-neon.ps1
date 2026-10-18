param(
  [switch]$Import
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$backupDirectory = Join-Path $projectRoot 'deploy\backups'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupName = "before-neon-$timestamp.dump"
$backupFile = Join-Path $backupDirectory $backupName
$containerFile = "/tmp/$backupName"

New-Item -ItemType Directory -Force -Path $backupDirectory | Out-Null

Push-Location $projectRoot
try {
  docker compose exec -T db pg_dump -U comidas -d comidas -Fc -f $containerFile
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear la copia de la base local.' }

  docker compose cp "db:$containerFile" $backupFile
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo copiar la copia fuera del contenedor.' }
} finally {
  Pop-Location
}

Write-Output "Copia local creada: $backupFile"

if (-not $Import) {
  Write-Output 'No se ha modificado Neon. Ejecuta de nuevo con -Import cuando quieras importar esta base.'
  exit 0
}

$target = $env:NEON_DIRECT_URL
if ([string]::IsNullOrWhiteSpace($target)) {
  throw 'Define NEON_DIRECT_URL con la conexión directa de Neon antes de usar -Import.'
}

try {
  $targetUri = [Uri]$target
} catch {
  throw 'NEON_DIRECT_URL no es una URL válida.'
}

if ($targetUri.Scheme -notin @('postgres', 'postgresql') -or -not $targetUri.Host.EndsWith('.neon.tech')) {
  throw 'Por seguridad, este script solo importa en una URL PostgreSQL cuyo host termine en .neon.tech.'
}

$resolvedBackup = (Resolve-Path $backupFile).Path
Write-Warning 'La importación limpiará las tablas existentes de la base Neon indicada.'
docker run --rm `
  -e NEON_DIRECT_URL `
  --mount "type=bind,source=$resolvedBackup,target=/backup/comidas.dump,readonly" `
  postgres:16-alpine `
  sh -c 'pg_restore --exit-on-error --clean --if-exists --no-owner --no-privileges --dbname "$NEON_DIRECT_URL" /backup/comidas.dump'

if ($LASTEXITCODE -ne 0) { throw 'La importación en Neon no terminó correctamente.' }
Write-Output 'Base de datos importada en Neon correctamente.'
