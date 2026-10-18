# Checklist antes de publicar

## Requisitos previos

- Cambios commiteados y pusheados a `main`
- Vercel CLI instalada (`npm install -g vercel`)
- Acceso a cuentas de Vercel y Neon

## Backend (Vercel Serverless)

- [ ] Base de datos: migraciones ejecutadas en Neon
  ```bash
  DIRECT_URL=<neon-direct-url> pnpm --dir backend db:migrate:deploy
  ```
- [ ] Variables de producción configuradas en Vercel:
  - `DATABASE_URL` (Neon con -pooler)
  - `DIRECT_URL` (Neon directa)
  - `JWT_SECRET` (aleatorio 64 bytes)
  - `ADMIN_CREDENTIALS_JSON` (secreto admin)
  - `ALLOWED_ORIGINS` (URL del frontend)
  - `APP_URL` (URL del frontend)
  - `PUBLIC_REGISTRATION=false`
  - `REQUIRE_EMAIL_VERIFICATION=false`
- [ ] Build compila sin errores: `cd backend && pnpm build`
- [ ] Despliegue: `cd backend && vercel deploy --prod`
- [ ] Salud del backend: `curl https://<backend>.vercel.app/health`

## Frontend (Vercel Static + Rewrites)

- [ ] Variables de producción configuradas:
  - `BACKEND_URL` (URL del backend)
  - `VITE_LEGAL_OPERATOR` (responsable legal)
  - `VITE_LEGAL_CONTACT` (correo de privacidad)
- [ ] Build compila sin errores: `cd frontend && pnpm build`
- [ ] `vercel.json` contiene rewrites para `/api/*` → backend
- [ ] Despliegue: `cd frontend && vercel deploy --prod`
- [ ] Frontend carga: `https://<frontend>.vercel.app`

## Verificación funcional

- [ ] Login con usuario demo funciona (demo@comidas.app / comidas123)
- [ ] Sesión persiste al recargar
- [ ] Recetas cargan correctamente (35 de seed)
- [ ] Plan semanal visible
- [ ] Registro público rechaza (403)
- [ ] Páginas legales (Privacy, Terms) cargan

## Neon (PostgreSQL)

- [ ] Backup automático de Neon habilitado
- [ ] Región correcta (Frankfurt)
- [ ] Plan Free sin límites alcanzados
- [ ] Migraciones aplicadas: `pnpm db:migrate:deploy`
- [ ] Seed ejecutado: `pnpm db:seed`

## Monitoreo post-despliegue

- [ ] Vercel Analytics activo
- [ ] Neon metrics monitoreados
- [ ] Health checks configurados (opcional)
- [ ] Notificaciones de errores activas
