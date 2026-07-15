# Module 2: Storage Units (physical stock locations)

See [`README.md`](./README.md) for full background/goal and
[`data-model_plan.md`](./data-model_plan.md) for the full schema this
module implements (`storage_units` table, the `storage_unit_id` FK added to
`inventory`/`stock_movements`/`stock_batches`/`opening_stock_entries`,
cardinalities, and the non-breaking rollout plan). Depends on:
[`data-model_plan.md`](./data-model_plan.md) (module 0).

This module **supersedes and folds in** the old `multi-location_plan.md`,
which treated location tracking as "lowest priority, only if needed" and
warned it was the largest, riskiest schema change in the whole plan because
nothing else was built with a location dimension in mind. That risk is
gone once storage units are part of the schema from module 0 onward — every
later module (purchase receiving, batch tracking, wastage, stock count) is
implemented against `(item_id, storage_unit_id)` from the start rather than
needing a retrofit. This module is therefore promoted to Phase 1, not
deferred.

## What

Add a `StorageUnit` master entity (e.g. "Central Store", "Kitchen Line 1",
"Walk-in Fridge", "Bar Counter") and make it the location dimension for all
stock-bearing tables. `MovementType.TRANSFER_IN`/`TRANSFER_OUT` already
exist in `apps/api/src/inventory/entities/inventory.entity.ts` but nothing
populates them today (confirmed by grep) — this module is what finally
gives them a purpose.

**Explicitly distinct from `zones`**
(`apps/api/src/seating/entities/zone.entity.ts`). Zones/tables model where
*guests* sit; storage units model where *stock* physically lives. Do not
reuse or merge the two entities — a "Central Store" is never a seating
zone.

**Non-breaking by construction**: a single `is_default = true` "Main Store"
`StorageUnit` is seeded before any inventory data exists. Every write path
defaults to it unless a caller explicitly picks a different location, so
day-one behavior is identical to the current single-location system. A
second location only needs to be created — and a location picker only
needs to appear in the UI — once multi-location is a real, confirmed
requirement.

## Files

- **New** `apps/api/src/inventory/entities/storage-unit.entity.ts`:
  ```ts
  export enum StorageUnitType { STORE = 'store', KITCHEN = 'kitchen', BAR = 'bar', COLD_STORAGE = 'cold_storage', OTHER = 'other' }

  @Entity('storage_units')
  @Index('idx_storage_unit_code', ['code'], { unique: true })
  @Index('idx_storage_unit_active', ['isActive'])
  export class StorageUnit {
    id!: string;
    name!: string;
    code!: string;
    type!: StorageUnitType;
    isDefault!: boolean;
    isActive!: boolean;
    createdAt!: Date;
    updatedAt!: Date;
  }
  ```
- `apps/api/src/inventory/entities/inventory.entity.ts`:
  - `Inventory` — add `storageUnitId: string` (FK → `storage_units.id`,
    not null). Change the unique constraint from `itemId` alone to
    `@Unique(['itemId', 'storageUnitId'])`; add
    `@Index('idx_inventory_storage_unit', ['storageUnitId'])`.
  - `StockMovement` — add `storageUnitId: string` (FK, not null) and
    `transferGroupId: string | null` (uuid, no FK — a shared correlation
    value linking a `TRANSFER_OUT` row to its paired `TRANSFER_IN` row, per
    `data-model_plan.md`'s rationale for not adding a separate `transfers`
    table).
- **New**
  `apps/api/src/inventory/repositories/storage-unit.repository.ts` —
  standard CRUD + `findDefault()` (throws if none/more than one row has
  `isDefault: true` — this should never happen but fail loud if it does,
  since every default-location write path depends on exactly one existing).
- **New** `apps/api/src/inventory/services/storage-units.service.ts` —
  `StorageUnitsService`: CRUD with a guard preventing more than one
  `isDefault: true` row (setting a new default must atomically clear the
  old one, same transactional pattern as `PriceLevelsService.setDefault()`
  in `apps/api/src/price-levels/`) and preventing deactivation of the
  current default.
