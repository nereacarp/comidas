# Auditoría pre-release — Planificador de Comidas

Revisión cruzada del monorepo (Fastify + Prisma + React + backoffice), `docker-compose.prod.yml`, guards de autorización y flujos críticos (auth, hogares, plan, compra, importación, enlaces públicos).

**Nota:** No es un pentest ni pruebas en entorno real; asume que lo desplegado coincide con el repo.

**Fecha de revisión:** 2026-05-26

---

## Resumen ejecutivo (Product)

| Área | Veredicto |
|------|-----------|
| Funcionalidad core | Sólida en happy path; varios huecos en permisos y validación |
| Seguridad | **No listo** sin endurecer CORS, secretos, JWT, SSRF y admin |
| DevOps | Existe `docker-compose.prod.yml`, pero secretos por defecto, HTTP, `db push` y backend expuesto |
| UX / móvil | PWA parcial; datos de salud solo en `localStorage`; VIEWER mal acotado en UI |
| Tests | Buena cobertura unitaria; **casi cero E2E e integración de rutas** |

---

## Veredicto del equipo

| Rol | Veredicto |
|-----|-----------|
| **Backend** | Lógica de dominio madura; **autorización inconsistente** en varias rutas |
| **Frontend** | `canEdit` bien usado en muchos sitios; **rutas y VIEWER** incompletos |
| **QA** | Unit tests bien; **falta capa integración/E2E** en flujos multi-rol |
| **UX** | Flujos principales claros; salud local-only y errores 403 en VIEWER molestan |
| **Security** | **Bloqueante** para internet abierto sin hardening |
| **DevOps** | Prod compose existe pero **secretos, HTTP y db push** son red flags |
| **PM** | MVP usable en red de confianza; **no “production-grade”** para usuarios reales en internet |

---

## 🔴 Crítico

### 1. Secretos y JWT con valores por defecto en producción

**Qué pasa en producción:** Cualquiera con acceso al servidor o a la imagen puede firmar JWTs válidos o entrar a la BD. El check de `auth.ts` solo falla si `JWT_SECRET === 'dev-secret'`, pero prod usa `change-this-in-production-please`.

Referencia en código:

```typescript
// backend/src/plugins/auth.ts
if (process.env.NODE_ENV === 'production' && secret === 'dev-secret') {
  throw new Error('JWT_SECRET must be set to a secure value in production');
}
```

```yaml
# docker-compose.prod.yml
JWT_SECRET: ${JWT_SECRET:-change-this-in-production-please}
DB_PASSWORD: ${DB_PASSWORD:-comidas_prod_2024}
```

**Reproducir:** Desplegar sin `.env` → login con cualquier usuario → decodificar JWT con el secret por defecto del compose.

**Solución:**

- Secretos obligatorios (fallar al arrancar si faltan).
- `NODE_ENV=production` en el contenedor backend.
- Rotación documentada; nunca defaults en compose prod.
- Validar longitud/entropía de `JWT_SECRET` y `ADMIN_SECRET` (rechazar valores de la lista negra conocida).

**Tests faltantes:** Test de arranque que falle sin `JWT_SECRET` / con secret débil.

---

### 2. CORS abierto si `ALLOWED_ORIGINS` no está definido

```typescript
// backend/src/server.ts
if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
  cb(null, true);
}
```

**Qué pasa:** Sitio malicioso puede llamar a la API desde el navegador de un usuario logueado (token en `localStorage`).

**Reproducir:** Prod sin `ALLOWED_ORIGINS` → página externa con `fetch` a la API usando el `Authorization` del usuario.

**Solución:** En producción, **denegar por defecto**; lista explícita de orígenes; valorar cookies `httpOnly` + SameSite si se mantiene sesión en browser.

**Tests faltantes:** Integración CORS con/sin `ALLOWED_ORIGINS`.

---

### 3. `copy-week` sin `canEditGuard` — VIEWER puede borrar y reescribir una semana

```typescript
// backend/src/routes/meal-plan.routes.ts
fastify.post('.../meal-plan/copy-week', { preHandler: [householdGuard] }, ...)
// copy-day SÍ tiene canEditGuard; copy-week NO
```

**Qué pasa:** Miembro “solo lectura” puede copiar semana y **borrar** el rango destino (`deleteMany` en el servicio).

