# Module 6: Zone grouping + real floor canvas

See [`README.md`](./README.md) for full background/goal. Depends on:
[`table-entity.md`](./table-entity.md) (module 2),
[`table-management-ui.md`](./table-management-ui.md) (module 5).

## What

Replace the fake auto-grid "floor plan" with a real draggable canvas, and
turn the zone page into the "group tables into a zone" step of the
bottom-up flow (AC Zone / Non-AC Zone as a box you drag existing tables
into). Also finishes the frontend half of the `sortOrder` removal from
[`zone-cleanup.md`](./zone-cleanup.md) (module 1) — the frontend `Zone`
type/form still reference `sortOrder` until this module lands.

## Files

- `apps/restaurant-ui/src/modules/zones/types/zone.types.ts`: drop
  `sortOrder` from `Zone`; remove the `Seat` type (superseded by
  `modules/tables/types/table.types.ts` from module 5) or re-export
  `Table` from there for convenience; add `posX`/`posY` if not already
  covered by the shared `Table` type.
- `pages/ZoneListPage.tsx`: drop the `sortOrder` form field/state
  (`formSort`) and any sort-by-`sortOrder` logic; sort zone cards by
  `name` instead.
- `components/FloorPlanView.tsx`: replace the fake `grid-cols-5`
  auto-layout with a real canvas — absolutely-positioned `<div>`s at
  `table.posX/posY` inside a relatively-positioned container, dragged via
  native pointer events (`onPointerDown/Move/Up` — no new npm dependency;
  confirmed neither `dnd-kit` nor `framer-motion` is installed in
  `apps/restaurant-ui/package.json`). On drag end, call
  `updateTablePosition(id, posX, posY)` from module 5's `table.api.ts`.
- `components/SeatBlock.tsx` → `TableBlock.tsx`: keep the existing visual
  style (isometric block, status colors), just drive position from real
  coordinates instead of CSS grid order.
- `pages/ZoneSeatsPage.tsx` → `ZoneFloorPlanPage.tsx`: add an "Add
  tables" picker (lists unassigned tables + tables from other zones, via
  `getTables()` from module 5 filtered client-side or via
  `?unassigned=true`) that calls `assignTableToZone(tableId, zoneId)` to
  group a table into this zone — the "bottom-up" grouping step described
  in the README. Route path changes `/zones/$zoneId/seats` →
  `/zones/$zoneId`:
  - Delete `apps/restaurant-ui/src/routes/zones.$zoneId.seats.tsx`.
  - Add `apps/restaurant-ui/src/routes/zones.$zoneId.tsx` →
    `createFileRoute('/zones/$zoneId')({ component: ZoneFloorPlanPage })`.
- `hooks/useZoneQueries.ts`, `api/zone.api.ts`: rename seat-prefixed
  exports to table-prefixed (`getZoneSeats` → `getZoneTables`, etc.),
  point at `GET /zones/:id/tables` (module 2) instead of
  `GET /zones/:id/seats`.

## Verification

- `tsc --noEmit`.
- Manually: create an "AC Zone" with no `sortOrder` field visible in the
  form. Open it, use "Add tables" to pull in 2-3 tables created in module
  5's `/tables` page, drag them around the canvas, refresh — positions
  persist.
