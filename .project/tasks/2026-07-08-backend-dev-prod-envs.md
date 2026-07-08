**Date:** 2026-07-08
**Prompt:** "create two envs for backend, prod, dev"

## What was done

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

## Outcome

Verified `.env.development` works: started the API with `NODE_ENV=development`
and it connected to Postgres successfully (see
`2026-07-08-seed-backend-data.md` for the seeding verification that rode along
with this). `.env.production` is a template only — nobody should assume it has
real credentials; it needs real values filled in at actual deploy time.
