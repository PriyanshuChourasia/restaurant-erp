# Module 1: Fix `seatIds`/`tableNumbers` field inconsistency

See [`README.md`](./README.md) for full background/goal. Depends on: —
(should land alongside or right after
[`../floorplan/sales-kot-rename.md`](../floorplan/sales-kot-rename.md),
which already covers the `Invoice`/`Kot` backend `seatIds`→`tableIds`
rename — this module finishes the job on the KOT read side, which that
plan didn't touch).

## What

Three different names exist for the same concept across the KOT code
path today, confirmed by reading the actual files:

- `apps/api/src/kot/entities/kot.entity.ts` — `seatIds: string[] | null`
  (backend source of truth right now).
- `apps/restaurant-ui/src/modules/pos/api/pos.api.ts` —
  `CreateKotRequest.seatIds` (matches backend — the **write** path is
  fine).
- `apps/restaurant-ui/src/modules/kot/api/kot.api.ts` — `Kot.tableNumbers`
  (used by the **read** path, `KotDisplayPage.tsx:90`) — this does not
  exist on the backend response at all. It's always `undefined`, so the
  table label on the KOT board silently never renders.
- `apps/api/src/kot/services/kot.service.spec.ts` (lines 108-140) — test
  fixture uses `tableNumbers` in the create DTO and asserts `repo.create`
  received `tableNumbers`, but `KotService.create()` reads `dto.seatIds`
  — the assertion doesn't exercise real behavior.

Once `../floorplan/sales-kot-rename.md` lands the backend rename to
`tableIds`, finish it through the KOT frontend so there's exactly one
name end-to-end.

## Files

- `apps/api/src/kot/entities/kot.entity.ts` — confirm `seatIds` →
  `tableIds` (if not already done by the floorplan module).
- `apps/api/src/kot/services/kot.service.ts` — `seatIds` → `tableIds` in
  `create()`.
- `apps/api/src/kot/services/kot.service.spec.ts` — fix the fixture:
  replace `tableNumbers: ['Table 7']` with `tableIds: ['table-1']` in the
  `createDto`, and fix the assertion at line ~131 to check
  `tableIds: ['table-1']` instead of `tableNumbers`. This spec has been
  silently checking the wrong field — treat this as a real bug fix, not a
  cosmetic rename.
- `apps/restaurant-ui/src/modules/kot/api/kot.api.ts` — `Kot.tableNumbers`
  → `Kot.tableIds: string[] | null`.
- `apps/restaurant-ui/src/modules/kot/pages/KotDisplayPage.tsx:90` —
  `kot.tableNumbers` → `kot.tableIds`. Since a KOT only stores table
  **ids**, not human-readable labels, resolve them to `Table.label` for
  display — either have the backend `findAll`/`getActiveKots` response
  include a resolved `tableLabels` field (join against
  `apps/api/src/seating/entities/table.entity.ts` in `KotService`), or
  have the frontend look them up via the already-fetched tables list. Pick
  whichever avoids an extra round-trip per KOT card; a backend join is
  simpler here since the KOT board polls every 10s
  (`KotDisplayPage.tsx:32`, `refetchInterval: 10000`).
- `apps/restaurant-ui/src/modules/pos/api/pos.api.ts` — `seatIds` →
  `tableIds` in `CreateKotRequest` to match.
- `apps/restaurant-ui/src/modules/pos/pages/POSDashboard.tsx` —
  `seatIds` → `tableIds` in the `createKot()` call site.

## Verification

- `apps/api`: `tsc --noEmit`; `kot.service.spec.ts` passes and its
  assertions now actually match what `create()` does.
- `apps/restaurant-ui`: `tsc --noEmit`.
- Manual: seat a table in POS, checkout with items, confirm `/kot` shows
  the correct table label on the resulting KOT card (previously always
  blank).
