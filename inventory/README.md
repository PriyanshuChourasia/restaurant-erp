# Stock Management Restructure — Module Index

**If you're an LLM/agent about to implement anything in this folder, read
[`AGENTS.md`](./AGENTS.md) first** — it has the task-workflow rule
(`.project/prompt.md`) and the module breakdown as an actionable checklist.
This file has the full background, goal, and worked example.

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
- **`apps/api/src/category/entities/category.entity.ts`** — `CategoryEntity`
  is a self-referencing tree (`parentId`/`path`/`level`) already used to
  organize items on the menu. It has no relationship to stock at all today
  — categorization and stock-keeping are, correctly, separate concerns; the
  redesign keeps them that way (`items.category_id` is the only link).
- **No `units` reference table** — units live only as the hardcoded
  `ItemUnit` enum. Nothing can be joined/queried/added without a code
  deploy, and nothing enforces that a "conversion" between two units is
  dimensionally sensible (kg→litre would silently be allowed if someone
  seeded a bad factor).
- **No storage-location dimension anywhere** — `Inventory`/`StockMovement`
  are keyed by `item_id` alone. `MovementType.TRANSFER_IN`/`TRANSFER_OUT`
  already exist but nothing populates them (confirmed by grep) because
  there's no second location to transfer *to*. A restaurant that wants to
  know "is this stock still in the walk-in fridge or already moved to the
  kitchen line" cannot ask that question today.
- **No dedicated opening-stock record** — "opening balance" is just
  whatever `InventoryService.setOpeningBalance()` last wrote. It can be
  called more than once and silently overwrite both the balance and the
  meaning of the audit trail; there's no way to know if/when an item's
  opening stock was actually declared versus just defaulted.
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
- **No vendor linkage on `Item` itself.** `apps/api/src/suppliers/` and
  `Purchase.supplierId` exist (a PO picks a vendor), but `Item` has no
  relationship to `Supplier` at all — no "who do we normally buy this
  from" default, and no per-vendor last-price history on the item.
- **`gstRate` conflates "0% GST" with "not a GST supply at all."**
  `GstRate.NIL = 0` can't distinguish nil-rated from exempt from
  genuinely non-GST goods (alcohol, petroleum) — three legally distinct
  categories that appear in separate tables on a GSTR-1 return. Today's
  model can only express a single taxable rate.
- **No compound/display-unit formatting.** Module 1 gives every item a
  base unit and the conversion math to a bigger one (gram→kg factor
  0.001), but nothing renders it — confirmed by grep, every page showing
  `currentStock` today prints the raw base-unit number (`4000 gram`
  instead of `4 kg`, `3400 gram` instead of `3.4 kg` / `3 kg 400 g`).

## Goal

Turn the existing perpetual-inventory skeleton into a system with a
complete, correctly-related data model — **Items, Categories, Units,
Storage Units, Inventory, Stock Movements, Batch Tracking, Opening Stock**
— that can correctly answer, for a perishable raw material like chicken:

0. How do all of these entities actually relate to each other — keys,
   foreign keys, cardinalities — as one schema, not eight separate
   half-designs? → **[`data-model_plan.md`](./data-model_plan.md)** (read
   this first; every module below implements a piece of it)
1. What unit did we buy it in vs. what unit do we cook/sell it in, and can
   the system convert between them instead of trusting a free-text unit
   string? → **[`units_plan.md`](./units_plan.md)**
2. Where does stock physically live — one shelf, or a central store plus a
   kitchen line — and can it move between locations with a real audit
   trail? → **[`storage-units_plan.md`](./storage-units_plan.md)**
3. When an item first starts being tracked, is that a one-time, dated,
   auditable declaration — or something anyone can silently overwrite
   later? → **[`opening-stock_plan.md`](./opening-stock_plan.md)**
4. Does receiving a purchase actually put stock on the shelf, at a
   correctly-averaged cost? → **[`purchase-receiving_plan.md`](./purchase-receiving_plan.md)**
5. Does every stock movement (purchase, sale, wastage, production) have a
   matching money-side ledger entry, so food cost % and inventory
   valuation are trustworthy? → **[`ledger-integration_plan.md`](./ledger-integration_plan.md)**
6. Which physical delivery is this stock from, and when does it expire —
   picked oldest-expiry-first? → **[`batch-tracking_plan.md`](./batch-tracking_plan.md)**
