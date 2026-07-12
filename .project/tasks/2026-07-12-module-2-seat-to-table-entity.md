# 2026-07-12 — Module 2: `Seat` → standalone `Table` entity

## Prompt

Complete Module 2 of the floorplan restructure as described in `floorplan/table-entity.md`.

## What was done

Transformed `Seat` into a standalone `Table` entity that can exist without a zone (bottom-up creation), survives zone deletion (ungrouped), and has floor canvas coordinates.

### New files created

- **`apps/api/src/seating/entities/table.entity.ts`** — `Table` class with:
  - `zoneId` nullable with `onDelete: 'SET NULL'` (was required FK with `CASCADE`)
  - `posX`, `posY` (float, nullable — floor-canvas coordinates)
  - Enums renamed: `SeatCategory` → `TableCategory`, `SeatStatus` → `TableStatus`
  - Indexes renamed: `idx_seat_*` → `idx_table_*`
- **`apps/api/src/seating/dto/create-table.dto.ts`** — `zoneId` optional, `posX`/`posY` added
- **`apps/api/src/seating/dto/update-table.dto.ts`** — `PartialType(CreateTableDto)`
- **`apps/api/src/seating/dto/update-table-status.dto.ts`** — Renamed from `UpdateSeatStatusDto`
- **`apps/api/src/seating/repositories/table.repository.ts`** — Added `findUnassigned()` (`zoneId IS NULL`), `updatePosition(id, posX, posY)`, `assignToZone(id, zoneId | null)`. `findAll()` now accepts optional `zoneId` and `unassigned` filters.
- **`apps/api/src/seating/services/tables.service.ts`** — Added `assignToZone(id, zoneId | null)`, `updatePosition(id, posX, posY)`, `findAll(zoneId?, unassigned?)`
- **`apps/api/src/seating/controllers/tables.controller.ts`** — Base path `@Controller('tables')`, endpoints:
  - `GET /tables?zoneId=&unassigned=true`
  - `GET /tables/:id`, `POST /tables`, `PATCH /tables/:id`, `PATCH /tables/:id/status`, `DELETE /tables/:id`
  - `PATCH /tables/:id/zone` — assign/remove zone
  - `PATCH /tables/:id/position` — set floor position

### Updated files

- **`apps/api/src/seating/seating.module.ts`** — Register `Table`, `TablesService`, `TableRepository`, `TablesController`; export `TablesService`
- **`apps/api/src/seating/controllers/zones.controller.ts`** — Inject `TablesService` instead of `SeatsService`; `getSeats` → `getTables`, route `/zones/:id/seats` → `/zones/:id/tables`
- **`apps/api/src/sales/services/sales.service.ts`** — Import `TablesService` instead of `SeatsService`; all 3 method calls updated
- **`apps/api/src/sales/services/sales.service.spec.ts`** — Mock token updated to `'TablesService'`

### Deleted files

- `entities/seat.entity.ts`, `dto/create-seat.dto.ts`, `dto/update-seat.dto.ts`, `dto/update-seat-status.dto.ts`
- `repositories/seat.repository.ts`, `services/seats.service.ts`, `controllers/seats.controller.ts`

### Not touched (by design)

- `Sales`/`Kot` entity field names (`seatIds`) — handled in Module 4 (`sales-kot-rename.md`).
- Frontend — handled in Modules 5 & 6.

## Verification

- `tsc --noEmit` passes clean — 0 TypeScript errors.
- Can no longer create a `Table` with a `zoneId` requirement — `POST /tables` with no zone succeeds.
- `DELETE /zones/:id` on a zone with tables will SET NULL on `zoneId` instead of CASCADE.
- `/zones/:id/tables` replaces `/zones/:id/seats`.

## Note

Existing dev `seats` table rows will not carry over cleanly through the table rename — `synchronize: true` will drop the old `seats` table and create a new `tables` table. Re-seeding may be needed.
