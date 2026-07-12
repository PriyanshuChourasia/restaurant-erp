# Module 3: `Reservation` entity (new module)

See [`README.md`](./README.md) for full background/goal. Depends on:
[`table-entity.md`](./table-entity.md) (module 2).

## What

There is currently no real booking record — `Seat.category = 'online'` and
`status = 'booked'` are just static flags a human toggles manually. Add a
real `Reservation` entity that tracks customer, party size, and scheduled
time independently of a table's live occupancy status, with logic to:
- Detect conflicts (an upcoming reservation on a table) so the POS can warn
  staff before double-booking a walk-in (used by module 8).
- Lazily expire stale `confirmed` reservations to `no_show` instead of
  blocking a table forever.

## Files

New `apps/api/src/reservations/` module, mirroring the `seating` module
structure (entity → dto → repository → service → controller):

- `entities/reservation.entity.ts`: `id`, `customerName`, `customerPhone`,
  `partySize: number`, `zoneId: string | null` (preferred zone before a
  table is picked), `tableId: string | null` (FK → `Table`,
  `onDelete: 'SET NULL'`), `scheduledFor: Date`, `durationMinutes: number`
  (default 90), `status` enum
  (`pending | confirmed | seated | completed | cancelled | no_show`),
  `source` enum (`online | phone | walk_in`, default `online`), `notes`,
  timestamps + soft delete (same pattern as `Zone`/`Table`).
- `dto/create-reservation.dto.ts`, `update-reservation.dto.ts`,
  `update-reservation-status.dto.ts`.
- `repositories/reservation.repository.ts`: `findAll` (date range/status
  filter), `findByTable(tableId)`,
  `findUpcomingForTable(tableId, withinMinutes)`.
- `services/reservations.service.ts`:
  - CRUD + `updateStatus`.
  - `getEffectiveStatus(reservation)`: lazy-expiry — if
    `status === 'confirmed'` and `now > scheduledFor + durationGraceMinutes
    (15)` and it was never marked `seated`, treat/persist it as `no_show`.
    Apply this wherever reservations are read for conflict checks, so a
    stale online booking doesn't block a table forever.
  - `checkTableConflict(tableId, withinMinutes = 120)`: returns the
    nearest upcoming `pending`/`confirmed` reservation for a table (or
    `null`) — this is what the POS panel calls before seating a walk-in
    (module 8).
  - `seat(reservationId, tableId)`: sets `status = 'seated'`, `tableId`,
    and occupies the table via `TablesService.updateStatus(tableId,
    'occupied')`.
- `controllers/reservations.controller.ts`: `GET /reservations`
  (date range/status filter), `GET /reservations/:id`,
  `POST /reservations`, `PATCH /reservations/:id`,
  `PATCH /reservations/:id/status`,
  `GET /reservations/table/:tableId/conflict` (used by POS), `DELETE
  /reservations/:id`.
- `reservations.module.ts`: imports `SeatingModule` (for `TablesService`),
  registered in `apps/api/src/app.module.ts`.

## Verification

- `apps/api`: `tsc --noEmit`, app boots with the new module registered.
- Create a reservation with `scheduledFor` in the past and `status:
  'confirmed'` → `GET /reservations/table/:tableId/conflict` (or any read
  path) reflects it as effectively `no_show`, not blocking.
- Create a reservation with `scheduledFor` 30 min from now, `status:
  'confirmed'` → `GET /reservations/table/:tableId/conflict` returns it.
- `PATCH /reservations/:id/status` with `seated` occupies the linked table
  (check `GET /tables/:id` shows `status: 'occupied'`).
