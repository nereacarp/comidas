# Planificador de Comidas

App web para planificar menús semanales/mensuales en familia o individual. Gestiona recetas, genera listas de la compra automáticamente y lleva el control de la despensa.

## Funcionalidades

- **Recetas:** crea, edita e importa recetas con IA, calcula calorías automáticamente y guarda favoritas.
- **Plan de comidas:** organiza desayunos, comidas y cenas en un calendario semanal o mensual, incluso días fuera de casa.
- **Lista de la compra:** se genera automáticamente según tu menú, agrupa ingredientes repetidos y permite compartirla fácilmente.
- **Despensa:** controla lo que tienes en casa por ubicaciones y actualízala automáticamente con las compras.
- **Salud:** seguimiento de agua, calorías, peso y objetivos de pérdida de peso con cálculos personalizados.
- **Hogares compartidos:** varios usuarios pueden colaborar en el mismo hogar con distintos permisos y favoritos individuales.

## Stack técnico

| Capa | Tecnología | Para qué se usa |
|------|-----------|-----------------|
| Backend | Node.js · Fastify | Servidor que expone la API REST que consume el frontend |
| ORM | Prisma | Hace las consultas a la base de datos de forma tipada y segura |
| Base de datos | PostgreSQL | Almacena todos los datos de la app |
| Frontend | React 19 · Vite | Interfaz de usuario |
| Estado global | Zustand | Gestiona el token de sesión, los filtros de recetas y el estado de conexión |
| Estilos | Tailwind CSS | Estilos de la interfaz mediante clases de utilidad |
| IA | Google Gemini | Extrae automáticamente los datos de una receta a partir de una URL |
| Infraestructura | Docker · Docker Compose | Levanta todos los servicios (backend, frontend, base de datos) con un solo comando |
| Testing | Vitest | Tests unitarios del backend y del frontend |


## Estructura del proyecto

```
comidas/
├── backend/               # Servidor API REST hecho con Fastify
│   ├── src/
│   │   ├── routes/        # Define los endpoints HTTP (qué URL hace qué)
│   │   ├── services/      # Lógica de negocio separada de las rutas (más fácil de testear)
│   │   └── lib/           # Utilidades compartidas y cliente de Prisma
│   └── prisma/            # Schema de la base de datos y migraciones
├── frontend/              # Aplicación web hecha con React
│   └── src/
│       ├── pages/         # Cada página de la app (recetas, plan, despensa...)
│       ├── components/    # Componentes reutilizables (botones, modales, formularios...)
│       ├── stores/        # Estado global con Zustand (sesión, filtros...)
│       └── api/           # Funciones que llaman al backend
└── docker-compose.yml     # Orquesta todos los servicios para arrancarlos juntos
```

---

## Ejecutar en local

Solo necesitas tener instalado [Docker](https://www.docker.com/).

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

Puedes crear una cuenta desde la propia app o usar la cuenta de demo:

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

Abre el `.env` que acabas de crear y sustituye cada valor por el tuyo. El archivo [.env.example](.env.example) incluye una descripción de para qué sirve cada variable.
