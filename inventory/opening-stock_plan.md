# Module 3: Opening Stock (one-time, tracked initial balance)

See [`README.md`](./README.md) for full background/goal and
[`data-model_plan.md`](./data-model_plan.md) for the full `OpeningStockEntry`
schema (columns, unique constraint, relations). Depends on:
[`units_plan.md`](./units_plan.md) (module 1),
[`storage-units_plan.md`](./storage-units_plan.md) (module 2).

## What

Today "opening stock" isn't its own concept — it's whatever
`InventoryService.setOpeningBalance(itemId, quantity, unitCost)` happens to
write. Confirmed by reading `apps/api/src/inventory/services/inventory.service.ts:38-55`:

```ts
async setOpeningBalance(itemId: string, quantity: number, unitCost: number) {
  let inv = await this.repo.findOne({ where: { itemId } });
  if (!inv) {
    inv = this.repo.create({ itemId, openingBalance: quantity, currentStock: quantity, unitCost, minStockLevel: 0 });
  } else {
    inv.openingBalance = quantity;
    inv.currentStock = quantity;
    inv.unitCost = unitCost;
  }
  // ...always writes a fresh OPENING_BALANCE StockMovement, even the 2nd/3rd time
}
```

This has two real problems, not just a naming gap:

1. **Callable more than once, silently.** A second call on an item that's
   already been trading for weeks overwrites `currentStock` back down to
   whatever quantity is passed — it doesn't add, it *replaces* — and posts
   another `OPENING_BALANCE` movement as if the item were being opened for
   the first time again. There's no guard.
2. **No structured record of *when* or *why* stock was opened.** "As of
   what date is this restaurant's opening stock declared?" and "was this
   item added after go-live, with its own later opening date?" aren't
   answerable — only inferable by eyeballing `stock_movements` for rows
   typed `OPENING_BALANCE`, which per problem 1 might not even mean what
   they say.

Add a dedicated `OpeningStockEntry` table (per
[`data-model_plan.md`](./data-model_plan.md)) that makes declaring opening
stock a one-time, constrained event per `(item, storage unit)`. Correcting
a wrong opening quantity after the fact goes through the existing
`adjustment_in`/`adjustment_out` movement types — the same principle
[`stock-count_plan.md`](./stock-count_plan.md) already applies to physical
count variances — not a second opening declaration.

## Files

- **New**
  `apps/api/src/inventory/entities/opening-stock-entry.entity.ts`:
  ```ts
  @Entity('opening_stock_entries')
  @Unique(['itemId', 'storageUnitId'])
  export class OpeningStockEntry {
    id!: string;
    itemId!: string;               // FK -> items.id
    storageUnitId!: string;        // FK -> storage_units.id
    quantity!: number;
    unitCost!: number;
    asOfDate!: Date;
    stockMovementId!: string;      // FK -> stock_movements.id (1:1, the OPENING_BALANCE row this created)
    createdBy!: string | null;
    createdAt!: Date;
  }
  ```
- `apps/api/src/inventory/services/inventory.service.ts`:
  - Rename the existing behavior into two distinct methods instead of one
    overloaded one:
    - `declareOpeningStock(itemId, storageUnitId, quantity, unitCost,
      asOfDate, userId?)` — throws `ConflictException` if an
      `OpeningStockEntry` already exists for that `(itemId,
      storageUnitId)` pair (the DB unique constraint is the backstop;
      check first for a clean 409 instead of relying on the DB error).
      Creates the `Inventory` row if missing (mirrors today's
      create-if-missing pattern), sets `openingBalance`/`currentStock`/
      `unitCost`, posts the `OPENING_BALANCE` `StockMovement`, then creates
      the `OpeningStockEntry` row pointing at that movement — all inside
      one `DataSource.transaction`.
    - Keep `setOpeningBalance` as a thin deprecated wrapper that calls
      `declareOpeningStock` with `asOfDate: new Date()` **only if no entry
      exists yet**, otherwise throws — so any caller still using the old
      name gets the new safety instead of silently regressing. Update
      call sites (`inventory.controller.ts`, any seed script) to call
      `declareOpeningStock` directly with an explicit `asOfDate`.
  - New `getOpeningStock(itemId, storageUnitId)` — returns the
    `OpeningStockEntry` or `null` (used by the frontend to know whether to
    show "Set Opening Balance" vs. a read-only "Opened on <date>" state).
- `apps/api/src/inventory/entities/inventory.entity.ts` — no column
  changes needed here; `Inventory.openingBalance` remains as a
  denormalized convenience column (fast read without a join), kept in sync
  by `declareOpeningStock` only, never by `adjustStock`.
- `apps/api/src/inventory/controllers/inventory.controller.ts`:
  - `POST /inventory/:itemId/opening-stock` (body: `storageUnitId,
    quantity, unitCost, asOfDate`) → `declareOpeningStock`. Returns 409 if
    already declared for that item/location.
  - `GET /inventory/:itemId/opening-stock?storageUnitId=` →
    `getOpeningStock`.
- `apps/api/src/inventory/inventory.module.ts` — register the
  `OpeningStockEntry` entity/repository.
- Frontend: `apps/restaurant-ui/src/modules/inventory/dialogs/AddInventoryItemDialog.tsx`
  (the existing opening-balance form, from
  `.project/tasks/inventory_group.md`'s "fix inventory actions" work) —
  once an item already has a declared opening entry for the selected
  storage unit, replace the editable quantity/cost fields with a read-only
  "Opened on <asOfDate> — 50 units @ ₹120" summary and point the user at
  "Adjust Stock" instead of letting them resubmit the opening form.

## Verification

- `tsc --noEmit` in `apps/api`.
- Declare opening stock for an item at the default storage unit — confirm
  `Inventory.currentStock`/`openingBalance` are set, an `OPENING_BALANCE`
  `StockMovement` exists, and an `OpeningStockEntry` row links to it.
- Attempt to declare opening stock a second time for the same `(item,
  storage unit)` — confirm it's rejected with 409, and that
  `Inventory.currentStock` is **unchanged** by the rejected attempt (proves
  it didn't partially apply before failing).
- Declare opening stock for the same item at a *different* storage unit —
  confirm it succeeds independently (the unique constraint is per-pair, not
  per-item).
- `GET /inventory/:itemId/opening-stock` returns `null` before declaration
  and the full entry after.
- Manual walkthrough: `/inventory` → Add Item → set opening balance →
  reopen the same item's dialog — confirm it now shows the read-only
  "already opened" summary instead of an editable form.
