# Prompt: Restructure Zone/Table/Reservation seating system

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

Build this in phases; each phase should be independently shippable and
testable — don't try to land it as one giant change.

---

## Backend (`apps/api/src`)

### Phase A — Zone cleanup
- `seating/entities/zone.entity.ts`: remove `sortOrder` column and the
  `idx_zone_sort` index.
- `seating/dto/create-zone.dto.ts` / `update-zone.dto.ts`: remove
  `sortOrder`.
- `seating/services/zones.service.ts` / `repositories/zone.repository.ts`:
  drop `sortOrder`-based ordering, order by `name` instead.

### Phase B — `Seat` → `Table`, decoupled from `Zone`
Rename the whole vertical slice (same pattern as today:
entity → dto → repository → service → controller under `seating/`):
- `entities/seat.entity.ts` → `entities/table.entity.ts`: rename class
  `Seat` → `Table`, table name `'seats'` → `'tables'`.
  - `zoneId` becomes **nullable**, relation `onDelete: 'SET NULL'` (was
    `CASCADE`) — deleting a zone must not delete its tables, only ungroup
    them.
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
- `ZonesController.getSeats` → `getTables` (`GET /zones/:id/tables`) —
  used by the zone floor-plan canvas.

### Phase C — `Reservation` entity (new module)
New `apps/api/src/reservations/` module, mirroring the `seating` module
structure:
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
    `null`) — this is what the POS panel calls before seating a walk-in.
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

### Phase D — Sales/KOT field rename
Mechanical rename `seatIds` → `tableIds` (same shape, just renamed) in:
`sales/entities/sales.entity.ts`, `sales/dto/create-invoice.dto.ts`,
`sales/services/sales.service.ts` (incl. `clearSeats` → `clearTables`),
`sales/controllers/sales.controller.ts`, `kot/entities/kot.entity.ts`,
`kot/services/kot.service.ts`, and their `*.spec.ts` files. Update
`SeatsService` → `TablesService` injections in both services.

---

## Frontend (`apps/restaurant-ui/src`)

### Phase E — Table Management (new module, bottom layer)
New `modules/tables/` (api client + types + page), mirroring
`modules/zones/api/zone.api.ts`'s axios pattern:
- `TableListPage.tsx`: flat CRUD list of all tables — label, capacity,
  status, and a zone dropdown (assign/reassign, including "Unassigned").
  Bulk-select + "Assign to zone" action (calls `PATCH /tables/:id/zone`
  per selected id). This is where tables get created standalone, no zone
  required — the bottom-up starting point.
- Route: `routes/tables.tsx` → `createFileRoute('/tables')`.

### Phase F — Zone grouping + real floor canvas
- `modules/zones/types/zone.types.ts`: drop `sortOrder`, rename `Seat` →
  `Table` (add `posX`, `posY`), add `Reservation` type.
- `ZoneListPage.tsx`: drop the `sortOrder` form field and any sort-by
  logic; sort zone cards by `name`.
- Replace `FloorPlanView.tsx`'s fake `grid-cols-5` auto-layout with a real
  canvas: absolutely-positioned `<div>`s at `table.posX/posY` inside a
  relatively-positioned container, dragged via native pointer events
  (`onPointerDown/Move/Up` — no new npm dependency; confirmed neither
  `dnd-kit` nor `framer-motion` is installed). On drag end, call
  `PATCH /tables/:id/position`. Keep `SeatBlock.tsx`'s visual style
  (rename to `TableBlock.tsx`), just drive position from real coordinates
  instead of CSS grid order.
- `ZoneSeatsPage.tsx` → `ZoneFloorPlanPage.tsx`: add an "Add tables"
  picker (lists unassigned tables + tables from other zones) that calls
  `PATCH /tables/:id/zone` to group a table into this zone — the
  "bottom-up" grouping step. Route path changes
  `/zones/$zoneId/seats` → `/zones/$zoneId`
  (`routes/zones.$zoneId.seats.tsx` → `routes/zones.$zoneId.tsx`).
- `useZoneQueries.ts`, `zone.api.ts`: rename seat-prefixed exports to
  table-prefixed (`getZoneSeats` → `getZoneTables`, etc.), point at the
  new `/tables` and `/zones/:id/tables` endpoints.

### Phase G — Reservations wired to backend
- New `modules/reservations/api/reservations.api.ts` +
  `types/reservation.types.ts`.
- `ReservationsPage.tsx`: replace the hardcoded `reservations` array with
  a real query; wire the 4 stat cards to real numbers ("Tables Available"
  from `GET /tables` minus occupied, "Today's Reservations"/"Guests
  Expected"/"Pending Requests" from `GET /reservations`); add a create
  form (customer name/phone, party size, zone, optional table, date/time);
  wire row actions (`Confirm`, `Seat` → calls the `seat` endpoint,
  `Cancel`).

### Phase H — POS conflict warning
- `modules/pos/components/SeatingPanel.tsx`: switch from
  `getZones`/`getZoneSeats` to the Phase F table endpoints; when rendering
  each table button, if it has an upcoming reservation within 2h (via
  `GET /zones/:id/tables?includeReservations=true` or a per-table
  lookup), show a small badge (reuse the existing amber `AlertCircle`
  treatment already used for `status === 'booked'` at
  `SeatingPanel.tsx:134-136`). On click, if a near-term reservation
  exists, use the same `confirm()`-dialog pattern already used elsewhere
  in this codebase (e.g. `ZoneSeatsPage.tsx`'s delete confirm) — "Table T4
  has a 7:00 PM reservation for Johnson Family (4 guests) — seat walk-in
  anyway?" — before toggling selection. This directly resolves the
  "online seat not booked yet vs. sold to walk-in" conflict: staff see it
  and make an explicit call instead of silently double-booking.
- `pos.api.ts` / `POSDashboard.tsx`: rename `seatIds` → `tableIds` to
  match the Phase D backend rename.

### Phase I — Nav & routing
- `components/layout/AppSidebar.tsx`: add
  `{ to: '/tables', label: 'Tables', icon: Armchair }` to the
  "Operations" section alongside the existing `/zones` and
  `/reservations` links (`/reservations` link already exists today, just
  currently dead — wired up in Phase G).
- `routeTree.gen.ts` is generated by the TanStack Router plugin — do not
  hand-edit it; adding the route files above (Phase E, F) and starting
  the dev server regenerates it automatically.

---

## Verification
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
