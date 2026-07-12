# Module 6: Physical stock count / reconciliation

See [`README.md`](./README.md) for full background/goal. Depends on:
[`ledger-integration_plan.md`](./ledger-integration_plan.md) (module 3) —
variances post through the same `adjustment_in/out` → ledger path.

## What

No stock-take/reconciliation flow exists today. Perishables like chicken
drift between book and physical quantity (moisture loss, imprecise
portioning, theft) — a count flow is how that drift gets found and
corrected without hand-editing `Inventory.currentStock` directly (which
would bypass the movement ledger entirely). Reuse the existing
`InventoryService.adjustStock` machinery for the actual correction —
don't invent a parallel stock-mutation path.

## Files

- **New** `apps/api/src/inventory/entities/stock-count.entity.ts`:
  ```ts
  @Entity('stock_counts')
  export class StockCount {
    id: string;
    countDate: Date;
    status: 'draft' | 'completed';
    createdBy: string | null;
  }

  @Entity('stock_count_lines')
  export class StockCountLine {
    id: string;
    stockCountId: string;
    itemId: string;
    systemQuantity: number;   // Inventory.currentStock snapshot when the line is added
    countedQuantity: number | null;  // null until physically counted
    variance: number | null;         // countedQuantity - systemQuantity, computed on complete
  }
  ```
- **New** `apps/api/src/inventory/services/stock-count.service.ts` —
  `StockCountService`:
  - `create(itemIds: string[], userId?: string)` — new `draft`
    `StockCount`, one `StockCountLine` per item with `systemQuantity`
    snapshotted from current `Inventory.currentStock`.
  - `submitCounts(stockCountId, lines: { lineId, countedQuantity }[])` —
    fills in `countedQuantity` on each line, computes `variance`. Doesn't
    post adjustments yet (allows re-counting before finalizing).
  - `complete(stockCountId)` — for each line with non-zero `variance`,
    call `InventoryService.adjustStock(itemId, variance > 0 ?
    ADJUSTMENT_IN : ADJUSTMENT_OUT, Math.abs(variance), ..., reference:
    'STOCKCOUNT-' + stockCountId)`. Sets `status: 'completed'`. Reject
    completing an already-completed count (idempotency, same concern as
    module 2's purchase receipt).
- **New** `apps/api/src/inventory/controllers/stock-count.controller.ts` —
  `POST /inventory/stock-counts`, `POST
  /inventory/stock-counts/:id/submit`, `POST
  /inventory/stock-counts/:id/complete`, `GET /inventory/stock-counts`,
  `GET /inventory/stock-counts/:id`.
- `apps/api/src/inventory/inventory.module.ts` — register the new
  entities/service/controller.
- Frontend: **new**
  `apps/restaurant-ui/src/modules/inventory/pages/StockCountPage.tsx` —
  pick items (or "all active items"), enter counted quantities against
  displayed system quantities, submit, review variances, complete. Add a
  nav entry near the existing Inventory page
  (`apps/restaurant-ui/src/components/layout/AppSidebar.tsx`).

## Verification

- `tsc --noEmit` in both apps.
- Create a count for 2-3 items, submit counts with a deliberate
  under-count and over-count, complete it — confirm `adjustment_out`
  posts for the short item and `adjustment_in` for the over-count item,
  each with the `STOCKCOUNT-<id>` reference, and both flow through to the
  Stock Adjustment ledger account (module 3).
- Confirm completing the same count twice is rejected.
- Manual walkthrough: `/inventory` → new stock-count entry point → full
  count → completed → `GET /inventory/:itemId/movements` shows the
  adjustment with correct before/after balances.
