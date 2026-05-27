# Auditoría frontend — lanzamiento a escala

Revisión del paquete `frontend/` como **SPA React 19 + Vite + Zustand**, sin SSR. No hay hidratación clásica; el riesgo equivalente es **flash de tema** (bien mitigado) y **estado desincronizado tras cargas async**.

**Hallazgo bloqueante:** `pnpm build` falla por `POSTRE` faltante en varios `Record<MealType, …>` (`MonthDayCellMeals`, `MonthMealThumb`, `MonthlyCalendar`). **No es desplegable en producción hasta corregirlo.**

---

## Resumen ejecutivo

| Área | Estado |
|------|--------|
| Arquitectura / tests API | Sólida (factory pattern, Vitest) |
| UX estados vacíos / loading | Parcial; inconsistente entre páginas |
| Concurrencia / race conditions | Débil (sin `AbortController`) |
| Performance (bundle) | Sin lazy routes; CSS monolítico |
| Accesibilidad | Buena base ARIA; fallos en modales, anidación, teclado drag |
| SEO | Mínimo (esperable en app autenticada) |
| Build producción | Roto |

---

## 1. Race conditions en fetch (sin cancelación)

| | |
|---|---|
| **Severidad** | Alta |
| **Impacto** | Usuario cambia de hogar, lista, semana o filtro rápido → respuesta antigua pisa estado nuevo (recetas incorrectas, plan semanal de otra semana, sugerencias de ingredientes obsoletas). Con miles de usuarios y redes lentas, es reproducible. |
| **Dónde** | Patrón global en `RecipesPage`, `RecipeDetailPage`, `PantryPage`, `ShoppingListDetailPage`, `WeeklyCalendar`, `HouseholdProvider`, debounces en `PantryPage` / `RecipeForm` / `ShoppingListDetailPage`. |
| **Solución concreta** | Añadir `signal?: AbortSignal` al `apiClient` / `fetch`. En cada `useEffect` de carga: `const ac = new AbortController(); … return () => ac.abort();`. Ignorar errores `AbortError` al hacer `setState`. |
| **Refactor recomendado** | Hook `useFetchResource({ key, fetcher })` con cancelación, `isLoading`, `error`, `data` — sustituye ~15 bloques duplicados. |

---

## 2. Build de producción roto (`POSTRE`)

| | |
|---|---|
| **Severidad** | Crítica |
| **Impacto** | CI/CD y deploy fallan; tipos incompletos en plan mensual. |
| **Solución concreta** | Añadir `POSTRE` a los mapas de iconos en `MonthlyCalendar.tsx`, `MonthMealThumb.tsx`, `MonthDayCellMeals.tsx` (mismo patrón que `MEAL_TYPES` en `meal-type.ts`). |
| **Refactor recomendado** | Un solo `MEAL_TYPE_ICONS: Record<MealType, ReactNode>` exportado desde `utils/meal-type.ts` y consumido en semanal/mensual. |

---

## 3. Sin code splitting (bundle inicial grande)

| | |
|---|---|
| **Severidad** | Alta |
| **Impacto** | LCP peor en primera visita: todo `App.tsx` importa todas las páginas de golpe (`HealthPage`, `PantryPage`, calendarios, settings 517 líneas). En móvil 3G esto penaliza FID/LCP de forma directa. |
| **Solución concreta** | `React.lazy` por ruta + `<Suspense fallback={<PageSkeleton />}>` en `AppLayout`. |
| **Refactor recomendado** | Rutas con lazy + skeleton por sección; opcional: prefetch al hover en sidebar. |

```tsx
const HealthPage = lazy(() => import('./pages/HealthPage'));
// + <Suspense fallback={<PageSkeleton />}> en AppLayout
```

---

## 4. Cascada de loading (auth + hogar)

