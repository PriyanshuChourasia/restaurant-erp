# Module 5: Ledger integration (COGS, wastage expense, inventory valuation)

See [`README.md`](./README.md) for full background/goal and
[`data-model_plan.md`](./data-model_plan.md) for the underlying schema.
Depends on: [`purchase-receiving_plan.md`](./purchase-receiving_plan.md)
(module 4) — needs `purchase_in` movements to actually exist before they
can be posted to the ledger.

## What

Confirmed by grep: nothing in `inventory`, `purchases`, `sales`, or
`recipes` calls `LedgerService` (`apps/api/src/ledger/services/ledger.service.ts`).
Stock and money are two disconnected ledgers. Wire every `StockMovement`
to a matching double-entry-style posting so `Inventory Asset` balance and
`Σ(Inventory.currentStock × unitCost)` stay reconciled, and so wastage/
COGS are visible in the money ledger instead of only the stock ledger.

Chart-of-accounts additions (seeded once, referenced by name/id
thereafter):

| Account | Type | Purpose |
|---|---|---|
| Inventory Asset | Asset | Mirrors `Σ(currentStock × unitCost)` |
| COGS | Expense | Debited on `sale_out` |
| Purchase Payable | Liability | Credited on `purchase_in` |
| GST Input Credit | Asset | Split out of purchase tax |
| Wastage & Spoilage | Expense | Debited on `wastage` — kept separate from COGS so spoilage is visible in P&L, not hidden inside food cost % |
| Stock Adjustment | Expense/Income | Debited/credited on `adjustment_in/out` from stock counts |

Posting map (`MovementType` → ledger entries):

| MovementType | Debit | Credit |
|---|---|---|
| `purchase_in` | Inventory Asset (qty×unitCost) + GST Input Credit | Purchase Payable |
| `sale_out` | COGS | Inventory Asset |
| `wastage` | Wastage & Spoilage | Inventory Asset |
| `adjustment_in` | Inventory Asset | Stock Adjustment |
| `adjustment_out` | Stock Adjustment | Inventory Asset |
| `production_consumption` / `production_yield` | no P&L entry — value moves item→item, net zero | — |
| `transfer_in` / `transfer_out` | no net entry unless storage units (module 2) makes inter-store accounting real | — |

## Files

- `apps/api/src/database/database-seed.service.ts` — seed the six ledger
  accounts above via existing `LedgerService.createAccount`.
- `apps/api/src/inventory/services/inventory.service.ts` — inject
  `LedgerService`. Add a private `postLedgerForMovement(movement, item)`
  called from `adjustStock()` and the new `postPurchaseReceipt()`
  (module 4), mapping per the table above. `sale_out` and `wastage` use
  `movement.quantity * inv.unitCost` (the average cost at time of
  movement, **not** the sale price) for the ledger amount — this is the
  standard COGS-at-cost rule, don't accidentally use `Item.price`.
- `apps/api/src/inventory/inventory.module.ts` — import `LedgerModule`.
- `apps/api/src/recipes/services/recipes.service.ts` —
  `deductOnSale()` and `createProductionEntry()` currently call
  `inventoryRepo.save()`/`movementRepo.save()` directly instead of going
  through `InventoryService.adjustStock()` (confirmed at
  `recipes.service.ts:143-158` and `178-224`) — this bypasses the ledger
  hook added above. Refactor both to call `InventoryService` methods so
  there is exactly one place that posts stock movements and ledger
  entries, not two divergent code paths.
- `apps/api/src/sales/services/sales.service.ts:185-204` — same issue:
  the no-recipe fallback path builds `StockMovement` directly via
  `movementRepo.save()`. Refactor to call `InventoryService.adjustStock()`
  so it also gets the ledger posting for free instead of needing a third
  copy of the same logic.
- `apps/api/src/ledger/controllers/ledger.controller.ts` — new
  `GET /ledger/inventory-valuation` — returns
  `{ ledgerBalance: InventoryAsset.currentBalance, computedValuation: Σ(currentStock × unitCost) across all Inventory rows, diff }`.
  This is the standing health-check that proves the two ledgers haven't
  drifted; wire it into whatever admin/reporting page already exists
  (check `SettingsPage.tsx` / a reports module) rather than adding a new
  page for a single number.

## Verification

- `tsc --noEmit` in `apps/api`.
- After module 4's purchase-receipt test: confirm `GET /ledger/accounts`
  shows Inventory Asset and Purchase Payable moved by the correct amounts
  (including the GST split).
- Sell an item with a recipe and one without — confirm both post to COGS
  identically (proves the refactor removed the divergent code path, not
  just added a third one).
- Post a manual `wastage` adjustment — confirm Wastage & Spoilage account
  moves, not COGS.
- `GET /ledger/inventory-valuation` returns `diff: 0` after a sequence of
  purchase → sale → wastage operations.
