# Planificador de Comidas

App web para planificar menús semanales/mensuales en familia o individual. Gestiona recetas, genera listas de la compra automáticamente y lleva el control de la despensa.

---

## Funcionalidades

### Recetas
- Crea y edita recetas con ingredientes, tiempos de preparación y raciones
- Filtra por tipo de comida, tags, calorías o tiempo
- Importa recetas desde cualquier URL con IA (Gemini)
- Estimación automática de calorías a partir de los ingredientes
- Marca recetas como favoritas

### Plan de comidas
- Calendario semanal y mensual para asignar recetas a cada día
- Tipos de comida: Desayuno, Comida, Cena, Snack, Postre
- También puedes anotar cuando comes fuera
- Copia días o semanas enteras con un clic

### Lista de la compra
- Generación automática a partir del plan de comidas de la semana
- Agrupa ingredientes repetidos entre recetas
- Añade artículos manuales
- Marca artículos como comprados y descuéntalos de la despensa automáticamente
- Comparte la lista con un enlace público (sin necesidad de cuenta)

### Despensa
- Inventario de lo que tienes en casa, organizado por ubicaciones (nevera, armario...)
- Se actualiza automáticamente cuando marcas compras o puedes añadir tú comida manualmente

### Salud
- Seguimiento de la cantidad necesaria que hay que beber al dia
- Calcula tu TMB y TDEE según tus datos
- Planifica déficit calórico para perder peso
- Seguimiento de peso con proyecciones (todo lo de calorías se puede desactivar)

### Hogares compartidos
- Varios usuarios pueden compartir el mismo hogar
- Invita a miembros por email con diferentes roles (editor/visor)
- Cada usuario tiene sus propios favoritos

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js · Fastify · Prisma ORM |
| Base de datos | PostgreSQL |
| Frontend | React 19 · Vite · Zustand · Tailwind CSS |
| Backoffice | Refine (panel de administración) |
| IA | Google Gemini (importación de recetas) |
| Infraestructura | Docker · Docker Compose |
| Testing | Vitest |

---

## Estructura del proyecto

```
comidas/
├── backend/          # API REST (Fastify)
│   ├── src/
│   │   ├── routes/   # Endpoints HTTP
│   │   ├── services/ # Lógica de negocio
│   │   └── lib/      # Utilidades y cliente Prisma
│   └── prisma/       # Schema y migraciones
├── frontend/         # App web (React)
│   └── src/
│       ├── pages/    # Vistas principales
│       ├── components/
│       ├── stores/   # Estado global (Zustand)
│       └── api/      # Cliente HTTP
├── backoffice/       # Panel de administración (Refine)
└── docker-compose.yml
```

---

## Ejecutar en local

Requisitos: [Docker](https://www.docker.com/) y Docker Compose.

```bash
git clone https://github.com/nereacarpinterob/comidas
cd comidas
docker compose up
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5175 |
| Backoffice | http://localhost:5176 |
| API | http://localhost:3001 |

---

## Variables de entorno

Copia `.env.example` a `.env` y rellena los valores:

```bash
cp .env.example .env
```

Ver [.env.example](.env.example) para la descripción de cada variable.
