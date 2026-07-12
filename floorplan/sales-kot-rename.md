# Module 4: Sales/KOT field rename (`seatIds` → `tableIds`)

See [`README.md`](./README.md) for full background/goal. Depends on:
[`table-entity.md`](./table-entity.md) (module 2).

## What

`Invoice` and `Kot` store a plain `seatIds: string[] | null` column (no FK,
just an array of ids). Since the underlying entity is now `Table` not
`Seat` (module 2), rename this field end-to-end for consistency. This is a
mechanical rename — same shape, no behavior change.

## Files

- `apps/api/src/sales/entities/sales.entity.ts`: `seatIds` → `tableIds`.
- `apps/api/src/sales/dto/create-invoice.dto.ts`: `seatIds` → `tableIds`.
- `apps/api/src/sales/services/sales.service.ts`:
  - `seatIds` → `tableIds` throughout `create()`.
  - `clearSeats()` → `clearTables()`.
  - `this.seatsService` → `this.tablesService` (update the injected type
    from `SeatsService` to `TablesService`, per module 2's rename).
- `apps/api/src/sales/controllers/sales.controller.ts`: update the
  `clear-seats` route handler name/reference to match `clearTables`
  (keep the URL path as-is unless you also want to rename the route —
  optional, not required).
- `apps/api/src/kot/entities/kot.entity.ts`: `seatIds` → `tableIds`.
- `apps/api/src/kot/services/kot.service.ts`: `seatIds` → `tableIds` in
  `create()`.
- `apps/api/src/sales/services/sales.service.spec.ts` and
  `apps/api/src/kot/services/kot.service.spec.ts`: update mock fixtures
  (`seatIds: null` → `tableIds: null`).

## Verification

- `apps/api`: `tsc --noEmit`.
- `npm test` (or the relevant spec runner) passes for
  `sales.service.spec.ts` and `kot.service.spec.ts`.
- `POST /sales` with `tableIds: [...]` occupies those tables via
  `TablesService.bulkUpdateStatus`.
