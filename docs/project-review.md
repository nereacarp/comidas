# Revisión general antes de publicar Comidas

Fecha de revisión: 10 de agosto de 2026  
Estado tras correcciones: **TÉCNICAMENTE PREPARADO, PUBLICACIÓN CONDICIONADA A CONFIGURACIÓN Y VALIDACIÓN OPERATIVA**

> Nota: las secciones 1 a 10 conservan la fotografía inicial que motivó el trabajo. Este bloque resume el estado real después de aplicar y verificar las correcciones.

## 0. Estado tras las correcciones

### Resuelto

- Salud: ritmos y fechas coherentes, opciones seguras de pérdida, límite por IMC, solo adultos, fecha local, calorías por ración y almacenamiento separado por cuenta.
- Autorización: comprobaciones multi-hogar para plan, favoritos, despensa, ubicaciones y recetas; actualizaciones complejas dentro de transacciones.
- Autenticación: cookie HttpOnly/SameSite, cierre de sesión, contraseñas de 10 caracteres, cambio de contraseña e invalidación de sesiones anteriores.
- Seguridad web: CORS y orígenes cerrados, límite de cuerpo, cabeceras, protección de origen, rate limits, secreto administrativo con comparación segura y auditoría.
- Importación URL: solo HTTPS, resolución DNS, bloqueo de redes privadas/localhost, validación tras redirecciones, timeout, tipo HTML y límite de 2 MB.
- Producción: Caddy con TLS, API y backoffice no expuestos públicamente, secretos obligatorios, contenedores reproducibles, migraciones, CI, backup y documentación de despliegue.
- Privacidad y condiciones: rutas públicas, aviso específico de Salud/IA/cookie/listas compartidas y aceptación en el registro. El build de producción exige responsable y contacto reales.
- Calidad: cero vulnerabilidades conocidas en dependencias de producción, Knip limpio en los tres módulos y carga inicial del frontend reducida de 511 kB a 292 kB mediante carga diferida.
- Adaptación móvil: navegación inferior con Recetas/Plan y Compra/Despensa alrededor de Inicio, acceso a Ajustes integrado en la cabecera de Inicio, Salud disponible desde Inicio, formularios de ingredientes reorganizados, acciones fijas por encima de la navegación y modales adaptados a pantallas estrechas.
- Modo oscuro: paleta pastel más saturada, paneles y tarjetas teñidos por sección, ubicaciones de despensa claramente diferenciadas y contraste AA conservado mediante pruebas automáticas.

### Verificación final ejecutada

| Comprobación | Resultado actual |
|---|---|
| Backend | **209 tests**, build, Prisma y Knip OK |
| Frontend | **250 tests**, build y Knip OK; incluye 6 comprobaciones de contraste oscuro; lint con 0 errores y 11 avisos de Fast Refresh |
| Backoffice | **2 tests**, build, lint y Knip OK |
| Total | **461 tests verdes** |
| Cobertura | Scripts reproducibles OK; servicios backend 86,41 %, utilidades Salud/frontend 87 % o más |
| Auditoría de producción | **0 vulnerabilidades conocidas** en los tres módulos |
| Imágenes Docker | Backend, frontend y backoffice construidas correctamente |
| Compose | Desarrollo y producción validados |
| Navegador | Login, registro, privacidad y condiciones sin errores de consola; dashboard, recetas, plan, despensa, compra, Salud y ajustes sin desbordamiento horizontal a 326 px |
| Sesión real | Registro temporal, doble login, cambio de clave, revocación de sesión anterior y borrado: **OK** |
| Base local | Backup creado; baseline inicial y migración de versión de sesión aplicados |

### Pendiente fuera del código antes de publicar

