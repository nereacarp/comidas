# Checklist de release — SaaS moderno

Checklist exhaustivo para validar un release de producción en una aplicación SaaS.

**Prioridades:** 🔴 Crítico · 🟡 Recomendado · ⚪ Opcional

---

## Frontend

| # | Item | Prioridad |
|---|------|-----------|
| 1 | Build de producción sin errores ni warnings bloqueantes | 🔴 |
| 2 | Variables de entorno correctas (`VITE_*` / `NEXT_PUBLIC_*`) por entorno | 🔴 |
| 3 | API apunta a URLs de producción (no localhost) | 🔴 |
| 4 | Manejo de errores global (boundary, toasts, estados vacíos) | 🔴 |
| 5 | Rutas protegidas y redirecciones post-login/logout | 🔴 |
| 6 | Assets estáticos con cache busting (hash en filenames) | 🔴 |
| 7 | CSP y headers de seguridad configurados en el host | 🔴 |
| 8 | Smoke test manual de flujos críticos (signup, core feature, settings) | 🔴 |
| 9 | Bundle size revisado; code splitting en rutas pesadas | 🟡 |
| 10 | Lazy loading de imágenes y componentes pesados | 🟡 |
| 11 | Meta tags básicos (title, description, og:image) | 🟡 |
| 12 | Favicon, apple-touch-icon, manifest PWA | 🟡 |
| 13 | i18n/locale si aplica; formatos de fecha/moneda | 🟡 |
| 14 | Feature flags para rollout gradual | 🟡 |
| 15 | Modo mantenimiento / banner de incidente | 🟡 |
| 16 | Source maps: subidos a Sentry, no expuestos públicamente | 🟡 |
| 17 | Prefetch / optimización de fuentes (subset, display swap) | ⚪ |
| 18 | Storybook / visual regression en CI | ⚪ |
| 19 | Offline / service worker (solo si PWA es requisito) | ⚪ |

---

## Backend

| # | Item | Prioridad |
|---|------|-----------|
| 1 | Health check (`/health`, `/ready`) con DB y dependencias | 🔴 |
| 2 | Variables de entorno validadas al arranque (fail fast) | 🔴 |
| 3 | CORS restringido a dominios de producción | 🔴 |
| 4 | Rate limiting en auth y endpoints sensibles | 🔴 |
| 5 | Timeouts y límites de body en requests | 🔴 |
| 6 | Logging estructurado (JSON) con request ID | 🔴 |
| 7 | Manejo centralizado de errores (no stack traces al cliente) | 🔴 |
| 8 | Versionado de API o compatibilidad documentada | 🟡 |
| 9 | Graceful shutdown (drain connections, jobs) | 🟡 |
| 10 | Idempotencia en operaciones críticas (pagos, webhooks) | 🟡 |
| 11 | Cola de jobs (emails, exports) con reintentos y DLQ | 🟡 |
| 12 | Documentación OpenAPI / contratos con frontend | 🟡 |
| 13 | Límites de concurrencia en operaciones costosas | 🟡 |
| 14 | Circuit breakers hacia servicios externos | ⚪ |
| 15 | Blue/green o canary en despliegue | ⚪ |

---

## Base de datos

| # | Item | Prioridad |
|---|------|-----------|
| 1 | Migraciones aplicadas y probadas en staging | 🔴 |
| 2 | Backup automático antes del release (o snapshot) | 🔴 |
| 3 | Plan de rollback de migraciones documentado | 🔴 |
| 4 | Índices en columnas de búsqueda y FKs | 🔴 |
| 5 | Connection pooling configurado (PgBouncer, etc.) | 🔴 |
| 6 | Usuario de app con permisos mínimos (no superuser) | 🔴 |
| 7 | SSL/TLS en conexión a DB en producción | 🔴 |
| 8 | Migraciones backward-compatible (expand/contract) | 🟡 |
| 9 | Retención y purga de datos obsoletos definida | 🟡 |
| 10 | Monitoreo de conexiones, locks, slow queries | 🟡 |
| 11 | Réplica de lectura si hay carga alta | 🟡 |
| 12 | Vacuum/analyze programado (PostgreSQL) | 🟡 |
| 13 | Cifrado at rest en el proveedor cloud | 🟡 |
| 14 | Particionamiento / sharding | ⚪ |
| 15 | Failover automático multi-AZ | ⚪ |

