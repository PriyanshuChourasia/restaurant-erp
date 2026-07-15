# Task Group: Floor Plan Restructure (Modules 1–9)

Tasks grouped (in module order, 2026-07-12, per `floorplan/README.md`): `2026-07-12-zone-cleanup-remove-sortorder.md` (Module 1), `2026-07-12-module-2-seat-to-table-entity.md`, `2026-07-12-module-3-reservation-entity-backend.md`, `2026-07-12-module-4-sales-kot-rename.md`, `2026-07-12-module-5-table-management-ui.md`, `2026-07-12-module-6-zone-floorplan-ui.md`, `2026-07-12-module-7-reservations-ui.md`, `2026-07-12-module-8-pos-conflict-warning.md`, `2026-07-12-module-9-nav-routing.md`

This 9-module sequence replaced the earlier `Zone`/`Seat` model (see
`customer-pricing-recipe-zone-buildout_group.md`) with a standalone `Table`
entity, added Reservations, renamed `seatIds` → `tableIds` throughout, and
rebuilt the zone/table frontend around real floor-canvas coordinates.

---

## Task: Module 1 — Zone cleanup: remove `sortOrder`

**Date:** 2026-07-12
**Prompt:** Follow floorplan/README.md and complete zone-cleanup.md.

### What was done

Implemented Module 1 of the Floor Plan Restructure (see `floorplan/README.md`):
removed the unused `sortOrder` field from the `Zone` entity everywhere on the
backend.

#### Files changed

- **`apps/api/src/seating/entities/zone.entity.ts`**: Removed `sortOrder` column
  and `idx_zone_sort` index.
- **`apps/api/src/seating/dto/create-zone.dto.ts`**: Removed `sortOrder` field
  and its `IsInt`, `Min` validator imports.
- **`apps/api/src/seating/services/zones.service.ts`**: Removed `sortOrder`
  assignment from the `create()` method.
- **`apps/api/src/seating/repositories/zone.repository.ts`**: Changed `order`
  from `{ sortOrder: 'ASC', name: 'ASC' }` to `{ name: 'ASC' }`.

#### Not touched (by design)

- **`update-zone.dto.ts`** — Automatically inherits from `CreateZoneDto` via
  `PartialType`, so no separate change needed.
- **Frontend** (`zone.types.ts`, `ZoneListPage.tsx`) — Left alone per the module
  spec; will be cleaned up in Module 6 (`zone-floorplan-ui.md`).

### Verification

- `tsc --noEmit` passes clean in `apps/api` — 0 TypeScript errors.
- No test specs reference `sortOrder` on Zone (no spec file existed for the
  zone repository or service).

---

## Task: Module 2 — `Seat` → standalone `Table` entity

**Date:** 2026-07-12
**Prompt:** Complete Module 2 of the floorplan restructure as described in `floorplan/table-entity.md`.

### What was done

Transformed `Seat` into a standalone `Table` entity that can exist without a zone (bottom-up creation), survives zone deletion (ungrouped), and has floor canvas coordinates.

#### New files created

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

#### Updated files

- **`apps/api/src/seating/seating.module.ts`** — Register `Table`, `TablesService`, `TableRepository`, `TablesController`; export `TablesService`
- **`apps/api/src/seating/controllers/zones.controller.ts`** — Inject `TablesService` instead of `SeatsService`; `getSeats` → `getTables`, route `/zones/:id/seats` → `/zones/:id/tables`
- **`apps/api/src/sales/services/sales.service.ts`** — Import `TablesService` instead of `SeatsService`; all 3 method calls updated
- **`apps/api/src/sales/services/sales.service.spec.ts`** — Mock token updated to `'TablesService'`

#### Deleted files

- `entities/seat.entity.ts`, `dto/create-seat.dto.ts`, `dto/update-seat.dto.ts`, `dto/update-seat-status.dto.ts`
- `repositories/seat.repository.ts`, `services/seats.service.ts`, `controllers/seats.controller.ts`

#### Not touched (by design)

- `Sales`/`Kot` entity field names (`seatIds`) — handled in Module 4 (`sales-kot-rename.md`).
- Frontend — handled in Modules 5 & 6.

### Verification