1. Rellenar `.env` con dominio, orígenes, secretos aleatorios, `LEGAL_OPERATOR` y `LEGAL_CONTACT` reales.
2. Aplicar el procedimiento de baseline documentado si la base de producción ya existe; en una base vacía debe usarse `migrate deploy` sin marcar manualmente la inicial.
3. Ejecutar en staging una restauración de backup y un simulacro de rollback; los scripts están preparados, pero una restauración real depende del servidor de destino.
4. Revisar los textos legales con la identidad, proveedores, plazos y jurisdicción reales del responsable.
5. Si la app se abre al público general, configurar un proveedor de correo para verificación y recuperación de contraseña. No se puede implementar correctamente sin decidir proveedor, remitente y dominio.
6. Para varias réplicas del backend, sustituir los rate limits en memoria por un almacén compartido (por ejemplo Redis). La configuración actual es adecuada para una sola réplica.

## 1. Resumen ejecutivo

La aplicación de desarrollo funciona y los flujos principales se pueden utilizar, pero la configuración actual no está preparada para una publicación segura y reproducible.

Los bloqueos principales son:

1. Las imágenes Docker de producción de `frontend` y `backoffice` no se construyen.
2. El directorio completo `backoffice/` está ignorado por Git y no se incluiría en un clon o despliegue desde el repositorio.
3. No existe ninguna migración de Prisma; una base de datos nueva no puede crearse de forma reproducible.
4. Producción no define `NODE_ENV=production`, por lo que un `JWT_SECRET` vacío puede terminar usando `dev-secret` y CORS puede quedar abierto.
5. El despliegue propuesto publica frontend, API y administración por HTTP, sin TLS, y expone directamente los puertos administrativos y de API.
6. La auditoría de dependencias detecta vulnerabilidades críticas, incluidas tres en la cadena JWT del backend.
7. Hay controles incompletos de pertenencia entre hogares en la actualización del plan de comidas, favoritos y ubicaciones de despensa.
8. La importación de recetas por URL necesita protección adicional contra SSRF, redirecciones, respuestas enormes y abuso de la API de IA.

El apartado Salud sí ha sido corregido durante esta revisión: cálculos coherentes, plazos seguros, validación de edad e IMC, fecha local, raciones personales y almacenamiento separado por cuenta. Sus regresiones forman parte de la suite verde de 244 tests.

## 2. Arquitectura y forma de inicio

El proyecto está formado por:

- `backend/`: Node.js, Fastify, Prisma y PostgreSQL.
- `frontend/`: React, Vite y Zustand.
- `backoffice/`: React/Refine para administración.
- `docker-compose.yml`: entorno de desarrollo con base de datos, backend y frontend.
- `docker-compose.prod.yml`: propuesta de despliegue con base de datos, backend, frontend y backoffice.
- `iniciar.bat`: inicia Docker Compose, ejecuta el seed una sola vez y abre `http://localhost:5175`.

Inicio actual de desarrollo:

```powershell
docker compose up -d
```

Direcciones locales:

- Frontend: `http://localhost:5175`
- Backend: `http://localhost:3001`
- PostgreSQL: `localhost:5433`

El `docker-compose.yml` actual no contiene el servicio `backoffice`; un contenedor antiguo puede seguir apareciendo como huérfano, pero `iniciar.bat` no garantiza que ese panel se inicie.

## 3. Comprobaciones ejecutadas