| | |
|---|---|
| **Severidad** | Media-Alta |
| **Impacto** | Pantalla en blanco encadenada: `ProtectedRoute` espera `loadProfile` → `HouseholdProvider` vuelve a cargar hogares. Sensación de app lenta al abrir. |
| **Dónde** | `frontend/src/components/ProtectedRoute.tsx` |
| **Solución concreta** | Paralelizar `loadProfile` + `households.list` en un `AppBootstrapProvider`; una sola pantalla de carga con progreso. |
| **Refactor recomendado** | `useAppSession()` que devuelve `{ user, household, status }` en un solo estado finito (`idle \| loading \| ready \| error`). |

---

## 5. Errores silenciados

| | |
|---|---|
| **Severidad** | Media |
| **Impacto** | Usuario ve listas vacías o calendario vacío sin saber si es “no hay datos” o fallo de red. |
| **Ejemplos** | `RecipesPage`: `catch { setRecipes([]) }` sin mensaje. `WeeklyCalendar`: `catch { // handle error }`. `DashboardPage`: `catch(() => {})`. |
| **Solución concreta** | Estado `error` + `SectionEmptyState` con CTA “Reintentar” y `role="alert"`. |
| **Refactor recomendado** | Mismo contrato que `PantryPage` (`loadError`), reutilizable. |

---

## 6. Sin Error Boundaries

| | |
|---|---|
| **Severidad** | Alta |
| **Impacto** | Un throw en `WeightGoalCard`, `MonthlyCalendar` o `deficit-planning` tumba toda la app (pantalla blanca). En producción con datos edge es común. |
| **Solución concreta** | `RouteErrorBoundary` por layout + fallback con “Recargar” y log a Sentry (o similar). |
| **Refactor recomendado** | Boundary en `AppLayout` + boundaries locales en Salud y Plan de comidas. |

---

## 7. Fecha “hoy” en UTC vs local

| | |
|---|---|
| **Severidad** | Media |
| **Impacto** | Tras las 22:00–23:59 en UTC+1/UTC+2, dashboard y salud pueden mostrar **comidas del día equivocado** respecto al plan semanal (`todayIsoLocal`). |
| **Dónde** | `DashboardPage`, `HealthPage`, `health.store.ts` usan `toISOString().split('T')[0]`; calendarios usan `todayIsoLocal()`. |
| **Solución concreta** | Usar `todayIsoLocal()` en todo el frontend (dashboard, health, health store). |
| **Refactor recomendado** | Export único desde `lib/meal-plan-dates.ts`; prohibir `toISOString().split('T')[0]` vía regla ESLint custom. |

---

## 8. Favoritos: estado inconsistente

| | |
|---|---|
| **Severidad** | Media |
| **Impacto** | Corazón siempre empieza en “no favorito”; tras toggle en detalle, la lista no se actualiza; doble click genera requests duplicados. |
| **Dónde** | `FavoriteButton` en `RecipeCard` sin `initialFavorited`; tipo `Recipe` sin `isFavorited`. |
| **Solución concreta** | Backend devuelve `isFavorited` en list/detail; pasar `initialFavorited`; opcional optimistic toggle con rollback. |
| **Refactor recomendado** | `useFavorite(recipeId)` con cache por id (Map en contexto o slice Zustand). |

---

## 9. Sin optimistic updates (listas y compra)

| | |
|---|---|
| **Severidad** | Media |
| **Impacto** | Cada check en lista de compra hace `reload()` completo → latencia perceptible y parpadeo (CLS en filas). |
| **Dónde** | `ShoppingListDetailPage.handleToggleGroup`, `SharedShoppingListPage`. |
| **Solución concreta** | Actualizar `list.items` en memoria al instante; revertir si falla el API. |
| **Refactor recomendado** | `shoppingListReducer` + acciones `TOGGLE_OPTIMISTIC` / `COMMIT` / `ROLLBACK`. |

---

## 10. Debounce sin cleanup (memory / setState tras unmount)

