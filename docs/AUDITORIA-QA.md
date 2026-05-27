# Informe de auditoría QA — Comidas (Planificador de comidas)

**Fecha:** 26 de mayo de 2026  
**Alcance:** Monorepo `backend` (Fastify + Prisma + PostgreSQL), `frontend` (React 19 + Vite + PWA), `backoffice` (Refine).  
**Método:** Revisión estática exhaustiva del código, análisis de arquitectura/seguridad, ejecución de tests automatizados (175 backend / 229 frontend). No se ejecutó la app en navegador en esta sesión; los hallazgos de UI/UX incluyen verificación de código y patrones típicos de fallo.

---

## Resumen ejecutivo

| Área | Valoración |
|------|------------|
| Funcionalidad core | Buena (con gaps de permisos) |
| Seguridad | **Deficiente** — varios hallazgos críticos |
| UX/UI | Buena en general; sin modo oscuro |
| Rendimiento | Aceptable; riesgos PWA/cache |
| Base de datos | Riesgo alto en despliegue (`db push --accept-data-loss`) |
| Tests | Frontend OK; backend 5 tests fallando |
| Backoffice | **No apto para producción** sin auth |

**Prioridad inmediata (P0):** Admin sin rol, IDOR en recursos, `householdGuard` sin `return`, rol VIEWER no aplicado en API, despliegue con pérdida de datos.

**Estado general:** La base funcional es sólida (buena cobertura de tests en servicios, validación Zod, rate limiting en auth, UI coherente con design system pastel). Sin embargo hay **vulnerabilidades de autorización graves** que deben corregirse antes de producción real.

---

## 1. Funcionamiento general

### CRÍTICO — `householdGuard` no detiene la cadena de handlers

**Problema:** Tras enviar 403, no hay `return`, por lo que Fastify puede seguir ejecutando el handler de la ruta.

**Ubicación:** `backend/src/plugins/household-guard.ts`

```typescript
if (!member) {
  reply.status(403).send({ error: 'No eres miembro de este hogar' });
}
```

**Cómo reproducir:** Usuario autenticado que no es miembro del `householdId` de la URL → petición a cualquier ruta con `householdGuard` (p. ej. `DELETE .../recipes/:id`).

**Impacto:** Posible ejecución de lógica de negocio aunque la respuesta sea 403; comportamiento impredecible y bypass parcial de autorización.

**Recomendación:** `return reply.status(403).send(...)` o `throw fastify.httpErrors.forbidden(...)`. Revisar también `authenticate` en `backend/src/plugins/auth.ts` (mismo patrón con 401).

---

### CRÍTICO — IDOR masivo en recursos por ID

**Problema:** Las rutas validan membresía del `householdId` en la URL, pero operan por `recipeId`, `listId`, `itemId` **sin comprobar** que el recurso pertenece a ese hogar.

**Ubicaciones:**
- `backend/src/services/recipe.service.ts` — `getById`, `update`, `delete`
- `backend/src/services/meal-plan.service.ts` — `updateItem`, `deleteItem`
- `backend/src/services/shopping-list.service.ts` — `getById`, `addManualItem`, etc.
- `backend/src/services/pantry.service.ts` — `update`, `delete`

**Cómo reproducir:**
1. Usuario miembro del hogar A.
2. Obtener `recipeId` de otro hogar B (fuga por favoritos, admin, enumeración).
3. `GET/PUT/DELETE /households/{idA}/recipes/{recipeIdDeB}` → acceso/modificación/borrado.

**Impacto:** Lectura, edición y borrado de datos de otros hogares. Afecta recetas, plan de comidas, listas de compra, despensa, tags, etc.

**Recomendación:** En cada operación: `where: { id: recipeId, householdId }` o comprobar pertenencia antes de mutar.

---

### CRÍTICO — Cualquier miembro puede expulsar a otros (incluido OWNER)

**Problema:** `DELETE /households/:householdId/members/:userId` solo usa `householdGuard`, sin comprobar que el solicitante es OWNER. `removeMember` no impide eliminar al OWNER.

**Ubicación:** `backend/src/routes/household.routes.ts`, `backend/src/services/household.service.ts`

**Cómo reproducir:** Usuario VIEWER del hogar → `DELETE .../members/{ownerUserId}`.

**Impacto:** Sabotaje del hogar, pérdida de control administrativo.

**Recomendación:** Solo OWNER puede eliminar miembros; prohibir eliminar al único OWNER.

---

