# Pruebas antes de publicar

## Despliegue y túnel del backoffice

El backoffice se sirve únicamente en `127.0.0.1:8080`. Abre el túnel:

```bash
ssh -L 8080:127.0.0.1:8080 comidas@servidor.example.com
```

La interfaz y su API administrativa viajan por ese mismo túnel mediante `/admin-api`; el puerto 3001 no se expone. Con el túnel abierto, comprueba frontend, API, backoffice y proxy:

```bash
PUBLIC_URL=https://comidas.example.com BACKOFFICE_URL=http://localhost:8080 \
  ./deploy/check-deployment.sh
```

## Copia y restauración

```bash
./deploy/backup.sh
./deploy/verify-backup.sh deploy/backups/comidas-AAAAMMDD-HHMMSS.dump
```

La verificación restaura el archivo en una base temporal con un nombre generado, consulta las tablas principales y elimina esa base al terminar. No modifica la base activa.

## Pruebas automatizadas E2E

```bash
cd tests/e2e
pnpm install
pnpm exec playwright install chromium
pnpm test
```

Las pruebas públicas no necesitan credenciales. Para cubrir cliente y backoffice autenticados:

```bash
E2E_EMAIL=cliente@example.com \
E2E_PASSWORD='contraseña-de-prueba' \
E2E_ADMIN_ACTOR=admin \
E2E_ADMIN_SECRET='secreto-de-prueba' \
E2E_BACKOFFICE_URL=http://localhost:8080 \
pnpm test
```

Usa cuentas y datos de prueba, nunca credenciales reales en CI.
