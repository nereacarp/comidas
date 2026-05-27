# Plan de edge cases — Planificador de Comidas

Lista orientada al stack real: JWT 7 días, hogares multi-usuario (OWNER/EDITOR/VIEWER), plan semanal, listas compartidas por token, salud en `localStorage`, importación por URL (no hay subida de archivos ni pagos).

**Prioridades:**

| Código | Significado |
|--------|-------------|
| **P0** | Pérdida de datos, seguridad o bloqueo total |
| **P1** | UX rota o inconsistencia grave |
| **P2** | Degradación parcial |
| **P3** | Cosmético o caso raro |

---

## 1. Usuario lento / red lenta

| ID | Escenario | Pasos exactos | Resultado esperado | Posibles fallos | Prioridad |
|----|-----------|---------------|-------------------|-----------------|-----------|
| S1 | Login con red 3G simulada | DevTools → Network → Slow 3G. Ir a `/login`, credenciales válidas, pulsar «Entrar» una vez. | Spinner/disabled; un solo request; redirección a dashboard con hogar cargado. | Doble sesión, botón no deshabilitado, timeout sin mensaje. | P1 |
| S2 | Generar lista de compra lenta | Plan con 20+ recetas. `/shopping-lists` → generar rango de 2 semanas. Esperar 30+ s sin tocar nada. | Indicador de carga; al terminar, lista nueva o error claro; no duplicar listas. | Segundo click crea 2 listas; UI congelada; error genérico. | P0 |
| S3 | Importar receta por URL lenta | `/recipes/new` → pegar URL de blog pesado → Importar. | Loading en botón; preview o error «no se pudo importar». | Request colgado sin cancelar; formulario parcial sin rollback. | P1 |
| S4 | Scroll infinito / muchas recetas | Crear 100+ recetas (o seed). `/recipes`, scroll y filtros rápidos. | Paginación estable (`limit` max 100); sin bloquear main thread. | Memoria alta en móvil; peticiones duplicadas. | P2 |

---

## 2. Mala conexión / intermitente

| ID | Escenario | Pasos exactos | Resultado esperado | Posibles fallos | Prioridad |
|----|-----------|---------------|-------------------|-----------------|-----------|
| N1 | Offline al guardar receta | Editar receta → DevTools Offline → Guardar. | Error visible; datos del formulario conservados. | Pérdida silenciosa; spinner infinito. | P0 |
| N2 | Corte mid-toggle lista compartida | `/shared/:token` → marcar ítem → cortar red a mitad del PUT. | Ítem refleja estado real tras recargar; o mensaje de error. | Checkbox optimista desincronizado. | P1 |
| N3 | Request abortado al cambiar de ruta | Iniciar carga `/meal-plan` → navegar a `/recipes` antes de responder. | Sin crash; nueva página carga bien. | Warning React / estado stale en UI. | P2 |
| N4 | 429 en lista pública | Automatizar 60+ GET a `/public/shopping-lists/:token` en 1 min. | HTTP 429 con mensaje en español. | Bloqueo sin feedback; cliente en bucle de reintentos. | P1 |

---

## 3. Doble click / acciones repetidas

| ID | Escenario | Pasos exactos | Resultado esperado | Posibles fallos | Prioridad |
|----|-----------|---------------|-------------------|-----------------|-----------|
| D1 | Doble «Generar lista» | Doble click rápido en generar compra. | Una lista o segundo click ignorado (disabled). | Dos listas idénticas. | P0 |
| D2 | Doble favorito | En detalle de receta, doble click en corazón. | Un toggle en BD. | Favorito añadido y quitado / error 500. | P1 |
| D3 | Doble «Compartir lista» | En detalle de lista, doble click en compartir. | Un `shareToken`; URL estable. | Tokens rotados; enlace anterior inválido sin aviso. | P1 |
| D4 | Doble «Copiar día» en plan | Copiar martes → pegar en miércoles con doble click en pegar. | Un conjunto de comidas en miércoles. | Duplicados de slots COMIDA/CENA. | P1 |
| D5 | Doble registro | `/register` con email nuevo, doble submit. | Un usuario; segundo intento = email en uso. | Dos usuarios o error críptico. | P0 |
| D6 | Doble «Añadir al plan» | Mismo día/tipo/receta, dos clicks seguidos. | Un `MealPlanItem` o UI que impida duplicado. | Dos entradas iguales en el mismo slot. | P1 |

