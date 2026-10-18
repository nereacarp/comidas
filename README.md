<img src="https://capsule-render.vercel.app/api?type=waving&height=100&color=a8e6cf&section=header" width="100%" alt="footer-waves" />

# Planificador de Comidas

App fullstack para planificar menús semanales/mensuales en familia o individual. Gestiona recetas, genera listas de compra automáticamente, controla tu despensa y monitorea tu salud.

<div align="center">
  <a href="https://comidas-frontend.vercel.app" target="_blank"><img src="https://img.shields.io/badge/Ver_en_Vivo-a8e6cf?style=for-the-badge&logo=google-chrome&logoColor=black" alt="Demo" /></a>
</div>

Demo: `demo@comidas.app` / `comidas123`

<p>
  <img width="1920" height="898" alt="dashboard" src="https://github.com/user-attachments/assets/9fca1ffe-e62b-4342-b1ec-611888daf820" />
</p>

## Funcionalidades

- **Recetas:** crea, edita e importa recetas con IA, calcula calorías automáticamente y guarda favoritas.
- **Plan de comidas:** organiza desayunos, comidas y cenas en un calendario semanal o mensual, incluso días fuera de casa.
- **Lista de la compra:** se genera automáticamente según tu menú, agrupa ingredientes repetidos y permite compartirla fácilmente.
- **Despensa:** controla lo que tienes en casa por ubicaciones y actualízala automáticamente con las compras.
- **Salud:** seguimiento de agua, calorías, peso y objetivos de pérdida de peso con cálculos personalizados.
- **Hogares compartidos:** varios usuarios pueden colaborar en el mismo hogar con distintos permisos y favoritos individuales.

<p>
  <img width="32%" alt="auth" src="https://github.com/user-attachments/assets/42e18a08-5e51-4575-a864-0f2cc0c93fdb" />
  <img width="32%" alt="recetas" src="https://github.com/user-attachments/assets/6748dff5-f3f8-4ea1-bb90-cb9dec639b78" />
  <img width="32%" alt="plan" src="https://github.com/user-attachments/assets/63148532-4d1c-49ad-9c95-c18465edc338" />
</p>
<p>
  <img width="32%" alt="despensa" src="https://github.com/user-attachments/assets/8e9be5ec-f7e0-4337-8bf4-f15dcae7d858" />
  <img width="32%" alt="lista" src="https://github.com/user-attachments/assets/e8bb67df-7b7e-4836-9ff5-11d1f9d08d99" />
  <img width="32%" alt="salud" src="https://github.com/user-attachments/assets/23eae776-70c5-4aaf-86a6-c026aceaf661" />
</p>

## Stack técnico

| Capa | Tecnología |
| :--- | :--- |
| **Backend** | <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white" /> <img src="https://img.shields.io/badge/Fastify-000000?style=flat-square&logo=fastify&logoColor=white" /> |
| **ORM** | <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" /> |
| **Base de datos** | <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" /> |
| **Frontend** | <img src="https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB" /> <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" /> |
| **Estado global** | <img src="https://img.shields.io/badge/Zustand-443E38?style=flat-square&logo=ghost&logoColor=white" /> |
| **Estilos** | <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" /> |
| **IA** | <img src="https://img.shields.io/badge/Google_Gemini-8E75C2?style=flat-square&logo=googlegemini&logoColor=white" /> |
| **Infraestructura** | <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" /> <img src="https://img.shields.io/badge/Compose-2496ED?style=flat-square&logo=docker&logoColor=white" /> |
| **Testing** | <img src="https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white" /> |


## Estructura del proyecto

```
comidas/
├── backend/               # API (Node + Fastify + Prisma)
│   ├── src/
│   │   ├── routes/        # Endpoints HTTP
│   │   ├── services/      # Lógica de negocio
│   │   └── lib/           # Funciones auxiliares
│   └── prisma/            # Esquema, migraciones y datos de demo (seed)
├── frontend/              # App web (React + Vite)
│   └── src/
│       ├── pages/         # Cada página de la app
│       ├── components/    # Componentes reutilizables
│       ├── hooks/         # Hooks de React
│       ├── lib/           # Utilidades y lógica de dominio
│       ├── stores/        # Estado global (Zustand)
│       └── api/           # Llamadas al backend
├── backoffice/            # Panel de administración
├── deploy/                # Docker de producción, Caddy y scripts de copias
├── docs/                  # Documentación
├── tests/e2e/             # Tests end-to-end (Playwright)
├── docker-compose.yml     # Entorno de desarrollo
└── start.bat              # Arranque con un doble clic (Windows)
```

---

## Web en vivo

<div align="center">
  <a href="https://comidas-frontend.vercel.app" target="_blank"><img src="https://img.shields.io/badge/Frontend_Live-4CAF50?style=for-the-badge&logo=google-chrome&logoColor=white&color=a8e6cf" alt="Frontend Live" /></a>
  <a href="https://comidas-backend.vercel.app" target="_blank"><img src="https://img.shields.io/badge/Backend_API-0077B6?style=for-the-badge&logo=fastify&logoColor=white" alt="Backend API" /></a>
  <a href="docs/release-checklist.md" target="_blank"><img src="https://img.shields.io/badge/Deployment_Docs-FF9800?style=for-the-badge&logo=readthedocs&logoColor=white" alt="Deployment Docs" /></a>
</div>

**Usuario demo:**
```
Email: demo@comidas.app
Contraseña: comidas123
```

---

## Ejecutar en local

Solo necesitas tener instalado [Docker](https://www.docker.com/). En Windows también puedes hacer doble clic en `start.bat`.

```bash
git clone https://github.com/nereacarp/comidas
cd comidas
docker compose up
```

Una vez arrancado:

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5175 |
| API | http://localhost:3001 |

Cargar datos de demo:

```bash
docker compose exec backend pnpm db:seed
```

```
Email: demo@comidas.app
Contraseña: comidas123
```

## Variables de entorno

_(Datos sensibles que la app necesita para funcionar pero que no se guardan en el código por seguridad)_

El proyecto incluye un archivo `.env.example` con todas las variables necesarias pero sin valores reales. Antes de arrancar la app tienes que crear tu propio archivo `.env` copiando ese ejemplo y rellenando los valores:

```bash
cp .env.example .env
```

Abre el `.env` que acabas de crear y sustituye cada valor por el tuyo. El archivo [.env.example](.env.example) incluye una descripción de para qué sirve cada variable. Si ejecutas cada parte fuera de Docker, `backend/`, `frontend/` y `backoffice/` tienen también su propio `.env.example`.

## Documentación

<div align="center">
  <a href="docs/README.md" target="_blank"><img src="https://img.shields.io/badge/Guías-2196F3?style=for-the-badge&logo=markdown&logoColor=white" alt="Documentación" /></a>
  <a href="docs/release-checklist.md" target="_blank"><img src="https://img.shields.io/badge/Release_Checklist-FF9800?style=for-the-badge&logo=checklist&logoColor=white" alt="Release Checklist" /></a>
  <a href="docs/vercel-neon.md" target="_blank"><img src="https://img.shields.io/badge/Deploy_Guide-4CAF50?style=for-the-badge&logo=vercel&logoColor=white" alt="Deploy Guide" /></a>
</div>

## Licencia

<div align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License" /></a>
</div>

<img src="https://capsule-render.vercel.app/api?type=waving&height=100&color=a8e6cf&section=footer" width="100%" alt="footer-waves" />