| | |
|---|---|
| **Severidad** | Media-Baja |
| **Impacto** | Warning en React 19 y updates tras desmontar componente al salir de despensa/receta mientras tipea. |
| **Dónde** | `nameDebounceRef`, `debounceRef`, `ingDebounceRef` sin `clearTimeout` en cleanup. |
| **Solución concreta** | `useEffect(() => () => clearTimeout(nameDebounceRef.current), []);` |
| **Refactor recomendado** | `useDebouncedCallback(fn, ms)` con cancelación automática. |

---

## 11. Re-renders innecesarios

| | |
|---|---|
| **Severidad** | Media |
| **Impacto** | Páginas pesadas se re-renderizan enteras cuando cambia un filtro o el contexto de hogar. |

| Problema | Detalle |
|----------|---------|
| Calendarios monolíticos | `WeeklyCalendar` (525 líneas) recalcula todo el árbol al cambiar `items` |
| Contexto hogar | Cualquier `refreshHousehold` re-renderiza todos los consumidores |
| `RecipeFilters` + 13 selectores Zustand | Bien granular en `RecipesPage`; el panel de filtros no está memoizado |

| **Solución concreta** | `React.memo` en `RecipeCard`, `WeeklyDayColumn`, `ShoppingItemRow`; dividir calendario en contenedor + presentación; selector fino en contexto hogar. |
| **Refactor recomendado** | Extraer `MealPlanWeekView` / `MealPlanMonthView` con props estables. |

---

## 12. Hidratación

| | |
|---|---|
| **Severidad** | N/A (CSR) |
| **Impacto** | No hay mismatch SSR/CSR. El script inline de tema en `index.html` + `initTheme()` evita FOUC de dark mode. |
| **Riesgo futuro** | Si se añade SSR, el script inline y `localStorage` deben alinearse con el mismo `resolveTheme`. |
| **Solución** | Ninguna urgente en CSR. Documentar contrato de tema si hay SSR. |

---

## 13. Loading states inconsistentes

| | |
|---|---|
| **Severidad** | Media |
| **Impacto** | UX poco profesional: texto “Cargando...” vs spinner vs skeleton vs nada. |

| Página | Estado actual |
|--------|----------------|
| Recetas | Card con texto |
| Recipe detail | Solo `<p className="loading-text">` |
| Shopping lists | `ShoppingListsSkeleton` (mejor) |
| Shared list | Spinner centrado |
| Hogar | Spinner full screen |

| **Solución concreta** | Un `PageLoader` y skeletons por patrón (grid, lista, detalle). |
| **Refactor recomendado** | Design system mínimo: `Skeleton`, `PageLoader`, `InlineLoader`. |

---

## 14. Empty states

| | |
|---|---|
| **Severidad** | Baja-Media |
| **Impacto** | `SectionEmptyState` está bien en recetas/despensa; calendario y salud a veces muestran UI vacía sin explicación. |
| **Solución concreta** | Empty explícito en plan semanal sin comidas, salud sin perfil; distinguir error de carga vs vacío real. |
| **Refactor recomendado** | Reutilizar `SectionEmptyState` con variantes `error` / `empty`. |

---

## 15. Formularios y validación débil

| | |
|---|---|
| **Severidad** | Media |

| Formulario | Problema |
|------------|----------|
| Registro | Solo `minLength={6}` en cliente |
| `RecipeForm` | Sin validar URL imagen, números negativos |
| Despensa | `handleSubmit` sale en silencio si falta cantidad/unidad |
| Salud | `Number(form.weight)` sin rangos (peso 0 o 9999) |

| **Solución concreta** | Validación compartida (Zod cuando haga falta) + mensajes por campo + `aria-invalid` / `aria-describedby`. |
| **Refactor recomendado** | `lib/validation/recipe.ts`, `pantry.ts` testeables. |

---

## 16. Anidación interactiva (WCAG 2.1)