---

## 4. Refresh inesperado / navegación brusca

| ID | Escenario | Pasos exactos | Resultado esperado | Posibles fallos | Prioridad |
|----|-----------|---------------|-------------------|-----------------|-----------|
| R1 | F5 en formulario de receta nueva | Rellenar título + ingredientes → F5. | Pérdida aceptable o draft (si existiera); no envío parcial al servidor. | Receta fantasma a medias. | P2 |
| R2 | F5 tras login | Login OK → F5 en `/dashboard`. | Sesión restaurada desde `localStorage` token + `loadProfile`. | Bucle login; pantalla en blanco. | P0 |
| R3 | F5 en lista compartida con cambios locales | Marcar 3 ítems → F5 antes de que terminen los PUT. | Estado = último persistido en servidor. | Ítems marcados solo en UI. | P1 |
| R4 | Cerrar pestaña con clipboard de día | Copiar día en plan → cerrar pestaña → reabrir. | Clipboard perdido (estado en memoria); sin corrupción. | Pegado accidental de día viejo si se persistiera mal. | P3 |
| R5 | Back del navegador tras eliminar receta | Borrar receta → botón Atrás. | 404 o redirección a listado; no crash. | Pantalla de detalle con datos cacheados. | P1 |

---

## 5. Pestañas múltiples

| ID | Escenario | Pasos exactos | Resultado esperado | Posibles fallos | Prioridad |
|----|-----------|---------------|-------------------|-----------------|-----------|
| T1 | Dos pestañas, mismo hogar | Tab A y B logueadas. En A: cambiar nombre del hogar. En B: refrescar o ir a settings. | B muestra nombre nuevo tras refresh/visibility. | B con nombre viejo indefinidamente. | P2 |
| T2 | Logout en una pestaña | Tab A logout. Tab B intenta guardar receta. | 401 → logout en B o error claro. | Escritura «exitosa» en UI sin persistir. | P0 |
| T3 | Plan concurrente | Tab A y B: copiar mismo día a destinos distintos a la vez. | Última operación gana; sin crash DB. | Días a medias; FK rotas. | P1 |
| T4 | Salud en localStorage | Tab A: +500 ml agua. Tab B: +250 ml sin recargar. | Tras recargar B, total coherente (último write gana). | Pérdida de litros; NaN en progreso. | P1 |
| T5 | Cambiar hogar activo | Tab A cambia hogar en selector. Tab B sigue en recetas del hogar anterior. | B debe revalidar `householdId` o mostrar aviso. | CRUD en hogar equivocado. | P0 |
| T6 | Lista compartida + app autenticada | Misma lista: tab pública y tab dueño editando ítems. | Sin sync en tiempo real (MVP): cada uno ve su estado hasta refresh. | Datos corruptos en vista del dueño. | P2 |

---

## 6. Sesión expirada (JWT 7d)

| ID | Escenario | Pasos exactos | Resultado esperado | Posibles fallos | Prioridad |
|----|-----------|---------------|-------------------|-----------------|-----------|
| E1 | Token expirado | Manipular `localStorage.token` a JWT inválido/expirado → cualquier ruta protegida. | `loadProfile` falla → logout → `/login`. | Errores 401 en bucle; pantalla vacía. | P0 |
| E2 | Token borrado manualmente | `localStorage.removeItem('token')` → F5 en `/recipes`. | Redirect a login. | Requests sin Authorization que devuelven HTML confuso. | P0 |
| E3 | Acción tras expiración en formulario | Sesión válida → esperar expiración (o token fake) → Guardar receta. | Mensaje + redirect login; no perder texto del formulario idealmente. | Error «HTTP 401» crudo. | P1 |
| E4 | Invitación con sesión caducada | Abrir enlace de invitación con token JWT muerto. | Flujo login → aceptar invitación. | Invitación perdida tras login. | P1 |

