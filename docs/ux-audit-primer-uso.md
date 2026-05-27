# Auditoría UX — Primer uso (usuario real)

Evaluación como **usuario nuevo** que llega a planificar la semana. Revisión basada en flujos del frontend (`localhost:5175`) y código de la app.

**Fecha:** 26 de mayo de 2026

---

## Resumen en una frase

La app **se ve cuidada**, pero el primer uso se siente como **entrar a un producto ya montado para power users**: muchas secciones, poco guion, y el camino feliz (receta → plan → compra) no está gritado.

---

## Por dimensión

### Onboarding

**Casi inexistente.** Tras registrarte: nombre del hogar → dashboard con 4 tarjetas + salud + miembros. No hay tour, checklist (“1. Crea una receta”), ni demo. El único onboarding real es el modal “Bienvenido / Crear hogar”, que está bien pero es **una sola pregunta** y luego te sueltan en el océano.

### Claridad

- **Bien:** auth con tagline y tres bullets (plan, despensa, compra).
- **Mal:** no queda claro el orden **Recetas → Plan → Lista**. El dashboard repite los mismos enlaces sin priorizar.
- **“Hogar”** no se explica (¿solo yo? ¿pareja? ¿piso compartido?).
- **“Hoy”** en el resumen = comidas planificadas hoy; sin etiqueta clara parece métrica random.
- Título **“Plan semanal”** con toggle **Mensual** → naming inconsistente.

### Confianza

- Contraseña mínima **6 caracteres**, sin requisitos visibles más allá del placeholder.
- **Sin “¿Olvidaste la contraseña?”** → abandono seguro si falla el login.
- Errores de API pueden sonar técnicos (el cliente menciona puerto 3001 en 404).
- **Fallos silenciosos** en dashboard y al generar listas erosionan confianza (“¿no funciona o no tengo datos?”).
- **Salud** en nav principal desde el minuto 0 parece otro producto; no queda claro si los datos van al servidor o solo local.

### Velocidad percibida

- Cadena de carga: **“Cargando…”** (auth) → **spinner del hogar** → contenido. Sensación de **doble espera** en cada arranque.
- Recetas: texto “Cargando recetas…” (no skeleton) → se siente más lento que Compra (sí tiene skeleton).
- Dashboard: contador de recetas en **“—”** hasta que responde la API, sin skeleton → parpadeo.
- Formulario de receta enorme → sensación de “esto va a tardar” antes de empezar.

### Fricción

| Momento | Fricción |
|--------|----------|
| Abrir `/` | **404** genérico (gris/teal, fuera del design system) |
| Logo en login | Enlaza a `/dashboard` → redirige a login (click muerto) |
| Plan vacío | `+` y **“Fuera”** sin explicar; hay que descubrir el picker |
| Plan sin recetas | Picker: “No hay recetas” **sin CTA** “Crear receta” |
| Lista vacía | Texto “Genera una lista…” **sin botón** en el empty state (el CTA está arriba, fácil de no ver) |
| Recetas vacías | Filtros avanzados visibles **antes** de tener una sola receta |
| Despensa | Ubicaciones en Ajustes; despensa sin setup previo = fricción extra |
| Copiar/pegar semana/día | Potente, **cero onboarding**; solo “Cancelar” en el hint |

### Comprensión del modelo mental

Entiendo (tarde) que: **hogar compartido → recetas del hogar → plan → lista snapshot → despensa opcional**. Un usuario espera “app de menú semanal”, no “CRM de cocina + wellness”. **Favoritos** tienen ruta `/favorites` pero **no están en la nav** (solo chip en recetas) → feature fantasma.

### Copywriting

- **Acertado:** tono cercano (“Cómo te llamamos”, “Tu cocina, organizada”).
- **Débil:** “Fuera” (¿fuera de casa? ¿restaurante?); “Genera la compra” (¿automática? ¿desde qué fechas?).
- **Jerga:** Propietario / Editor / Solo lectura en invitaciones.
- Empty de recetas: *“Prueba otros filtros o crea la primera”* → **prioridad invertida** para usuario nuevo.

### CTAs

- **Fuertes:** registro, crear hogar, “Ir al plan semanal” en menú vacío, “+ Nueva receta”.
- **Débiles / ausentes:** lista vacía (sin botón en empty), picker sin recetas, 404, primer paso post-registro.

### Confusión

- **7 ítems** en sidebar + bottom nav apretada (Inicio en FAB central, Ajustes al final).
- **Salud** en dashboard (chip) y en nav y en plan (kcal) → ¿es core o extra?
- **Favoritos** vs filtro “Favoritos” vs página `/favorites`.
- Invitaciones pendientes solo en **Ajustes** (fácil no verlas si te invitaron antes de crear hogar propio).

### Errores silenciosos

Ejemplos en código:

