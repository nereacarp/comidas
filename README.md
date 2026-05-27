# Planificador de Comidas

App web para planificar menús semanales/mensuales en familia o individual. Gestiona recetas, genera listas de la compra automáticamente y lleva el control de la despensa.

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
|------|-----------|
| Backend | Node.js · Fastify |
| ORM | Prisma |
| Base de datos | PostgreSQL |
| Frontend | React 19 · Vite |
| Estado global | Zustand |
| Estilos | Tailwind CSS |
| IA | Google Gemini (recetas) |
| Infraestructura | Docker · Docker Compose |
| Testing | Vitest |


## Estructura del proyecto

```
comidas/
├── backend/               # Servidor (Fastify)
│   ├── src/
│   │   ├── routes/        # Endpoints HTTP
│   │   ├── services/      # Lógica de negocio
│   │   └── lib/           # Funciones auxiliares
│   └── prisma/            # Base de datos
├── frontend/              # Aplicación web (React)
│   └── src/
│       ├── pages/         # Cada página de la app
│       ├── components/    # Componentes reutilizables
│       ├── stores/        # Estado global (Zustand)
│       └── api/           # Funciones que llaman al backend
└── docker-compose.yml     # Arranca todo
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