---

## 7. Datos corruptos / manipulados

| ID | Escenario | Pasos exactos | Resultado esperado | Posibles fallos | Prioridad |
|----|-----------|---------------|-------------------|-----------------|-----------|
| C1 | `health_store` JSON inválido | DevTools → Application → editar `health_store` a `{broken`. | App arranca; valores por defecto. | Crash en HealthPage. | P1 |
| C2 | `health_store` con tipos absurdos | `weight: "abc"`, `waterIntakeMl: -999`. | Validación UI o reset parcial. | NaN en gráficos / % agua mal mostrado. | P1 |
| C3 | `active_household` id inexistente | Poner UUID random en storage de hogar activo. | Fallback a primer hogar o setup. | 403 en todas las rutas. | P0 |
| C4 | API devuelve JSON no estándar | Mock proxy que devuelve `[]` donde esperas objeto. | Error manejado. | `undefined` en `.map` → white screen. | P1 |
| C5 | Receta borrada referenciada en plan | Borrar receta usada en plan de mañana. | Plan muestra hueco o «receta eliminada»; sin 500 al abrir plan. | Crash al renderizar `recipe.title`. | P0 |
| C6 | Token de share inválido | `/shared/not-a-real-token-xyz`. | Mensaje «no existe o ya no está compartida». | 500 stack trace en UI. | P1 |

---

## 8. «Uploads» gigantes (URLs e inputs masivos)

No hay upload de ficheros; `imageUrl` es URL y la importación es por URL.

| ID | Escenario | Pasos exactos | Resultado esperado | Posibles fallos | Prioridad |
|----|-----------|---------------|-------------------|-----------------|-----------|
| U1 | `imageUrl` de imagen remota enorme | Crear receta con URL a imagen de varios MB. | Imagen carga o falla con alt/placeholder; página usable. | Layout roto; OOM en móvil. | P2 |
| U2 | Import URL a página HTML gigante | Importar desde URL de receta con HTML de 50+ MB. | Timeout o error; servidor estable. | OOM backend en `recipe-import`. | P1 |
| U3 | Pegar texto enorme en instrucciones | Pegar 500 KB en instrucciones (sin `maxLength` en schema). | Guardado o 413/validación. | DB lenta; UI lag al escribir. | P2 |
| U4 | 200 ingredientes en una receta | Añadir filas hasta 200 → guardar. | Límite razonable o rendimiento aceptable. | Timeout; formulario ilegible. | P2 |

---

## 9. Inputs absurdamente largos / Unicode / Emojis

| ID | Escenario | Pasos exactos | Resultado esperado | Posibles fallos | Prioridad |
|----|-----------|---------------|-------------------|-----------------|-----------|
| I1 | Título 10 000 caracteres | Crear receta con título enorme. | Truncado o 400 del backend. | Rompe cards del plan/listado. | P1 |
| I2 | Nombre hogar 81+ chars | Settings: nombre con 81 caracteres (UI `maxLength={80}`). | No envía o recorta en cliente. | Si se salta UI: overflow en header. | P2 |
| I3 | Emojis en receta | Título `🍝 Pasta 🧄`, ingrediente `🧅 cebolla`. | Búsqueda y lista de compra agrupan bien. | Normalización NFC rompe búsqueda. | P2 |
| I4 | RTL + LTR mezclados | Nombre `עברית` + descripción en español. | Layout no invertido de forma extraña. | Iconos desalineados en Safari. | P3 |
| I5 | Zero-width spaces | Copiar ingrediente desde web con `\u200b`. | Mismo ingrediente visible = misma compra (o duplicado explícito). | Duplicados en lista de compra. | P2 |
| I6 | `customMealName` solo espacios | Plan: comida libre con `"   "`. | 400 «obligatorio» o trim. | Slot vacío en calendario. | P2 |
| I7 | Contraseña 8 chars + emoji | Registro password `12345678🎉`. | Acepta o rechaza con mensaje claro. | Problemas de encoding en bcrypt. | P3 |

