# Puesta en producción

Ejecuta todos los comandos desde la raíz del repositorio.

## Requisitos

- Un servidor Linux con Docker Compose, DNS y los puertos 80/443 abiertos.
- Un usuario sin privilegios de root que pueda ejecutar Docker.
- Un archivo `.env` creado desde `.env.example`, con secretos aleatorios y un dominio real.

Valida siempre la configuración antes de arrancar:

```bash
docker compose --env-file .env -f deploy/docker-compose.prod.yml config --quiet
```

## Base de datos existente

La migración `20260810203000_initial` representa el esquema que ya usaba el proyecto. En una base nueva se aplica automáticamente. Si el servidor ya contiene tablas creadas con `prisma db push`, haz primero una copia y marca esa migración como aplicada una sola vez:

```bash
./deploy/backup.sh
docker compose --env-file .env -f deploy/docker-compose.prod.yml run --rm migrate \
  pnpm exec prisma migrate resolve --applied 20260810203000_initial
docker compose --env-file .env -f deploy/docker-compose.prod.yml up -d
```

No ejecutes `migrate resolve` sobre una base vacía: en ese caso debe actuar `migrate deploy`.

## Despliegue y copias

```bash
DEPLOY_HOST=servidor.example.com DEPLOY_USER=comidas DOMAIN=comidas.example.com ./deploy/deploy.sh
```

El despliegue crea una copia PostgreSQL antes de actualizar. Programa además `deploy/backup.sh` diariamente y copia los ficheros fuera del servidor. El script conserva 30 días por defecto; puedes cambiarlo con `BACKUP_RETENTION_DAYS`. Prueba periódicamente una restauración en una base separada.

Antes de construir el frontend, configura también `LEGAL_OPERATOR` y `LEGAL_CONTACT` con la identidad real del responsable y su correo de privacidad. La compilación de producción falla si faltan.

## Backoffice

No queda publicado en Internet. Abre un túnel SSH y visita `http://localhost:8080`:

```bash
ssh -L 8080:127.0.0.1:8080 comidas@servidor.example.com
```

El backoffice usa `/admin-api` en el mismo túnel; no hace falta publicar ni tunelizar el puerto 3001.

## Comprobaciones posteriores

- `https://DOMINIO/` carga y permite iniciar sesión.
- `https://DOMINIO/api/health` devuelve `{"ok":true}`.
- `docker compose --env-file .env -f deploy/docker-compose.prod.yml ps` muestra servicios sanos.
- Registro, recetas, plan semanal y cierre de sesión funcionan.
- La copia más reciente puede restaurarse.
