# Floor Plan Restructure — Module Index

## Background

This is a NestJS (`apps/api`) + React/TanStack Router (`apps/restaurant-ui`)
restaurant ERP monorepo. Today "seating" is modeled as `Zone` (owns) →
`Seat` — a `Seat` is actually a whole table (has `label`, `capacity`,
`category`, `status`), not an individual chair. Problems with the current
model:

- `Zone.sortOrder` is a required-feeling field nobody actually needs.
- Tables can only be created *inside* a zone (`Seat.zoneId` is a required
  FK, `onDelete: 'CASCADE'`), so there's no way to stand up tables first and
  organize them into zones afterward.
- The "floor plan" (`apps/restaurant-ui/src/modules/zones/components/FloorPlanView.tsx`)
  is a fake CSS `grid-cols-5` auto-layout, not a real arrangement — no
  stored position, so it can't reflect the physical room layout.
- There's no real reservation/booking record. `Seat.category = 'online'`
  and `Seat.status = 'booked'` are just static flags a human toggles
  manually — no time, no customer, no way to know when a "booked" table's
  online reservation will actually arrive, and no way to safely reassign it
  to a walk-in without silently losing the booking. The POS
  `SeatingPanel.tsx` currently lets staff select a `booked` table with just
  a tooltip ("Booked - click to confirm") and no real conflict info.
- `/reservations` already has a sidebar nav entry and a page
  (`apps/restaurant-ui/src/modules/reservations/pages/ReservationsPage.tsx`)
  but it is 100% hardcoded mock data — no backend at all.
- No DB migration tooling exists in this repo — confirmed no
  `migrations/` folder and no `migration:*` scripts in
  `apps/api/package.json`. `apps/api/src/app.module.ts` sets
  `synchronize: process.env.NODE_ENV !== 'production'`, so entity/schema
  changes just apply automatically on the next dev server start. Flag to
  the user before running that existing dev `zones`/`seats` rows may need
  re-seeding since there's no migration path to preserve them through a
  column rename.

## Goal

1. Remove `Zone.sortOrder` — not needed, zones sort by name.
2. Split `Seat` into a standalone `Table` entity that is **not** owned by a
   zone. Tables are created first (bottom layer, no zone required), then
   grouped into zones (AC / Non-AC / etc.) as a second step (top layer,
   "bottom-up"). Add real `posX`/`posY` floor coordinates so a zone shows
   an actual draggable floor layout instead of an auto-grid.
3. Add a real `Reservation` entity (customer name/phone, party size,
   scheduled time, status, optional zone/table) decoupled from a table's
   live occupancy status. Wire the POS table-picker so that assigning a
   walk-in to a table with a near-term online reservation shows an
   explicit warning/confirm dialog instead of silently double-booking or
   blocking outright — staff make the call, and no-show reservations
   lazily expire instead of blocking a table forever.

## Modules

Each module below is a self-contained, independently shippable unit of
work — its own file has full context to be handed off/implemented on its
own. Do them roughly in this order; later modules depend on earlier ones
(noted as "Depends on" in each file).

| # | Module file | Depends on | What it does |
|---|---|---|---|
| 1 | [`zone-cleanup.md`](./zone-cleanup.md) | — | Remove `Zone.sortOrder` |
| 2 | [`table-entity.md`](./table-entity.md) | 1 | `Seat` → standalone `Table` entity, zone-optional, adds floor position |
| 3 | [`reservation-entity.md`](./reservation-entity.md) | 2 | New `Reservation` entity/module, conflict + lazy-expiry logic |
| 4 | [`sales-kot-rename.md`](./sales-kot-rename.md) | 2 | `seatIds` → `tableIds` in Sales/KOT |
| 5 | [`table-management-ui.md`](./table-management-ui.md) | 2 | New `/tables` page — create/manage tables with no zone required |
| 6 | [`zone-floorplan-ui.md`](./zone-floorplan-ui.md) | 2, 5 | `/zones` becomes a real draggable floor-plan canvas for grouping tables |
| 7 | [`reservations-ui.md`](./reservations-ui.md) | 3 | Wire the existing mock `/reservations` page to the real backend |
| 8 | [`pos-conflict-warning.md`](./pos-conflict-warning.md) | 3, 4, 6 | POS seating panel warns before double-booking a reserved table |
| 9 | [`nav-routing.md`](./nav-routing.md) | 5, 6, 7 | Sidebar nav + route wiring for the new pages |

## Cross-module verification (after all modules land)

- `apps/api`: `npm run build` (or `tsc --noEmit`) to catch renamed-symbol
  fallout across `sales`, `kot`, `seating`, `reservations`; update and run
  existing specs (`sales.service.spec.ts`, `kot.service.spec.ts`) for the
  `tableIds` rename.
- `apps/restaurant-ui`: `tsc --noEmit` for renamed types (`Seat`→`Table`)
  across `pos`, `zones`, `tables`, `reservations` modules.
- Manual walkthrough via the dev server:
  1. Create 2-3 tables in `/tables` with no zone.
  2. Create an "AC Zone" in `/zones`, drag the new tables onto its floor
     canvas, drag one to reposition — confirm the position persists on
     refresh.
  3. Create a reservation for one of those tables at a near-future time
     in `/reservations`.
  4. Open `/pos`, pick that table in the seating panel — confirm the
     reservation badge/warning appears before it lets you select it for
     a walk-in order.
  5. Complete a sale on an unreserved table — confirm it flips to
     occupied, then the "clear tables" action releases it.