---

## 10. Timezone / fechas

| ID | Escenario | Pasos exactos | Resultado esperado | Posibles fallos | Prioridad |
|----|-----------|---------------|-------------------|-----------------|-----------|
| Z1 | Usuario UTC-12, medianoche local | A las 23:30 local (ya «mañana» en UTC), abrir dashboard. | «Hoy» = día local del usuario en UI de salud. | Dashboard usa `toISOString()` → comidas de «ayer» en UTC. | **P0** |
| Z2 | Viaje de zona horaria | Registrar agua «hoy», cambiar TZ del SO, reabrir Health. | Reset de agua según nuevo «hoy» coherente. | Doble reset o agua de ayer contada hoy. | P1 |
| Z3 | Plan: copiar semana cruzando DST | Copiar semana que incluye cambio horario (Europa). | 7 días correctos en calendario. | Off-by-one en `copyWeek`. | P2 |
| Z4 | Rango lista compra invertido | `endDate` < `startDate`. | Validación 400. | Lista vacía o error 500. | P1 |
| Z5 | Fecha `2024-02-30` | API meal-plan con fecha inválida. | 400. | Parseo NaN en Prisma. | P1 |

---

## 11. Concurrencia (hogar compartido, sin realtime)

| ID | Escenario | Pasos exactos | Resultado esperado | Posibles fallos | Prioridad |
|----|-----------|---------------|-------------------|-----------------|-----------|
| X1 | Dos EDITORES, misma receta | A edita título; B edita ingredientes; guardan a 1 s. | Last-write-wins; sin corrupción. | Mezcla de campos imposible. | P1 |
| X2 | OWNER quita a MEMBER activo | Miembro en `/recipes` → OWNER lo elimina → miembro guarda. | 403 inmediato o tras siguiente request. | Sigue editando en caché. | P0 |
| X3 | VIEWER intenta POST | Rol VIEWER: crear receta vía DevTools/fetch directo. | 403 del `canEditGuard`. | Solo oculto en UI pero API abierta. | P0 |
| X4 | Generar compra + editar plan simultáneo | Usuario A genera lista; B añade comida al rango. | Lista = snapshot al generar (diseño doc). | Ingredientes «fantasma» o faltantes sin aviso. | P2 |
| X5 | Revocar share mientras compran | Dueño quita share; comprador togglea ítem. | 404 en toggle público. | UI pública sigue mostrando lista editable. | P1 |
| X6 | Aceptar misma invitación 2 veces | Doble POST accept invitation. | Idempotente o error claro. | Duplicado en `HouseholdMember`. | P1 |

---

## 12. Flujos críticos interrumpidos (análogo a «pagos»)

No hay Stripe/pagos. Equivalentes: operaciones de un solo paso que no deben quedar a medias.

| ID | Escenario | Pasos exactos | Resultado esperado | Posibles fallos | Prioridad |
|----|-----------|---------------|-------------------|-----------------|-----------|
| P1 | Generar lista → cerrar app | Pulsa generar → cierra pestaña a los 2 s. | Lista existe completa o no existe; no lista a medias. | Lista sin ítems o duplicada al reintentar. | P0 |
| P2 | Import receta → cancelar navegación | Import en curso → botón Atrás. | Request abortado; no receta duplicada al volver. | Receta creada sin que el usuario lo vea. | P1 |
| P3 | Check ítem + mover a despensa | Marcar comprado con cantidad y ubicación → cortar red tras check. | Ítem checked O despensa actualizada; estado consistente al volver. | Comprado pero no en despensa. | P1 |
| P4 | Eliminar cuenta a medias | Settings → borrar cuenta → confirmar → offline tras DELETE. | Cuenta borrada o error; no sesión zombie. | Token válido pero usuario borrado. | P0 |
| P5 | Crear hogar + invitar miembro | Crear hogar → invitar → fallo en segundo paso. | Hogar existe; invitación reintentable. | Hogar huérfano sin UI de recuperación. | P2 |