| Comprobación | Resultado |
|---|---|
| Tests backend | **OK** — 24 archivos, 193 tests |
| Build TypeScript backend | **OK** |
| Imagen Docker producción backend | **OK** |
| Tests frontend | **OK** — 58 archivos, 244 tests |
| Build frontend | **OK** |
| Lint de todos los archivos modificados en Salud | **OK** |
| Lint general frontend | **FALLA** — 4 errores y 12 avisos |
| Knip frontend | **FALLA** — 2 exportaciones anteriores sin uso |
| Tests backoffice | **SIN TESTS** — Vitest devuelve código 0 aunque indica “No test files found” |
| Lint backoffice | **OK** |
| Knip backoffice | **FALLA** — configuración sin coincidencias y dependencias marcadas como no usadas |
| Imagen Docker producción frontend | **FALLA** durante `pnpm install` |
| Imagen Docker producción backoffice | **FALLA** durante `pnpm install` |
| Cobertura backend/frontend | **FALLA** — falta `@vitest/coverage-v8` |
| Estado de migraciones | Cero migraciones; la base actual está sincronizada por otros medios |
| Validación Compose desarrollo/producción | Sintaxis **OK** |
| Smoke test autenticado de API | **OK** para perfil, hogares, recetas, despensa, ubicaciones, listas, plan, favoritos e invitaciones |
| API sin JWT | **OK** — devuelve 401 |
| Administración sin secreto | **OK** — devuelve 401 |
| Recorrido navegador | **OK** en dashboard, recetas, plan, despensa, listas, Salud y ajustes |
| Cabeceras frontend | **FALLA** — sin CSP, `X-Content-Type-Options` ni protección contra frames |

### Auditoría de dependencias

| Módulo | Vulnerabilidades de producción detectadas |
|---|---|
| Backend | 18: 3 críticas, 10 altas, 5 moderadas |
| Frontend | 12: 6 altas, 5 moderadas, 1 baja |
| Backoffice | 95: 1 crítica, 51 altas, 38 moderadas, 5 bajas |

En backend, las vulnerabilidades críticas proceden de `fast-jwt`, usado por `@fastify/jwt`. Son relevantes para autenticación y no deben ignorarse. En frontend, varias alertas de React Router afectan funciones RSC que quizá no se utilicen, pero deben actualizarse y comprobarse. En backoffice, gran parte del volumen entra por `@refinedev/cli`, que está instalado como dependencia de producción; aunque algunos paquetes sólo se usen al construir, siguen siendo riesgo de cadena de suministro y aumentan mucho la superficie.

## 4. Bloqueos P0 — obligatorios antes de publicar

### P0-01. Las imágenes de producción del frontend y backoffice no compilan

Evidencia:

- `frontend/Dockerfile.prod:3`
- `backoffice/Dockerfile.prod:3`

Ambos ejecutan `corepack prepare pnpm@latest`. La versión actual de pnpm ignora el campo antiguo `pnpm.onlyBuiltDependencies` de `package.json` y aborta con `ERR_PNPM_IGNORED_BUILDS` para `esbuild`.

Impacto: `docker compose -f docker-compose.prod.yml build` no puede generar la aplicación publicable.

Corrección recomendada:

- Fijar una versión concreta de pnpm en todos los Dockerfiles y en `packageManager`.
- Migrar la aprobación de scripts a la configuración soportada por esa versión.
- Construir las tres imágenes en CI desde cero, sin depender de caché local.

Prueba de cierre: las tres imágenes deben compilar con caché vacía.

### P0-02. El backoffice no está versionado

Evidencia:

- `.gitignore:15` contiene `backoffice/`.
- `git ls-files backoffice` devuelve cero archivos.
- `docker-compose.prod.yml` intenta construir `./backoffice`.

Impacto: un clon limpio del repositorio no contiene el backoffice y el despliegue falla. Además, sus cambios no quedan revisados ni protegidos por historial.

Corrección recomendada: dejar de ignorar `backoffice/`, revisar que su `.env` permanezca ignorado y añadir el código necesario al repositorio.

### P0-03. No existen migraciones de base de datos

Evidencia:

- `backend/prisma/` no tiene directorio `migrations/`.
- `prisma migrate status` indica “No migration found”.
- Desarrollo sólo ejecuta `prisma generate`.
- Producción ejecuta `prisma migrate deploy`, que no tiene migraciones que aplicar.

La base local aparece sincronizada porque se creó previamente mediante `db push` u otro proceso, pero ese estado no puede reproducirse desde el repositorio.

Impacto: una instalación nueva puede arrancar PostgreSQL sin tablas; el seed falla y el backend no dispone de esquema. Tampoco existe historial para evolucionar o revertir la base.

Corrección recomendada:

