# Project Memory — Key Points

Fast-moving, high-signal notes: open questions, decisions made mid-work, gotchas,
things to remember for next time. Keep entries short. When something here becomes
permanently true of the project's architecture, promote it into `knowledge.md` and
remove it from here. Full narrative history of each prompt lives in `tasks/`.

Newest entries at the top.

---

## 2026-07-08 — Seeded all roles, permissions, and users

- Seed service rewritten to be idempotent: 77 permissions across 17 modules, 6 roles (added chef, cashier, waiter), 6 demo users.
- New seed data: 5 suppliers, 15 Indian cuisine items with GST, inventory for 15 items (opening stock 50), 8 ledger accounts.

## 2026-07-08 — Added logout option

- Added logout button in sidebar footer (red icon + text) and header user dropdown.
- Both sidebar and header now show real user data from AuthContext instead of hardcoded "John Doe".
- Logout calls POST /api/auth/logout, clears localStorage, redirects to /login.
- 0 TypeScript errors.

## 2026-07-08 — Fixed auth flow: login → dashboard, not orders

- Login moved to `/login` route (was at `/`). Dashboard now lives at `/` root route.
- Created proper DashboardPage with KPI cards, revenue chart, popular items, recent orders, quick actions.
- LoginPage now redirects to `/` (dashboard) instead of `/orders`.
- AppLayout updated: `/login` = no layout, `/` = dashboard with sidebar.
- 0 TypeScript errors.

## 2026-07-08 — Started API server to fix login 500

- Login was returning 500 because the API server on port 3000 was not running.
- Rebuilt and started the server (`node dist/main.js`). Both direct and Vite-proxied login endpoints now return 201 with valid JWT tokens.
- No code changes needed — entity fixes from the previous session were already compiled in.

## 2026-07-08 — Updated DB_NAME to restaurant_erp

- Updated `.env.development` to use `DB_NAME=restaurant_erp` (was `restaurant_erp_dev`), matching the user's connection string `postgresql://primesysindia@localhost:5432/restaurant_erp`.
- The `restaurant_erp` database already has all 18 tables and seed data.

## 2026-07-08 — Fixed login 500 error (TypeORM nullable column gotcha)

- Root cause: API server crashed on startup with `DataTypeNotSupportedError: Data type "Object" in "Supplier.gstin"`.
  The same `string | null` without `type: 'varchar'` bug hit 8 columns across 4 new entities from the POS build.
- Fixed in `Supplier.gstin`, `Supplier.contactPerson`, `Invoice.customerName`, `Invoice.customerPhone`,
  `Invoice.customerGstin`, `Invoice.tableNumber`, `LedgerAccount.financialYear`, `Kot.tableNumber`.
- Verified all 43 nullable columns across all 12 entities now have explicit `type:` — no remaining vulnerabilities.
- Login endpoint now returns 200 with valid JWT access + refresh tokens.

## 2026-07-08 — Real login wired up (was a fake `setTimeout`)

- Login page now actually authenticates: prefilled demo credentials, real
  `POST /api/auth/login` call, token stored + applied to axios defaults via new
  `src/lib/session.ts`, redirects to `/orders` on success. See
  `.project/tasks/2026-07-08-wire-real-login.md`.
- Gotcha found: `apps/restaurant-ui/vite.config.ts` had no dev proxy, so every
  relative `/api/*` axios call (category API included) was already silently
  broken in `pnpm dev` before this fix. Added `server.proxy['/api'] →
  localhost:3000`.
- Gotcha: Vite doesn't hot-reload `vite.config.ts` — any already-running dev
  server needs a manual restart to pick up the new proxy.
- No browser tool / project run-skill existed for this repo; verified the
  login flow with an ad-hoc Playwright script (`playwright-core` installed
  temporarily in the scratchpad dir, not a repo dependency). Worth generating
  a real project run-skill (`/run-skill-generator`) next time this comes up.
- Not done: no route guard/protected-route pattern anywhere (all routes are
  reachable unauthenticated); sidebar user display is still static placeholder
  data, not wired to the logged-in user.

## 2026-07-08 — Full POS billing system built (GST, KOT, Inventory, Ledger, Reports)