### ALTO — Rol VIEWER solo en frontend

**Problema:** `canEdit` existe en UI (`frontend/src/providers/HouseholdProvider.tsx`), pero la API permite POST/PUT/DELETE a cualquier miembro.

**Cómo reproducir:** Cuenta VIEWER → llamar API de crear receta / editar plan / borrar lista (curl o DevTools).

**Impacto:** Incumplimiento del modelo de permisos; usuarios “solo lectura” pueden modificar todo.

**Recomendación:** Middleware `requireCanEdit` en backend (OWNER + EDITOR) en todas las mutaciones.

---

### ALTO — Proxy de desarrollo incompleto (`/invitations`)

**Problema:** En `frontend/vite.config.ts` no se proxifica `/invitations`; con `VITE_API_URL` vacío las invitaciones fallan en dev local.

**Cómo reproducir:** Frontend sin `VITE_API_URL`, intentar aceptar invitación.

**Impacto:** Flujo de invitaciones roto en desarrollo; confusión en QA.

**Recomendación:** Añadir proxy `/invitations` → `:3001`.

---

### MEDIO — Inconsistencia `POSTRE` vs API/UI

**Problema:** Prisma define `POSTRE` en `MealType` (`backend/prisma/schema.prisma`), pero Zod/frontend solo permiten 4 tipos (`DESAYUNO`, `COMIDA`, `CENA`, `SNACK`). Tests fallan esperando `POSTRE` en importación.

**Impacto:** Postres importados se clasifican como `SNACK`; datos incoherentes en BD vs UI.

**Recomendación:** Alinear enum en schema, validación, UI y tests.

---

### MEDIO — 5 tests backend fallando

| Test | Causa |
|------|-------|
| `storage-location-colors` | Espera 3 ubicaciones por defecto, hay 5 |
| `html-recipe-extractor` (2) | Categoría `POSTRE` no mapeada |
| `recipe-import.service` (2) | Categoría `POSTRE` no mapeada |

**Impacto:** Regresiones no detectadas en CI si no se bloquea el pipeline.

**Recomendación:** Corregir implementación o tests; fallar CI en rojo.

---

### BAJO — Ruta comodín redirige todo a dashboard

**Ubicación:** `frontend/src/App.tsx` — `<Route path="*" element={<Navigate to={routes.dashboard} />} />`

**Impacto:** URLs inválidas no muestran 404; UX confusa al compartir enlaces rotos.

**Recomendación:** Página 404 dedicada.

---

## 2. UI / Diseño / Coherencia visual

### MEDIO — Sin modo oscuro

Solo paleta clara en `frontend/src/index.css` (`:root` con fondos claros). No hay `prefers-color-scheme` ni toggle.

**Recomendación:** Si no está planificado, documentarlo; si sí, tokens CSS duales.

---

### BAJO — PWA `theme_color` fijo claro

`frontend/vite.config.ts`: `theme_color: '#2ec4b6'`, `background_color: '#ffffff'`.

**Impacto:** Barra del sistema siempre clara en móvil.

---

### BAJO — Backoffice sin alineación visual con app principal

Estilos genéricos Tailwind gris; no comparte design system Payd.

---

### Positivo

- Design system consistente (pastels, tipografía Inter/Montserrat).
- Uso extendido de `aria-*` en componentes clave (navegación, modales, formularios).
- Contraste pensado en chips de tipo de comida (`frontend/src/utils/meal-type.ts` — `MEAL_TYPE_TEXT`).

---

## 3. UX / Experiencia de usuario

### ALTO — Permisos engañosos para VIEWER

La UI oculta botones con `canEdit`, pero la API permite cambios → el usuario cree que está protegido y otro canal no.

**Recomendación:** Mensajes explícitos “Solo lectura” + bloqueo real en API.

---

### MEDIO — Datos de salud solo en `localStorage`

`frontend/src/stores/health.store.ts` persiste peso, objetivos, agua, ejercicio localmente; no hay sync ni backup.

**Impacto:** Pérdida al cambiar dispositivo/navegador; no usable en hogar compartido.

**Recomendación:** Persistir en backend o advertir claramente en UI.

---

### MEDIO — Auto-creación de hogar silenciosa

`HouseholdProvider` crea “Mi hogar” si el usuario no tiene ninguno.

**Impacto:** Usuario invitado a otro hogar puede no entender por qué tiene dos hogares.

**Recomendación:** Onboarding que pregunte antes de crear.

---

