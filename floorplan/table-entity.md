# Module 2: `Seat` → standalone `Table` entity

See [`README.md`](./README.md) for full background/goal. Depends on:
[`zone-cleanup.md`](./zone-cleanup.md) (module 1).

## What

Today `Seat.zoneId` is a required FK with `onDelete: 'CASCADE'` — a table
can't exist without a zone, and deleting a zone destroys its tables. Split
`Seat` into a standalone `Table` entity that:
- Can exist with no zone (bottom-up creation).
- Survives zone deletion (just gets ungrouped).
- Has a real floor position for the draggable canvas in module 6.

Rename the whole vertical slice under `apps/api/src/seating/` (same
pattern as today: entity → dto → repository → service → controller).

## Files

- `entities/seat.entity.ts` → `entities/table.entity.ts`: rename class
  `Seat` → `Table`, table name `'seats'` → `'tables'`.
  - `zoneId` becomes **nullable**, relation `onDelete: 'SET NULL'` (was
    `CASCADE`).
  - Add `posX: number | null`, `posY: number | null` (floor-canvas
    coordinates, meaningful once assigned to a zone).
  - Keep `label`, `capacity`, `category`, `status`, `isActive`,
    soft-delete — same shape as today's `Seat`.
- `repositories/seat.repository.ts` → `table.repository.ts`
  (`SeatRepository` → `TableRepository`): add `findUnassigned()`
  (`zoneId IS NULL`) and `updatePosition(id, posX, posY)`.
- `services/seats.service.ts` → `tables.service.ts`
  (`SeatsService` → `TablesService` — this is the exported provider
  `SalesModule`/`KotModule` depend on, update those imports too): add
  `assignToZone(id, zoneId | null)` and `updatePosition(id, posX, posY)`.
- `controllers/seats.controller.ts` → `tables.controller.ts`, base path
  `@Controller('tables')`:
  - `GET /tables` (supports `?unassigned=true`, `?zoneId=`)
  - `GET /tables/:id`, `POST /tables`, `PATCH /tables/:id`,
    `PATCH /tables/:id/status`, `DELETE /tables/:id` (same behavior as
    today's seats endpoints)
  - `PATCH /tables/:id/zone` — body `{ zoneId: string | null }`
  - `PATCH /tables/:id/position` — body `{ posX: number, posY: number }`
- `seating.module.ts`: register renamed providers/controllers, keep
  exporting `TablesService`.
- `controllers/zones.controller.ts`: `getSeats` → `getTables`
  (`GET /zones/:id/tables`) — used by the zone floor-plan canvas in
  module 6.

## Notes

- No DB migration tooling exists in this repo (`synchronize: true`
  outside production, no `migrations/` folder). The rename applies
  automatically on next dev server start — flag to the user that existing
  dev `seats` rows won't carry over cleanly through a table rename and may
  need re-seeding.
- Don't touch `Sales`/`Kot` entities in this module — that's
  [`sales-kot-rename.md`](./sales-kot-rename.md) (module 4). Just make
  sure the `SeatsService` → `TablesService` symbol rename doesn't break
  their imports (update the import path/name, not the field names yet).

## Verification

- `apps/api`: `tsc --noEmit`.
- `POST /tables` with no `zoneId` succeeds (bottom-up creation).
- `DELETE /zones/:id` on a zone with tables leaves the tables intact with
  `zoneId: null` (not cascaded-deleted).
- `PATCH /tables/:id/zone` and `PATCH /tables/:id/position` work.