---

## Auth

| # | Item | Prioridad |
|---|------|-----------|
| 1 | HTTPS obligatorio; cookies `Secure`, `HttpOnly`, `SameSite` | 🔴 |
| 2 | Secretos JWT/session rotados y distintos por entorno | 🔴 |
| 3 | Passwords hasheados (bcrypt/argon2), nunca en logs | 🔴 |
| 4 | Protección brute force (rate limit, lockout temporal) | 🔴 |
| 5 | Flujo de reset password seguro (token único, expiración) | 🔴 |
| 6 | Verificación de email antes de acceso completo | 🔴 |
| 7 | Logout invalida sesión/token en servidor | 🔴 |
| 8 | MFA disponible o obligatorio según riesgo | 🟡 |
| 9 | OAuth redirect URIs solo de producción registradas | 🟡 |
| 10 | Refresh token rotation / revocación | 🟡 |
| 11 | Sesiones concurrentes y “cerrar todas” | 🟡 |
| 12 | Audit log de login, cambio password, permisos | 🟡 |
| 13 | RBAC/ABAC probado en endpoints admin | 🟡 |
| 14 | SSO/SAML para enterprise | ⚪ |
| 15 | Passkeys / WebAuthn | ⚪ |

---

## Pagos

| # | Item | Prioridad |
|---|------|-----------|
| 1 | Claves live vs test separadas; live solo en prod | 🔴 |
| 2 | Webhooks con firma verificada y idempotencia | 🔴 |
| 3 | No almacenar PAN/CVV; solo IDs del proveedor | 🔴 |
| 4 | Flujos: subscribe, upgrade, downgrade, cancel, failed payment | 🔴 |
| 5 | Portal de cliente / gestión de facturación enlazado | 🔴 |
| 6 | Proration y cambios de plan probados en staging | 🔴 |
| 7 | Impuestos (VAT/IVA) según jurisdicción si aplica | 🟡 |
| 8 | Facturas PDF/email automáticas | 🟡 |
| 9 | Dunning (reintentos de cobro fallido) configurado | 🟡 |
| 10 | Cupones, trials y límites de uso alineados con producto | 🟡 |
| 11 | Reconciliación periódica Stripe ↔ DB | 🟡 |
| 12 | Modo test E2E con tarjetas de prueba documentadas | 🟡 |
| 13 | Chargebacks y disputas: proceso interno | ⚪ |
| 14 | Múltiples métodos de pago (SEPA, etc.) | ⚪ |

---

## Emails

| # | Item | Prioridad |
|---|------|-----------|
| 1 | Dominio verificado (SPF, DKIM, DMARC) | 🔴 |
| 2 | Templates transaccionales: welcome, verify, reset, invoice | 🔴 |
| 3 | Unsubscribe en marketing; List-Unsubscribe header | 🔴 |
| 4 | Bounce/complaint handling (webhooks del ESP) | 🔴 |
| 5 | From/reply-to coherentes con la marca | 🔴 |
| 6 | Rate limits y cola para envíos masivos | 🟡 |
| 7 | Preview/test en staging sin enviar a usuarios reales | 🟡 |
| 8 | Localización de plantillas si hay i18n | 🟡 |
| 9 | Tracking de opens/clicks desactivado o con consentimiento | 🟡 |
| 10 | Supresión de usuarios que dieron de baja | 🟡 |
| 11 | In-app notifications como fallback | ⚪ |
| 12 | SMS para 2FA crítico | ⚪ |

---

## Analytics

| # | Item | Prioridad |
|---|------|-----------|
| 1 | Consentimiento antes de trackers no esenciales (GDPR) | 🔴 |
| 2 | Eventos core definidos (signup, activation, conversion, churn) | 🔴 |
| 3 | Separación dev/staging/prod (no contaminar prod) | 🔴 |
| 4 | User ID hasheado o pseudónimo donde aplique | 🟡 |
| 5 | Funnels y cohortes documentados | 🟡 |
| 6 | UTM y atribución de campañas | 🟡 |
| 7 | Server-side events para acciones críticas (pago) | 🟡 |
| 8 | Dashboard de producto para el equipo | 🟡 |
| 9 | Session replay con enmascaramiento de PII | ⚪ |
| 10 | A/B testing framework | ⚪ |
| 11 | Export a data warehouse | ⚪ |