### BAJO — Errores de API genéricos en inglés en store

`frontend/src/stores/auth.store.ts`: `'Login failed'`, `'Registration failed'` (fallback).

**Recomendación:** Mensajes en español coherentes con el resto de la app.

---

### Positivo

- Loaders en `HouseholdProvider` y páginas compartidas.
- Rate limit en login con mensajes progresivos en español.
- Estados vacíos con `SectionEmptyState`.

---

## 4. Seguridad

### CRÍTICO — API `/admin/*` sin rol administrador

**Ubicación:** `backend/src/routes/admin.routes.ts`

```typescript
fastify.addHook('onRequest', fastify.authenticate);
```

Cualquier usuario con JWT válido puede listar/eliminar usuarios, hogares, recetas y tags.

**Cómo reproducir:** Registrarse → usar token en `GET /admin/users`, `DELETE /admin/users/:id`.

**Impacto:** Compromiso total de la plataforma (borrado masivo, fuga de emails).

**Recomendación:** Rol `ADMIN` en BD, middleware dedicado, o desactivar en producción; backoffice detrás de VPN + auth.

---

### CRÍTICO — Backoffice sin autenticación

**Ubicación:** `backoffice/src/App.tsx`

Refine apunta a `${API_URL}/admin` sin login; URL por defecto `localhost:3000` vs API en `3001`.

**Recomendación:** OAuth/admin login, proxy con auth, o no exponer puerto 8080 públicamente.

---

### CRÍTICO — JWT sin expiración configurada

**Ubicación:** `backend/src/plugins/auth.ts`

`fastify.jwt.sign()` sin `expiresIn`.

**Impacto:** Tokens robados válidos indefinidamente.

**Recomendación:** `expiresIn: '7d'`, refresh tokens, rotación en logout.

---

### CRÍTICO — Secreto JWT por defecto

Fallback `'dev-secret'` y en Docker dev `JWT_SECRET: dev-secret-change-in-production` (`docker-compose.yml`).

**Impacto:** Forja de tokens si se despliega sin variable.

**Recomendación:** Fallar al arrancar si `JWT_SECRET` ausente en producción.

---

### ALTO — Token JWT en `localStorage`

**Ubicación:** `frontend/src/stores/auth.store.ts`

**Impacto:** Robo vía XSS (aunque no hay `dangerouslySetInnerHTML` hoy).

**Recomendación:** Cookies `httpOnly` + `Secure` + `SameSite=Strict`, o al menos CSP estricta.

---

### ALTO — SSRF en importación de recetas por URL

**Ubicación:** `backend/src/services/recipe-import.service.ts` — `fetch(url)` sin lista blanca.

**Cómo reproducir:** `POST .../recipes/import-url` con `http://169.254.169.254/...` o servicios internos.

**Impacto:** Escaneo de red interna, lectura de metadatos cloud.

**Recomendación:** Validar URL (solo `https`, dominios permitidos), resolver DNS y rechazar rangos privados, timeout corto.

---

### ALTO — CORS `origin: true`

**Ubicación:** `backend/src/server.ts`

Refleja cualquier `Origin`.

**Impacto:** Cualquier sitio puede llamar la API con token del usuario (si lo roba).

**Recomendación:** Lista blanca de orígenes (`VITE_*` URLs).

---

### ALTO — Favoritos sin verificación de hogar

**Ubicación:** `backend/src/services/favorite.service.ts` — `toggle` acepta cualquier `recipeId`.

**Impacto:** Favoritar recetas ajenas; vector para descubrir IDs.

**Recomendación:** Verificar que el usuario es miembro del `householdId` de la receta.

---

### MEDIO — Listas compartidas públicas sin rate limit

`/public/shopping-lists/:token` — token 32 hex (128 bits, aceptable), pero sin límite de intentos.

**Impacto:** Abuso de toggle; fuerza bruta teórica (improbable).

**Recomendación:** Rate limit por IP/token, opción de expiración del share.

---

### MEDIO — Sin headers de seguridad HTTP

No `@fastify/helmet` ni CSP/HSTS/X-Frame-Options en backend ni `frontend/nginx.conf`.

**Recomendación:** Helmet en API; en nginx: `X-Content-Type-Options`, `Referrer-Policy`, CSP para frontend.

---

### MEDIO — Contraseña mínima 6 caracteres

**Ubicación:** `backend/src/lib/validation.ts`

**Recomendación:** Mínimo 8–12 + complejidad o zxcvbn.