- `tsc --noEmit` passes clean — 0 TypeScript errors.
- Can no longer create a `Table` with a `zoneId` requirement — `POST /tables` with no zone succeeds.
- `DELETE /zones/:id` on a zone with tables will SET NULL on `zoneId` instead of CASCADE.
- `/zones/:id/tables` replaces `/zones/:id/seats`.

### Note

Existing dev `seats` table rows will not carry over cleanly through the table rename — `synchronize: true` will drop the old `seats` table and create a new `tables` table. Re-seeding may be needed.

---

## Task: Module 3 — Reservation entity (new module)

**Date:** 2026-07-12
**Prompt:** Continue with Module 3 of the floorplan restructure (reservation-entity.md).

### What was done

Created a complete new `apps/api/src/reservations/` module with entity, DTOs,
repository, service, controller, and module registration.

#### New files created

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

#### Updated files

- **`app.module.ts`** — Registered `ReservationsModule` in imports array

#### Bugs found & fixed during implementation

1. **Route ordering** — `GET /reservations/:id` would match before `GET /reservations/table/:tableId/conflict`, making the conflict endpoint unreachable. Fixed by reordering.
2. **Missing `await`** — `this.applyLazyExpiry(upcoming)` in `checkTableConflict` was missing `await`, causing `Promise<Reservation>` to be used as `Reservation`.
3. **Repository date filter** — `{ ...where.scheduledFor, [MoreThanOrEqual]: ... }` would throw on `...undefined`. Fixed to use TypeORM's array-of-operators pattern.

### Verification

- `tsc --noEmit` passes clean — 0 TypeScript errors.

### Next

Module 4 (sales-kot-rename.md) and Module 5 (table-management-ui.md) can be done independently.

---

## Task: Module 4 — Sales/KOT field rename (`seatIds` → `tableIds`)

**Date:** 2026-07-12
**Prompt:** Continue with Module 4 of the floorplan restructure (sales-kot-rename.md).

### What was done

Mechanical rename of `seatIds` → `tableIds` and `clearSeats` → `clearTables` across
the entire backend. Exact same shape, no behavior change.

#### Files updated

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

#### Note

`TablesService` import/usage in `sales.service.ts` was already updated in Module 2.

### Verification

- `tsc --noEmit` passes clean — 0 TypeScript errors.

---

## Task: Module 5 — Table Management UI (new module)

**Date:** 2026-07-12
**Prompt:** Continue with Module 5 of the floorplan restructure (table-management-ui.md).

### What was done

Created a new `apps/restaurant-ui/src/modules/tables/` frontend module with types,
API client, page component, and route file.

#### Files created

- **`types/table.types.ts`** — `Table` interface (id, zoneId, label, capacity, category,
  status, posX, posY, isActive, timestamps), `CreateTableRequest`, `UpdateTableRequest`,
  `TableStatus`, `TableCategory`, `ZoneBrief`

- **`api/table.api.ts`** — API client with all backend endpoints:
  `getTables(unassigned?, zoneId?)`, `getTable(id)`, `createTable()`, `updateTable()`,
  `updateTableStatus()`, `updateTablePosition()`, `assignTableToZone()`, `deleteTable()`,
  `getZonesBrief()` (for assignment dropdown)

- **`pages/TableListPage.tsx`** — Full CRUD page with:
  - Inline add/edit form (label, capacity, category, zone assignment)
  - Table view with status badges (color-coded: emerald/amber/blue)
  - Quick status toggle (available → booked → available)
  - Per-row zone reassign dropdown
  - Edit and delete actions
  - Stats footer: Available / Booked / Occupied / Unassigned counts
  - Empty state with creation prompt
  - Follows the same TanStack Query pattern as `ZoneListPage`

- **`routes/tables.tsx`** — `createFileRoute('/tables')({ component: TableListPage })`
  (auto-discovered by TanStack Router codegen on next dev server start)

### Verification

- `tsc --noEmit` passes clean — 0 TypeScript errors.
- No changes to `routeTree.gen.ts` (auto-generated; regens on dev server start).
- No changes to `floorplan/table-management-ui.md` needed (implementation matches spec).

---

## Task: Module 6 — Zone floorplan UI

**Date:** 2026-07-12
**Prompt:** Continue with Module 6 of the floorplan restructure (zone-floorplan-ui.md).

### What was done