7. When trim/prep loses 30% of a whole chicken to bone and skin, is that
   loss visible and costed, or does it silently vanish? → **[`wastage-tracking_plan.md`](./wastage-tracking_plan.md)**
8. When the book quantity and the physical count disagree, is there a real
   reconciliation flow? → **[`stock-count_plan.md`](./stock-count_plan.md)**
9. Which vendor do we normally buy this item from (and at what price last
   time), is it actually a taxable supply or nil-rated/exempt/non-GST, and
   can a base-unit quantity like 4000 g of flour or 3400 g of cucumber
   display in a human-sized unit instead of raw grams? → **[`item-master_plan.md`](./item-master_plan.md)**

Categories are covered entirely inside `data-model_plan.md` — the existing
`CategoryEntity` tree needs no behavioral changes, only its relationship to
`Item` documented alongside everything else.

## Modules

Each module file is self-contained — full "what/files/verification" to be
handed off and implemented on its own. Do them roughly in this order;
later modules depend on earlier ones (noted as "Depends on" in each file).
Phase labels match priority: **Phase 1 lays the schema foundation and
closes the money gap** (purchases never move stock, wastage never hits the
books) — do this before any of the nicer-to-have batch/expiry work. Phase
4 (module 9) is independent of phases 2–3 — it only needs modules 0 and 1,
so it can ship any time after those, in parallel with or ahead of the
batch-tracking/wastage/stock-count work if a vendor-linkage or GST-return
correctness need is more urgent than those.

| # | Phase | Module file | Depends on | What it does |
|---|---|---|---|---|
| 0 | 0 | [`data-model_plan.md`](./data-model_plan.md) | — | Full ERD/schema reference for all 8 pillars — read first, implements nothing on its own |
| 1 | 1 | [`units_plan.md`](./units_plan.md) | 0 | `units` master table (replaces the `ItemUnit` enum) + `unit_conversions`; `purchaseUnitId` on `Item` |
| 2 | 1 | [`storage-units_plan.md`](./storage-units_plan.md) | 0 | `StorageUnit` master + `storageUnitId` on `Inventory`/`StockMovement`; real transfers. Non-breaking (single default location seeded) |
| 3 | 1 | [`opening-stock_plan.md`](./opening-stock_plan.md) | 1, 2 | `OpeningStockEntry` — one-time, dated, per-location opening balance declaration |
| 4 | 1 | [`purchase-receiving_plan.md`](./purchase-receiving_plan.md) | 1, 2 | GRN actually posts `purchase_in` stock movements + weighted-average cost, at a storage unit |
| 5 | 1 | [`ledger-integration_plan.md`](./ledger-integration_plan.md) | 4 | Every `StockMovement` gets a matching `LedgerEntry` (COGS, wastage expense, inventory asset) |
| 6 | 2 | [`batch-tracking_plan.md`](./batch-tracking_plan.md) | 2, 4 | `StockBatch` (lot + expiry, per storage unit) + FEFO picking on consumption |
| 7 | 2 | [`wastage-tracking_plan.md`](./wastage-tracking_plan.md) | 5, 6 | Reasoned wastage (`trim_loss`, `expired`, ...) + auto-post production shrinkage instead of silently dropping it |
| 8 | 3 | [`stock-count_plan.md`](./stock-count_plan.md) | 5 | Physical stock count (per storage unit) → variance → `adjustment_in/out` reconciliation |
| 9 | 4 | [`item-master_plan.md`](./item-master_plan.md) | 0, 1 | Vendor-per-item linkage with last-purchase-price, precise tax classification (taxable/nil-rated/exempt/non-GST) distinct from `gstRate`, and compound-unit display formatting (4000 g → "4 kg", 3400 g → "3 kg 400 g") |

Storage units (module 2) were previously deferred as a "lowest priority,
only if needed" module (the old `multi-location_plan.md`) because adding a
location dimension after the fact would have meant auditing every earlier
module's call sites. Building it into the schema at module 2 — right after
units, right before anything else touches `Inventory`/`StockMovement` —
removes that risk: every later module (4 through 8) is written against the
final two-column key from the start. A single seeded default location keeps
this change invisible to users until a second location is actually needed
(see the Rollout section in [`data-model_plan.md`](./data-model_plan.md)).

