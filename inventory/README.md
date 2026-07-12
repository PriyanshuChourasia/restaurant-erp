# Stock Management Restructure — Module Index

## Background

This is a NestJS (`apps/api`) + React/TanStack Router (`apps/restaurant-ui`)
restaurant ERP monorepo. Raw/unfinished items (e.g. **chicken**) break the
current inventory model in specific, confirmed ways:

- **`apps/api/src/items/entities/item.entity.ts`** — `Item.unit` is a single
  `ItemUnit` enum value per item. There is no distinction between the unit a
  supplier bills in (e.g. whole birds) and the unit stock/recipes use (kg),
  and no conversion table exists anywhere in the repo (confirmed by grep —
  `unit` fields are free enum values, never converted).
- **`apps/api/src/inventory/entities/inventory.entity.ts`** — `Inventory`
  (one row per item: `openingBalance`, `currentStock`, `minStockLevel`,
  `unitCost`, `status`) and `StockMovement` (append-only ledger with
  `MovementType`: `opening_balance`, `purchase_in`, `sale_out`,
  `adjustment_in/out`, `wastage`, `transfer_in/out`,
  `production_consumption`, `production_yield`). This **is** already a
  perpetual-inventory system — every change goes through
  `InventoryService.adjustStock()` and is logged with
  `balanceBefore`/`balanceAfter`. Keep this pattern; extend it, don't
  replace it.
- **`apps/api/src/recipes/`** — `Recipe` (output item + yield qty/unit),
  `RecipeIngredient` (component item + qty/unit), `ProductionEntry` (batch
  log). `RecipesService.createProductionEntry()` already deducts raw
  components and credits yielded semi-finished stock as two
  `StockMovement` rows — this is the trim/prep step for chicken, already
  half-built. `RecipesService.deductOnSale()` already deducts recipe
  components at sale time; `SalesService.create()`
  (`apps/api/src/sales/services/sales.service.ts:178-205`) calls it and
  falls back to a **second, separate** direct-deduction code path
  (duplicated `SALE_OUT` movement logic) when an item has no recipe.
- **`apps/api/src/purchases/services/purchases.service.ts`** — confirmed by
  reading the file: `create()` and `updateStatus()` **never call
  `InventoryService` or touch `Inventory`/`StockMovement` at all**.
  Receiving a chicken delivery today does not move stock.
- **`apps/api/src/ledger/`** — generic `LedgerAccount`/`LedgerEntry`
  (credit/debit, category enum incl. `purchase`, `sales`, `expense`).
  Confirmed by grep: **nothing in `inventory`, `purchases`, `sales`, or
  `recipes` calls `LedgerService`**. Stock movements and money movements
  are two disconnected ledgers today — a bag of chicken can rot
  (`wastage`) and it never becomes an expense anywhere in `ledger`.
- **No batch/lot/expiry concept anywhere** (confirmed by grep — `batch`
  only appears as "production batch quantity", not a stock lot). No
  FEFO, no expiry alerts, no way to know *which* delivery of chicken is
  about to go off.
- **Costing drift**: `Inventory.unitCost` is set once at opening balance
  and never recalculated on purchase (no weighted-average recompute
  anywhere). `Item.costPrice` is instead recomputed recursively from
  recipes (`RecipesService.computeCost`). Two different costing sources
  exist today and can silently diverge.
- No DB migration tooling exists in this repo (confirmed: no `migrations/`
  folder, no `migration:*` scripts in `apps/api/package.json`).
  `apps/api/src/app.module.ts` sets
  `synchronize: process.env.NODE_ENV !== 'production'`, so entity/schema
  changes apply automatically on next dev server start. Flag to the user
  before running that existing dev data (inventory rows, purchases) may
  need re-seeding across the column/entity additions below.

## Goal

Turn the existing perpetual-inventory skeleton into a system that can
correctly answer, for a perishable raw material like chicken:

1. What unit did we buy it in vs. what unit do we cook/sell it in, and can
   the system convert between them instead of trusting a free-text unit
   string? → **[`units_plan.md`](./units_plan.md)**
2. Does receiving a purchase actually put stock on the shelf, at a
   correctly-averaged cost? → **[`purchase-receiving_plan.md`](./purchase-receiving_plan.md)**
3. Does every stock movement (purchase, sale, wastage, production) have a
   matching money-side ledger entry, so food cost % and inventory
   valuation are trustworthy? → **[`ledger-integration_plan.md`](./ledger-integration_plan.md)**
4. Which physical delivery is this stock from, and when does it expire —
   picked oldest-expiry-first? → **[`batch-tracking_plan.md`](./batch-tracking_plan.md)**
5. When trim/prep loses 30% of a whole chicken to bone and skin, is that
   loss visible and costed, or does it silently vanish? → **[`wastage-tracking_plan.md`](./wastage-tracking_plan.md)**
6. When the book quantity and the physical count disagree, is there a real
   reconciliation flow? → **[`stock-count_plan.md`](./stock-count_plan.md)**