**Reproducir:** Usuario VIEWER → `POST /households/:id/meal-plan/copy-week` con fechas válidas → plan destino reemplazado.

**Solución:** Añadir `canEditGuard` como en `copy-day`.

**Tests faltantes:** Route test: VIEWER → 403 en `copy-week`.

---

### 4. Referencias cruzadas de recetas en el plan (IDOR lógico)

`meal-plan.service.addItem` no comprueba que `recipeId` pertenezca al `householdId`.

**Qué pasa:** Si alguien conoce un `recipeId` de otro hogar, puede colgarlo en el plan; al borrar la receta queda slot huérfano (`onDelete: SetNull`).

**Reproducir:** `POST /households/{mi-hogar}/meal-plan` con `recipeId` de otro hogar (como EDITOR).

**Solución:** Validar `recipe.householdId === householdId` antes de crear/actualizar.

**Tests faltantes:** `meal-plan.service` — rechazar recipe ajena.

---

### 5. Endpoints de escritura/coste sin `canEditGuard` (VIEWER + abuso de Gemini)

| Ruta | Guard actual |
|------|----------------|
| `POST .../recipes/import-url` | solo `householdGuard` |
| `POST .../recipes/estimate-kcal` | solo `householdGuard` |

**Qué pasa:** VIEWER dispara import SSRF-ish y llamadas Gemini → coste y carga.

**Reproducir:** Token VIEWER → importar URL o estimar kcal en bucle.

**Solución:** `canEditGuard` en ambas; rate limit por hogar/usuario en IA.

**Tests faltantes:** VIEWER → 403; rate limit IA.

---

### 6. `prisma db push` en cada arranque de producción

```dockerfile
# backend/Dockerfile.prod
CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]
```

**Qué pasa:** Cambios de schema sin migraciones controladas; riesgo de drift, locks, pérdida de datos en cambios destructivos.

**Solución:** `prisma migrate deploy` en job de deploy; nunca `db push` en prod.

**Tests faltantes:** Pipeline CI que ejecute migrate en staging.

---

### 7. Despliegue HTTP, API en puerto público, IP en repo

- `VITE_API_URL: http://${SERVER_IP}:3001` — mixed content si hay HTTPS.
- Backend `:3001` expuesto; backoffice en `:8080`.
- `deploy.sh` con IP fija hardcodeada.

**Qué pasa:** Token JWT interceptable; superficie de ataque amplia; información de infra filtrada.

**Solución:** Reverse proxy (TLS), API solo red interna, un dominio, quitar IP del repo.

---

## 🟠 Alto

### 8. JWT en `localStorage` (7 días, sin revocación)

**Qué pasa:** XSS roba sesión; no hay logout server-side ni refresh rotativo.

**Solución:** `httpOnly` + `Secure` + `SameSite=Strict`; refresh corto; opcional denylist en Redis.

**Tests faltantes:** E2E auth; test de cookie flags.

---

### 9. Rate limiting en memoria (auth + público)

`createAuthRateLimiter` y `ipCounters` en `public.routes.ts` son **por proceso**.

**Qué pasa:** Tras restart o con N réplicas, límites ineficaces; fuerza bruta distribuida.

**Solución:** Redis/Upstash con claves `login:{email}`, `ip:{ip}`.

---

### 10. SSRF parcial en importación de recetas

`validateUrl` bloquea IPs privadas en hostname, pero no:

- Rebinding DNS (`evil.com` → `169.254.169.254`)
- Redirects a red interna
- Metadata cloud vía redirect

**Reproducir:** URL que redirige a metadata (si el runtime lo permite).

**Solución:** Resolver DNS, bloquear rangos RFC1918/link-local, sin redirects o validar destino final, allowlist de dominios opcional.

**Tests faltantes:** URLs mock con redirect a IP privada.

---

### 11. Token de lista compartida — filtración de datos del hogar

`shareToken` = 32 hex (128 bits) — entropía OK, pero **sin expiración** y lectura completa de ítems.

**Qué pasa:** Enlace reenviado/leaked → cualquiera marca/desmarca ítems (`PUT .../toggle`).

**Reproducir:** Crear share → abrir `/shared/:token` sin login → togglear.

**Solución:** Expiración, revocación, permisos solo lectura vs edición, auditoría; aviso UX “cualquiera con el enlace…”.

**Tests faltantes:** Token revocado → 404; expirado → 410.

---

