# Development guide

## Who am I
I am Nerea, and I develop different types of solutions with your help.

## Project Documentation

For project scope, features, and roadmap, see:
- `docs/base-project-info.md` - Core concepts, data model, and philosophy
- `docs/ROADMAP-*.md` - Feature roadmap and planned phases
- `docs/DEPLOYMENT.md` - Deployment configuration

---

## Conventions

- **Use pnpm for everything.** Never use npm or yarn.
- TypeScript is mandatory
- Tailwind CSS is the only styling solution
- Prefer ESM and modern browser syntax
- Don't add dependencies until they're necessary
- Add or update tests when changing behavior, even if not explicitly asked

---

## Code Rules

### File Size Limit
**Maximum 500 lines of code per file.** If a file exceeds this limit:
- Refactor immediately
- Extract components, services, or utilities
- Split by responsibility, not arbitrarily

### Organization
- Small components with a single responsibility
- Prefer composition over complex configurations
- Avoid premature abstractions
- Shared code lives in clear folders: `components`, `layouts`, `lib`, `utils`

### UI and Styles
- Tailwind is the only styling solution
- Don't duplicate classes if you can extract a component
- Prioritize readability over visual micro-optimizations
- Accessibility is not optional: semantic HTML, ARIA roles when applicable, managed focus

### Testing Requirements
All business logic and data management code must be testable:
- **Backend**: Service layer must be tested (not routes directly)
- **Frontend**: API layer and stores must be tested
- **Backoffice**: Data providers and custom hooks must be tested
- Use dependency injection to enable mocking
- Tests live alongside code: `*.test.ts` / `*.test.tsx`
- No code with type errors, lint errors, or failing tests is accepted

### Architecture for Testability
- Separate concerns: routes/components are thin, logic lives in services/hooks
- Use factory functions that accept dependencies (see examples in codebase)
- No direct imports of singletons in testable code

---

## Architecture

Monorepo with three packages + Docker infrastructure:

```
optimaflow/
├── docker-compose.yml       # Orchestrates all services
├── backend/
│   ├── Dockerfile
│   └── src/
│       ├── server.ts        # Fastify entry point
│       ├── routes/          # HTTP route handlers (thin)
│       ├── services/        # Business logic (testable)
│       ├── lib/             # Shared utilities, Prisma client
│       └── types/           # TypeScript types
├── frontend/
│   ├── Dockerfile
│   └── src/
│       ├── api/             # API client & data fetching (testable)
│       ├── hooks/           # Custom React hooks
│       ├── components/      # UI components
│       ├── pages/           # Page-level components
│       ├── stores/          # Zustand stores
│       ├── types/           # TypeScript types
│       └── test/            # Test setup
├── backoffice/
│   ├── Dockerfile
│   └── src/
│       ├── api/             # Data providers (testable)
│       ├── hooks/           # Custom React hooks
│       ├── components/      # UI components
│       ├── pages/           # Resource pages (CRUD)
│       ├── types/           # TypeScript types
│       └── test/            # Test setup
└── docs/                    # Project documentation
```

### Docker

All services run via Docker Compose. Start everything with:
```bash
docker compose up
```

Services:
- **backend** - Fastify API server
- **frontend** - Vite/React app
- **backoffice** - Refine admin panel
- **db** - PostgreSQL database

---

## Backend

### Tech Stack
- **Runtime**: Node.js with ESM
- **Framework**: Fastify
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Testing**: Vitest
- **Language**: TypeScript

### Commands
```bash
cd backend
pnpm dev              # Dev server with hot reload
pnpm build            # Compile TypeScript
pnpm start            # Run production build
pnpm test             # Run tests once
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:migrate       # Run migrations
pnpm knip             # Check for unused code/dependencies
```

### Service Pattern (Testable)
```typescript
// services/task.service.ts
export function createTaskService(prisma: PrismaClientType) {
  return {
    async create(input) { /* ... */ },
    async getNextTasks(userId) { /* ... */ },
  };
}

// services/task.service.test.ts
const mockPrisma = { task: { create: vi.fn() } };
const service = createTaskService(mockPrisma);
// Now you can test without a real database
```

---

## Frontend

### Tech Stack
- **Build**: Vite
- **Framework**: React 19
- **State**: Zustand
- **Testing**: Vitest
- **Language**: TypeScript

### Commands
```bash
cd frontend
pnpm dev              # Dev server
pnpm build            # Production build
pnpm preview          # Preview build
pnpm test             # Run tests once
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage
pnpm lint             # ESLint
pnpm knip             # Check for unused code/dependencies
```

### API Layer Pattern (Testable)
```typescript
// api/tasks.ts
export function createTasksApi(client: ApiClient) {
  return {
    getNextTasks: () => client.get('/tasks/next'),
    createTask: (input) => client.post('/tasks', input),
  };
}

// api/tasks.test.ts
const mockClient = { get: vi.fn(), post: vi.fn() };
const api = createTasksApi(mockClient);
// Now you can test without network calls
```

---

## Backoffice

### Tech Stack
- **Build**: Vite
- **Framework**: React 19 + Refine
- **Testing**: Vitest
- **Language**: TypeScript

### Commands
```bash
cd backoffice
pnpm dev              # Dev server
pnpm build            # Production build
pnpm preview          # Preview build
pnpm test             # Run tests once
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage
pnpm lint             # ESLint
pnpm knip             # Check for unused code/dependencies
```

---

## Git Hooks (Husky)

The project uses Husky for Git hooks.

### Pre-commit
Before every commit, these checks run automatically:
1. **Lockfiles** - Verifies pnpm-lock.yaml files are in sync (same as CI)
2. **Gitleaks** - Scans for leaked secrets (API keys, tokens, passwords)
3. **Lint** - ESLint on frontend and backoffice
4. **Build** - TypeScript compilation on all projects
5. **Test** - All tests must pass
6. **Knip** - Checks for unused code and dependencies

### Commit-msg
Validates the commit message:
- Blocks "Generated with" text
- Blocks "Co-Authored-By" tags

If any check fails, the commit is blocked.

---

## Dead Code Detection (Knip)

Knip detects unused:
- Dependencies in package.json
- Exported functions/types not imported elsewhere
- Files not referenced by any entry point

Run manually:
```bash
cd backend && pnpm knip
cd frontend && pnpm knip
cd backoffice && pnpm knip
```

Note: Some dependencies (like `tailwindcss`, `tw-animate-css`) are used via CSS imports and are configured as exceptions in `knip.json`.

---

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@db:5432/optimaflow
JWT_SECRET=your-secret
RESEND_API_KEY=your-resend-key
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
```

### Backoffice (.env)
```
VITE_API_URL=http://localhost:3000
```

---

## Git Workflow

### Pre-commit (Automatic)
Husky runs all checks automatically. If they pass, the commit proceeds.

### Commit Rules
- **Never push** - Only commit locally, user handles push
- **No generated footers** - Don't add "Generated with Claude Code" or similar
- **No co-authored-by** - Don't add co-author tags
- Keep commit messages concise and descriptive

### Testing Commands
For Vitest specific tests:
```bash
pnpm vitest run -t "<test name>"
```

After moving files or changing imports:
```bash
pnpm lint
```
