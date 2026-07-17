# Project Knowledge — Restaurant ERP

Durable knowledge about this codebase: architecture, domain concepts, and decisions.
This file changes slowly — only update it when something structurally true about the
project changes (new module, new convention, new tech choice). For fast-moving state
(what's in progress, open questions, gotchas) use `memory.md` instead. For a log of
what was done per prompt, see `tasks/`.

## What this project is

A restaurant ERP system: monorepo (pnpm workspace + Turborepo) with a NestJS API and
a React SPA.

## Structure

- `apps/api/` — NestJS REST API (PostgreSQL + TypeORM)
- `apps/restaurant-ui/` — React SPA (Vite + TanStack Router + Tailwind CSS v4)
- `packages/` — Shared config packages (ESLint, TypeScript, UI)

## Modules in this repo

### Current modules (`apps/api/src/`):

`auth/`, `users/`, `roles/`, `permissions/`, `category/`, `items/`, `inventory/`, `purchases/`, `suppliers/`, `sales/`, `orders/`, `kot/`, `ledger/`, `vouchers/`, `customers/`, `price-levels/`, `recipes/`, `seating/`, `reservations/`, `reports/`, `shared/`, `database/`

- `customers/` — Customer management with price-level resolution (2026-07-11)
- `price-levels/` — Price Level management with per-item pricing overrides (2026-07-11)
- `recipes/` — Recipe Engineering / Bill of Materials: Recipe + RecipeIngredient + ProductionEntry entities, recursive cost computation, sale-time component stock deduction, production batch logging (2026-07-11)
- `seating/` — Zone + Seat entities for floor-plan management (2026-07-11)
- `reports/` — Entity-free reporting module: 71 read-only endpoints across sales (12), inventory (10), financial (8), kitchen (7), customer (8), reservation (6), procurement (7), operations (8), and executive (5). Uses TypeORM repos from other modules injected via `TypeOrmModule.forFeature`. As of 2026-07-13, all hardcoded/stub values (previously 17) have been replaced with real data queries. (2026-07-12, verified clean 2026-07-13)
- `ledger/` — Real double-entry accounting as of 2026-07-15: `LedgerAccount` now has `accountType` (asset/liability/equity/revenue/expense) driving `LedgerService.addEntry`'s balance direction; `JournalEntry`/`JournalService` is the atomic posting engine (`post()` enforces `sum(debit)===sum(credit)` in one transaction, `reverse()` posts a mirror entry). `InventoryService.postLedgerForMovement` and `SalesService.create()` both post through it. `LedgerEntry` rows are journal *lines* now (nullable `journalEntryId` links them back to their `JournalEntry`).
- `vouchers/` — Payment/Receipt/Journal vouchers, each a thin document wrapping one `JournalEntry` (`Voucher.journalEntryId`). POS Charge auto-creates a Receipt Voucher for cash/card/upi/online, or a bare Journal Entry (Debit Accounts Receivable) for credit sales. (2026-07-15)
- `sales/` — `SalesService.cancel()` (`POST /sales/:id/cancel`) reverses a *whole* confirmed invoice: stock (via `RecipesService.reverseOnSale` or `InventoryService.adjustStock(ADJUSTMENT_IN)`), tables, linked KOTs (`KotService.findByOrderId`), and the posted voucher/journal entry. `Invoice` carries `journalEntryId`/`voucherId` to know what to reverse. For correcting *specific items* on an already-served invoice (not a full cancel), use `SalesService.createCreditNote()` instead — new `CreditNote`/`CreditNoteItem` entities, reverses just the credited items' revenue/tax with optional per-line stock restore, and can ring up a replacement item as a normal follow-on invoice in the same call. (2026-07-15)
- `orders/` — New pre-Invoice stage as of 2026-07-16: `Order` (regular/party/scheduled, dine_in/takeaway/delivery, pending_confirmation→confirmed→billed/cancelled). `OrdersService.charge()` converts a confirmed order into an `Invoice` by calling the *existing* `SalesService.create()` unchanged (`Invoice.orderId` / `Order.invoiceId` cross-reference). Regular orders auto-fire their KOT on confirm; Party/Scheduled wait for an explicit `sendToKitchen()` call and can hold a table via an auto-created `Reservation`. Price/GST resolution is shared with `sales/` via `PriceLevelsService.resolveLineItems()` — don't duplicate that logic elsewhere.

## Backend (`apps/api/`)

- NestJS 11, TypeORM + PostgreSQL, JWT auth (Passport) + bcrypt
- Validation via class-validator + class-transformer
- Testing: Jest + Supertest
- Modules (`apps/api/src/`): `auth/`, `users/`, `roles/`, `permissions/`, `category/`,
  `items/`, `inventory/`, `purchases/`, `suppliers/`, `sales/`, `kot/`, `ledger/`, `vouchers/`, `shared/`
- Each module follows: `controller -> service -> repository (interface) -> entity`
- `shared/` holds guards, decorators, filters, interfaces
- Auth decorators: `@Public()`, `@Roles()`, `@Permissions()`, `@CurrentUser()`

## Frontend (`apps/restaurant-ui/`)

- React 19, Vite 5, TanStack Router (file-based routing, routes in `src/routes/`,
  route tree auto-generated)
- TanStack React Query + TanStack Table 8 for server data/tables
- TanStack Form + React Hook Form + Zod + @hookform/resolvers for forms
- Tailwind CSS v4 + Tailwind merge, Lucide React icons, Shadcn-compatible primitives
- Axios via `src/lib/axios-client.ts` — a configured instance with interceptor for
  auto-refresh token rotation and request queuing on 401s
- Auth via `AuthContext` provider (`src/lib/auth-context.tsx`) — login, logout,
  refresh token rotation, session restoration from localStorage
- Feature modules under `src/modules/`, each with: `api/`, `hooks/`, `types/`,
  `schemas/`, `components/`, `dialogs/`, `forms/`, `pages/`, `configs/`, `utils/`
- Reports module uses declarative `ReportConfig` objects (in `configs/`) rather than individual page components. Generic `GenericReportPage` renders any config via dynamic `$reportId` route. New reports = new config entry. (2026-07-12)
- UI primitives in `src/components/ui/`; layout components in `src/components/layout/`
- `@/` path alias maps to `src/`

## Conventions

- TypeScript throughout
- PascalCase: components/types/classes; camelCase: functions/variables; kebab-case: files
- Prettier: 2-space indent, single quotes, trailing commas
- No direct commits to main — be careful with state-changing git operations

## Dev commands

```bash
pnpm dev          # Run both API + UI in dev mode
pnpm build        # Build all packages
pnpm lint         # Lint all packages

cd apps/api && pnpm start:dev    # API watch mode (NODE_ENV=development)
cd apps/api && pnpm start:prod   # NODE_ENV=production, runs dist/main
cd apps/api && pnpm test         # API unit tests
cd apps/api && pnpm test:e2e     # API e2e tests

cd apps/restaurant-ui && pnpm dev     # Vite dev server
cd apps/restaurant-ui && pnpm build   # Type-check + build
```

## Backend environments

`apps/api` loads `.env.${NODE_ENV}` (see `app.module.ts`'s `ConfigModule.forRoot`).
Files are gitignored except `.env.example` (safe placeholder template):

- `apps/api/.env.development` — real local config, points at a local Postgres
  database `restaurant_erp` (localhost:5432, user `primesysindia`, trust auth,
  Homebrew `postgresql@17`). API listens on port **3001** (not 3000 — see gotcha below).
- `apps/api/.env.production` — placeholder template (`REPLACE_WITH_*` values);
  real prod secrets must come from actual deployment infra, never hardcoded here.

`DatabaseSeedService.onApplicationBootstrap()` auto-seeds demo data (permissions,
roles, 3 demo users, categories) whenever the DB is empty — idempotent, checks
row counts first. Demo login: `admin@restaurant.com` / `Admin@123456` (also
shown on the frontend login page).

**Gotcha**: TypeORM entity columns typed `T | null` in TypeScript need an
explicit `@Column({ type: '...' })` — without it, TS's decorator metadata
erases the union to `Object` and TypeORM throws `DataTypeNotSupportedError` at
DB-connect time. This only surfaces when actually connecting to a real
database, not via `tsc`/`eslint`.

**Gotcha**: `pg`/TypeORM returns `decimal`/`numeric` columns as JS **strings**
at runtime regardless of the TS `number` type on the entity. Every
`@Column({ type: 'decimal', ... })` in this codebase must set
`transformer: decimalTransformer` (from
`apps/api/src/shared/transformers/decimal.transformer.ts`) or consumers get a
string where a number is expected (e.g. `item.price.toFixed(...)` throwing).
Like the nullable-column gotcha above, `tsc`/`eslint` can't catch this — only
hitting a real database surfaces it.

## Frontend auth

- `apps/restaurant-ui/vite.config.ts` proxies `/api/*` to `http://localhost:4210`
  in dev — required for every relative-path axios call in the app to reach the
  backend. Vite *does* auto-restart on `vite.config.ts` changes in practice (contrary
  to earlier assumption) — but if a stale proxy target is suspected, restart `pnpm dev`.
- **Gotcha (recurring port collisions on this machine — happened twice now):**
  this machine runs several unrelated side projects that default to the same
  common Node dev ports. First `pharmacy-erp-blueprint/doctor-erp`'s NestJS API
  collided on `localhost:3000` (bound IPv6-only, `[::1]:3000`; since `localhost`
  resolves to IPv6 first on this Mac, requests silently hit the *wrong* backend
  with no obvious error — e.g. login fails with a 404 that isn't even from this
  codebase). That's why the API moved to **3001**. Then a *second*, different
  project (`portfolio-tanstack`'s `apps/web`/`apps/resume-ui`, both Vite dev
  servers) ended up squatting on **3001** (and 3000) instead, breaking login the
  exact same way. Since generic low port numbers (3000/3001/3002...) are exactly
  what other local projects default to, the API's dev port was moved again to
  **4210** — a value distinctive enough that another project's default `pnpm
  dev` is very unlikely to pick it. If API calls ever silently 404 or hit the
  wrong app again, run `lsof -nP -iTCP:4210 -sTCP:LISTEN` (or check whichever
  port `apps/api/.env.development`'s `PORT` currently holds) to confirm the
  right process — not a different project's — owns that port before debugging
  anything else.
- **AuthContext** (`src/lib/auth-context.tsx`) — React Context wrapping the whole app
  via `AuthProvider` in `main.tsx`. Provides `user`, `login()`, `logout()`, `refreshing`.
- **AxiosClient** (`src/lib/axios-client.ts`) — configured axios instance with:
  - Base URL `/api`
  - Access token from `AuthContext` attached as `Authorization: Bearer` header
  - Response interceptor that catches 401s, queues concurrent requests, calls
    `/api/auth/refresh` with the stored refresh token, retries the original request
- **Session persistence** — access + refresh tokens stored in `localStorage` via
  `src/lib/session.ts`; `AuthContext` restores them on mount.
- **No route-guard/protected-route pattern yet** — any route is reachable without
  signing in.

## Docs

- `.project/docs/` — longer-form standalone documents that don't fit `memory.md`/
  `knowledge.md`'s short-entry format (e.g., functional specs). First entry:
  `inventory-management-module-spec.md` — a full business/functional spec (no tech
  stack) for a 12-sub-module Inventory Management system, considerably broader than
  what's implemented today.

## History

- Repo started from `create-turbo` scaffold, then API and restaurant-ui apps were added.
- 2026-07-08 — Set up `.project/` documentation system (this file, `memory.md`, `tasks/`).
- 2026-07-08 — Fixed all lint/type/build errors repo-wide. Notable structural
  fixes: root `package.json` must declare `@repo/eslint-config` as a
  devDependency (root `.eslintrc.js` extends it, and restaurant-ui's eslint 8
  cascades up to it); `apps/api`'s eslint config sets
  `no-unused-vars: { ignoreRestSiblings: true }` for the password-exclusion
  destructuring pattern; `apps/restaurant-ui`'s `lint` script globs
  `*.{ts,tsx}` (was `*.ts` only, silently skipping all `.tsx` files).
- 2026-07-08 — Full POS billing system built: 7 new backend modules (items, inventory,
  purchases, suppliers, sales, KOT, ledger), frontend upgraded to React 19, AuthContext
  + AxiosClient with refresh token rotation, complete GST billing (CGST/SGST/INR),
  KOT board with kitchen stations, purchase/sales/ledger pages, sidebar reorganization.
  See `.project/tasks/2026-07-08-build-pos-billing-system.md`.
