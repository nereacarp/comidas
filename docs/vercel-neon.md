# Despliegue gratuito en Vercel y Neon

Esta variante mantiene Docker para desarrollo local, pero ejecuta la aplicación y el
backend en Vercel y guarda PostgreSQL en Neon. El ordenador personal puede permanecer
apagado.

## Arquitectura

- `frontend/`: proyecto Vercel público. Usa siempre `/api` para conservar las cookies
  como cookies de primera parte.
- `backend/`: proyecto Vercel Fastify. Se ejecuta como una única Vercel Function en
  Frankfurt (`fra1`).
- `backoffice/`: proyecto Vercel independiente. No contiene el secreto administrativo;
  este se introduce al iniciar sesión y permanece en `sessionStorage`.
- Neon: PostgreSQL. La aplicación usa la URL agrupada y las migraciones la URL directa.

## 1. Crear Neon

1. Crear un proyecto en Neon, preferiblemente en Frankfurt.
2. En **Connect**, copiar dos conexiones:
   - conexión agrupada, cuyo host contiene `-pooler`;
   - conexión directa, sin `-pooler`.
3. Guardarlas temporalmente como `DATABASE_URL` y `DIRECT_URL`. No pegarlas en Git.

Para importar todos los datos que existen en Docker:

```powershell
$env:NEON_DIRECT_URL='postgresql://...sin-pooler...'
.\deploy\migrate-to-neon.ps1 -Import
Remove-Item Env:NEON_DIRECT_URL
```

El script crea primero `deploy/backups/before-neon-*.dump`, comprueba que el destino termina
en `.neon.tech` y después restaura la copia. La importación limpia previamente las
tablas que ya existan en ese proyecto Neon.

## 2. Desplegar el backend

Crear un proyecto Vercel conectado a este repositorio y seleccionar **Root Directory:
`backend`**. Vercel detecta Fastify mediante `src/server.ts`.

Variables de producción:

```text
DATABASE_URL=<URL agrupada de Neon, con -pooler>
DIRECT_URL=<URL directa de Neon>
JWT_SECRET=<secreto aleatorio de 64 bytes>
ADMIN_CREDENTIALS_JSON={"admin":"<secreto administrativo nuevo>"}
ALLOWED_ORIGINS=https://<frontend>.vercel.app,https://<backoffice>.vercel.app
APP_URL=https://<frontend>.vercel.app
PUBLIC_REGISTRATION=false
REQUIRE_EMAIL_VERIFICATION=false
GEMINI_API_KEY=<opcional>
RESEND_API_KEY=
MAIL_FROM=
```

En la URL agrupada conviene añadir `connect_timeout=15`, `pool_timeout=15` y
`connection_limit=1`. Para aplicar futuras migraciones se usa `DIRECT_URL`:

```powershell
pnpm --dir backend db:migrate:deploy
```

Las migraciones deben ejecutarse antes de desplegar una versión que dependa del nuevo
esquema.

## 3. Desplegar el frontend

Crear otro proyecto Vercel con **Root Directory: `frontend`**.

Variables:

```text
BACKEND_URL=https://<backend>.vercel.app
VITE_LEGAL_OPERATOR=<nombre de la persona responsable>
VITE_LEGAL_CONTACT=<correo de privacidad>
```

No definir `VITE_API_URL`: el valor relativo `/api` es deliberado. La función
`frontend/api/[...path].ts` reenvía las peticiones al backend sin exponer cookies de
terceros. `vercel.json` conserva además las rutas internas de React al recargar.

Tras conocer la URL final del frontend, comprobar que `APP_URL` y `ALLOWED_ORIGINS` del
backend coinciden exactamente y volver a desplegar el backend si se cambiaron.

## 4. Desplegar el backoffice

Crear un tercer proyecto con **Root Directory: `backoffice`** y definir:

```text
BACKEND_URL=https://<backend>.vercel.app
```

No definir `VITE_API_URL`. El backoffice utilizará `/api/admin`. La página estática puede
ser visible, pero ningún dato ni operación administrativa funciona sin el identificador
y secreto válidos. No compartir su URL y utilizar un secreto nuevo de al menos 32
caracteres. En Hobby, la protección gratuita de Vercel no cubre el dominio principal de
producción.

## 5. Verificación

1. `https://<backend>.vercel.app/health` devuelve `{ "ok": true }`.
2. La app abre, inicia sesión y conserva la sesión al recargar.
3. Una invitación creada en el backoffice genera una URL del frontend.
4. El registro público devuelve 403.
5. Recetas, plan, compra y despensa conservan los datos importados.
6. Guardar fuera de Neon una copia periódica cifrada de PostgreSQL.

## Límites esperados

Neon puede tardar unos segundos en despertar tras un periodo sin uso. Vercel Hobby y
Neon Free son adecuados para uso personal y familiar, pero el servicio se detendrá si se
superan sus límites gratuitos. Las importaciones de recetas con IA deben finalizar dentro
del máximo de 60 segundos configurado para la función.
