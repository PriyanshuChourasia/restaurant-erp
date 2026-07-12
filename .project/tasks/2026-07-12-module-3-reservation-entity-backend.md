# 2026-07-12 — Module 3: Reservation entity (new module)

## Prompt

Continue with Module 3 of the floorplan restructure (reservation-entity.md).

## What was done

Created a complete new `apps/api/src/reservations/` module with entity, DTOs,
repository, service, controller, and module registration.

### New files created

- **`entities/reservation.entity.ts`** — `Reservation` entity with:
  - `customerName`, `customerPhone`, `partySize`, `notes`
  - `zoneId` (nullable, preferred zone) and `tableId` (nullable FK → `Table`, `onDelete: 'SET NULL'`)
  - `scheduledFor` (datetime), `durationMinutes` (default 90)
  - `status` enum: `pending | confirmed | seated | completed | cancelled | no_show`
  - `source` enum: `online | phone | walk_in`
  - Soft delete + indexes on status, scheduledFor, tableId, zoneId, customerPhone

- **`dto/create-reservation.dto.ts`** — Validation: customerName required, date as ISO string, partySize ≥ 1, optional zoneId/tableId as UUIDs
- **`dto/update-reservation.dto.ts`** — `PartialType(CreateReservationDto)`
- **`dto/update-reservation-status.dto.ts`** — Single `status` field with enum validation

- **`repositories/reservation.repository.ts`** — CRUD + `findByTable`, `findUpcomingForTable(tableId, withinMinutes)` (finds nearest pending/confirmed reservation), `findAll` with date range and status filters

- **`services/reservations.service.ts`** — Full CRUD +:
  - `applyLazyExpiry(reservation)` — auto-expires stale confirmed reservations to `no_show` after scheduled time + duration + 15min grace
  - `checkTableConflict(tableId, withinMinutes=120)` — checks for upcoming reservations, applies lazy expiry, returns conflict or null
  - `seat(id, tableId)` — links table, sets seated status, occupies the table
  - `updateStatus(id, status)` — handles side effects: seating occupies table, cancelling/no_show releases occupied table

- **`controllers/reservations.controller.ts`** — Endpoints:
  - `GET /reservations` (dateFrom, dateTo, status filters)
  - `GET /reservations/table/:tableId/conflict` (before `:id` route to avoid capture)
  - `GET /reservations/:id`, `POST /reservations`, `PATCH /reservations/:id`
  - `PATCH /reservations/:id/status`, `POST /reservations/:id/seat`
  - `DELETE /reservations/:id`

- **`reservations.module.ts`** — Imports `TypeOrmModule.forFeature([Reservation])` + `SeatingModule`, exports `ReservationsService`

### Updated files

- **`app.module.ts`** — Registered `ReservationsModule` in imports array

### Bugs found & fixed during implementation

1. **Route ordering** — `GET /reservations/:id` would match before `GET /reservations/table/:tableId/conflict`, making the conflict endpoint unreachable. Fixed by reordering.
2. **Missing `await`** — `this.applyLazyExpiry(upcoming)` in `checkTableConflict` was missing `await`, causing `Promise<Reservation>` to be used as `Reservation`.
3. **Repository date filter** — `{ ...where.scheduledFor, [MoreThanOrEqual]: ... }` would throw on `...undefined`. Fixed to use TypeORM's array-of-operators pattern.

## Verification

- `tsc --noEmit` passes clean — 0 TypeScript errors.

## Next

Module 4 (sales-kot-rename.md) and Module 5 (table-management-ui.md) can be done independently.
