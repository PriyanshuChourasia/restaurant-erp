# Module 4: Purchases → Inventory wiring (GRN posts stock)

See [`README.md`](./README.md) for full background/goal and
[`data-model_plan.md`](./data-model_plan.md) for the underlying schema.
Depends on: [`units_plan.md`](./units_plan.md) (module 1) for unit
conversion when `purchaseUnit !== unit`, and
[`storage-units_plan.md`](./storage-units_plan.md) (module 2) — receipts
post stock at a specific storage unit, not implicitly "the item's stock".

## What

Confirmed by reading `apps/api/src/purchases/services/purchases.service.ts`:
`create()` builds the commercial document (`Purchase`/`PurchaseItem`, GST
totals) and `updateStatus()` just flips the `status` enum column — neither
touches `Inventory` or `StockMovement`. A chicken delivery marked
`RECEIVED` today does not add a single gram to stock. This is the
single biggest gap in the whole plan and should ship before anything else.

Add a real goods-receipt step that:
1. Converts each purchase line to the item's base unit (module 1).
2. Posts a `purchase_in` `StockMovement` via the existing
   `InventoryService` machinery (don't bypass it — reuse
   `balanceBefore`/`balanceAfter` bookkeeping).
3. Recomputes `Inventory.unitCost` as a moving weighted average instead of
   leaving it static:
   ```
   new_avg_cost = (existing_qty * existing_avg_cost + received_qty * received_unit_cost)
                  / (existing_qty + received_qty)
   ```
4. Runs steps 1–3 (plus batch creation in module 6, ledger posting in
   module 5) inside one `DataSource.transaction`, following the exact
   pattern already used in `RecipesService.createProductionEntry`
   (`apps/api/src/recipes/services/recipes.service.ts:170-234`).

## Files

- `apps/api/src/purchases/entities/purchase.entity.ts` — add
  `PurchaseStatus.RECEIVED` transition guard: only `ORDERED → RECEIVED`
  should trigger the receipt logic (not `DRAFT → RECEIVED` directly, and
  not re-triggerable once already `RECEIVED`).
- `apps/api/src/purchases/services/purchases.service.ts`:
  - New method `receive(id: string, userId?: string)`:
    - Load the purchase with its items; throw if already `RECEIVED` or
      `CANCELLED`.
    - For each `PurchaseItem`, convert `quantity` from the item's
      `purchaseUnit` to `unit` via `UnitsService.convert`.
    - Call a new `InventoryService.postPurchaseReceipt(itemId, storageUnitId, convertedQty, unitPrice)`
      (see below) instead of the generic `adjustStock` (which doesn't
      touch `unitCost`). `storageUnitId` defaults to
      `StorageUnitsService.findDefault().id` unless the purchase specifies
      a receiving location (module 2).
    - Set `status = RECEIVED`.
    - Wrap in `this.dataSource.transaction(...)`.
  - Inject `UnitsService`, `InventoryService`, `DataSource`.
- `apps/api/src/purchases/controllers/purchases.controller.ts` — new
  `PATCH /purchases/:id/receive` route calling `receive()`. Keep the
  existing generic `PATCH /purchases/:id/status` for `CANCELLED`/`DRAFT`
  transitions, but route `RECEIVED` specifically through `/receive` (or
  have the existing status-update handler internally call `receive()`
  when the target status is `RECEIVED` — pick whichever keeps one code
  path; don't let both exist and diverge).
- `apps/api/src/inventory/services/inventory.service.ts` — new method
  `postPurchaseReceipt(itemId, storageUnitId, quantity, unitCost)`:
  - Load or create the `Inventory` row for that `(itemId, storageUnitId)`
    pair (mirror the existing `setOpeningBalance`/`declareOpeningStock`
    create-if-missing pattern).
  - Compute the weighted average per the formula above (scoped to that
    storage unit's existing quantity/cost, not the item's global total).
  - Update `currentStock += quantity`, `unitCost = newAvgCost`.
  - Save, then create the `StockMovement` (`type: PURCHASE_IN`,
    `storageUnitId`, `reference: purchase.purchaseNumber`).
  - Return the updated `Inventory` row (callers in modules 5/6 need it for
    ledger posting / batch creation amounts).
- `apps/api/src/purchases/purchases.module.ts` — import `InventoryModule`
  and `UnitsModule` (mirrors how `SalesModule` already imports
  `RecipesModule` per the existing codebase pattern).

## Verification

- `tsc --noEmit` in `apps/api`.
- Update/extend `purchases.service.spec.ts` (currently has no
  inventory-related mocks) with `InventoryService`/`UnitsService` mocks
  for the new `receive()` method.
- Manual: create a purchase for an item with existing stock at a
  different cost, mark it received via `PATCH /purchases/:id/receive`,
  confirm `GET /inventory/:itemId` shows the correctly weighted
  `unitCost` and increased `currentStock`, and `GET
  /inventory/:itemId/movements` shows the new `purchase_in` row with
  correct `balanceBefore`/`balanceAfter`.
- Confirm calling `/receive` twice on the same purchase is rejected
  (idempotency — don't double-post stock on a retry/double-click).
