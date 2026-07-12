# Module 7: Multi-location stock (lowest priority, only if needed)

See [`README.md`](./README.md) for full background/goal. Depends on:
[`ledger-integration_plan.md`](./ledger-integration_plan.md) (module 3),
[`batch-tracking_plan.md`](./batch-tracking_plan.md) (module 4).

## What

`MovementType.TRANSFER_IN`/`TRANSFER_OUT` already exist in
`apps/api/src/inventory/entities/inventory.entity.ts` but nothing
populates them — confirmed by grep. Right now `Inventory` is one row per
item globally; there's no concept of "central store" vs. "kitchen line"
stock. If a restaurant needs to know that chicken has already moved from
the walk-in fridge to the kitchen prep station (and therefore isn't
available for a different kitchen line's dish), this module is needed.
**Do not build this speculatively** — confirm with the user it's an
actual requirement before starting; it's the largest schema change of the
plan (every `Inventory`/`StockMovement` row gains a location dimension)
and the earlier modules deliver most of the value without it.

The repo already has zone/seating concepts
(`apps/api/src/seating/entities/zone.entity.ts`) for *dining* areas —
storage locations are a different concept and should **not** reuse the
`Zone` entity; a "central store" isn't a seating zone.

## Files (if greenlit)

- **New** `apps/api/src/inventory/entities/stock-location.entity.ts` —
  simple `StockLocation` (id, name, isActive) — e.g. "Central Store",
  "Kitchen Line 1".
- `apps/api/src/inventory/entities/inventory.entity.ts` — add
  `locationId` to `Inventory` (unique index on `[itemId, locationId]`
  instead of just `[itemId]`) and to `StockMovement`. This changes every
  existing query in `InventoryService` (`findByItem`, `adjustStock`,
  `getLowStock`, etc.) from "the item's stock" to "the item's stock at a
  location" — audit every call site, including `RecipesService` and
  `SalesService`'s direct-deduction fallback, since they currently assume
  one `Inventory` row per item.
- `apps/api/src/inventory/services/inventory.service.ts` — new
  `transferStock(itemId, fromLocationId, toLocationId, quantity)` posting
  paired `TRANSFER_OUT`/`TRANSFER_IN` movements atomically.
- Decide default location assignment for existing/new purchases (module
  2's `receive()` needs a `locationId`, e.g. always "Central Store" unless
  specified) and for recipe/production consumption (which location's
  stock does a kitchen line draw from?).
- Frontend: location selector across `InventoryPage.tsx`, purchase
  receiving UI, and the POS/KOT flows if line-level stock visibility
  matters there too.

## Verification

- `tsc --noEmit` in both apps.
- Transfer stock between two locations — confirm both movements post
  atomically (either both succeed or neither does) and per-location
  `Inventory.currentStock` is correct on each side.
- Confirm every pre-existing single-location query path (low-stock
  report, movement history, recipe deduction) still returns sane results
  once `Inventory` is keyed by `(itemId, locationId)` instead of just
  `itemId` — this is the highest-risk regression surface in the whole
  plan, since it touches every earlier module's code.
