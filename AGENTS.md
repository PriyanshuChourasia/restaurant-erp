# Restaurant ERP — Project Overview

## 📋 Project Structure

This is a monorepo (pnpm workspace + Turborepo) containing:

- **`apps/api/`** — NestJS REST API (PostgreSQL + TypeORM)
- **`apps/restaurant-ui/`** — React SPA (Vite + TanStack Router + Tailwind CSS v4)
- **`packages/`** — Shared config packages (ESLint, TypeScript, UI)

## 🧰 Tech Stack

### Backend (`apps/api/`)
- **Framework:** NestJS 11
- **ORM:** TypeORM + PostgreSQL
- **Auth:** JWT (Passport), bcrypt
- **Validation:** class-validator + class-transformer
- **Testing:** Jest + Supertest
- **Package manager:** pnpm

### Frontend (`apps/restaurant-ui/`)
- **Framework:** React 18
- **Routing:** TanStack Router (file-based, routes in `src/routes/`)
- **Data fetching:** TanStack React Query + Axios
- **UI:** Tailwind CSS v4, @base-ui/react, Lucide React icons
- **Forms:** React Hook Form + Zod + @hookform/resolvers
- **Build:** Vite 5
- **State:** React Query (server state), no global client state library

## 🏗 Architecture

### Backend Modules
- **`auth/`** — JWT authentication (login, register)
- **`users/`** — User management
- **`roles/`** — Role-based access control
- **`permissions/`** — Granular permissions (per-module)
- **`category/`** — Tree-structured category management
- **`shared/`** — Guards, decorators, filters, interfaces

Each module follows: `controller -> service -> repository (interface) -> entity`

### Frontend Modules
Each feature module in `src/modules/` follows:
- **`api/`** — Axios API calls
- **`hooks/`** — React Query hooks
- **`types/`** — TypeScript interfaces
- **`schemas/`** — Zod validation schemas
- **`components/`** — UI components
- **`dialogs/`** — Modal dialogs
- **`forms/`** — Form components
- **`pages/`** — Page components
- **`utils/`** — Utility functions

## 🚀 Dev Commands

```bash
pnpm dev          # Run both API + UI in dev mode
pnpm build        # Build all packages
pnpm lint         # Lint all packages

# API-specific
cd apps/api && pnpm start:dev    # Watch mode
cd apps/api && pnpm test         # Unit tests
cd apps/api && pnpm test:e2e     # E2E tests

# UI-specific
cd apps/restaurant-ui && pnpm dev     # Vite dev server
cd apps/restaurant-ui && pnpm build   # Type-check + build
```

## 📐 Conventions

### General
- **Language:** TypeScript throughout
- **Naming:** PascalCase for components/types/classes, camelCase for functions/variables, kebab-case for files
- **Imports:** Use `@/` alias for `src/` in the UI app
- **Formatting:** Prettier (2-space indent, single quotes, trailing commas)

### Backend
- Use NestJS modular architecture with dependency injection
- DTOs for request validation, separate Response DTOs for responses
- Repository pattern with interfaces for testability
- Decorators for auth (`@Public()`, `@Roles()`, `@Permissions()`, `@CurrentUser()`)

### Frontend
- File-based routing via TanStack Router (`src/routes/` → route tree auto-generated)
- React Query for server data — queries and mutations
- Forms via React Hook Form + Zod schemas
- Tailwind CSS for styling (no CSS modules or styled-components)
- Use `@/` path alias for imports from `src/`
- UI primitives in `src/components/ui/` (Button, Input, Sheet, Sidebar, etc.)
- Layout components in `src/components/layout/`

### Git
- No direct commits to main — always be careful with state-changing operations

## 🗂 Project Documentation System

This repo tracks project knowledge and work history under `.project/`.
**Read `.project/prompt.md` first — it is the step-by-step procedure every
LLM/agent must follow in this repo, at the start and end of every task.** Summary
below; `.project/prompt.md` is the source of truth.

- **`.project/knowledge.md`** — durable knowledge about the project (architecture,
  stack, conventions, domain concepts). Update only when something structurally
  true about the project changes (new module, new tech choice, new convention).
- **`.project/memory.md`** — running log of key points: decisions, gotchas, open
  questions. Newest entries at the top. Add a short entry after finishing a task;
  promote anything permanent into `knowledge.md` and trim it from here.
- **`.project/tasks/`** — one markdown file per prompt, created at the end of the
  task, named `YYYY-MM-DD-<short-slug>.md` (add a numeric suffix if multiple tasks
  land on the same date). Each file records: the date, the prompt/ask, what was
  done, and the outcome. This is the append-only history of "what happened up to
  when."

Workflow for every prompt: do the work, then (1) write a new file in
`.project/tasks/`, (2) add/update an entry in `.project/memory.md`, and (3) update
`.project/knowledge.md` if the change altered the project's structure or
conventions.