---

## Observabilidad

| # | Item | Prioridad |
|---|------|-----------|
| 1 | APM/tracing distribuido (request → DB → external) | 🔴 |
| 2 | Logs centralizados con retención definida | 🔴 |
| 3 | Alertas en errores 5xx y latencia p95/p99 | 🔴 |
| 4 | Dashboards: requests, errors, latencia, queue depth | 🔴 |
| 5 | Correlación request ID entre frontend y backend | 🟡 |
| 6 | Métricas de negocio (signups, MRR proxy) en dashboards | 🟡 |
| 7 | SLOs/SLIs documentados (uptime, error budget) | 🟡 |
| 8 | Status page pública o semi-pública | 🟡 |
| 9 | Synthetic monitoring (ping cada N min) | 🟡 |
| 10 | Profiling en staging para hotspots | ⚪ |
| 11 | OpenTelemetry export unificado | ⚪ |

---

## Backups

| # | Item | Prioridad |
|---|------|-----------|
| 1 | Backups automáticos de DB (diario mínimo) | 🔴 |
| 2 | Restore probado en los últimos 3–6 meses | 🔴 |
| 3 | RPO/RTO documentados y comunicados | 🔴 |
| 4 | Backups cifrados y en región distinta | 🔴 |
| 5 | Retención alineada con legal (ej. 30–90 días) | 🟡 |
| 6 | Backup de objetos (S3) y secrets vault | 🟡 |
| 7 | Point-in-time recovery si el proveedor lo ofrece | 🟡 |
| 8 | Runbook de disaster recovery | 🟡 |
| 9 | Backup de configuración infra (IaC en git) | 🟡 |
| 10 | Prueba de restore anual tipo “game day” | ⚪ |

---

## CI/CD

| # | Item | Prioridad |
|---|------|-----------|
| 1 | Pipeline: lint → test → build → deploy a staging → prod | 🔴 |
| 2 | Deploy a prod solo desde tag/main protegida | 🔴 |
| 3 | Secrets en CI (no en repo); rotación documentada | 🔴 |
| 4 | Migraciones en paso explícito del pipeline | 🔴 |
| 5 | Rollback de deploy documentado y probado | 🔴 |
| 6 | Branch protection + reviews obligatorias | 🟡 |
| 7 | Lockfile (`pnpm-lock`) verificado en CI | 🟡 |
| 8 | Escaneo de dependencias (Dependabot/Snyk) | 🟡 |
| 9 | Escaneo de secretos (gitleaks) en pre-commit/CI | 🟡 |
| 10 | Artefactos inmutables (imagen Docker con tag SHA) | 🟡 |
| 11 | Deploy notifications (Slack) | 🟡 |
| 12 | Preview environments por PR | ⚪ |
| 13 | Canary / progressive rollout | ⚪ |
| 14 | DORA metrics tracking | ⚪ |

---

## Dominios

