# Auditoría de seguridad y calidad — Backend Comidas

**Fecha:** 2026-05-26  
**Alcance:** `backend/` — rutas, plugins, servicios, Prisma, despliegue

## Resumen ejecutivo

La base es sólida: Prisma parametrizado, guards por hogar, rate limit en auth, SSRF parcial en import. Hay hallazgos **críticos y altos** concentrados en IDOR cross-household, CORS, SSRF, transacciones y permisos inconsistentes.

| Prioridad | Cantidad aprox. | Acción |
|-----------|-----------------|--------|
| P0 Crítico | 5 | Bloquear release hasta corregir |
| P1 Alto | 10 | Sprint inmediato |
| P2 Medio | Varios | Planificar |
| P3 Bajo | Varios | Endurecimiento continuo |

---

## P0 — Crítico (arreglar antes de producción)

### 1. IDOR en tags y ubicaciones de almacenamiento

**Problema:** `tag.service` y `storage-location.service` actualizan/borran solo por `tagId` / `locationId`, sin comprobar `householdId` del path.

```typescript
// backend/src/services/tag.service.ts
async update(tagId: string, input: CreateTagInput) {
  return prisma.tag.update({
    where: { id: tagId },
    data: { name: input.name, color: input.color },
  });
}
```

**Explotación:**

1. Usuario EDITOR en hogar `H_A`.
2. Obtiene un `tagId` de otro hogar (fuga en UI, admin, logs, etc.).
3. `PUT /households/H_A/tags/{tagId_victima}` con `{ "name": "comprometido" }`.
4. `householdGuard` valida membresía en `H_A`, pero el update afecta el tag de `H_B`.

Mismo patrón en `DELETE` de tags y en `update`/`delete` de `storage-location.service`.

**Fix:**

```typescript
async update(tagId: string, householdId: string, input: CreateTagInput) {
  const existing = await prisma.tag.findFirst({ where: { id: tagId, householdId } });
  if (!existing) {
    throw Object.assign(new Error('Etiqueta no encontrada'), { statusCode: 404 });
  }
  return prisma.tag.update({ where: { id: tagId }, data: { name: input.name, color: input.color } });
}
```

Aplicar el mismo patrón en `delete` y en `storage-location.service` (`update`, `delete`). Actualizar rutas para pasar `request.params.householdId`.

**Tests:**

- `tag.service.test.ts`: update/delete con `householdId` incorrecto → 404, sin mutación.
- Test de ruta con `tagId` ajeno al hogar del path.

---

### 2. CORS permisivo si `ALLOWED_ORIGINS` está vacío

**Ubicación:** `backend/src/server.ts`

```typescript
if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
  cb(null, true);
}
```

**Explotación:** En producción sin `ALLOWED_ORIGINS`, cualquier origen puede llamar a la API desde el navegador de la víctima (riesgo mayor con cookies; con Bearer sigue siendo mala práctica).

**Fix:** En `NODE_ENV=production`, si `allowedOrigins.length === 0` → fallar al arrancar o rechazar orígenes desconocidos (`cb(new Error(...), false)`).

**Tests:** Bootstrap falla sin `ALLOWED_ORIGINS` en producción.

---

### 3. SSRF incompleto en importación de recetas

**Ubicación:** `backend/src/services/recipe-import.service.ts`

Hay validación HTTPS y blocklist de hostnames, pero:

- `fetch` sigue **redirects** (p. ej. `https://evil.com` → red interna).
- No hay resolución DNS → IP (bypass con dominios que resuelven a IPs internas).
- Respuesta HTML completa en memoria (DoS por tamaño).

**Explotación:** Usuario autenticado llama `POST .../recipes/import-url` con URL que redirige a metadata cloud o red interna; el servidor hace la petición.

**Fix:**

- `redirect: 'manual'` y revalidar cada URL de redirect.
- Resolver DNS y rechazar IPs privadas/link-local.
- Límite de bytes en body (stream con cap).
- Rate limit por usuario/hogar en import + Gemini.

**Tests:** URLs con redirect simulado, hostname que resuelve a `127.0.0.1`, respuesta > N MB.