1. Crear una migración inicial completa.
2. Definir cómo baselinar la base existente sin recrear tablas.
3. Probar migración sobre base vacía y sobre una copia de la base actual.
4. Añadir backup y prueba de restauración antes de cada despliegue.

### P0-04. Producción puede usar el secreto JWT de desarrollo

Evidencia:

- `backend/src/plugins/auth.ts:13` usa `process.env.JWT_SECRET || 'dev-secret'`.
- La comprobación estricta sólo se ejecuta si `NODE_ENV === 'production'`.
- `docker-compose.prod.yml` no define `NODE_ENV=production`.

El mismo problema afecta al cierre de CORS: `backend/src/server.ts:40` sólo exige `ALLOWED_ORIGINS` cuando `NODE_ENV` vale `production`.

Impacto: con variables incompletas, producción podría firmar tokens con un secreto público y aceptar orígenes no previstos.

Corrección recomendada:

- Añadir `NODE_ENV=production` a la imagen/Compose.
- Validar al arrancar todas las variables obligatorias con un esquema y fallar siempre si están vacías.
- Eliminar completamente el fallback JWT fuera de tests/desarrollo explícito.

### P0-05. Despliegue HTTP y servicios expuestos directamente

Evidencia:

- `docker-compose.prod.yml:22`, `:47` y `:60` publican API, frontend y backoffice.
- `VITE_API_URL` se construye como `http://${SERVER_IP}:3001`.
- `deploy.sh` anuncia URLs `http://` y usa un IP y usuario root fijos.

Impacto: contraseñas, JWT y secreto de administración viajarían sin cifrar. La API y el backoffice quedan directamente expuestos a Internet. Si posteriormente se pone HTTPS sólo delante del frontend, la llamada HTTP a la API causará contenido mixto.

Corrección recomendada:

- Colocar Caddy, Traefik o Nginx como único punto público en 80/443.
- Emitir certificado TLS y redirigir todo HTTP a HTTPS.
- Servir API bajo el mismo origen, por ejemplo `/api`.
- No publicar los puertos 3001, 8080 ni PostgreSQL.
- Añadir HSTS sólo después de comprobar HTTPS.

### P0-06. Dependencias críticas en autenticación y administración

El backend usa `@fastify/jwt@9.1.0`, que incorpora `fast-jwt@5.0.6`. La auditoría detectó tres vulnerabilidades críticas relacionadas con confusión de algoritmos/caché y bypass con secreto HMAC vacío.

Corrección recomendada:

- Actualizar Fastify y `@fastify/jwt` hasta una cadena que use versiones parcheadas.
- Regenerar lockfiles y volver a ejecutar tests y auditoría.
- Reducir las dependencias de producción del backoffice; `@refinedev/cli` no debería viajar como dependencia runtime si sólo se usa al desarrollar/construir.
- Bloquear publicación si queda cualquier vulnerabilidad crítica sin una evaluación escrita de aplicabilidad.

### P0-07. Aislamiento incompleto entre hogares

#### Actualización del plan de comidas

`backend/src/services/meal-plan.service.ts:46` comprueba que el item pertenezca al hogar, pero no valida que el nuevo `recipeId` pertenezca al mismo hogar. La creación sí hace esa validación.

Impacto: una persona con permiso de edición y conocimiento de un ID ajeno podría enlazar una receta de otro hogar. Al recuperar el plan, la relación incluida puede revelar datos de esa receta.

#### Favoritos después de abandonar un hogar

`backend/src/services/favorite.service.ts:24` lista favoritos sólo por `userId`; no vuelve a comprobar la membresía del hogar de cada receta.

Impacto: un favorito antiguo puede mantener acceso a los datos de una receta después de retirar al usuario del hogar.

#### Ubicación de despensa

`backend/src/services/pantry.service.ts:20` y `:48` aceptan `locationId` sin verificar que esa ubicación pertenezca al mismo hogar.

Impacto: relaciones cruzadas entre hogares y posible exposición del nombre/icono de una ubicación ajena.