---

### MEDIO — Rate limiting solo en memoria

**Ubicación:** `backend/src/services/auth-rate-limit.service.ts`

Se reinicia con el proceso; no funciona con múltiples réplicas.

**Recomendación:** Redis para límites distribuidos.

---

### BAJO — Sin verificación de email ni recuperación de contraseña

**Impacto:** Cuentas con email ajeno, bloqueo permanente si olvidan contraseña.

---

### Positivo (seguridad)

- bcrypt (10 rondas).
- Prisma parametrizado → bajo riesgo SQLi.
- React sin `dangerouslySetInnerHTML` en `frontend/src`.
- `.env` en `.gitignore`.
- Rate limit en register/login/delete account.

---

## 5. Rendimiento

### MEDIO — PWA cachea respuestas API sensibles

**Ubicación:** `frontend/vite.config.ts` — `NetworkFirst` para shopping-lists, recipes, meal-plan (24h).

**Impacto:** Datos obsoletos offline; posible mostrar listas/recetas de sesión anterior en dispositivo compartido.

**Recomendación:** No cachear respuestas autenticadas o usar `NetworkOnly` con auth header.

---

### MEDIO — `applyDistinctListAccents` escribe en cada listado

**Ubicación:** `backend/src/services/shopping-list.service.ts`

Puede hacer N `update` en paralelo al listar listas de compra.

**Impacto:** Latencia extra.

**Recomendación:** Migración batch o job en background.

---

### BAJO — Paginación

Backend soporta `page`/`limit` en recetas; verificar que la UI no cargue todo en hogares grandes.

---

### Positivo

- Gzip en nginx prod.
- Tests de filtros de recetas con SQL optimizado donde aplica.

---

## 6. Backend y API

### ALTO — `getById` de lista de compra sin validar hogar

**Ubicación:** `backend/src/services/shopping-list.service.ts`

Mismo patrón IDOR que recetas.

---

### MEDIO — Admin: `orderBy` dinámico con `_sort` del cliente

**Ubicación:** `backend/src/routes/admin.routes.ts`

```typescript
orderBy: { [_sort]: _order.toLowerCase() as 'asc' | 'desc' },
```

**Impacto:** Error 500, posible filtrado de campos.

**Recomendación:** Lista blanca de campos ordenables.

---

### MEDIO — Sin paginación máxima estricta en admin

`take = parseInt(_end) - skip` sin tope → DoS con `_end=1000000`.

---

### BAJO — Puerto por defecto inconsistente

- `backend/src/server.ts` → 3000
- Docker → 3001
- Backoffice default → 3000

---

## 7. Base de datos

### CRÍTICO — Producción usa `prisma db push --accept-data-loss`

**Ubicación:** `backend/Dockerfile.prod`

```dockerfile
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/server.js"]
```

**Impacto:** Pérdida de datos en cambios de schema; sin historial de migraciones.

**Recomendación:** `prisma migrate deploy` + backups automáticos de Postgres.

---

### MEDIO — Sin carpeta `prisma/migrations`

Schema drift entre entornos difícil de auditar.

---

### MEDIO — `MealPlanItem.recipeId` con `onDelete: SetNull`

Receta borrada deja huecos en plan; conviene UX de “receta eliminada”.

---

### Positivo

- Cascadas bien definidas en relaciones principales.
- Índices en invitaciones (`email`, `status`).
- `shareToken` único.

---

## 8. Testing

| Suite | Resultado |
|-------|-----------|
| Frontend | **229/229 OK** |
| Backend | **170/175 OK** (5 fallos) |
| Backoffice | **0 tests** |
| E2E / integración rutas | **No existen** |
| Tests de permisos/IDOR | **No existen** |

### Recomendación QA adicional

- E2E (Playwright): login, CRUD receta, plan semanal, lista compra, invitación, VIEWER bloqueado.
- Tests de contrato API para IDOR y admin.
- Pentest manual en `/admin` y shares públicos.

### Comandos

```bash
cd backend && pnpm test
cd frontend && pnpm test
```

---

## 9. Calidad del código

### Positivo

- Separación routes / services / lib.
- Zod centralizado (`backend/src/lib/validation.ts`).
- ~79 archivos de test en lógica de negocio.
- Convenciones consistentes frontend/backend.

### A mejorar

- **Duplicación del patrón IDOR** en todos los servicios — abstraer `assertBelongsToHousehold(model, id, householdId)`.
- **Autorización dispersa** — un solo middleware de roles.
- `recipe-import.service.ts` muy largo (~430 líneas) — difícil mantener.
- Backoffice sin tests ni auth.

