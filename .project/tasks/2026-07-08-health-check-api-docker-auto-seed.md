**Date:** 2026-07-08
**Prompt:** Create a health check API, and in Docker write such it should seed data when docker run seed the demo data automatically

## What was done

### Health check API (`GET /api/health`)

- **`apps/api/src/app.controller.ts`**: Added `@Public() @Get('health')` endpoint — bypasses the global JWT guard so Docker healthchecks work without auth.
- **`apps/api/src/app.service.ts`**: Added `getHealth()` method using `@InjectDataSource()` to run `SELECT 1` against PostgreSQL. Returns: `status`, `timestamp`, `uptime`, `database` (connected/disconnected), `environment`.

### Docker auto-seed on startup

- **`docker-compose.yml`**: Added `NODE_ENV: development` to the `api` service environment (overrides the production env file). This enables TypeORM's `synchronize: true` so tables are auto-created on a fresh database. The existing `DatabaseSeedService.onApplicationBootstrap()` runs on every startup and auto-seeds demo data (idempotent — checks row counts).
- Added `healthcheck` for the `api` service using `wget http://localhost:3000/api/health` (wget is available on Alpine), with a 20s `start_period` to allow startup + seeding time.

### What happens when `docker compose up` runs:
1. PostgreSQL container starts
2. API container starts after DB is healthy
3. TypeORM creates all tables (synchronize)
4. Seed service auto-seeds all demo data (permissions, roles, users, categories, items, inventory, suppliers, purchases, invoices, KOTs, ledger entries, stock movements)
5. Health endpoint returns `{"status":"ok","database":"connected"}`
6. Docker healthcheck passes, container marked healthy

## Outcome

Zero TypeScript errors. Demo data auto-seeds on every fresh Docker startup. Health endpoint is publicly accessible.
