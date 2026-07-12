# 2026-07-12 — Module 5: Table Management UI (new module)

## Prompt

Continue with Module 5 of the floorplan restructure (table-management-ui.md).

## What was done

Created a new `apps/restaurant-ui/src/modules/tables/` frontend module with types,
API client, page component, and route file.

### Files created

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