Major frontend restructure for the zones module: replaced fake Seat auto-grid with
a real draggable floor canvas using stored coordinates, removed `sortOrder` from the
frontend, changed the zone detail route from `/zones/$zoneId/seats` to `/zones/$zoneId`,
and updated the SeatingPanel used by POS.

#### Files modified

- **`modules/zones/types/zone.types.ts`** — Removed `sortOrder` from `Zone`, removed
  `Seat`/`SeatStatus`/`SeatCategory`/`CreateSeatRequest`/`UpdateSeatRequest` types,
  re-exported `Table` type from `modules/tables/types/table.types.ts`

- **`modules/zones/api/zone.api.ts`** — Replaced seat API functions (`getSeats`,
  `getZoneSeats`, `createSeat`, etc.) with table API functions (`getZoneTables`,
  `getAllTables`, `getUnassignedTables`, `assignTableToZone`, `updateTablePosition`, etc.)
  pointing at `/zones/:id/tables` and `/tables` endpoints

- **`modules/zones/hooks/useZoneQueries.ts`** — Replaced seat hooks (`useZoneSeats`,
  `useAllSeats`, `useCreateSeat`, etc.) with table hooks (`useZoneTables`,
  `useAllTables`, `useUnassignedTables`, `useAssignTableToZone`, `useUpdateTablePosition`, etc.)

- **`modules/zones/pages/ZoneListPage.tsx`** — Removed `formSort` state, "Sort Order"
  form field and card display. Link changed from `/zones/$zoneId/seats` to `/zones/$zoneId`
  with label "Floor Plan"

- **`modules/zones/components/FloorPlanView.tsx`** — Complete rewrite from isometric grid
  to real coordinate canvas: absolutely-positioned `<div>`s using stored `posX`/`posY`,
  pointer-event drag with `setPointerCapture`, rotation control, stats bar

- **`modules/zones/components/TableBlock.tsx`** — Renamed from `SeatBlock.tsx`, uses
  `Table` type instead of `Seat`, supports `isDraggable` prop for cursor changes

- **`modules/zones/pages/ZoneFloorPlanPage.tsx`** — Replaces `ZoneSeatsPage.tsx`:
  "Add Tables" picker listing unassigned tables via `getUnassignedTables()`,
  drag-to-position floor plan, table list with status controls and remove-from-zone

- **`modules/pos/components/SeatingPanel.tsx`** — Updated from `getZoneSeats` to
  `getZoneTables`, from `Seat` type to `Table` type, zones sorted by name instead of
  `sortOrder`

- **`modules/pos/pages/POSDashboard.tsx`** — Updated `SeatingPanel` prop names to
  `selectedTableIds`/`onTableToggle`

#### Files created

- **`routes/zones.$zoneId.tsx`** — New route for `/zones/$zoneId` → `ZoneFloorPlanPage`

#### Files deleted

- `routes/zones.$zoneId.seats.tsx`
- `modules/zones/pages/ZoneSeatsPage.tsx`
- `modules/zones/components/SeatForm.tsx`
- `modules/zones/components/ZoneHeader.tsx`
- `modules/zones/components/SeatBlock.tsx`

#### Bugs found & fixed during implementation

1. Removed unused `GripVertical` import from `TableBlock.tsx`
2. Removed unused `CreateTableRequest`/`UpdateTableRequest` imports from `zone.api.ts`
3. Removed unused `Table` type import from `ZoneFloorPlanPage.tsx`
4. Fixed `SeatingPanel` prop names in `POSDashboard.tsx`
5. Fixed `zoneKeys.tables` (a function) being used as a query key in `useUpdateTablePosition`

### Verification

- `tsc --noEmit` passes clean for all changed files (pre-existing errors in unrelated
  `SalesSummaryPage.tsx` remain unchanged)
- Route auto-discovered by TanStack Router codegen on next dev server start

---

## Task: Module 7 — Reservations UI wired to backend

**Date:** 2026-07-12
**Prompt:** Continue with Module 7 of the floorplan restructure (reservations-ui.md).

### What was done

Created a complete reservations frontend module and rewrote the mock-data-based
`ReservationsPage` to use the real backend API from Module 3.

#### Files created

- **`types/reservation.types.ts`** — `Reservation`, `CreateReservationRequest`,
  `UpdateReservationRequest`, `ReservationStatus`, `ReservationSource` types

