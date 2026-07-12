# Index of `taskprompt.md`

Quick reference for the implementation prompts stored in `taskprompt.md` at the repo root. Each prompt is self-contained and written for an LLM/agent to execute end-to-end (backend + frontend). Read the two rules at the top of `taskprompt.md` first — they apply to every task below.

## Rules (apply to every task)
1. **Follow `.project/prompt.md` workflow** — read `.project/memory.md`/`knowledge.md` before starting; create a task file under `.project/tasks/` and update `memory.md`/`knowledge.md` after finishing.
2. **Data models are not fixed** — field lists given are a starting point; work out full column/constraint/index details per feature, and ensure every new table is properly connected (FKs/joins) to the rest of the schema, no orphaned tables.

## Tasks

### 1. Implement Price Level Management (API + Frontend)
- **Status**: not yet implemented (`apps/api/src/price-levels/` does not exist yet).
- **Dependencies**: none — foundational task, other tasks below depend on it.
- **What it adds**: `PriceLevel` entity (named pricing tiers, e.g. Standard/Corporate/Staff, one marked default) and `ItemPriceLevel` junction entity (per-item price override per level, falls back to `Item.price` if no override). Full CRUD API, `getEffectivePrice`/`getPricingGrid` service methods, and a frontend module (`modules/price-level/`) with list/form/pricing-grid pages.
- **Key backend paths**: `apps/api/src/price-levels/entities/{price-level,item-price-level}.entity.ts`, `price-levels.module.ts`.
- **Key frontend paths**: `apps/restaurant-ui/src/modules/price-level/`, routes `price-levels*.tsx`.

### 2. POS Customer Picker + Price-Level Billing + Zone-Based Seating
- **Status**: not yet implemented.
- **Dependencies**: Task 1 (`PriceLevelsService.getEffectivePrice`).
- **What it adds** (three connected changes):
  - **Customer entity/API** (`apps/api/src/customers/`) — `customerType` (default `regular`), auto-resolved/overridable `priceLevelId`.
  - **Price-level-aware billing** — replaces `sales.controller.ts`'s untyped `@Body() dto: any` with real DTOs; `sales.service.ts` now resolves `unitPrice` server-side from the customer's price level instead of trusting client input.
  - **POS customer combobox** — replaces the plain customer-name text input (`POSDashboard.tsx:30,217`) with a searchable dropdown + inline "+ Add new customer" row (`modules/customers/components/CustomerCombobox.tsx`).
  - **Zone-based seating** (`apps/api/src/seating/` — `Zone` + `Seat` entities, categories Online/Walk-in/Flexible, status Available/Booked/Occupied) — replaces the flat `PREDEFINED_TABLES` table selector (`POSDashboard.tsx:18-56,173-216`) with a zone-tabbed seat picker (`modules/pos/components/SeatingPanel.tsx`) and a zone/seat admin module (`modules/zones/`).
- **Key backend paths**: `apps/api/src/customers/`, `apps/api/src/seating/`, changes to `apps/api/src/sales/`.
- **Key frontend paths**: `apps/restaurant-ui/src/modules/customers/`, `apps/restaurant-ui/src/modules/zones/`, changes to `apps/restaurant-ui/src/modules/pos/`.

### 3. Recipe Engineering & Multi-Level Inventory Mapping (Bill of Materials)
- **Status**: implemented — `apps/api/src/recipes/` exists (`entities/{recipe,production-entry}.entity.ts`, `dto/`, `controllers/recipes.controller.ts`, `services/recipes.service.ts`, `repositories/`, `recipes.module.ts`). Verify exact field/method names before building on it — implementation may have drifted slightly from the original spec.
- **Dependencies**: none functionally, but conceptually builds on the existing `Item`/`Inventory`/`StockMovement` schema.
- **What it adds**: `productType` on `Item` (raw/semi-finished/finished), `Recipe` + `RecipeIngredient` entities (bill of materials, supports nesting so a Thali can reference other finished/semi-finished items), `ProductionEntry` entity for kitchen prep batches. Recursive cost roll-up (`computeCost`), sale-time component deduction wired into `sales.service.ts`, and a frontend recipe-builder tab + kitchen-prep logging page. Requires unit tests and API/e2e tests (`apps/api/test/recipes.e2e-spec.ts`); frontend has no test runner configured, so frontend verification is manual.
- **Key backend paths**: `apps/api/src/recipes/entities/{recipe,recipe-ingredient,production-entry}.entity.ts`, changes to `apps/api/src/items/` and `apps/api/src/sales/`.
- **Key frontend paths**: `apps/restaurant-ui/src/modules/recipes/`, changes to the item form.

### 4. Reusable Thermal Tax Invoice + Multi-Location Stock
- **Status**: not yet implemented.
- **Dependencies**: Part B builds on Task 3's Recipe Engineering module (already implemented) and the existing `Inventory`/`StockMovement` schema. Part A is independent.
- **What it adds** (two parts):
  - **Part A — Reusable invoice/receipt**: a singleton `RestaurantProfile` entity (name/address/GSTIN — none exists today; `SettingsPage.tsx`'s "Restaurant Info" is currently hardcoded mock data), a pure `formatReceiptText()` function producing a fixed 40-char monospace thermal-receipt layout (itemized Sr/Item/Qty/Rate/Amount table, Sub-Total→Discount→Taxable Value→CGST/SGST or IGST→Grand Total→Round Off→Net Payable), exposed via `GET /sales/:id/receipt` and rendered by a new frontend `ReceiptView` component (no print/receipt UI exists today) with a Print button, shown after every POS sale and for reprints from `SalesPage.tsx`.
  - **Part B — Storage Location**: new `StorageLocation` entity; adds `locationId` to `Inventory`/`StockMovement` (currently one global balance per item, no location concept) with a composite unique on (item, location) and a data-backfill step (no migrations in this project — `synchronize: true` only); wires location-awareness into Recipe Engineering's sale-time deduction/production logic so e.g. Butter Chicken deducts stock at the correct location; adds `POST /inventory/transfer` between locations that also posts a `LedgerEntry` for accounts visibility.
- **Key backend paths**: `apps/api/src/settings/`, `apps/api/src/sales/utils/receipt-formatter.ts`, `apps/api/src/storage-locations/`, changes to `apps/api/src/inventory/` and `apps/api/src/recipes/`.
- **Key frontend paths**: `apps/restaurant-ui/src/modules/sales/components/ReceiptView.tsx`, `apps/restaurant-ui/src/modules/storage-locations/`, changes to `SettingsPage.tsx` and `apps/restaurant-ui/src/modules/inventory/pages/InventoryPage.tsx`.

## Suggested build order
1. Price Level (Task 1) — foundational pricing primitive.
2. Recipe Engineering (Task 3) — already implemented; touches `sales.service.ts create()`.
3. POS Customer + Seating (Task 2) — depends on Task 1; also modifies `sales.service.ts create()` — coordinate with Task 3's changes to that same function (customer price resolution + recipe-based deduction both need to run in the same invoice-creation flow).
4. Reusable Invoice + Multi-Location Stock (Task 4) — Part A can go anytime; Part B should come after Task 3 since it extends the Recipe Engineering deduction logic with location-awareness, and after Task 2 if both touch `sales.service.ts create()` around the same time.