## Worked example (chicken, referenced from every module)

20 kg whole chicken purchased @ ₹180/kg into the "Central Store" storage
unit, existing stock there 5 kg @ ₹175 avg:

1. **Receive** (module 4): weighted avg cost = `(5×175 + 20×180)/25 = ₹179`.
   `StockBatch CHK-20260710-01` at Central Store, expiry `2026-07-13`.
   Ledger (module 5): Debit Inventory Asset ₹3,600 + GST Input ₹180, Credit
   Purchase Payable ₹3,780.
2. **Transfer** (module 2): 8 kg moved from Central Store to Kitchen Line
   1 — paired `TRANSFER_OUT`/`TRANSFER_IN` movements share one
   `transferGroupId`; the batch splits, with the Kitchen Line 1 portion's
   `parentBatchId` pointing back at `CHK-20260710-01`.
3. **Trim** (existing `RecipesService.createProductionEntry`, extended by
   module 7): 8 kg whole → 5.6 kg boneless at Kitchen Line 1 (70% yield).
   The missing 2.4 kg auto-posts as `wastage`/`trim_loss` → Debit Wastage &
   Spoilage `2.4 × 179 = ₹429.60`, instead of vanishing between two
   movement rows as it does today.
4. **Sale** (existing `RecipesService.deductOnSale`, extended by module 6
   for FEFO batch picking): 1 "Butter Chicken" plate needs 180 g boneless
   → drawn from the oldest batch at Kitchen Line 1, cost `0.18 × 255.71 =
   ₹46.03`. Ledger: Debit COGS ₹46.03, Credit Inventory Asset ₹46.03.
5. **Expiry sweep** (module 6): any batch past `expiryDate` with
   `quantityRemaining > 0`, at any storage unit, auto-writes off as
   `wastage`/`expired`.
6. **Stock count** (module 8): a count at Kitchen Line 1 finds physical
   stock 0.3 kg short → posts `adjustment_out`, booked to a Stock
   Adjustment expense account.

At every step, `Σ(Inventory.currentStock × unitCost)` **across all storage
units for an item** should reconcile to the Inventory Asset ledger balance
— build the reconciliation check (`GET /ledger/inventory-valuation`,
module 5) as a standing health check, not a one-off.

## Cross-module verification (after modules 0–8 land)

- `apps/api`: `tsc --noEmit`; run/update `purchases.service.spec.ts`,
  `inventory.service.spec.ts`, `sales.service.spec.ts`,
  `kot.service.spec.ts`, `items.service.spec.ts` for any new required mocks
  (`UnitsService`, `StorageUnitsService`, `LedgerService`, batch repos).
- Manual walkthrough via the dev server, using the chicken numbers above:
  1. Confirm the seeded "Main Store"/"Central Store" `StorageUnit` exists
     and `GET /storage-units` returns it as the default.
  2. Create item "Whole Chicken" (`productType: raw`, `unitId: kg`,
     `purchaseUnitId: kg`, `shelfLifeDays: 3`).
  3. Declare its opening stock via `POST /inventory/:itemId/opening-stock`
     — confirm a second attempt is rejected with 409.
  4. Create + receive a purchase for 20 kg — confirm `GET
     /inventory/:itemId?storageUnitId=` shows `currentStock` increased and
     `unitCost` recomputed as weighted average, and `GET
     /inventory/:itemId/batches` shows the new batch with its expiry.
  5. Transfer 8 kg to a second storage unit — confirm paired movements
     post atomically and the batch splits with `parentBatchId` set.
  6. Check `GET /ledger/accounts` — Inventory Asset and Purchase Payable
     balances moved by the purchase amount.
  7. Log a production entry against a "Boneless Chicken" recipe at the
     destination storage unit — confirm a `wastage`/`trim_loss` movement
     appears for the shrinkage, and the Wastage & Spoilage ledger account
     moved.
  8. Sell a recipe item that consumes boneless chicken — confirm
     deduction draws from the correct (oldest-expiry) batch at that
     location and COGS/Inventory Asset ledger accounts move.
  9. Run a stock count at that storage unit with a deliberate variance —
     confirm the adjustment movement and ledger entry both post.
  10. Confirm `GET /ledger/inventory-valuation` reconciles to `Σ
      (currentStock × unitCost)` summed across all storage units for every
      item, at every step above.
