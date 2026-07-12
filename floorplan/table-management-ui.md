# Module 5: Table Management UI (new module, bottom layer)

See [`README.md`](./README.md) for full background/goal. Depends on:
[`table-entity.md`](./table-entity.md) (module 2).

## What

The bottom-up starting point: a flat page where tables get created
standalone, no zone required. This is what makes "create tables first,
group into zones later" possible in the UI.

## Files

New `apps/restaurant-ui/src/modules/tables/`, mirroring the existing
`modules/zones/api/zone.api.ts` axios-client pattern:

- `api/table.api.ts`: `getTables()`, `getTable(id)`, `createTable()`,
  `updateTable()`, `updateTableStatus()`, `updateTablePosition()`,
  `assignTableToZone(id, zoneId | null)`, `deleteTable()` — hitting the
  `/tables` endpoints from module 2.
- `types/table.types.ts`: `Table` (id, zoneId, label, capacity, category,
  status, posX, posY, isActive, timestamps), request types.
- `pages/TableListPage.tsx`: flat CRUD list of all tables — label,
  capacity, status, and a zone dropdown (assign/reassign, including
  "Unassigned"). Bulk-select + "Assign to zone" action (calls
  `PATCH /tables/:id/zone` per selected id). Follow the same
  list/form/mutation structure as `modules/zones/pages/ZoneListPage.tsx`
  (useQuery + useMutation + `queryClient.invalidateQueries`).
- Route: `apps/restaurant-ui/src/routes/tables.tsx` →
  `createFileRoute('/tables')({ component: TableListPage })` (same
  pattern as `routes/zones.tsx`).

## Verification

- `tsc --noEmit`.
- Manually: create a table with no zone selected — it appears in the list
  with "Unassigned". Assign it to an existing zone via the dropdown or
  bulk action — it updates.
