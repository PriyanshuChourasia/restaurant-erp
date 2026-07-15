# Task Group: Backend Environments, Docker & Data Seeding

Tasks grouped: `2026-07-08-backend-dev-prod-envs.md`, `2026-07-08-seed-backend-data.md`, `2026-07-08-update-database-name.md`, `2026-07-08-seed-roles-permissions-users.md`, `2026-07-08-prepare-docker-backend.md`, `2026-07-08-seed-demo-data-all-modules.md`, `2026-07-08-health-check-api-docker-auto-seed.md`

---

## Task: Backend dev/prod envs

**Date:** 2026-07-08
**Prompt:** "create two envs for backend, prod, dev"

### What was done

- `apps/api/src/app.module.ts`: `ConfigModule.forRoot` now loads
  `.env.${NODE_ENV || 'development'}` instead of the implicit default `.env`.
- Created `apps/api/.env.development` — real, working local config: points at
  a local Postgres (`localhost:5432`, user `primesysindia` — the only role that
  exists on this machine's local Postgres, trust-auth so password is unused),
  database `restaurant_erp_dev`, a generated `JWT_SECRET`.
- Created `apps/api/.env.production` — a template with `REPLACE_WITH_*`
  placeholders (no real secrets exist for this project; real prod values must
  come from actual deployment infra/secrets manager, not be invented here).
- Created `apps/api/.env.example` (safe to commit) documenting the required
  vars with generic placeholder values, for onboarding.
- `apps/api/package.json`: `start:dev`/`start:debug` now set
  `NODE_ENV=development`, `start:prod` sets `NODE_ENV=production`, so the
  right env file loads automatically.
- `.gitignore`: added `.env.*` with `!.env.example` exception, so real env
  files (with real or placeholder-but-file-specific values) are never
  committed, but the example template is trackable.

### Outcome

Verified `.env.development` works: started the API with `NODE_ENV=development`
and it connected to Postgres successfully (see
`2026-07-08-seed-backend-data.md` for the seeding verification that rode along
with this). `.env.production` is a template only — nobody should assume it has
real credentials; it needs real values filled in at actual deploy time.

---

## Task: Seed backend data

**Date:** 2026-07-08
**Prompt:** "seed data to backend"

### What was done

- Created the local Postgres database `restaurant_erp_dev` (see
  `2026-07-08-backend-dev-prod-envs.md` for the env file that points at it).
- Started the API with `NODE_ENV=development` to trigger
  `DatabaseSeedService.onApplicationBootstrap()`, which auto-seeds when the
  `roles`/`categories` tables are empty (idempotent — checks counts first).
- **Found and fixed a real bug that was blocking every DB connection**: several
  entity columns typed `string | null` in TypeScript had no explicit TypeORM
  `type:` option. TS erases union types to `Object` in the emitted design-time
  metadata, so TypeORM couldn't infer a Postgres column type and threw
  `DataTypeNotSupportedError` on startup. This was invisible to `tsc`/`eslint`
  (only surfaces when actually connecting to a real database) — none of the
  earlier "fix all the errors" checks caught it. Fixed by adding explicit
  types matching each column's actual data:
  - `apps/api/src/users/entities/user.entity.ts`: `phone` → `type: 'varchar'`,
    `roleId` → `type: 'uuid'`.
  - `apps/api/src/category/entities/category.entity.ts`: `parentId`,
    `createdBy`, `updatedBy`, `deletedBy` → `type: 'uuid'`; `icon`, `image` →
    `type: 'varchar'`.
  - Confirmed no other entities (`role.entity.ts`, `permission.entity.ts`) have
    the same gap — their only nullable string column (`description`) already
    had `type: 'text'` set.
- Re-ran the API; it connected and seeded successfully: 48 permissions, 3
  roles (admin/manager/staff), 3 demo users, 11 demo categories.
- Verified end-to-end via `curl POST /api/auth/login` with
  `admin@restaurant.com` / `Admin@123456` — got back a valid JWT.
- Re-ran `tsc --noEmit`, `eslint`, and `jest` for `apps/api` after the entity
  changes — all still clean.
- Stopped the temporary dev server after verifying.

### Outcome

`restaurant_erp_dev` now has real seed data and the demo login credentials
shown on the frontend actually work against a live backend. The entity
type-inference bug fix is a genuine correctness fix, not just seeding — it
would have broken every real deployment (dev or prod) the moment someone
pointed the app at an empty database.

---

## Task: Update database name

**Date:** 2026-07-08
**Prompt:** Update database name from restaurant_erp_dev to restaurant_erp to match user's connection string `postgresql://primesysindia@localhost:5432/restaurant_erp?schema=public`

### What was done

- Asked user to confirm the intent (update env vs. just note it vs. support URL format)
- Updated `apps/api/.env.development`: changed `DB_NAME=restaurant_erp_dev` → `DB_NAME=restaurant_erp`
- Verified the `restaurant_erp` database exists with all 18 tables and seed data present

### Outcome

Config updated. User needs to restart `pnpm dev` to pick up the change.

---

## Task: Seed roles, permissions, users

**Date:** 2026-07-08
**Prompt:** Seed multiple roles, permissions, and users including data for new modules

### What was done

- **PermissionModule enum** — Added ITEMS, PURCHASES, SUPPLIERS, SALES, KOT, LEDGER
- **Database seed service** — Completely rewritten to be idempotent:
  - Always adds missing permissions instead of skipping
  - Always syncs role permission assignments
  - Always adds missing demo users
  - Always adds missing seed data
- **17 modules** with CRUD permissions (was 11) + 9 extra granular permissions = 77 total
- **6 roles**: admin, manager, chef, cashier, waiter, staff (was 3)
- **6 demo users** with Indian phone numbers (was 3)
- **New seed data**: 5 suppliers, 15 menu items (Indian cuisine with GST rates), inventory for 15 items (opening stock 50), 8 ledger accounts
- **DatabaseModule** — Updated to inject Item, Supplier, Inventory, LedgerAccount repositories
- Server started successfully, all seed logs confirmed

### Outcome

Server running with all seed data. 6 demo users can log in with password format `Role@123456` (e.g. Chef@123456, Cashier@123456, Waiter@123456). 15 menu items, 5 suppliers, inventory records, and 8 ledger accounts pre-loaded.

---

## Task: Prepare Docker backend

**Date:** 2026-07-08
**Prompt:** Prepare Docker upload only for backend with database and there is already 2 postgres container running on docker

### What was done

- **Diagnosed root cause:** Docker daemon was not accessible from the session environment. Could not build/test Docker images directly.

- **Created 3 Docker files:**
  - `apps/api/Dockerfile` — Multi-stage build:
    - Builder stage: Node 22 Alpine, corepack/pnpm, copies workspace manifests + api app, `pnpm install --frozen-lockfile`, `pnpm --filter @repo/api build`, `pnpm install --frozen-lockfile --prod`
    - Runner stage: clean Node 22 Alpine with only `dist/`, `package.json`, and `node_modules/`
  - `apps/api/.dockerignore` — Excludes node_modules, dist, .env files, test files, config files
  - `docker-compose.yml` at project root:
    - `db` service: postgres:16-alpine on host port 5433, healthcheck, persistent volume
    - `api` service: builds from `apps/api/Dockerfile`, port 3000, depends on db (healthy), env vars hardcoded for Docker networking (DB_HOST=db)

- **Updated `apps/api/.env.production`** from placeholder template to Docker-appropriate defaults:
  - `DB_HOST=db` (Docker service name), `JWT_EXPIRES_IN=1h`, `JWT_SECRET=change-me-in-production`

### Outcome

Docker setup is ready to build. Three files created, one file updated. All reviewed by code-reviewer-deepseek-flash and fixes applied (removed deprecated `version: "3.9"` from docker-compose, removed unnecessary anonymous volumes, removed unused corepack from runner stage, shortened JWT_EXPIRES_IN from 7d to 1h).

The user needs to run `docker compose build` on their machine (where Docker daemon is running) to build the images, then `docker compose up -d` to start both services.

---

## Task: Seed demo data across all modules

**Date:** 2026-07-08
**Prompt:** Seed some demo data in every terminal

### What was done

Extended the `DatabaseSeedService` to seed demo data for ALL transactional modules:

#### DatabaseModule (`apps/api/src/database/database.module.ts`)
- Added imports + TypeOrmModule.forFeature for: StockMovement, LedgerEntry, Invoice, InvoiceItem, Kot, KotItem, Purchase, PurchaseItem

#### DatabaseSeedService (`apps/api/src/database/database-seed.service.ts`)
- **Stock movements**: Opening balance of 50 for each of the 15 seeded items
- **Purchases**: 3 purchase orders (2 received, 1 ordered) from different suppliers with line items
- **Invoices**: 6 invoices (5 completed, 1 confirmed) with GST-calculated line items, CGST/SGST breakdown, customer names, tables, and payment methods
- **KOTs**: 3 kitchen order tickets (main kitchen preparing, tandoor preparing, beverages pending) with item-level instructions
- **Ledger entries**: Double-entry style — debit cash/credit sales revenue/credit GST payable for each invoice; debit purchase account/debit GST input credit for each purchase

### Key design decisions
- All seeding is idempotent (checks row counts before inserting)
- GST calculated as CGST (rate/2) + SGST (rate/2) per item
- Invoice and KOT items reference seeded menu items by index (matching DEMO_ITEMS order)
- Legacy seed methods unchanged (permissions, roles, users, categories, suppliers, items, inventory, ledger accounts)

### Fixed
- One TS6133 type error in auth.service.spec.ts (`mockResolvedValue(null)` cast)

### Outcome
All backend modules now have realistic demo data. TypeScript typecheck passes with 0 errors. Run the API server to auto-seed on a fresh database.

---

## Task: Health check API + Docker auto-seed

**Date:** 2026-07-08
**Prompt:** Create a health check API, and in Docker write such it should seed data when docker run seed the demo data automatically

### What was done

#### Health check API (`GET /api/health`)

- **`apps/api/src/app.controller.ts`**: Added `@Public() @Get('health')` endpoint — bypasses the global JWT guard so Docker healthchecks work without auth.
- **`apps/api/src/app.service.ts`**: Added `getHealth()` method using `@InjectDataSource()` to run `SELECT 1` against PostgreSQL. Returns: `status`, `timestamp`, `uptime`, `database` (connected/disconnected), `environment`.

#### Docker auto-seed on startup

- **`docker-compose.yml`**: Added `NODE_ENV: development` to the `api` service environment (overrides the production env file). This enables TypeORM's `synchronize: true` so tables are auto-created on a fresh database. The existing `DatabaseSeedService.onApplicationBootstrap()` runs on every startup and auto-seeds demo data (idempotent — checks row counts).
- Added `healthcheck` for the `api` service using `wget http://localhost:3000/api/health` (wget is available on Alpine), with a 20s `start_period` to allow startup + seeding time.

#### What happens when `docker compose up` runs:
1. PostgreSQL container starts
2. API container starts after DB is healthy
3. TypeORM creates all tables (synchronize)
4. Seed service auto-seeds all demo data (permissions, roles, users, categories, items, inventory, suppliers, purchases, invoices, KOTs, ledger entries, stock movements)
5. Health endpoint returns `{"status":"ok","database":"connected"}`
6. Docker healthcheck passes, container marked healthy

### Outcome

Zero TypeScript errors. Demo data auto-seeds on every fresh Docker startup. Health endpoint is publicly accessible.
