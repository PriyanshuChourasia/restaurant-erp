**Date:** 2026-07-11
**Prompt:** Follow taskprompt.md and implement what is not implemented

## What was done

### Recipe Engineering & Multi-Level Inventory Mapping (Task 3) — Full Backend

**Backend entities (apps/api/src/recipes/):**
- `Recipe` entity — one per output item, with `outputItemId` (FK, unique), `yieldQuantity`, `yieldUnit`, soft-delete
- `RecipeIngredient` entity — `recipeId` (FK CASCADE), `componentItemId` (FK), `quantity`, `unit`, unique index on (recipeId, componentItemId)
- `ProductionEntry` entity — logs kitchen prep runs: `itemId`, `batchQuantity`, `producedAt`, `createdBy`

**Backend module files:**
- `dto/create-recipe.dto.ts` — `CreateRecipeDto` (with nested `RecipeIngredientEntryDto[]`), `CreateProductionEntryDto`
- `repositories/recipe.repository.ts` — `RecipeRepository` + `ProductionEntryRepository` with standard CRUD + findByOutputItem
- `interfaces/recipe-repository.interface.ts` — repository interfaces
- `services/recipes.service.ts` — core logic:
  - `upsert(dto)` — transactional create/replace recipe with ingredients
  - `computeCost(itemId)` — recursive cost computation with circular-reference guard
  - `persistCost(itemId)` — writes computed cost to Item.costPrice
  - `deductOnSale(itemId, soldQty, invoiceNo)` — recipe-based stock deduction at sale time
  - `createProductionEntry(dto)` — transactional: deducts raw materials, adds produced item stock, logs movements
- `controllers/recipes.controller.ts` — REST routes: `GET/POST/DELETE /recipes/:itemId`, `GET /:itemId/cost`, `POST /:itemId/recalculate-cost`, `POST /recipes/production`
- `recipes.module.ts` — registered in `app.module.ts`

**Entity changes:**
- Added `productType` column to `Item` entity (enum: `raw`, `semi_finished`, `finished`, default `finished`)
- Added `PRODUCTION_CONSUMPTION` and `PRODUCTION_YIELD` to `MovementType` enum in `inventory.entity.ts`
- Updated `InventoryService.adjustStock` to recognize `PRODUCTION_CONSUMPTION` as an out-movement

**Sale-time recipe deduction wired into `SalesService`:**
- After saving an invoice, for each sold item calls `recipesService.deductOnSale()`
- If no recipe exists, falls back to direct inventory deduction (existing behavior)
- `SalesModule` now imports `RecipesModule` and registers `Inventory`/`StockMovement` repositories

**Item DTOs updated:**
- `CreateItemDto` now accepts `productType` field
- `UpdateItemDto` inherits it via `PartialType`

### Recipe Engineering — Frontend

**New frontend module (apps/restaurant-ui/src/modules/recipes/):**
- `types/recipe.types.ts` — Recipe, RecipeIngredient, RecipeCostResult, ProductionEntry types
- `api/recipe.api.ts` — API client for recipe CRUD, cost computation, production entry
- `hooks/useRecipeQueries.ts` — TanStack Query hooks with `recipeKeys` factory
- `pages/RecipePage.tsx` — `RecipeEditor` component embedded in Item edit page: ingredient table with search-select, yield config, cost breakdown display, save/recalculate/delete
- `pages/KitchenPrepPage.tsx` — standalone page to log production batches

**Item edit page updated:**
- Added tabs: "Details" and "Recipe / BOM"
- Recipe tab renders `RecipeEditor` inline
- Added `productType` select (Finished/Semi-Finished/Raw Material) to both Create and Edit item forms

**New routes:**
- `/kitchen-prep` — Kitchen Prep page

**Sidebar navigation updated:**
- Added "Kitchen Prep" under Inventory section
- Added "Zones & Seating" under Operations section

### Zone/Seat Admin CRUD Pages (Task 2, Section 8)

**New zone admin pages (apps/restaurant-ui/src/modules/zones/pages/):**
- `ZoneListPage.tsx` — table of zones with create/edit/delete/toggle-active, link to seats
- `ZoneSeatsPage.tsx` — grid of seats within a zone with create/edit/delete/status-change, category and capacity display

**New routes:**
- `/zones` — Zone list page
- `/zones/$zoneId/seats` — Zone seats management page

### Test spec fixes

- Fixed `items.service.spec.ts`: added `productType` to mock, removed stale `page` property, fixed `restore` mock return type
- Fixed `kot.service.spec.ts`: replaced `tableNumber`/`tableNumbers` with `seatIds`
- Fixed `sales.service.spec.ts`: replaced `tableNumber`/`tableNumbers` with `seatIds`/`customerId`/`customer`, updated DTO shape to match new service signature, added mocks for new dependencies (PriceLevelsService, SeatsService, CustomersService, RecipesService, Item/Inventory/StockMovement repos)

## Outcome

- 0 TypeScript errors in both apps (`tsc --noEmit` passes clean)
- Recipe Engineering backend: complete module with entities, DTOs, service (cost computation, sale-time deduction, production entry), controller, module
- Recipe Engineering frontend: RecipeEditor on item edit page, Kitchen Prep standalone page
- Zone/Seat admin pages: full CRUD UI for managing zones and seats
- Item forms updated with productType select
- Sidebar updated with new nav entries
- Pre-existing test spec type errors (4) all resolved
- **Not done:** Unit tests for recipes service, e2e tests for recipes API (deferred — existing test infrastructure doesn't have the required mocks for the new dependencies, and the recipe service has complex transactional logic that needs proper integration test setup)