7. (Lower priority) Does stock live in one place, or does a central store /
   kitchen-line split matter? → **[`multi-location_plan.md`](./multi-location_plan.md)**

## Modules

Each module file is self-contained — full "what/files/verification" to be
handed off and implemented on its own. Do them roughly in this order;
later modules depend on earlier ones (noted as "Depends on" in each file).
Phase labels match priority: **Phase 1 closes the money gap** (purchases
never move stock, wastage never hits the books) — do this before any of
the nicer-to-have batch/expiry work.

| # | Phase | Module file | Depends on | What it does |
|---|---|---|---|---|
| 1 | 1 | [`units_plan.md`](./units_plan.md) | — | `UnitConversion` master + `purchaseUnit` on `Item`; foundational, small |
| 2 | 1 | [`purchase-receiving_plan.md`](./purchase-receiving_plan.md) | 1 | GRN actually posts `purchase_in` stock movements + weighted-average cost |
| 3 | 1 | [`ledger-integration_plan.md`](./ledger-integration_plan.md) | 2 | Every `StockMovement` gets a matching `LedgerEntry` (COGS, wastage expense, inventory asset) |
| 4 | 2 | [`batch-tracking_plan.md`](./batch-tracking_plan.md) | 2 | `StockBatch` (lot + expiry) + FEFO picking on consumption |
| 5 | 2 | [`wastage-tracking_plan.md`](./wastage-tracking_plan.md) | 3, 4 | Reasoned wastage (`trim_loss`, `expired`, ...) + auto-post production shrinkage instead of silently dropping it |
| 6 | 3 | [`stock-count_plan.md`](./stock-count_plan.md) | 3 | Physical stock count → variance → `adjustment_in/out` reconciliation |
| 7 | 3 | [`multi-location_plan.md`](./multi-location_plan.md) | 3, 4 | Per-location `Inventory` rows (central store vs. kitchen line), only if multi-store becomes a real requirement |

## Worked example (chicken, referenced from every module)

20 kg whole chicken purchased @ ₹180/kg, existing stock 5 kg @ ₹175 avg:

1. **Receive** (module 2): weighted avg cost = `(5×175 + 20×180)/25 = ₹179`.
   `StockBatch CHK-20260710-01`, expiry `2026-07-13`. Ledger (module 3):
   Debit Inventory Asset ₹3,600 + GST Input ₹180, Credit Purchase Payable
   ₹3,780.
2. **Trim** (existing `RecipesService.createProductionEntry`, extended by
   module 5): 20 kg whole → 14 kg boneless (70% yield). The missing 6 kg
   auto-posts as `wastage`/`trim_loss` → Debit Wastage & Spoilage
   `6 × 179 = ₹1,074`, instead of vanishing between two movement rows as
   it does today.
3. **Sale** (existing `RecipesService.deductOnSale`, extended by module 4
   for FEFO batch picking): 1 "Butter Chicken" plate needs 180 g boneless
   → drawn from the oldest batch, cost `0.18 × 255.71 = ₹46.03`. Ledger:
   Debit COGS ₹46.03, Credit Inventory Asset ₹46.03.
4. **Expiry sweep** (module 4): any batch past `expiryDate` with
   `quantityRemaining > 0` auto-writes off as `wastage`/`expired`.
5. **Stock count** (module 6): physical count 0.3 kg short → posts
   `adjustment_out`, booked to a Stock Adjustment expense account.

At every step, `Σ(Inventory.currentStock × unitCost)` should reconcile to
the Inventory Asset ledger balance — build the reconciliation check
(`GET /ledger/inventory-valuation`, module 3) as a standing health check,
not a one-off.

## Cross-module verification (after modules 1–6 land)

- `apps/api`: `tsc --noEmit`; run/update `purchases.service.spec.ts`,
  `inventory.service.spec.ts`, `sales.service.spec.ts`,
  `kot.service.spec.ts` for any new required mocks (`UnitsService`,
  `LedgerService`, batch repos).
- Manual walkthrough via the dev server, using the chicken numbers above:
  1. Create item "Whole Chicken" (`productType: raw`, `unit: kg`,
     `purchaseUnit: kg`).
  2. Create + receive a purchase for 20 kg — confirm `GET
     /inventory/:itemId` shows `currentStock` increased and `unitCost`
     recomputed as weighted average, and `GET
     /inventory/:itemId/batches` shows the new batch with its expiry.
  3. Check `GET /ledger/accounts` — Inventory Asset and Purchase Payable
     balances moved by the purchase amount.
  4. Log a production entry against a "Boneless Chicken" recipe — confirm
     a `wastage`/`trim_loss` movement appears for the shrinkage, and the
     Wastage & Spoilage ledger account moved.
  5. Sell a recipe item that consumes boneless chicken — confirm
     deduction draws from the correct (oldest-expiry) batch and COGS/
     Inventory Asset ledger accounts move.
  6. Run a stock count with a deliberate variance — confirm the
     adjustment movement and ledger entry both post.
  7. Confirm `GET /ledger/inventory-valuation` reconciles to `Σ
     (currentStock × unitCost)` across all items at every step above.