---

## 10. Tabla consolidada de hallazgos

| # | Gravedad | Hallazgo | Área |
|---|----------|----------|------|
| 1 | **Crítico** | Admin API sin rol | Seguridad |
| 2 | **Crítico** | Backoffice sin auth | Seguridad |
| 3 | **Crítico** | IDOR recetas/plan/listas/despensa | Seguridad |
| 4 | **Crítico** | `householdGuard` sin `return` | Seguridad |
| 5 | **Crítico** | Cualquier miembro puede expulsar miembros/OWNER | Seguridad |
| 6 | **Crítico** | `db push --accept-data-loss` en prod | BD |
| 7 | **Crítico** | JWT sin expiración + secret por defecto | Seguridad |
| 8 | Alto | VIEWER puede mutar vía API | Seguridad/UX |
| 9 | Alto | SSRF import URL | Seguridad |
| 10 | Alto | CORS abierto | Seguridad |
| 11 | Alto | Token en localStorage | Seguridad |
| 12 | Alto | Favoritos sin control de hogar | Seguridad |
| 13 | Medio | Proxy `/invitations` faltante | Funcional |
| 14 | Medio | POSTRE inconsistente + tests rotos | Funcional |
| 15 | Medio | PWA cache API autenticada | Rendimiento |
| 16 | Medio | Sin Helmet/CSP | Seguridad |
| 17 | Medio | Salud solo local | UX |
| 18 | Medio | Rate limit en memoria | Seguridad |
| 19 | Bajo | Sin modo oscuro | UI |
| 20 | Bajo | Sin página 404 | UX |
| 21 | Bajo | Puertos/URLs inconsistentes | DevOps |

---

## Prioridades de corrección

### P0 — Bloqueantes antes de producción (1–3 días)

1. Deshabilitar o proteger `/admin/*` y backoffice.
2. Corregir `householdGuard` + middleware `canEdit` en todas las mutaciones.
3. IDOR: validar `householdId` en cada `get/update/delete` por ID.
4. Restringir `removeMember` a OWNER; proteger OWNER.
5. JWT: expiración + secreto obligatorio.
6. Sustituir `db push --accept-data-loss` por migraciones.

### P1 — Alta prioridad (1 semana)

7. SSRF: lista blanca URLs import.
8. CORS restringido.
9. Alinear rol VIEWER backend/frontend.
10. Arreglar tests backend y CI en rojo.
11. Rate limit público en shares.

### P2 — Mejoras (2–4 semanas)

12. Cookies httpOnly o CSP estricta.
13. Redis rate limiting.
14. PWA: política de cache segura.
15. Modo oscuro / 404 / onboarding hogar.
16. Backend para datos de salud o aviso UX.
17. E2E Playwright + tests IDOR.

---

## Mapa del proyecto (referencia QA)

### Estructura

```
comidas/
├── backend/          # Fastify API + Prisma
├── frontend/         # React PWA
├── backoffice/       # Refine admin
├── docker-compose.yml
├── docker-compose.prod.yml
└── docs/
```

### Rutas frontend principales

| Ruta | Página |
|------|--------|
| `/login`, `/register` | Auth |
| `/shared/:token` | Lista compra pública |
| `/dashboard` | Hoy |
| `/recipes`, `/recipes/new`, `/recipes/:id` | Recetas |
| `/meal-plan` | Planificador |
| `/shopping-lists` | Listas compra |
| `/pantry` | Despensa |
| `/settings` | Hogar y cuenta |
| `/health` | Salud (local) |

### Puertos Docker (desarrollo)

| Servicio | Puerto |
|----------|--------|
| PostgreSQL | 5433 |
| Backend | 3001 |
| Frontend | 5175 |
| Backoffice | 5176 |

---

## Conclusión

**Comidas** es una aplicación bien estructurada para un MVP de planificación de comidas, con buena UX visual y tests unitarios sólidos en lógica de negocio. **No está lista para producción pública** en su estado actual por fallos de autorización que permiten, entre otros, administración total vía `/admin`, acceso cruzado entre hogares (IDOR) y escalada de privilegios por miembros VIEWER.

La corrección de P0 transformaría el perfil de riesgo de **crítico** a **aceptable para beta cerrada**; P1 y P2 llevarían la app a un nivel profesional para lanzamiento amplio.