| # | Item | Prioridad |
|---|------|-----------|
| 1 | DNS apuntando correctamente (A/AAAA/CNAME) | 🔴 |
| 2 | TLS válido (Let's Encrypt o cert gestionado) | 🔴 |
| 3 | Redirect www ↔ apex consistente | 🔴 |
| 4 | Subdominios: app, api, www, status documentados | 🔴 |
| 5 | Renovación auto de dominio y cert | 🟡 |
| 6 | HSTS preload considerado tras estabilidad | 🟡 |
| 7 | Email DNS (MX, SPF, DKIM) en subdominio mail | 🟡 |
| 8 | CDN delante de estáticos | 🟡 |
| 9 | Dominio de reserva / typosquatting básico | ⚪ |
| 10 | IPv6 si el proveedor lo soporta | ⚪ |

---

## SEO

| # | Item | Prioridad |
|---|------|-----------|
| 1 | `robots.txt` y `sitemap.xml` en marketing site | 🟡 |
| 2 | Canonical URLs; evitar duplicados www/http | 🟡 |
| 3 | Meta title/description únicos por página pública | 🟡 |
| 4 | SSR/SSG o prerender para páginas indexables | 🟡 |
| 5 | Core Web Vitals aceptables en landing | 🟡 |
| 6 | Structured data (Organization, SoftwareApplication) | ⚪ |
| 7 | hreflang si multi-región | ⚪ |
| 8 | Google Search Console / Bing verificados | ⚪ |
| 9 | Blog/docs con internal linking | ⚪ |

---

## Legal

| # | Item | Prioridad |
|---|------|-----------|
| 1 | Términos de servicio publicados y enlazados en signup | 🔴 |
| 2 | Política de privacidad actualizada y accesible | 🔴 |
| 3 | Checkbox de aceptación en registro (timestamp guardado) | 🔴 |
| 4 | Contrato de procesamiento (DPA) si B2B/UE | 🟡 |
| 5 | Política de cookies y banner si hay trackers | 🟡 |
| 6 | SLA publicado si vendes a empresas | 🟡 |
| 7 | Política de reembolsos / cancelación alineada con pagos | 🟡 |
| 8 | Aviso legal / datos de empresa (CIF, dirección) | 🟡 |
| 9 | Registro de marcas si aplica | ⚪ |
| 10 | Seguro de responsabilidad civil cyber | ⚪ |

---

## Privacidad

| # | Item | Prioridad |
|---|------|-----------|
| 1 | Registro de actividades de tratamiento (ROPA) básico | 🔴 |
| 2 | Base legal por finalidad (contrato, consentimiento, interés) | 🔴 |
| 3 | Export de datos del usuario (portabilidad) | 🔴 |
| 4 | Borrado de cuenta y datos asociados (cascade) | 🔴 |
| 5 | Subprocesadores listados (hosting, email, analytics) | 🔴 |
| 6 | Minimización: solo datos necesarios en forms/logs | 🟡 |
| 7 | Retención automática / política de borrado | 🟡 |
| 8 | DPIA si datos sensibles o alto riesgo | 🟡 |
| 9 | DPO o contacto privacidad publicado | 🟡 |
| 10 | Registro de consentimientos marketing | 🟡 |
| 11 | Anonimización en analytics/logs | 🟡 |
| 12 | Transferencias internacionales (SCCs) documentadas | ⚪ |

---

## Monitoring

| # | Item | Prioridad |
|---|------|-----------|
| 1 | Uptime check externo (API + landing) | 🔴 |
| 2 | Alertas 24/7 a on-call (PagerDuty/Opsgenie) | 🔴 |
| 3 | Escalación definida si no ack en X min | 🔴 |
| 4 | Monitoreo de colas y jobs fallidos | 🟡 |
| 5 | Monitoreo de disco, CPU, memoria en hosts | 🟡 |
| 6 | Alertas de facturación cloud (budget alerts) | 🟡 |
| 7 | SSL expiry monitoring | 🟡 |
| 8 | Monitoreo de certificados y dominio expiry | 🟡 |
| 9 | Heartbeat de cron jobs críticos | 🟡 |
| 10 | RUM (Real User Monitoring) | ⚪ |

---

## Seguridad

| # | Item | Prioridad |
|---|------|-----------|
| 1 | Dependencias sin CVEs críticos conocidos | 🔴 |
| 2 | Secrets no en código; rotación post-incidente | 🔴 |
| 3 | Headers: CSP, X-Frame-Options, X-Content-Type-Options | 🔴 |
| 4 | Input validation y sanitización (SQLi, XSS) | 🔴 |
| 5 | Autorización en cada endpoint (no solo auth) | 🔴 |
| 6 | Webhooks y APIs internas con auth/firma | 🔴 |
| 7 | Pentest o escaneo DAST antes de launch público | 🟡 |
| 8 | WAF o rate limit a nivel edge | 🟡 |
| 9 | 2FA en cuentas admin internas (GitHub, cloud) | 🟡 |
| 10 | Política de contraseñas y rotación de API keys | 🟡 |
| 11 | SBOM / supply chain en CI | 🟡 |
| 12 | Bug bounty / security.txt | ⚪ |
| 13 | Honeypots / detección de bots avanzada | ⚪ |
| 14 | SOC 2 / ISO 27001 (enterprise) | ⚪ |

---

## Rendimiento

| # | Item | Prioridad |
|---|------|-----------|
| 1 | Load test básico en endpoints críticos | 🔴 |
| 2 | CDN para assets estáticos | 🟡 |
| 3 | Compresión gzip/brotli | 🟡 |
| 4 | Cache HTTP en recursos inmutables | 🟡 |
| 5 | N+1 queries eliminadas en listados principales | 🟡 |
| 6 | Paginación en listas grandes | 🟡 |
| 7 | LCP < 2.5s en landing (objetivo) | 🟡 |
| 8 | Database query timeouts | 🟡 |
| 9 | Autoscaling configurado | 🟡 |
| 10 | Image optimization (WebP, sizes) | ⚪ |
| 11 | Edge caching de API read-heavy | ⚪ |
| 12 | Benchmark regression en CI | ⚪ |

---

## Mobile

| # | Item | Prioridad |
|---|------|-----------|
| 1 | Responsive en viewports 320–428px | 🔴 |
| 2 | Touch targets ≥ 44px; sin hover-only UX | 🔴 |
| 3 | Formularios usables (teclado correcto, zoom no roto) | 🔴 |
| 4 | PWA manifest si “Add to Home Screen” es objetivo | 🟡 |
| 5 | Prueba en iOS Safari y Chrome Android reales | 🟡 |
| 6 | Deep links / universal links si hay app nativa | 🟡 |
| 7 | Push notifications (permiso y fallback) | ⚪ |
| 8 | Apps nativas en stores (review, screenshots) | ⚪ |
| 9 | Offline mode limitado | ⚪ |

---

## Accesibilidad

| # | Item | Prioridad |
|---|------|-----------|
| 1 | HTML semántico (landmarks, headings jerárquicos) | 🔴 |
| 2 | Navegación por teclado en flujos críticos | 🔴 |
| 3 | Contraste WCAG AA en texto y controles | 🔴 |
| 4 | Labels en todos los inputs; errores asociados (`aria-describedby`) | 🔴 |
| 5 | Focus visible y orden lógico de tab | 🔴 |
| 6 | `alt` en imágenes informativas; decorativas vacías | 🟡 |
| 7 | `aria-live` en toasts y cargas dinámicas | 🟡 |
| 8 | Skip link “Ir al contenido” | 🟡 |
| 9 | Audit axe/Lighthouse a11y sin issues críticos | 🟡 |
| 10 | No depender solo de color para estado | 🟡 |
| 11 | Modales: trap focus, Escape cierra | 🟡 |
| 12 | Declaración de accesibilidad / contacto | ⚪ |
| 13 | Certificación WCAG AAA / auditoría externa | ⚪ |

---

## Pre-launch transversal (día D)

| # | Item | Prioridad |
|---|------|-----------|
| 1 | Checklist firmado por responsable técnico + producto | 🔴 |
| 2 | Ventana de deploy comunicada; rollback listo | 🔴 |
| 3 | Feature flags OFF para features no listas | 🔴 |
| 4 | Monitoreo reforzado 24–48 h post-launch | 🔴 |
| 5 | Runbook de incidentes y contactos actualizado | 🔴 |
| 6 | Comunicación a usuarios beta / changelog | 🟡 |
| 7 | Post-mortem template listo por si algo falla | ⚪ |

---

## Resumen por prioridad

| Área | 🔴 Críticos | 🟡 Recomendados | ⚪ Opcionales |
|------|-------------|----------------|--------------|
| Frontend | 8 | 7 | 3 |
| Backend | 7 | 6 | 2 |
| Base de datos | 7 | 6 | 2 |
| Auth | 7 | 6 | 2 |
| Pagos | 6 | 6 | 2 |
| Emails | 5 | 5 | 2 |
| Analytics | 3 | 5 | 3 |
| Observabilidad | 4 | 5 | 2 |
| Backups | 4 | 5 | 1 |
| CI/CD | 5 | 6 | 3 |
| Dominios | 4 | 4 | 2 |
| SEO | 0 | 5 | 4 |
| Legal | 3 | 5 | 2 |
| Privacidad | 5 | 6 | 1 |
| Monitoring | 3 | 6 | 1 |
| Seguridad | 6 | 5 | 3 |
| Rendimiento | 1 | 8 | 3 |
| Mobile | 3 | 3 | 3 |
| Accesibilidad | 5 | 6 | 2 |
| Pre-launch | 5 | 1 | 1 |

---

## Notas

- Para un **MVP interno** o **beta cerrada** se pueden relajar legal, SEO y parte de privacidad avanzada, pero no auth, pagos, backups, secrets ni HTTPS.
- Checklist específico del proyecto: ver [`PRE-RELEASE-AUDIT.md`](./PRE-RELEASE-AUDIT.md).