---

## 13. Modo offline

| ID | Escenario | Pasos exactos | Resultado esperado | Posibles fallos | Prioridad |
|----|-----------|---------------|-------------------|-----------------|-----------|
| O1 | Abrir app sin red (primera visita) | Sin cache, offline, ir a `/`. | Pantalla de error o shell PWA si existe; no bucle. | White screen infinito. | P1 |
| O2 | Navegar offline tras haber cargado | Cargar dashboard online → offline → click Recetas. | Error de red en fetch; mensaje. | Pantalla en blanco sin datos cacheados. | P2 |
| O3 | Health offline | `/health`: agua, peso, ejercicio sin API. | Todo funciona (solo localStorage). | — | P3 |
| O4 | Lista pública offline | Abrir `/shared/token` sin red. | Error amigable. | Spinner eterno. | P2 |

---

## 14. Dispositivos viejos / Safari / Android barato / iPhone SE

| ID | Escenario | Pasos exactos | Resultado esperado | Posibles fallos | Prioridad |
|----|-----------|---------------|-------------------|-----------------|-----------|
| H1 | iPhone SE (375×667) | Plan semanal + bottom nav + modal añadir comida. | Sin scroll horizontal; botones ≥ 44px. | Nav tapa contenido; modales cortados. | P1 |
| H2 | Safari iOS | Login, localStorage, compartir lista (Web Share si hay). | Flujo completo. | ITP borra token; fecha `input[type=date]` rara. | P1 |
| H3 | Android 8 + Chrome viejo | Misma batería de smoke tests. | Usable. | `color-mix`, `light-dark()` no soportados → colores rotos. | P2 |
| H4 | RAM baja | Plan mensual + 50 recetas con imágenes. | Scroll fluido. | Crash tab; imágenes sin lazy load. | P2 |
| H5 | `prefers-reduced-motion` | Activar en SO → animaciones UI. | Sin animaciones molestas. | Mareo por transiciones largas. | P3 |

---

## 15. Modo oscuro

| ID | Escenario | Pasos exactos | Resultado esperado | Posibles fallos | Prioridad |
|----|-----------|---------------|-------------------|-----------------|-----------|
| M1 | Toggle tema sistema | SO oscuro/claro mientras usas app (`data-theme`). | Contraste WCAG en inputs, chips de comida, plan. | Texto `--muted` ilegible en chips pastel. | P2 |
| M2 | ColorPicker en dark | Settings tag/hogar: elegir color hex. | Preview legible. | Swatch invisible sobre fondo oscuro. | P3 |
| M3 | Imágenes recetas oscuras | Receta con foto oscura en card. | Título con sombra o overlay. | Título blanco sobre foto negra invisible. | P2 |

---

## 16. Copy/paste extraño / teclado móvil

| ID | Escenario | Pasos exactos | Resultado esperado | Posibles fallos | Prioridad |
|----|-----------|---------------|-------------------|-----------------|-----------|
| K1 | Pegar URL con espacios/newlines | Import: pegar `  https://blog.com/r  \n`. | Trim y validación Zod URL. | 400 críptico. | P2 |
| K2 | Autocorrect móvil en ingredientes | iOS: «pollo» → «Pollo» distinto en dos filas. | Agrupación compra opcionalmente case-insensitive. | Dos líneas «pollo» en compra. | P2 |
| K3 | Teclado numérico en cantidades | Despensa: cantidad con coma `1,5`. | Acepta punto o normaliza. | NaN o guardado `1`. | P1 |
| K4 | Paste HTML rico en textarea | Pegar desde Word en instrucciones. | Solo texto plano guardado. | Tags HTML guardados y renderizados. | P1 |
| K5 | Sugerencia contraseña iOS | Registro: rellenar strong password del keychain. | Campo compatible `autocomplete`. | Password no visible / no pegable. | P3 |

---

## 17. Permisos denegados

