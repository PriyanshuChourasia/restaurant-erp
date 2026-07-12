# 2026-07-12 — Module 1: Zone cleanup — remove `sortOrder`

## Prompt

Follow floorplan/README.md and complete zone-cleanup.md.

## What was done

Implemented Module 1 of the Floor Plan Restructure (see `floorplan/README.md`):
removed the unused `sortOrder` field from the `Zone` entity everywhere on the
backend.

### Files changed

- **`apps/api/src/seating/entities/zone.entity.ts`**: Removed `sortOrder` column
  and `idx_zone_sort` index.
- **`apps/api/src/seating/dto/create-zone.dto.ts`**: Removed `sortOrder` field
  and its `IsInt`, `Min` validator imports.
- **`apps/api/src/seating/services/zones.service.ts`**: Removed `sortOrder`
  assignment from the `create()` method.
- **`apps/api/src/seating/repositories/zone.repository.ts`**: Changed `order`
  from `{ sortOrder: 'ASC', name: 'ASC' }` to `{ name: 'ASC' }`.

### Not touched (by design)

- **`update-zone.dto.ts`** — Automatically inherits from `CreateZoneDto` via
  `PartialType`, so no separate change needed.
- **Frontend** (`zone.types.ts`, `ZoneListPage.tsx`) — Left alone per the module
  spec; will be cleaned up in Module 6 (`zone-floorplan-ui.md`).

### Verification

- `tsc --noEmit` passes clean in `apps/api` — 0 TypeScript errors.
- No test specs reference `sortOrder` on Zone (no spec file existed for the
  zone repository or service).
