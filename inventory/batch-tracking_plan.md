# Module 6: Batch/lot tracking + FEFO

See [`README.md`](./README.md) for full background/goal and
[`data-model_plan.md`](./data-model_plan.md) for the full `stock_batches`
schema (including the `storageUnitId`/`parentBatchId` columns this module
implements). Depends on:
[`purchase-receiving_plan.md`](./purchase-receiving_plan.md) (module 4) —
batches are created at goods receipt; and
[`storage-units_plan.md`](./storage-units_plan.md) (module 2) — batches are
location-scoped from the start, not retrofitted later.

## What

No batch/lot/expiry concept exists anywhere (confirmed by grep — `batch`
only means "production batch quantity" today). For a perishable like
chicken this means no expiry alerts and no way to guarantee the oldest
delivery gets used first. Add per-receipt batches and make consumption
(sale, production) draw from them **First-Expiry-First-Out**, falling
back to oldest-received-first when there's no expiry date (non-perishable
raw items).

Note: batch tracking is for **traceability and pick order**, not for
costing — costing stays the moving-weighted-average from module 4/5.
Don't reintroduce FIFO costing here; that's a deliberate scope boundary.

## Files

- **New** `apps/api/src/inventory/entities/stock-batch.entity.ts`:
  ```ts
  @Entity('stock_batches')
  @Index(['itemId', 'storageUnitId', 'expiryDate'])
  export class StockBatch {
    id: string;
    itemId: string;
    storageUnitId: string;          // FK -> storage_units.id — which location physically holds this batch (module 2)
    purchaseId: string | null;      // traceability back to the GRN
    parentBatchId: string | null;   // FK -> stock_batches.id, self-ref — set when a transfer splits part of a batch to another storage unit
    batchNumber: string;            // e.g. "CHK-20260710-01"
    quantityReceived: number;
    quantityRemaining: number;
    unitCost: number;                // cost at receipt, for traceability (valuation still uses Inventory.unitCost avg)
    receivedDate: Date;
    expiryDate: Date | null;
    status: 'active' | 'exhausted' | 'expired' | 'written_off';
  }
  ```
  Transferring an entire batch to another storage unit updates
  `storageUnitId` in place (same goods, new location). Transferring part
  of a batch creates a new row at the destination with `parentBatchId`
  pointing at the source and decrements the source's `quantityRemaining` —
  see [`data-model_plan.md`](./data-model_plan.md)'s transfer/split rule.
- `apps/api/src/inventory/entities/inventory.entity.ts` — add nullable
  `batchId` column to `StockMovement` so every out-movement records which
  batch it drew from (in addition to the `storageUnitId` column added by
  module 2).
- `apps/api/src/items/entities/item.entity.ts` — add
  `shelfLifeDays: number | null` (nullable — non-perishables have none);
  used to compute `expiryDate = receivedDate + shelfLifeDays` at receipt.
- `apps/api/src/inventory/inventory.module.ts` — register `StockBatch`
  repository.
- `apps/api/src/inventory/services/inventory.service.ts`:
  - New `pickBatchesForConsumption(itemId, storageUnitId, quantity): Promise<{ batchId: string; quantity: number }[]>` —
    query active batches for the item **at that storage unit** ordered by
    `expiryDate ASC NULLS LAST, receivedDate ASC`, greedily allocate
    `quantity` across them (partial-batch draws allowed), throw if total
    available < requested (same "insufficient stock" guard as today, just
    batch-aware and location-scoped).
  - `postPurchaseReceipt()` (module 4) also creates the `StockBatch` row
    (`quantityReceived = quantityRemaining = convertedQty`, `expiryDate`
    from `item.shelfLifeDays`, `storageUnitId` from the receiving
    location).
  - `adjustStock()` for out-types calls `pickBatchesForConsumption` first,
    decrements each batch's `quantityRemaining`, flips `status:
    'exhausted'` at zero, and stamps `batchId` per resulting
    `StockMovement` row (may produce more than one movement row if a
    consumption spans batches — acceptable, mirrors how a real kitchen
    picks two half-empty trays).
- `apps/api/src/recipes/services/recipes.service.ts` —
  `deductOnSale`/`createProductionEntry` route their component deductions
  through `InventoryService` (already required by module 5's refactor) so
  they automatically get FEFO picking for free.
- **New** `apps/api/src/inventory/services/expiry-sweep.service.ts` — a
  `@Cron` (e.g. daily at 02:00, matching whatever scheduling approach
  `database-seed.service.ts` or existing services use — check for an
  existing `@nestjs/schedule` dependency before adding a new one) job:
  finds batches with `expiryDate < now` and `quantityRemaining > 0`,
  writes them off via `adjustStock(itemId, WASTAGE, quantityRemaining,
  ...)` (reason `expired`, wired in module 7) and sets `status: 'expired'`.
- `apps/api/src/inventory/controllers/inventory.controller.ts` — add
  `GET /inventory/:itemId/batches` (active batches + remaining qty +
  expiry) and `GET /inventory/near-expiry?days=2` (cross-item, for a
  dashboard widget).

## Verification

- `tsc --noEmit` in `apps/api`.
- Receive two purchases of the same item on different dates with
  different expiry dates; consume a quantity that spans both — confirm
  the older-expiry batch is drawn down first and `StockMovement.batchId`
  is set correctly on each resulting row.
- Manually backdate a batch's `expiryDate` (or set a very short
  `shelfLifeDays` in a test) and trigger the expiry sweep — confirm it
  posts a `wastage` movement and the batch flips to `expired`, and that
  double-running the sweep doesn't write it off twice.
- `GET /inventory/near-expiry?days=2` returns the right batches.