| ID | Escenario | Pasos exactos | Resultado esperado | Posibles fallos | Prioridad |
|----|-----------|---------------|-------------------|-----------------|-----------|
| A1 | localStorage bloqueado | Safari privado estricto / extensión. | Login funciona en sesión; aviso si no persiste token. | Login OK pero logout al refrescar. | P0 |
| A2 | Clipboard API denegado | Copiar enlace de lista compartida sin permiso. | Fallback `prompt` o texto seleccionable. | Botón sin feedback. | P2 |
| A3 | Notificaciones (futuro) | Denegar permiso. | App usable sin push. | — | P3 |
| A4 | Cámara/galería (futuro) | Denegar para foto receta. | Mensaje; seguir con URL manual. | — | P3 |

---

## 18. Dominio específico (alto valor)

| ID | Escenario | Pasos exactos | Resultado esperado | Posibles fallos | Prioridad |
|----|-----------|---------------|-------------------|-----------------|-----------|
| B1 | `recipeId` y `customMealName` vacíos | POST meal-plan sin ninguno. | 400. | Item vacío en DB. | P0 |
| B2 | Copiar día sobre sí mismo | `copyDay` mismo source/target. | Duplica items sin `deleteMany` (comportamiento actual). | Usuario espera no-op; duplicados x2. | P1 |
| B3 | Lista compra: revocar share con enlace copiado | Compartir → copiar URL → revocar → abrir URL en incógnito. | 404/mensaje amigable. | Lista cacheada en Service Worker. | P1 |
| B4 | Rutas legacy `/households/:id/*` | Abrir bookmark antiguo. | `LegacyHouseholdRedirect` al hogar correcto. | 404 o hogar incorrecto. | P1 |
| B5 | Filtro `limit=101` en API | GET recipes `?limit=101`. | Cap a 100. | DoS / respuesta enorme. | P1 |
| B6 | Miembro VIEWER en despensa drag | Intentar drag en board. | UI sin drag (`canEdit` false). | API rechaza si fuerzan request. | P1 |
| B7 | Borrar ubicación con ítems | Eliminar `StorageLocation` con pantry items. | Cascade o bloqueo con mensaje. | Items huérfanos / 500. | P0 |
| B8 | Import URL maliciosa (SSRF) | URL `file://` o IP interna. | Rechazo URL. | Fetch servidor a red interna. | **P0** |

---

## Matriz P0 — ejecutar primero

| ID | Escenario |
|----|-----------|
| Z1 | `toISOString()` en dashboard vs día local |
| T5 / C3 | Hogar activo incorrecto |
| E1–E3 | JWT y 401 |
| X2–X3 | Permisos VIEWER |
| D1 / P1 | Doble generación lista compra |
| C5 | Receta borrada en plan |
| B8 | Import URL SSRF |
| A1 | localStorage bloqueado |
| S2 | Generar lista lenta sin duplicar |
| B1 | Meal plan sin receta ni nombre custom |
| B7 | Borrar ubicación con ítems |

---

## Notas para ejecución

- **Red:** Chrome DevTools → Network → Slow 3G / Offline.
- **Safari:** BrowserStack o dispositivo real; revisar `input[type=date]` y `localStorage`.
- **JWT:** decodificar en [jwt.io](https://jwt.io) o acortar `expiresIn` en dev.
- **Concurrencia:** dos navegadores o perfil normal + incógnito con dos usuarios del mismo hogar.
- **Automatización sugerida:** Playwright para D1, E1, Z1 (mock TZ), T2, B3.

---

## Referencias en código

| Área | Ubicación |
|------|-----------|
| JWT 7d | `backend/src/plugins/auth.ts` |
| Cliente API sin retry | `frontend/src/api/client.ts` |
| Salud en localStorage | `frontend/src/stores/health.store.ts` |
| Fechas plan (UTC noon) | `backend/src/lib/meal-plan-dates.ts` |
| Dashboard «hoy» UTC | `frontend/src/pages/DashboardPage.tsx` |
| Lista pública + rate limit | `backend/src/routes/public.routes.ts` |
| Validación Zod | `backend/src/lib/validation.ts` |
| Sin sync realtime | `docs/base-project-info.md` |