---

### 4. Pérdida de datos en despensa al generar lista de la compra

**Ubicación:** `backend/src/services/shopping-list.service.ts` — `generate()`

`generate()` consume despensa en bucle y **después** crea la lista, sin transacción global.

**Explotación:** Fallo en `create` (DB, timeout) tras consumos → stock reducido sin lista creada.

**Fix:** `prisma.$transaction` que incluya consumos + creación, o patrón saga con compensación.

**Tests:** Mock de `create` que falle → despensa sin cambios.

---

### 5. Admin API: secreto estático, sin rate limit, comparación no constant-time

**Ubicación:** `backend/src/routes/admin.routes.ts`

```typescript
if (!ADMIN_SECRET || !auth || auth !== `Bearer ${ADMIN_SECRET}`) {
```

**Explotación:** Fuerza bruta / filtración de `ADMIN_SECRET` → borrado masivo (`DELETE /admin/users/:id`, hogares, recetas).

**Fix:**

- Comparación timing-safe (`crypto.timingSafeEqual`).
- Rate limit agresivo en `/admin/*`.
- Rotación de secretos, IP allowlist, o mTLS / OAuth service-to-service.
- Auditoría en cada DELETE.

**Tests:** 401 sin secret; rate limit tras N intentos.

---

## P1 — Alto

### 6. Permisos rotos: `copy-week` sin `canEditGuard`

**Ubicación:** `backend/src/routes/meal-plan.routes.ts`

`POST .../meal-plan/copy-week` solo usa `householdGuard`; `copy-day` sí usa `canEditGuard`.

**Explotación:** Usuario `VIEWER` copia semana completa (borra destino + recrea ítems).

**Fix:** Añadir `canEditGuard` como en `copy-day`.

**Tests:** VIEWER → 403 en copy-week.

---

### 7. Abuso de coste IA: import/kcal sin rol EDITOR

`import-url` y `estimate-kcal` solo usan `householdGuard`; un `VIEWER` puede disparar `fetch` + Gemini.

**Fix:** `canEditGuard` + cuotas por hogar/día.

**Tests:** VIEWER → 403; contador de llamadas.

---

### 8. Referencias cruzadas entre hogares (`tagIds`, `recipeId`)

`recipe.create/update` y `mealPlan.addItem` no validan que `tagId`/`recipeId` pertenezcan al `householdId`.

**Explotación:** Enlazar receta del hogar víctima a plan del atacante o tags ajenos (corrupción de datos).

**Fix:**

```typescript
const tags = await prisma.tag.findMany({
  where: { id: { in: tagIds }, householdId },
});
if (tags.length !== tagIds.length) throw new Error('Etiqueta no válida');
```

**Tests:** `tagId` de otro hogar → error.

---

### 9. Exposición de datos: favoritos de todos los usuarios en detalle de receta

**Ubicación:** `backend/src/services/recipe.service.ts` — `getById` incluye `favorites: true`.

**Explotación:** Cualquier miembro del hogar ve quién marcó favorita cada receta (`userId`).

**Fix:** No incluir `favorites` o filtrar `{ where: { userId: currentUser } }` y devolver solo `isFavorited: boolean`.

**Tests:** Usuario B no ve favorito de usuario A en GET recipe.

---

### 10. JWT: 7 días, sin revocación, sin refresh

**Ubicación:** `backend/src/plugins/auth.ts` — `expiresIn: '7d'`.

**Explotación:** Token robado (XSS, logs, dispositivo) válido una semana; cambio de contraseña no invalida sesiones.

**Fix:** Access token corto (15–60 min) + refresh en DB, denylist en logout/delete account, `algorithms: ['HS256']` explícito.

**Tests:** Token tras delete account → 401; refresh rotation.

---

### 11. Rate limiting en memoria (auth, público, admin)

`auth-rate-limit.service` y `public.routes` usan `Map` en proceso.

**Problemas:**

- Varias réplicas → sin límite global.
- Reinicio borra contadores.
- IP spoof vía `X-Forwarded-For` sin `trustProxy` configurado.

