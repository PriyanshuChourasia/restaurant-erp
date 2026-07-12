# 2026-07-12 — Module 6: Zone floorplan UI

## Prompt

Continue with Module 6 of the floorplan restructure (zone-floorplan-ui.md).

## What was done

Major frontend restructure for the zones module: replaced fake Seat auto-grid with
a real draggable floor canvas using stored coordinates, removed `sortOrder` from the
frontend, changed the zone detail route from `/zones/$zoneId/seats` to `/zones/$zoneId`,
and updated the SeatingPanel used by POS.

### Files modified

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

### Files created

- **`routes/zones.$zoneId.tsx`** — New route for `/zones/$zoneId` → `ZoneFloorPlanPage`

### Files deleted

- `routes/zones.$zoneId.seats.tsx`
- `modules/zones/pages/ZoneSeatsPage.tsx`
- `modules/zones/components/SeatForm.tsx`
- `modules/zones/components/ZoneHeader.tsx`
- `modules/zones/components/SeatBlock.tsx`

### Bugs found & fixed during implementation

1. Removed unused `GripVertical` import from `TableBlock.tsx`
2. Removed unused `CreateTableRequest`/`UpdateTableRequest` imports from `zone.api.ts`
3. Removed unused `Table` type import from `ZoneFloorPlanPage.tsx`
4. Fixed `SeatingPanel` prop names in `POSDashboard.tsx`
5. Fixed `zoneKeys.tables` (a function) being used as a query key in `useUpdateTablePosition`

## Verification

- `tsc --noEmit` passes clean for all changed files (pre-existing errors in unrelated
  `SalesSummaryPage.tsx` remain unchanged)
- Route auto-discovered by TanStack Router codegen on next dev server start
