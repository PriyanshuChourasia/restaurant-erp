# 2026-07-12 — Module 4: Sales/KOT field rename (`seatIds` → `tableIds`)

## Prompt

Continue with Module 4 of the floorplan restructure (sales-kot-rename.md).

## What was done

Mechanical rename of `seatIds` → `tableIds` and `clearSeats` → `clearTables` across
the entire backend. Exact same shape, no behavior change.

### Files updated

| File | Change |
|------|--------|
| `apps/api/src/sales/entities/sales.entity.ts` | `seatIds` → `tableIds`, column `'seat_ids'` → `'table_ids'` |
| `apps/api/src/sales/dto/create-invoice.dto.ts` | `seatIds` → `tableIds` |
| `apps/api/src/sales/services/sales.service.ts` | `seatIds` → `tableIds` throughout `create()`, `clearSeats()` → `clearTables()` |
| `apps/api/src/sales/controllers/sales.controller.ts` | `clearSeats` → `clearTables`, route `/clear-seats` → `/clear-tables` |
| `apps/api/src/kot/entities/kot.entity.ts` | `seatIds` → `tableIds`, column `'seat_ids'` → `'table_ids'` |
| `apps/api/src/kot/services/kot.service.ts` | `seatIds` → `tableIds` in `create()` method signature + payload |
| `apps/api/src/sales/services/sales.service.spec.ts` | `seatIds: null` → `tableIds: null` in mock fixture |
| `apps/api/src/kot/services/kot.service.spec.ts` | `seatIds: null` → `tableIds: null`, `tableNumbers` → `tableIds` in test DTO |
| `apps/api/src/database/database-seed.service.ts` | Two remaining `seatIds: null` references → `tableIds: null` (caught by tsc) |

### Note

`TablesService` import/usage in `sales.service.ts` was already updated in Module 2.

## Verification

- `tsc --noEmit` passes clean — 0 TypeScript errors.