- **Dashboard:** `catch(() => {})` — fallo API sin feedback, datos en `—`.
- **Lista de compra:** `catch { // handle error }` al generar — nada visible.
- **Recetas:** `catch` → lista vacía como si no hubiera recetas (confunde con error de red).

El usuario interpreta **“no hay datos”**, no **“falló la red”**.

### Feedback visual

- Mezcla: spinners, texto, skeletons, `—` en stats.
- Clipboard: hint con solo **“Cancelar”** (¿qué estoy pegando?).
- Guardado en salud: flash “saved” pero perfil en localStorage — sensación inconsistente.

### Sensación de calidad

- **Alto:** paleta pastel, cards, auth layout, meal plan en móvil (píldoras de día).
- **Bajo:** 404, estados de carga dispares, errores tragados, settings monolítico (tags, ubicaciones, miembros, borrar cuenta…) en una sola página larga.

---

## Dónde abandonaría un usuario (orden probable)

1. **`/` o URL raíz → 404** — “¿Está rota?”
2. **Dashboard día 1** — demasiadas puertas, ninguna dice “empieza aquí”.
3. **Plan semanal vacío** — toco `+`, picker vacío, no sé crear receta desde ahí.
4. **Formulario nueva receta** — muchos campos (ingredientes, pasos, tags, kcal, categorías…) sin versión mínima.
5. **Lista de compra vacía** — no veo botón obvio “Generar”; no sé que necesito plan previo.
6. **Login sin recuperar contraseña** — si me equivoco, me voy.
7. **Ajustes / despensa** — configurar ubicaciones antes de guardar un tomate.

---

## Qué genera desconfianza

- Errores que **no se muestran** (dashboard, generar lista, listar recetas con error de red).
- Mensajes técnicos en errores de API.
- Contraseña débil aceptada sin aviso claro de riesgo.
- **Salud / peso / agua** sin explicar privacidad ni persistencia.
- Ver **“Receta eliminada”** o `?` en el plan si alguien borró datos (correcto técnicamente, inquietante sin contexto).
- Logo que promete ir “dentro” y te devuelve al login.

---

## Qué parece amateur

- Página **404** con estilos fuera del design system (`text-gray-300` / `teal-600`).
- **“Cargando…”** como único loading global (texto plano).
- Stat **“—”** en dashboard.
- Empty states **sin botón** cuando el copy pide acción (compra).
- **Catch vacíos** en flujos críticos.
- Ruta **Favoritos** huérfana en la navegación.

---

## Qué parece lento

- Doble/triple pantalla de carga al entrar.
- Lista de recetas sin skeleton.
- Picker de recetas que recarga en cada búsqueda con solo “Cargando...”.
- Settings que carga tags + ubicaciones + invitaciones de golpe.
- Formulario de receta pesado (percepción, aunque el guardado sea rápido).

---

## Qué sobra (para un primer uso)

- **Salud** como sección nav principal antes de tener una receta.
- **Filtros avanzados** (kcal, tiempo, ingredientes) con biblioteca vacía.
- **Copiar semana / copiar día** sin descubrimiento guiado.
- **Métricas de agua/calorías** en dashboard si aún no configuré perfil (solo ocupan espacio y dicen “completa perfil”).
- **Chip Miembros** en cabecera del dashboard el primer día en solitario.
- Vista **mensual** del plan antes de dominar la semanal (complejidad prematura).
- Página **Favoritos** separada si ya hay filtro en recetas.

---

## Qué falta

- **Redirect `/` → login o dashboard**.
- **Onboarding de 3 pasos**: crear receta → planificar un día → generar lista (con fechas por defecto = esta semana).
- **CTA en empties** (compra, picker, recetas: “Crear mi primera receta”).
- **Recuperación de contraseña**.
- **Toasts / banners** unificados para errores de red.
- **Un solo loading** coherente (skeleton system-wide).
- Explicación de **hogar** y flujo **plan → compra** en una línea bajo el saludo.
- **Versión mínima** de receta (título + ingredientes) y ampliar después.
- Invitaciones visibles en **dashboard** o banner global, no solo en Ajustes.
- En plan vacío: enlace **“Crear receta”** dentro del picker.

---

## Veredicto

Tienes una base de **producto serio para quien ya entiende el modelo**. Para alguien que abre la app **por primera vez** con la promesa “organiza tus comidas”, el producto **no enseña el camino feliz**, **castiga errores en silencio** y **compite consigo mismo** (demasiadas secciones con el mismo peso visual). No parece un MVP feo; parece un **MVP con demasiadas fases del roadmap visibles a la vez**.

---

## Próximos pasos sugeridos (prioridad)

1. Redirect `/` → login o dashboard.
2. Errores visibles en dashboard, recetas y generación de listas.
3. Empty de compra con botón “Generar lista”.
4. CTA “Crear receta” en picker del plan cuando no hay recetas.
5. Onboarding mínimo (checklist o banner en dashboard día 1).