- **New** `apps/api/src/inventory/services/inventory.service.ts` changes:
  - Every method signature that currently takes `itemId` alone
    (`findByItem`, `setOpeningBalance`, `adjustStock`, `getLowStock`,
    `getMovements`) gains a `storageUnitId` parameter, defaulting to
    `StorageUnitsService.findDefault().id` when the caller doesn't specify
    one — so existing call sites in `purchases`, `sales`, `recipes`, and
    the inventory controller keep compiling and behaving identically
    without every call site needing to change in this module.
  - New `transferStock(itemId, fromStorageUnitId, toStorageUnitId,
    quantity, reference?)`: wraps a paired `TRANSFER_OUT` (source) +
    `TRANSFER_IN` (destination) `adjustStock` call in one
    `DataSource.transaction`, both rows sharing a freshly generated
    `transferGroupId` (uuid v4). Rejects if `fromStorageUnitId ===
    toStorageUnitId` and if the source doesn't have enough stock (existing
    "insufficient stock" guard, now evaluated against the source location's
    `Inventory` row).
- **New**
  `apps/api/src/inventory/controllers/storage-units.controller.ts` —
  `GET /storage-units`, `POST /storage-units`, `PATCH
  /storage-units/:id`, `PATCH /storage-units/:id/set-default`, `DELETE
  /storage-units/:id` (soft-deactivate, not hard delete — matches the
  `isActive` toggle pattern used by `Zone`/`Table`).
- `apps/api/src/inventory/controllers/inventory.controller.ts` — every
  route gains an optional `storageUnitId` query/body param, and a new
  `POST /inventory/transfer` route calling `transferStock()`.
- `apps/api/src/inventory/inventory.module.ts` — register `StorageUnit`
  entity, `StorageUnitRepository`, `StorageUnitsService`,
  `StorageUnitsController`; export `StorageUnitsService` for
  `purchases`/`recipes`/`sales` to resolve a default location where needed.
- `apps/api/src/database/database-seed.service.ts` — seed the single
  `Main Store` `StorageUnit` (`isDefault: true`) **before** any
  `Inventory`/`StockMovement`/opening-stock seed data, matching the
  Rollout order in `data-model_plan.md`.
- Frontend: **new**
  `apps/restaurant-ui/src/modules/inventory/pages/StorageUnitsPage.tsx` —
  simple CRUD list (name, code, type, default toggle, active toggle),
  following the same TanStack Query list-page pattern as
  `ZoneListPage.tsx`/`TableListPage.tsx`. Not required for the frontend to
  show a location picker everywhere yet — with only one `StorageUnit`
  seeded, existing pages (`InventoryPage.tsx`, purchase receiving) can
  keep omitting a location selector; it only becomes necessary once a
  second location is actually created.

## Verification

- `tsc --noEmit` in `apps/api`.
- With only the seeded "Main Store" present: every existing
  inventory/purchase/sale/wastage flow (from earlier task work — see
  `.project/tasks/inventory_group.md`, `.project/tasks/pos-billing_group.md`)
  behaves identically to before this module — confirms the default-location
  fallback works and the rollout is non-breaking.
- Create a second `StorageUnit` ("Kitchen Line 1"), call `POST
  /inventory/transfer` moving stock from Main Store to it — confirm both
  `TRANSFER_OUT`/`TRANSFER_IN` `StockMovement` rows post atomically (either
  both succeed or neither does, verified by forcing a failure mid-transfer
  in a test), share the same `transferGroupId`, and per-location
  `Inventory.currentStock` is correct on each side.
- Attempt to set two `StorageUnit`s as default — confirm the service
  rejects it (or atomically clears the previous default, per whichever
  behavior is implemented — pick one and test it, don't leave it
  ambiguous).
- Attempt to deactivate the current default `StorageUnit` — confirm it's
  rejected.
- `GET /inventory/:itemId` with no `storageUnitId` still returns the
  Main Store row (backward-compatible default behavior for any existing
  frontend call site that hasn't been updated to pass a location).
