# Module 1: Zone cleanup — remove `sortOrder`

See [`README.md`](./README.md) for full background/goal. Depends on: —

## What

`Zone.sortOrder` is a required-feeling field nobody actually needs — zones
should just sort alphabetically by name. Remove it everywhere.

## Files

- `apps/api/src/seating/entities/zone.entity.ts`: remove the `sortOrder`
  column and the `idx_zone_sort` index.
- `apps/api/src/seating/dto/create-zone.dto.ts`: remove `sortOrder`.
- `apps/api/src/seating/dto/update-zone.dto.ts`: remove `sortOrder` (it's a
  `PartialType` of create, so this follows automatically once create is
  fixed — just confirm no separate override exists).
- `apps/api/src/seating/services/zones.service.ts` /
  `apps/api/src/seating/repositories/zone.repository.ts`: drop any
  `sortOrder`-based `ORDER BY`, replace with `order: { name: 'ASC' }`.

## Frontend follow-up

This module only touches the backend. The frontend `Zone` type and
`ZoneListPage.tsx` form still reference `sortOrder` — those are cleaned up
in [`zone-floorplan-ui.md`](./zone-floorplan-ui.md) (module 6) alongside
the `Seat` → `Table` rename, so the frontend isn't touched twice. Don't
remove the frontend references yet as part of this module — leave them
working against the old shape until module 6, or the zone list page will
break if this ships alone before the frontend catches up. If shipping this
module standalone, make `sortOrder` optional-and-ignored in the DTOs
temporarily rather than a hard removal, OR just land modules 1 and 6
together.

## Verification

- `apps/api`: `tsc --noEmit`, confirm `zones.service.spec.ts` (if present)
  doesn't reference `sortOrder`.
- `GET /zones` returns zones sorted by name, no `sortOrder` field in the
  response.