Corrección recomendada: toda clave foránea recibida del cliente debe consultarse junto con `householdId` dentro de la misma operación/transacción. Añadir tests con dos hogares y dos usuarios para cada ruta de lectura y escritura.

### P0-08. Importación URL expuesta a SSRF y abuso de recursos

`backend/src/services/recipe-import.service.ts` exige HTTPS y bloquea IP privadas escritas literalmente, lo cual es positivo, pero faltan:

- Resolución DNS y validación de todas las IP obtenidas.
- Revalidación de cada redirección.
- Bloqueo de representaciones alternativas de IPv4, IPv6 mapeada y DNS rebinding.
- Límite de bytes de respuesta antes de `response.text()`.
- Comprobación de `Content-Type`.
- Rate limit por usuario/hogar para importación y estimación con Gemini.
- Presupuesto/cuota para evitar costes inesperados.

Impacto: acceso a servicios internos, consumo de memoria y abuso económico de Gemini.

## 5. Riesgos P1 — resolver antes de abrir registro público

### P1-01. Rate limit evadible mediante `X-Forwarded-For`

`backend/src/services/auth-rate-limit.service.ts:36` y `backend/src/routes/public.routes.ts:8` confían directamente en una cabecera controlada por el cliente.

Como la API se publica directamente, un atacante puede cambiar `X-Forwarded-For` para repartir intentos entre IP ficticias.

Configurar `trustProxy` sólo para el proxy conocido y usar `request.ip`. No aceptar esa cabecera desde Internet.

### P1-02. Rate limiting sólo en memoria

Los contadores viven en `Map`. Se pierden al reiniciar, no se comparten entre réplicas y pueden crecer con muchas claves/IP diferentes.

Usar Redis o un almacenamiento compartido con TTL y métricas. Aplicar límites también a registro, administración, importación IA y rutas públicas compartidas.

### P1-03. Administración con un único secreto compartido

El backoffice utiliza un bearer secret guardado en `sessionStorage`. No hay cuentas individuales de administrador, MFA, auditoría ni trazabilidad de quién eliminó usuarios, hogares, recetas o tags.

Antes de usarlo públicamente:

- Crear roles/cuentas de administrador individuales.
- Exigir MFA o acceso mediante VPN/SSO.
- Registrar acciones administrativas y conservar auditoría.
- Rate limit de autenticación del backoffice.
- Evitar operaciones destructivas sin confirmación reforzada.

### P1-04. JWT de 30 días en `localStorage`

`frontend/src/stores/auth.store.ts` y `frontend/src/api/client.ts` almacenan el token en `localStorage`; las rutas lo emiten con 30 días de validez. Logout sólo borra el token del navegador y no lo revoca.

Impacto: un XSS obtiene una sesión larga y no revocable.

Preferencia: cookie `HttpOnly`, `Secure`, `SameSite`, access token corto y refresh token rotatorio/revocable. Como mínimo, reducir expiración, añadir CSP y rotación/versionado de sesión.

### P1-05. Actualización de receta no transaccional

`backend/src/services/recipe.service.ts:261-263` elimina ingredientes, categorías y tags antes de actualizar la receta. No está envuelto en `$transaction`.

Impacto: si la actualización posterior falla, la receta queda parcialmente vacía.

Corrección: ejecutar validación, borrados y actualización dentro de una transacción Prisma.

### P1-06. Validación de entradas insuficiente

En `backend/src/lib/validation.ts` abundan strings con sólo `.min(1)` y sin máximos. Las fechas sólo comprueban que no estén vacías. El plan permite estructuras ambiguas con receta y nombre personalizado, o sin ninguno.

Añadir:

- Límites de longitud para nombres, descripciones, instrucciones y URLs.
- Fechas ISO válidas y rangos máximos razonables.
- Regla XOR entre `recipeId` y `customMealName`.
- Límites de arrays e ingredientes.
- Normalización y trim consistente.
- Respuestas 400 para datos inválidos, nunca 500.