- **`api/reservations.api.ts`** — API client for all 8 endpoints:
  `getReservations()` (with date/status filters), `getReservation()`,
  `getTableConflict()`, `createReservation()`, `updateReservation()`,
  `updateReservationStatus()`, `seatReservation()`, `deleteReservation()`

- **`hooks/useReservationsQueries.ts`** — React Query hooks:
  `useReservations`, `useReservation`, `useCreateReservation`,
  `useUpdateReservation`, `useUpdateReservationStatus`,
  `useSeatReservation`, `useDeleteReservation`

#### Files rewritten

- **`pages/ReservationsPage.tsx`** — Replaced 100% hardcoded mock data with:
  - **4 live stat cards**: Today's Reservations, Guests Expected (from confirmed
    reservations), Tables Available (from `getTables()`), Pending Requests
  - **Inline add/edit form**: name, phone, party size, date, time, source (phone/
    online/walk_in), table selector (shows available-only tables)
  - **Real-time search** and **status filter pills** (All/Pending/Confirmed/Seated/Cancelled)
  - **Action buttons per row**: Confirm (pending→confirmed), Seat selector with
    available table dropdown (confirmed→seated via `seatReservation`), Edit, Cancel,
    Delete
  - **Weekly calendar** showing real booking counts per day from API data
  - Proper empty states for filtered vs unfiltered views

### Verification

- `tsc --noEmit` passes clean — 0 TypeScript errors.
- Route at `/reservations` already registered; sidebar link already exists (Module 9).

---

## Task: Module 8 — POS conflict warning

**Date:** 2026-07-12
**Prompt:** Continue with Module 8 of the floorplan restructure (pos-conflict-warning.md).

### What was done

Added reservation conflict detection to the POS SeatingPanel so staff see an explicit
warning before double-booking a table with an upcoming reservation. Also completed the
`seatIds` → `tableIds` rename in the POS module to match Module 4's backend change.

#### Files modified

- **`modules/pos/components/SeatingPanel.tsx`** — Added reservation conflict checking:
  - Uses `useQueries` to fetch `GET /reservations/table/:tableId/conflict` for all
    visible tables in the active zone in parallel
  - Shows a `CalendarDays` icon + `AlertCircle` badge on tables with upcoming
    reservations, with a tooltip showing time, customer name, and party size
  - Sub-line shows "5:00 PM · Johnson Family" on tables with conflicts
  - On click, uses `window.confirm()` to warn: "Table T4 has a 7:00 PM reservation
    for Johnson Family (4 guests) — seat walk-in anyway?" — only toggles selection
    if confirmed (exact same pattern as `ZoneSeatsPage` delete confirm)
  - Conflicts auto-refresh every 30 seconds via `staleTime`

- **`modules/pos/api/pos.api.ts`** — Renamed `seatIds` → `tableIds` in
  `CreateInvoiceRequest` and `CreateKotRequest`. Renamed `clearInvoiceSeats` →
  `clearInvoiceTables`, URL `/clear-seats` → `/clear-tables`

- **`modules/pos/pages/POSDashboard.tsx`** — Renamed all state and function references:
  `selectedSeatIds` → `selectedTableIds`, `handleSeatToggle` → `handleTableToggle`,
  `clearInvoiceSeats` → `clearInvoiceTables`, `seatIds` → `tableIds` in billing
  payloads, "Clear seats" → "Clear tables" button text

### Verification

- `tsc --noEmit` passes clean for all changed files (only pre-existing
  `AppSidebar.tsx` unused-import error remains)

---

## Task: Module 9 — Nav & routing

**Date:** 2026-07-12
**Prompt:** Continue with Module 9 of the floorplan restructure (nav-routing.md).

### What was done

Added the `/tables` sidebar link to make Module 5's TableListPage reachable from the
navigation, completing the floorplan restructure.

#### Files modified

- **`apps/restaurant-ui/src/components/layout/AppSidebar.tsx`**:
  - Added `Table` import from `lucide-react`
  - Added `{ to: '/tables', label: 'Tables', icon: Table }` to the "Operations" section,
    before the existing "Zones & Seating" link — so both are visually distinct

#### Not touched

- `routeTree.gen.ts` — auto-generated by TanStack Router plugin on next dev server start
- `/reservations` sidebar link already existed (was wired in Module 7)

### Verification

- `tsc --noEmit` passes clean for the sidebar change (only pre-existing errors remain)