**Fix:** Redis / `@fastify/rate-limit` + `trustProxy` solo detrás de reverse proxy conocido.

**Tests:** Dos instancias comparten contador (integración con Redis).

---

### 12. Race en despensa (`consume` / `add`)

Patrón read-modify-write sin transacción ni `UPDATE ... WHERE quantity >=`.

**Explotación:** Dos generaciones de lista simultáneas → doble consumo o stock inconsistente.

**Fix:** Transacción serializable o `updateMany` atómico con condición.

**Tests:** Dos `consume` concurrentes con stock 5 y pedidos 4+4.

---

### 13. Race en favoritos (`toggle`)

Check + create/delete sin transacción → `P2002` o estado inconsistente.

**Fix:** `upsert` o transacción / delete idempotente.

**Tests:** 10 toggles paralelos → estado estable.

---

### 14. `deleteAccount` — TOCTOU

Comprobación de propietario con otros miembros y conteos ocurre **fuera** de la transacción final; otro miembro puede unirse entre medio.

**Fix:** Transacción con locks o reglas en DB.

---

### 15. Lista pública por `shareToken`

Token de 128 bits (`randomBytes(16)`) está bien; pero:

- Sin expiración ni rotación automática.
- Toggle anónimo (diseño OK si es intencional).
- Rate limit solo en memoria.

**Explotación:** Enlace filtrado = lectura/modificación de ítems hasta revocar share.

**Fix:** Expiración opcional, rotar token al compartir de nuevo, rate limit distribuido.

---

## P2 — Medio

| Tema | Detalle |
|------|---------|
| **SQL injection** | Bajo riesgo: `$queryRaw` usa `Prisma.sql` parametrizado en `recipe.service.ts`. |
| **Enumeración de emails** | Registro 409 “email ya registrado”; invitación “Usuario no encontrado”. Unificar mensajes genéricos donde aplique. |
| **Validación meal plan** | `createMealPlanItemSchema` permite sin `recipeId` ni `customMealName`. Añadir `.refine()`. |
| **Duplicados en plan** | Sin `@@unique([householdId, date, mealType])` → entradas duplicadas concurrentes. |
| **copy-day/week** | `deleteMany` + `Promise.all(create)` sin transacción → estado parcial si falla a mitad. |
| **Recipe update** | Borra ingredients/categories/tags y recrea sin transacción → ventana inconsistente. |
| **N+1 / lentitud** | `generate()` llama `consume()` por ingrediente; `getUserHouseholds` anida miembros; sugerencias `take: 50`. |
| **Logs** | `Fastify({ logger: true })` puede registrar headers/bodies en errores. Redactar `Authorization`, passwords. |
| **Errores** | Sin `setErrorHandler` global → posible fuga de stack en 500. |
| **Body size** | Sin `bodyLimit` explícito en Fastify. |
| **Idempotencia** | Generar lista duplicada puede crear listas duplicadas. |
| **Retries Gemini** | `callGeminiWithFallback` multiplica coste en errores retriables. |

---

## P3 — Bajo / endurecimiento

- Contraseña solo `min(8)` — considerar lista de contraseñas comunes.
- Sin endpoint `/health` / readiness para orquestación.
- `preParsing` borra `content-length` globalmente — vigilar DoS.
- `applyDistinctListAccents` escribe en background con `.catch(() => {})` — fallos silenciosos.
- Docker dev: `JWT_SECRET: dev-secret-change-in-production` — secretos distintos en prod real.

---

## SQL injection — conclusión

No hay concatenación de SQL de usuario. Los `$queryRaw` usan plantillas parametrizadas de Prisma. Riesgo residual solo si en el futuro se añade SQL dinámico sin parametrizar.

---

## Tests recomendados (prioridad)