### P1-07. Emails no normalizados y recuperación de cuenta inexistente

El registro/login no normaliza consistentemente el email a minúsculas. PostgreSQL puede aceptar cuentas distintas que sólo cambian mayúsculas/minúsculas.

No se encontró flujo de:

- Verificación de correo.
- Recuperación de contraseña.
- Cambio de contraseña.
- Revocación de sesiones.

Son necesarios antes de abrir el registro a usuarios reales.

### P1-08. Cabeceras y endurecimiento del frontend ausentes

La respuesta del frontend no incluye CSP, `X-Content-Type-Options` ni protección `frame-ancestors`/`X-Frame-Options`. El backend sí aplica Helmet, pero eso no protege los documentos servidos por Nginx.

Añadir en `frontend/nginx.conf` y `backoffice/nginx.conf`:

- Content-Security-Policy.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy`.
- `Permissions-Policy`.
- `frame-ancestors`.
- HSTS cuando HTTPS esté validado.

### P1-09. Contenedores con privilegios y dependencias innecesarias

La imagen runtime del backend instala también dependencias de desarrollo y no define un usuario sin privilegios.

Corrección recomendada:

- Instalar sólo dependencias de producción en runtime.
- Ejecutar con usuario no root.
- Usar filesystem de sólo lectura cuando sea posible.
- Añadir límites de CPU/memoria, rotación de logs y healthchecks externos.

### P1-10. No hay CI ni cobertura funcional real

No se encontró `.github/workflows` ni otro pipeline. Los tests actuales son principalmente unitarios con mocks; no se encontraron pruebas de rutas mediante `fastify.inject`, Supertest ni E2E automatizados.

Además, `test:coverage` está definido pero falla por falta de `@vitest/coverage-v8`. El backoffice no tiene ningún test y su comando devuelve éxito, por lo que puede dar una falsa sensación de seguridad.

## 6. Problemas P2 de utilidad y operación

### P2-01. `iniciar.bat` puede quedarse esperando indefinidamente

No valida el resultado de `docker compose up`, no tiene timeout general y no explica si Docker Desktop está cerrado.

También crea `.initialized` aunque `pnpm db:seed` falle:

- `iniciar.bat:17`: ejecuta seed.
- `iniciar.bat:18`: crea siempre el marcador.

Impacto: después de un fallo inicial, el seed no se vuelve a intentar automáticamente.

Debe comprobar cada código de salida, tener un tiempo máximo y mostrar los logs/estado del servicio que no arrancó.

### P2-02. `.env.example` contiene instrucciones incorrectas

La primera línea no es un comentario de dotenv y la descripción de `ADMIN_SECRET` dice “no se usa ahora mismo”, aunque sí protege las rutas administrativas.

Corregir el archivo, añadir `SERVER_IP`, `ALLOWED_ORIGINS`, `NODE_ENV` y documentación de generación/rotación de secretos. No recomendar generadores web de secretos; usar herramientas locales.

### P2-03. Script de despliegue frágil

`deploy.sh` contiene IP y usuario root fijos, instala Docker automáticamente, usa `docker compose down` —provocando parada— y no contempla staging, rollback, migración segura ni backup.

Crear un pipeline reproducible con:

- Entorno de staging.
- Imagen identificada por commit.
- Backup verificado.
- Migración previa/compatible.
- Healthcheck post-despliegue.
- Rollback automático o documentado.

### P2-04. Mensajes de error confusos

`frontend/src/api/client.ts` añade a cualquier 404 que el backend del puerto 3001 podría estar caído. Un 404 válido de receta/hogar no significa caída del backend.

El registro también transforma errores como “email ya registrado” en “Email o contraseña incorrectos”. Mostrar el mensaje adecuado sin filtrar información sensible en login.

### P2-05. Generación de lista y despensa necesita semántica clara

La generación calcula sustracciones de despensa y termina aplicando cambios. Debe quedar claro para el usuario cuándo se reserva/consume stock, y la operación debe ser idempotente para que regenerar la misma lista no descuente dos veces.

Añadir historial o confirmación y tests de regeneración, concurrencia y rollback.

### P2-06. Privacidad y textos legales

No se encontraron política de privacidad, términos de uso ni información sobre tratamiento de datos. Aunque Salud se almacena localmente, la aplicación gestiona cuentas, hogares compartidos y contenido alimentario. La importación puede enviar contenido a Google Gemini.

Antes de publicar:

- Política de privacidad y responsable/contacto.
- Explicación de datos locales y datos almacenados en servidor.
- Información de proveedores/subencargados, incluida IA.
- Retención, exportación y eliminación.
- Términos de uso y limitación médica de Salud.
- Consentimiento o base jurídica correspondiente.

### P2-07. Operación sin observabilidad ni recuperación probada

No se observan alertas, agregación de logs, seguimiento de errores, métricas de base de datos, backup programado ni prueba de restauración.

Como mínimo medir:

- Disponibilidad y latencia API.
- Errores 5xx y fallos de login/importación.
- Uso/cuota de Gemini.
- CPU, memoria y disco.
- Estado y antigüedad del último backup.

## 7. Estado del apartado Salud

Corregido durante la revisión:

- Plazos de pérdida y ganancia coherentes con kcal y ritmo mostrado.
- Reajuste automático de fechas imposibles al máximo recomendado.
- Límite de 1 kg/semana y suelo basado en TMB/mínimo calórico.
- Objetivos de pérdida bloqueados bajo IMC 18,5.
- Edad limitada a adultos de 18–100 años.
- Fecha local para “hoy”.
- kcal definidas por ración y raciones personales configurables.
- Totales de Salud/calendario ajustados a raciones personales.
- Datos locales separados por ID de usuario.
- Texto de fecha estimada y advertencia de que no sustituye consejo sanitario.

Caso verificado en navegador:

- Mujer, 63 kg, 165 cm, 30 años, actividad moderada.
- TMB: 1.350 kcal.
- TDEE: 2.093 kcal.
- Objetivo 58 kg en 4 semanas solicitado.
- Resultado corregido: 1.350 kcal/día, déficit 743 kcal/día, 0,68 kg/semana y fecha estimada posterior.
- Objetivo 30 kg: bloqueado con IMC aproximado 11.

Nota médica: son estimaciones para adultos y no garantizan que un ritmo sea adecuado para cada situación clínica.

## 8. Batería mínima de tests antes de publicar

### 8.1. Tests automáticos obligatorios en cada commit/PR

1. Instalación congelada desde lockfile.
2. TypeScript/build de backend, frontend y backoffice.
3. ESLint sin errores.
4. Tests unitarios con cobertura y umbrales acordados.
5. Auditoría de dependencias sin críticas.
6. Knip o análisis equivalente sin fallos injustificados.
7. Escaneo de secretos y SAST.
8. Construcción de las tres imágenes Docker desde caché vacía.
9. `docker compose config --quiet` para desarrollo y producción.

### 8.2. Tests de integración del backend

Usar una PostgreSQL temporal real y `fastify.inject`:

- Registro, login, perfil y logout/revocación.
- Validación y códigos 400/401/403/404/409.
- Roles OWNER, EDITOR y VIEWER.
- Dos usuarios y dos hogares en cada recurso para detectar IDOR.
- Invitaciones, retirada de miembros y favoritos antiguos.
- CRUD recetas, tags, plan, despensa, ubicaciones y listas.
- Transacciones y rollback ante fallos.
- Rate limiting real y cabeceras de proxy.
- URL import: redirects, DNS privado, respuestas grandes, timeout y content-type.

### 8.3. Tests E2E

Automatizar con Playwright contra un entorno limpio:

1. Registro → creación de hogar → login/logout.
2. Crear, editar, filtrar y eliminar receta.
3. Importar receta válida y gestionar error de URL.
4. Añadir receta al plan semanal y cambiar vistas.
5. Generar lista, marcar compra y actualizar despensa.
6. Invitar miembro y comprobar permisos de cada rol.
7. Salud: perfiles, fechas rápidas, IMC, ganancia, raciones y cambio de cuenta.
8. Ajustes y eliminación de cuenta.
9. Backoffice: acceso, listados, detalle, permisos y confirmaciones destructivas.
10. 404 y recuperación ante caída temporal del backend.

### 8.4. Base de datos y despliegue

- Crear base vacía sólo con migraciones.
- Ejecutar seed y abrir la aplicación.
- Migrar una copia anonimizada del estado actual.
- Backup y restauración completa.
- Despliegue en staging usando exactamente las imágenes publicables.
- Reinicio de todos los contenedores y persistencia de datos.
- Rollback de aplicación y procedimiento compatible de base de datos.

### 8.5. Seguridad

- TLS y redirección HTTP→HTTPS.
- Verificación de cabeceras con herramienta automatizada.
- Pruebas de autorización multi-hogar.
- XSS en todos los textos introducidos por usuarios/IA.
- CSRF si se migra a cookies.
- Rate limit distribuido.
- SSRF y DNS rebinding.
- Escaneo de imágenes Docker y ejecución no root.
- Rotación de JWT, DB, Gemini y secreto administrativo.

### 8.6. Calidad de producto

- Accesibilidad con axe y navegación sólo con teclado.
- Contraste, foco visible y lectores de pantalla.
- Móvil pequeño, tablet y escritorio.
- Chrome, Firefox, Safari y Edge.
- Zona horaria Europe/Madrid y cambios de horario de verano.
- PWA/offline, actualización de service worker y caché obsoleta.
- Rendimiento con hogares grandes, cientos de recetas y listas.
- Textos legales, exportación y eliminación de datos.

## 9. Orden recomendado de trabajo

### Fase 1 — hacer publicable el artefacto

- Versionar backoffice.
- Corregir Dockerfiles de frontend/backoffice.
- Crear migración inicial y estrategia de baseline.
- Añadir CI con build/test/audit.

### Fase 2 — cerrar seguridad crítica

- Configuración fail-closed de secretos y `NODE_ENV`.
- Actualizar dependencias críticas.
- TLS/reverse proxy y puertos internos.
- Corregir autorización cruzada de plan, favoritos y despensa.
- Endurecer importación de URLs y rate limits.

### Fase 3 — cuentas, datos y operaciones

- Recuperación/verificación de correo y sesiones revocables.
- Transacciones y validación completa.
- Backups, restauración, logs, métricas y alertas.
- Privacidad, términos y aviso de IA/Salud.

### Fase 4 — validación final

- E2E completo en staging.
- Pruebas de seguridad y accesibilidad.
- Carga básica y navegadores.
- Simulacro de despliegue y rollback.

## 10. Criterios para dar luz verde

No publicar hasta que se cumpla todo lo siguiente:

- [ ] Las tres imágenes de producción compilan desde cero.
- [ ] Backoffice está versionado y tiene tests.
- [ ] Una base vacía se crea sólo con migraciones.
- [ ] Producción falla al arrancar si falta cualquier secreto/origen.
- [ ] Todo el tráfico público usa HTTPS y sólo se expone el proxy.
- [ ] No quedan vulnerabilidades críticas sin justificar/corregir.
- [ ] Los tests multi-hogar demuestran aislamiento completo.
- [ ] SSRF y rate limiting están reforzados.
- [ ] Lint, tests, cobertura y CI están verdes.
- [ ] Backup/restauración y rollback se han probado.
- [ ] Existen privacidad, términos y mecanismos de cuenta.
- [ ] E2E, accesibilidad y staging han pasado.

Hasta entonces, el entorno local es adecuado para seguir desarrollando, pero no para exponerlo a usuarios reales o Internet.