| | |
|---|---|
| **Severidad** | Media |
| **Impacto** | `FavoriteButton` dentro de `<Link>` en `RecipeCard` — botón dentro de enlace: problemas con lectores de pantalla y activación. |
| **Solución concreta** | `FavoriteButton` fuera del `Link` (layout flex) o acciones en overlay con tab order correcto. |
| **Refactor recomendado** | `RecipeCard`: imagen+link al detalle; acciones en barra separada. |

---

## 17. Modal sin focus trap

| | |
|---|---|
| **Severidad** | Media |
| **Impacto** | Tab escapa al contenido detrás; no devuelve foco al disparador — fallo WCAG 2.4.3. |
| **Dónde** | `frontend/src/components/ui/Modal.tsx` |
| **Solución concreta** | `focus-trap-react` o implementación mínima: primer/último foco, `returnFocusRef`. |
| **Refactor recomendado** | `Modal` accesible reutilizable en settings y meal-plan. |

---

## 18. Drag handle solo visual (teclado)

| | |
|---|---|
| **Severidad** | Media |
| **Impacto** | `PantryLocationHead`: `role="button"` con `onKeyDown` que solo hace `preventDefault` sin acción — usuarios solo teclado no pueden reordenar. |
| **Dónde** | `frontend/src/components/pantry/PantryLocationHead.tsx` |
| **Solución concreta** | Botones “Subir/Bajar ubicación” alternativos, o reordenar con flechas y `aria-grabbed`. |
| **Refactor recomendado** | Modo lista accesible paralelo al drag en `PantryLocationsBoard`. |

---

## 19. Imágenes y CLS / LCP

| | |
|---|---|
| **Severidad** | Media |
| **Impacto** | Google Fonts bloqueantes en `<head>` (Inter + Montserrat, 8 pesos) retrasa LCP. Imágenes sin dimensiones intrínsecas; `alt=""` en recetas pierde contexto. |
| **Solución concreta** | `font-display: swap`, subset, self-host; `aspect-ratio` fijo; `alt={recipe.title}` en cards. |
| **Refactor recomendado** | Componente `RecipeImage` con placeholder (como el fallback con icono actual). |

---

## 20. Dark mode

| | |
|---|---|
| **Severidad** | Baja |
| **Impacto** | Implementación correcta: `data-theme`, script anti-FOUC, `AppearanceSection`, listener `prefers-color-scheme`. |
| **Mejora** | `theme-color` en manifest PWA fijo — barra de estado no sigue tema en standalone. |
| **Solución concreta** | Sincronizar `theme_color` del manifest con tema activo o valores por modo. |

---

## 21. Navegación móvil

| | |
|---|---|
| **Severidad** | Baja-Media |
| **Impacto** | `BottomNav` con 5 destinos + FAB central — denso en pantallas &lt;360px; `main-scroll__nav-spacer` evita solapamiento (bien). Favoritos solo en sidebar desktop. |
| **Solución concreta** | Probar en dispositivos reales; considerar menú “Más” para Salud+Ajustes. |
| **Refactor recomendado** | Documentar breakpoints y máximo de ítems en bottom nav. |

---

## 22. SEO y meta

| | |
|---|---|
| **Severidad** | Baja (app privada) / Media (lista compartida pública) |
| **Impacto** | Una sola `<title>Comidas</title>`; `/shared/:token` sin OG tags ni título dinámico — mal preview en WhatsApp. |
| **Solución concreta** | Para rutas públicas: `react-helmet-async` o meta en servidor si esa ruta tiene SSR. |
| **Refactor recomendado** | `SharedShoppingListPage` con meta por lista (nombre, progreso). |

---

## 23. Performance Lighthouse (estimación)

| Métrica | Riesgo principal |
|---------|------------------|
| **LCP** | Fonts externas + JS bundle sin split |
| **CLS** | Reload de listas, imágenes sin ratio, spinners que sustituyen contenido |
| **INP / FID** | Calendario mensual grande, drag pantry, listeners `resize` |