### 12. `ADMIN_SECRET` ausente en prod compose

Si no se define, todos los `/admin/*` devuelven 401 — backoffice roto. Si se define mal y filtra → borrado masivo de usuarios/hogares.

**Solución:** Secret fuerte, IP allowlist, no exponer `:8080` a internet, 2FA operacional.

---

### 13. Agregación de lista de compra vs fechas (timezone)

Meal plan usa `parseMealPlanDate` (mediodía UTC); generación de lista usa `new Date(input.startDate)`.

**Qué pasa:** En UTC+1/UTC-5, comidas del lunes pueden quedar fuera o entrar el domingo.

**Reproducir:** Hogar en España, plan lunes → generar lista → comparar ingredientes.

**Solución:** Misma utilidad de fechas en todo el backend.

**Tests faltantes:** Casos borde `2025-03-30` con TZ simulada.

---

### 14. `createMealPlanItemSchema` excluye `POSTRE`

El enum del schema solo incluye `DESAYUNO`, `COMIDA`, `CENA`, `SNACK`; el modelo Prisma y la UI sí tienen `POSTRE`.

**Qué pasa:** UI muestra POSTRE; API rechaza 400 — bug funcional visible.

**Solución:** Añadir `POSTRE` en `createMealPlanItemSchema` y `suggestRecipesSchema`.

---

### 15. Rutas de edición accesibles para VIEWER (solo UI oculta)

`/recipes/new`, `/recipes/:id/edit` no redirigen si `!canEdit`.

**Reproducir:** VIEWER navega manualmente → formulario visible; API devuelve 403 al guardar.

**Solución:** `CanEditRoute` wrapper o redirect en páginas de creación/edición.

---

### 16. Invitaciones: enumeración de usuarios

`invite` → `"Usuario no encontrado"` si el email no está registrado.

**Qué pasa:** Enumeración de emails registrados.

**Solución:** Mensaje genérico; flujo con email (Resend ya previsto en docs del proyecto).

---

### 17. Sin límite de tamaño de body en Fastify

**Qué pasa:** DoS con JSON enorme en import/create recipe.

**Solución:** `bodyLimit` global (p. ej. 1 MB) y timeout por ruta.

---

## 🟡 Medio

### 18. Datos de salud solo en `localStorage`

Pérdida al cambiar dispositivo/navegador; sin backup; inconsistencia con kcal del plan en servidor.

**UX:** Usuario cree que “Salud” está guardada en la nube.

**Solución (producto):** Persistir en backend scoped a usuario o documentar claramente “solo en este dispositivo”.

---

### 19. Slots duplicados en plan de comidas

No hay `@@unique([householdId, date, mealType])`.

**Qué pasa:** Dos “Comida” el mismo día → UI confusa, doble conteo en kcal.

**Solución:** Constraint DB o upsert en `addItem`.

---

### 20. Lista de compra: agregación ingenua de cantidades

Suma cantidades sin convertir unidades (g vs kg, etc.).

**Qué pasa:** “500 g” + “1 kg” no se unifican correctamente.

---

### 21. `applyDistinctListAccents` — escrituras async silenciosas

`void Promise.all(...).catch(() => {})` en `shopping-list.service.ts`.

**Qué pasa:** Fallos de DB ignorados; acentos inconsistentes.

---

### 22. Condiciones de carrera en despensa

`consume` + `add` sin transacción serializable → dos generaciones de lista pueden descontar mal.

**Solución:** `$transaction` con `SELECT FOR UPDATE` o versión optimista.

---

### 23. PWA / caché

`VitePWA` con `selfDestroying: true`; rutas API `NetworkOnly` — bien, pero build con `VITE_API_URL` incorrecto deja app “muerta” sin mensaje claro.

**Móvil:** `BottomNav` + calendario denso; verificar safe-area y scroll en iOS Safari.

---

### 24. Helmet CSP en API JSON

CSP estricto en API no protege al frontend; `nginx.conf` del frontend no envía CSP headers.

**Solución:** CSP en nginx para el SPA.

---

### 25. Backoffice y admin sin auditoría

`DELETE /admin/users/:id` sin log ni soft-delete.

---

### 26. Documentación vs código (roles)

Docs mencionan `OWNER/MEMBER`; schema tiene `OWNER/EDITOR/VIEWER` — confusión operativa.

---

## 🟢 Bajo (vigilar)