| Prioridad | Test |
|-----------|------|
| P0 | IDOR tag/storage: household incorrecto |
| P0 | `generate` shopping list rollback si falla create |
| P0 | SSRF: redirect + IP privada (mocks) |
| P0 | CORS fail-closed en producción |
| P1 | VIEWER forbidden: copy-week, import-url, estimate-kcal |
| P1 | tagIds/recipeId cross-household rejected |
| P1 | Recipe GET no expone favoritos ajenos |
| P1 | Pantry consume concurrente |
| P1 | Favorite toggle concurrente |
| P2 | copy-week transaccional / sin pérdida a medias |
| P2 | meal plan refine schema |
| P2 | Admin auth timing-safe + rate limit |

---

## Checklist para producción

### Secretos y red

- [ ] `JWT_SECRET` fuerte (≥32 bytes aleatorios), distinto por entorno
- [ ] `ADMIN_SECRET` fuerte, no en repo, rotación planificada
- [ ] `ALLOWED_ORIGINS` explícito (no lista vacía)
- [ ] `DATABASE_URL` con usuario de mínimos privilegios
- [ ] `GEMINI_API_KEY` solo en backend, cuotas en Google Cloud
- [ ] TLS terminado en reverse proxy; `trustProxy` configurado
- [ ] DB no expuesta públicamente

### Auth

- [ ] Tokens de vida corta + refresh/revocación
- [ ] Rate limit distribuido (login, register, admin, público, import)
- [ ] Logout invalida refresh tokens
- [ ] Tras `deleteAccount`, tokens inútiles

### Autorización

- [ ] Todos los updates/deletes validan `householdId` del recurso
- [ ] `canEditGuard` en todas las mutaciones (incl. copy-week, IA)
- [ ] Admin detrás de VPN/IP allowlist o identidad fuerte

### Datos

- [ ] Transacciones en operaciones multi-paso (lista+despensa, copy-week, delete account)
- [ ] Constraints únicos donde haga falta (meal plan por slot)
- [ ] Validación FK lógica (recipe/tag del mismo hogar)

### SSRF / abuso

- [ ] Import URL: sin redirects a red interna, límite de tamaño
- [ ] Cuotas IA por hogar/usuario

### Observabilidad

- [ ] Logs sin passwords/tokens; nivel adecuado
- [ ] Error handler sin stack al cliente
- [ ] Métricas: latencia p95, errores 5xx, rate 429
- [ ] Alertas en picos de `/auth/login`, `/admin/*`, `/public/*`

### Operaciones

- [ ] Health/readiness probes
- [ ] Backups PostgreSQL probados (restore)
- [ ] Migraciones en pipeline, no `db push` en prod
- [ ] Límites de conexión Prisma vs pool de PG
- [ ] Plan de escalado horizontal con rate limit Redis

### Privacidad

- [ ] Revisar qué devuelve `/auth/profile` y listas compartidas
- [ ] Política de retención para `shareToken`

---

## Lo que ya está bien

- Guards `householdGuard` + `canEditGuard` en la mayoría de rutas sensibles
- Rate limit en auth (IP + cuenta) con mensajes y `Retry-After`
- Bcrypt cost 10; perfil sin `passwordHash`
- Prisma ORM y raw queries parametrizadas
- SSRF básico (HTTPS + blocklist hostname)
- Share token con entropía criptográfica
- Helmet registrado; validación Zod en entradas principales
- Transacción en `accept` invitación y parte de `deleteAccount`
- Tests de servicios existentes (buena base para ampliar)

---

## Referencias de código

| Área | Archivo principal |
|------|-------------------|
| Servidor / CORS | `backend/src/server.ts` |
| JWT | `backend/src/plugins/auth.ts` |
| Guards | `backend/src/plugins/household-guard.ts`, `can-edit-guard.ts` |
| Auth + rate limit | `backend/src/routes/auth.routes.ts`, `services/auth-rate-limit.service.ts` |
| Admin | `backend/src/routes/admin.routes.ts` |
| Público | `backend/src/routes/public.routes.ts` |
| Tags (IDOR) | `backend/src/services/tag.service.ts` |
| Storage (IDOR) | `backend/src/services/storage-location.service.ts` |
| Import SSRF | `backend/src/services/recipe-import.service.ts` |
| Lista + despensa | `backend/src/services/shopping-list.service.ts` |
| Schema | `backend/prisma/schema.prisma` |