- Built 7 new backend modules: Items, Inventory (with opening balance), Purchases,
  Suppliers, Sales (with GST), KOT, Ledger (financial). Auth upgraded with refresh
  token rotation.
- Frontend: React 19 upgrade, AuthContext + AxiosClient with auto-refresh
  interceptor, complete POS with GST billing (CGST/SGST/INR), KOT board with
  kitchen station management, Sales/Invoices, Purchases, Ledger pages.
- Sidebar completely reorganized with all new module links.
- 0 TypeScript errors in both apps (`tsc --noEmit` passes clean).
- Not done: route guards for unauthenticated access, inventory opening balance UI
  form, dedicated Reports viewer page (exists as backend endpoints, frontend
  ReportsPage still shows static data).

## 2026-07-08 — Comprehensive README written

- Created `README.md` with full project documentation: 12 feature modules described,
  tech stack tables, architecture patterns, API endpoint reference, setup guide, and
  a detailed "How This Project Was Created" section documenting all 10 prompts used
  to build the project.

## 2026-07-08 — Dev/prod envs created, backend seeded, local dev DB is live

- `apps/api` now loads `.env.development` or `.env.production` (picked by
  `NODE_ENV`, set in the `start:dev`/`start:prod` scripts). `.env.production`
  is a placeholder template only — no real prod credentials exist anywhere.
- Local dev Postgres database `restaurant_erp_dev` exists on this machine
  (localhost:5432, user `primesysindia`, trust auth) and is seeded: 3 demo
  users (admin/manager/staff), 3 roles, 48 permissions, 11 demo categories.
- **Real bug found while seeding, not by lint/typecheck**: TypeORM entity
  columns typed `string | null` without an explicit `type:` option throw
  `DataTypeNotSupportedError` at DB-connect time (TS erases union types to
  `Object` in decorator metadata). Fixed across `User.phone`/`roleId` and
  `CategoryEntity.parentId/createdBy/updatedBy/deletedBy/icon/image`. Worth
  remembering: `tsc`/`eslint` cannot catch this class of bug — only actually
  connecting to a real database surfaces it. See
  `.project/tasks/2026-07-08-seed-backend-data.md`.
- Demo credentials (also shown on the login page): `admin@restaurant.com` /
  `Admin@123456`.

## 2026-07-08 — Fixed all project errors; repo is green

- `pnpm build` / `pnpm lint` / API `jest` all pass clean across `@repo/api`,
  `@repo/restaurant-ui`, `@repo/ui`. See
  `.project/tasks/2026-07-08-fix-all-project-errors.md` for the full list.
- Gotcha: root `package.json` must keep `@repo/eslint-config` as a devDependency
  — root `.eslintrc.js` extends it, and eslint 8 (used by restaurant-ui) walks
  up to root config, which breaks entirely if the package isn't linked.
- Gotcha: `apps/restaurant-ui`'s `lint` script must glob `*.{ts,tsx}`, not just
  `*.ts` — it was silently skipping all `.tsx` files before.
- Open follow-ups (not done, would be feature work): `UsersController.update`
  has no real self-vs-admin authorization despite an old comment implying one;
  `CategoryDetailsPage` has no activate/deactivate control unlike the list page.
- Demo login: `apps/restaurant-ui` login page now shows the real demo password
  (`Admin@123456` for `admin@restaurant.com`) instead of masking it — matches
  the seed data in `apps/api/src/database/database-seed.service.ts`.

## 2026-07-08 — Added `.project/prompt.md` as the directive entry point

- `AGENTS.md` now points agents at `.project/prompt.md` first, which spells out
  the exact procedure (read memory before starting; write a task file + update
  memory + maybe update knowledge after finishing) so the workflow is followed
  automatically every session, not just when re-explained.

## 2026-07-08 — Documentation system bootstrapped

- Created `.project/knowledge.md`, `.project/memory.md`, `.project/tasks/` and
  documented the convention in `AGENTS.md`.
- Convention going forward: every user prompt is treated as a task. At the end of
  completing it, write a new dated file in `.project/tasks/` summarizing what was
  done. Update this file with any key decisions/gotchas, and update `knowledge.md`
  if something structural changed.