- Mensajes de error 404 del cliente sugieren “puerto 3001 Docker” — ruido en prod.
- Favoritos/listados sin paginación fuerte en hogares enormes.
- Sin refresh de JWT antes de expirar (corte brusco a los 7 días).
- `preParsing` borra `Content-Length` — workaround de extensiones; vigilar proxies raros.
- Health: cálculos médicos sin disclaimer legal.
- Knip/ESLint no sustituyen revisión de accesibilidad (focus en modales, drag pantry).

---

## Tests que faltan (priorizado)

| Prioridad | Área | Casos |
|-----------|------|--------|
| P0 | Autorización | VIEWER en `copy-week`, `import-url`, `estimate-kcal`; EDITOR vs OWNER en miembros |
| P0 | IDOR | `recipeId` ajeno en meal plan; `tagIds` de otro hogar en create recipe |
| P0 | Fechas | Generar lista vs plan en TZ Europe/Madrid |
| P1 | Integración HTTP | CORS, body limit, arranque sin secrets |
| P1 | Público | Share token revocado/expirado; rate limit 429 |
| P1 | SSRF | Redirect + IP privada (mocks) |
| P2 | E2E (Playwright) | Login → hogar → plan → generar lista → compartir → toggle público |
| P2 | E2E | VIEWER no puede guardar receta aunque abra `/recipes/new` |
| P2 | Carga | 50 ingredientes, plan mensual, generar lista |
| P3 | Visual/a11y | Modal focus trap, contraste chips meal-type |

Hoy hay buenos **unit tests** en servicios/utils; **no hay suite E2E del producto** en el repo.

---

## Métricas a monitorizar

### Infra / API

- `http_requests_total` por ruta, status, latencia p50/p95/p99
- `auth_login_failures_total` / `auth_rate_limit_429_total`
- `jwt_auth_401_total` (posible token robado o expirado masivo)
- `prisma_query_duration_ms` y errores de conexión a Postgres
- Uso CPU/memoria por contenedor; reinicios (`restart_count`)
- Espacio disco volumen `pgdata`

### Seguridad

- Intentos `POST /auth/login` por IP (spike)
- `POST .../import-url` y `estimate-kcal` por usuario/hogar (coste Gemini)
- `GET /public/shopping-lists/*` 404 vs 200 (enumeración de tokens)
- Accesos `/admin/*` 401/403
- Errores CORS rechazados

### Negocio / UX

- Hogares sin miembros activos / usuarios sin hogar (atascados en setup)
- Invitaciones `PENDING` > 7 días
- Listas compartidas activas (`shareToken IS NOT NULL`)
- Tiempo generación lista de compra
- Recetas importadas con `warnings` (calidad datos)
- Errores 422 importación

### Frontend (RUM si puedes)

- `api_client_errors` por endpoint
- Core Web Vitals (LCP en dashboard/plan)
- PWA: fallos de `fetch` por `VITE_API_URL` mal configurado
- Tasa abandono en `HouseholdSetupScreen` / login

### Alertas sugeridas

- p95 API > 2s sostenido
- 5xx > 1% en 5 min
- Login failures > umbral por IP
- Gemini/quota errors
- Postgres connections near max
- Contenedor backend reiniciado

---

## Checklist “no subir a prod” sin cerrar

- [ ] `JWT_SECRET`, `DB_PASSWORD`, `ADMIN_SECRET`, `ALLOWED_ORIGINS`, `GEMINI_API_KEY` — obligatorios, sin defaults
- [ ] `NODE_ENV=production` + validación de secrets al boot
- [ ] TLS + API no pública; CORS cerrado
- [ ] `canEditGuard` en `copy-week`, import, estimate-kcal
- [ ] Validación `recipeId` / `tagIds` por hogar
- [ ] `migrate deploy` en lugar de `db push`
- [ ] POSTRE en schema de meal plan
- [ ] Fechas unificadas en shopping-list
- [ ] Rate limit distribuido
- [ ] E2E mínimo del flujo hogar → plan → compra

---

## Próximos pasos sugeridos

1. **PR seguridad:** secrets, CORS, `canEditGuard`, validación `recipeId`
2. **PR datos:** fechas unificadas, POSTRE en validation, `migrate deploy`
3. **PR DevOps:** TLS, proxy, quitar defaults, métricas básicas
4. **PR QA:** tests P0 + Playwright smoke