**Acciones rápidas:** lazy routes, fonts self-hosted, optimistic UI en compra, skeletons con altura fija.

---

## 24. Salud: estado solo en `localStorage`

| | |
|---|---|
| **Severidad** | Media (producto) |
| **Impacto** | Perfil, agua y objetivos no sincronizan entre móvil y desktop; pérdida al limpiar datos; incoherencia con kcal del plan en servidor. |
| **Dónde** | `frontend/src/stores/health.store.ts` |
| **Solución concreta** | Persistir en API por usuario (como `showCalories` en perfil). |
| **Refactor recomendado** | `health.store` como cache; fuente de verdad en backend. |

---

## 25. Componentes demasiado grandes (límite 500 líneas del proyecto)

| Archivo | Líneas (~) | Acción |
|---------|------------|--------|
| `index.css` | 3737 | Dividir por dominio (`pantry.css`, `meal-plan.css`, …) o más Tailwind `@layer` |
| `RecipeForm.tsx` | 573 | Split: detalles, ingredientes, pasos |
| `WeeklyCalendar.tsx` | 525 | Extraer toolbar, día móvil, fila ítem |
| `MonthlyCalendar.tsx` | 468 | Extraer celda día y toolbar |
| `HouseholdSettingsPage.tsx` | 517 | Una sección = un componente |
| `HealthPage.tsx` | 492 | Separar perfil, agua, planes |
| `deficit-planning.ts` | 506 | OK como util testeada; no mezclar con UI |
| `PantryPage.tsx` | 458 | Extraer formulario y búsqueda |

---

## 26. Arquitectura de carpetas

| | |
|---|---|
| **Severidad** | Baja (deuda) |
| **Estado** | Coherente con la guía del monorepo (`api/`, `hooks/`, `stores/`, `components/`, `pages/`). |
| **Mejoras** | Mover `WeeklyCalendar` / `MonthlyCalendar` a `components/meal-plan/`. Añadir `AuthBootstrapProvider` en `providers/`. Evitar imports entre líneas de estilo en páginas. |
| **Refactor recomendado** | Convención: páginas &lt;200 líneas; lógica en hooks/services. |

---

## 27. Deuda técnica priorizada

| Prioridad | Item |
|-----------|------|
| **P0** | Arreglar build `POSTRE` |
| **P0** | `AbortController` en fetches |
| **P1** | Error boundaries + errores visibles |
| **P1** | `todayIsoLocal` unificado |
| **P1** | Code splitting rutas |
| **P2** | Optimistic shopping/favorites |
| **P2** | Validación formularios |
| **P2** | Modal a11y + FavoriteButton fuera de Link |
| **P3** | Dividir CSS y componentes &gt;500 líneas |
| **P3** | Health sync backend |
| **P3** | SEO lista compartida |

---

## Lo que ya está bien

- Patrón **API factory** testeable y alineado con el proyecto.
- **Tema** anti-FOUC y tokens semánticos CSS.
- **PWA** con `NetworkOnly` en rutas sensibles (auth/hogares).
- Uso extendido de **ARIA** en navegación, paginación, compra y despensa.
- **`SectionEmptyState`** y algunos skeletons.
- **`PantryLocationsBoard`** con lógica de sync/drag cuidadosa (`pendingSyncKeyRef`).
- **`WeightGoalCard`** limpia preview al desmontar (`setLiveCaloriePreview(null)`).

---

## Plan sugerido (1 semana)

1. **Día 1–2:** P0 — build `POSTRE`, `AbortController`, `todayIsoLocal`.
2. **Día 3–4:** P1 — lazy routes, error boundaries, errores visibles en listados/calendario.
3. **Día 5:** P2 — favoritos + toggle compra optimista (muestra de impacto UX).
4. **Backlog:** P3 — CSS split, health API, SEO shared.

---

*Generado: auditoría pre-lanzamiento del frontend `comidas`.*
