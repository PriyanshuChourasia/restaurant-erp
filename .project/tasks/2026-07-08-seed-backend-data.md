**Date:** 2026-07-08
**Prompt:** "seed data to backend"

## What was done

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

## Outcome

`restaurant_erp_dev` now has real seed data and the demo login credentials
shown on the frontend actually work against a live backend. The entity
type-inference bug fix is a genuine correctness fix, not just seeding — it
would have broken every real deployment (dev or prod) the moment someone
pointed the app at an empty database.
