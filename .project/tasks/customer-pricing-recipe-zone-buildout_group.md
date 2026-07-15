# Task Group: Customer, Price Levels, Zone/Seat & Recipe Engineering Buildout

Tasks grouped (chronological, 2026-07-11, from `taskprompt.md`'s 3-task plan): `2026-07-11-price-levels-and-customers.md`, `2026-07-11-zone-seat-backend.md`, `2026-07-11-pos-screen-fix.md`, `2026-07-11-customer-save-500-fix.md`, `2026-07-11-recipe-engineering-and-zones-admin.md`, `2026-07-11-zone-management-3d.md`

---

## Task: Price levels + customers (initial implementation)

**Date:** 2026-07-11
**Prompt:** Read taskprompt.md and start implementing — 3 tasks: Price Level Management, POS Customer Picker + Zone Seating + Price-Level Billing, Recipe Engineering

### What was done

#### Task 1: Price Level Management (fully implemented)

**Backend (14 new files, 1 modified):**
- `apps/api/src/price-levels/` — complete module with `PriceLevel` and `ItemPriceLevel` entities, DTOs, repositories, service, controller, module
- Transactional `setDefault()` using `DataSource.queryRunner`
- `getEffectivePrice(itemId, priceLevelId)` with fallback to base `Item.price`
- `getPricingGrid(priceLevelId)` returning all items with effective prices
- `bulkUpsertItemPrices()` using TypeORM native upsert
- All decimal columns use `decimalTransformer`
- Registered in `app.module.ts`

**Frontend (12 new files, 1 modified):**
- `modules/price-level/` — types, Zod schema, API client, TanStack Query hooks
- 3 pages: list (table + search + pagination + action dropdown), form (create/edit with react-hook-form + zod), pricing grid (editable per-item prices, save all)
- 4 file-based routes: `/price-levels`, `/price-levels/create`, `/price-levels/:id/edit`, `/price-levels/:id/pricing`
- Sidebar: Added "Price Levels" under "Products" section

#### Task 2 (partial): Customer API backend

**Backend (9 files):**
- `apps/api/src/customers/` — complete module with `Customer` entity, DTOs, repository, service, controller, module
- Price level resolution: explicit > type-match-by-code > default fallback
- ILIKE search endpoint for POS type-ahead (`GET /customers/search?q=`)
- Registered in `app.module.ts`

### Not done (at this point in the workstream)

- Zone/Seat entities + API (Task 2, Sec 5-6)
- CustomerCombobox frontend component (Task 2, Sec 7)
- SeatingPanel frontend component (Task 2, Sec 9)
- POSDashboard.tsx integration (Task 2, Sec 7-9)
- Sales CreateInvoiceDto + server-side price resolution (Task 2, Sec 4)
- Invoice/Kot entity updates (customerId, seatIds columns)
- Recipe Engineering (Task 3)

### Outcome

- Price Level Management: fully functional backend + frontend ready for testing
- Customer API: backend ready, no frontend yet
- 0 new TypeScript errors; 4 pre-existing test spec errors unchanged
- Implementation report written to `implementation-report.md`

---

## Task: Zone/Seat backend

**Date:** 2026-07-11
**Prompt:** Pick one pending task and implement it — Zone/Seat Backend API

### What was done

#### Zone/Seat Backend Module (9 new files, 1 modified)

**Files created:**

| # | File | Purpose |
|---|------|---------|
| 1 | `apps/api/src/seating/entities/zone.entity.ts` | `Zone` entity — name, description, sortOrder, isActive, soft-delete |
| 2 | `apps/api/src/seating/entities/seat.entity.ts` | `Seat` entity — zoneId (FK CASCADE), label, capacity, category (online/walk_in/flexible string column), status (available/booked/occupied string column), isActive, soft-delete |
| 3 | `apps/api/src/seating/dto/create-zone.dto.ts` | Zone create DTO |
| 4 | `apps/api/src/seating/dto/update-zone.dto.ts` | Zone update DTO (PartialType) |
| 5 | `apps/api/src/seating/dto/create-seat.dto.ts` | Seat create DTO — zoneId, label, capacity, category (IsIn), status |
| 6 | `apps/api/src/seating/dto/update-seat.dto.ts` | Seat update DTO (PartialType) |
| 7 | `apps/api/src/seating/dto/update-seat-status.dto.ts` | Seat status update DTO — status (IsIn available/booked/occupied) |
| 8 | `apps/api/src/seating/repositories/zone.repository.ts` | Zone repo — findAll (with includeInactive), CRUD, soft-delete |
| 9 | `apps/api/src/seating/repositories/seat.repository.ts` | Seat repo — findByZone, findByIds, updateStatus, CRUD, soft-delete |
| 10 | `apps/api/src/seating/services/zones.service.ts` | Zone service — CRUD with NotFound checks |
| 11 | `apps/api/src/seating/services/seats.service.ts` | Seat service — CRUD + updateStatus + bulkUpdateStatus |
| 12 | `apps/api/src/seating/controllers/zones.controller.ts` | Zone routes — GET /, GET /:id, GET /:id/seats, POST, PATCH :id, DELETE :id |
| 13 | `apps/api/src/seating/controllers/seats.controller.ts` | Seat routes — GET /, GET /:id, POST, PATCH :id, PATCH :id/status, DELETE :id |
| 14 | `apps/api/src/seating/seating.module.ts` | NestJS module — registers Zone + Seat entities, both controllers/services/repos, exports SeatsService |

**Files modified:**
| 15 | `apps/api/src/app.module.ts` | Added `SeatingModule` to imports |

### How to test

1. **Create a zone:**
   ```bash
   POST /api/zones  {"name": "AC Lounge", "sortOrder": 1}
   POST /api/zones  {"name": "Family Dining", "sortOrder": 2}
   ```

2. **List zones:**
   ```bash
   GET /api/zones
   ```

3. **Create seats in a zone:**
   ```bash
   POST /api/seats  {"zoneId": "<zone-uuid>", "label": "T1", "capacity": 4}
   POST /api/seats  {"zoneId": "<zone-uuid>", "label": "T2", "capacity": 6, "category": "flexible"}
   ```

4. **List seats in a zone:**
   ```bash
   GET /api/zones/:id/seats
   ```

5. **Update seat status (e.g., occupy when order is placed):**
   ```bash
   PATCH /api/seats/:id/status  {"status": "occupied"}
   ```

6. **Clear seat (when bill is settled):**
   ```bash
   PATCH /api/seats/:id/status  {"status": "available"}
   ```

### What's still pending

- CustomerCombobox frontend component (POS type-ahead + inline add)
- SeatingPanel frontend component (zone tabs + seat grid replacing flat table selector)
- POSDashboard.tsx integration (customer picker + seat selector + price-level-aware cart)
- Sales CreateInvoiceDto validation + server-side price resolution
- Invoice/Kot entity updates (customerId, seatIds columns)
- Recipe Engineering (Task 3)

### Outcome

- Zone/Seat backend: fully functional (entities, DTOs, repositories, services, controllers, module, registered)
- 0 new TypeScript errors (only pre-existing test spec errors remain)

---

## Task: POS screen fix + customer/zones frontend + seating panel

**Date:** 2026-07-11
**Prompt:** Find the prompt where I explained to fix the POS screen and fix it. The POS POST was failing because the frontend still sent `tableNumbers` + `unitPrice` in the payload while the backend now expects `seatIds` + no `unitPrice` (server-side price resolution). The old `PREDEFINED_TABLES`/`selectedTables` UI was still in `POSDashboard.tsx`.

### What was done

#### 1. Fixed `pos.api.ts` (types mismatch with backend)
- Dropped `tableNumbers`, `unitPrice`, `itemName`, `hsnCode`, `gstRate` from `CreateInvoiceRequest` and `PosInvoiceItem`
- Added `customerId`, `seatIds`, `clearInvoiceSeats()` function
- New `CreateKotRequest` interface with `seatIds` instead of `tableNumbers`
- Matches backend `CreateInvoiceDto` exactly

#### 2. Created customers frontend module (`apps/restaurant-ui/src/modules/customers/`)
- `types/customer.types.ts` — Customer, CustomerSearchResult, CreateCustomerRequest, etc.
- `api/customer.api.ts` — `searchCustomers()`, CRUD functions via shared `apiClient`
- `hooks/useCustomerQueries.ts` — TanStack Query hooks with `customerKeys` factory
- `components/CustomerCombobox.tsx` — Type-ahead search combobox:
  - Debounced search (enabled when `query.length >= 2`)
  - Dropdown with matching customers (name, phone, customerType badge)
  - "+ Add '{query}' as new customer" inline form (name + phone, no page navigation)
  - On select, calls `onSelect(customer)` to update POS state
  - Outside click closes dropdown

#### 3. Created zones frontend module (`apps/restaurant-ui/src/modules/zones/`)
- `types/zone.types.ts` — Zone, Seat, seat/zone request/response types
- `api/zone.api.ts` — Zone/Seat CRUD + seat status management
- `hooks/useZoneQueries.ts` — TanStack Query hooks with `zoneKeys`/`seatKeys` factories

#### 4. Created `SeatingPanel` component (`apps/restaurant-ui/src/modules/pos/components/SeatingPanel.tsx`)
- Fetches zones and seats by active zone
- Zone tabs sorted by `sortOrder`
- Seat grid with status colors (green=available, amber=booked, red=occupied) and category icons
- Multi-select toggle for seats
- Handles empty state (no zones configured)

#### 5. Updated `POSDashboard.tsx`
- Replaced `PREDEFINED_TABLES`/`selectedTables`/`tableInput`/`addTable`/`removeTable` with `SeatingPanel`
- Replaced plain `customerName` text input with `CustomerCombobox`
- Fixed billing payload: sends only `itemId` + `quantity`, no `unitPrice`, no `tableNumbers`
- `createKot` also uses `seatIds` instead of `tableNumbers`
- Added "Clear seats" action button in success message

### Outcome

- 0 new TypeScript errors (frontend `tsc --noEmit` clean, API only pre-existing test spec errors)
- Route tree regenerated successfully
- POS billing payload now matches backend `CreateInvoiceDto`
- Customers can be searched + created inline without leaving POS
- Seats are zone-based with proper status management

### Not done (remaining work)

- Recipe Engineering / Bill of Materials (Task 3 in taskprompt.md)
- Customer/Zones admin CRUD pages (admin list, create, edit forms — out of POS scope)
- Cart price preview doesn't adjust when customer changes (servers resolves prices correctly, but the cashier sees base prices in the cart — UX follow-up)

---

## Task: Fixed 500 on customer save & recipes module build errors

**Date:** 2026-07-11
**Prompt:** Customer save not working in POS — "Request failed with status code 500".

### What Was Done

#### Root Cause 1: TypeORM union-type bug on Customer entity

- `Customer.entity.ts` had `@Column({ length: 255, nullable: true }) email!: string | null;`
  without `type: 'varchar'`. TypeORM cannot infer column type from union
  types (`string | null`), defaults to `Object`, which PostgreSQL rejects with
  `DataTypeNotSupportedError`.
- Same issue on `gstin` column.
- **Fix**: Added `type: 'varchar'` to both `@Column` decorators. This is the
  same class of bug as documented in `.project/knowledge.md` (nullable-column
  gotcha + decimal transformer gotcha).

#### Root Cause 2: Recipes module build errors (pre-existing)

Discovered when the build cache was invalidated by the Customer entity change.
Seven build errors existed:

1. **Bad import paths in `recipes.module.ts`**: Used `../entities/recipe.entity`
   instead of `./entities/recipe.entity` (same for services, controllers,
   repositories — all 5 imports wrong).
2. **Missing `production-entry.entity.ts`**: The `ProductionEntry` entity was
   defined inside `recipe.entity.ts` but imported as a separate file by the
   module, repository, service, and interface.
3. **Interface mismatch**: `IProductionEntryRepository.findByItem` return type
   was missing `page` and `limit` which the implementation returns.

**Fixes**:
- Corrected all import paths in `recipes.module.ts` (relative → `./`)
- Extracted `ProductionEntry` into its own file at
  `recipes/entities/production-entry.entity.ts`
- Updated `IProductionEntryRepository.findByItem` return type to include
  `page` and `limit`
- Updated `ProductionEntryRepository.findByItem` return type to match

### Outcome

- `npx nest build` passes clean (only pre-existing test spec errors remain)
- The 500 error on customer creation in POS should be resolved
- The recipes module now compiles and can be used

### Files Changed

- `apps/api/src/customers/entities/customer.entity.ts` — added `type: 'varchar'`
- `apps/api/src/recipes/entities/production-entry.entity.ts` — **created**
- `apps/api/src/recipes/entities/recipe.entity.ts` — removed `ProductionEntry`
- `apps/api/src/recipes/recipes.module.ts` — fixed import paths
- `apps/api/src/recipes/interfaces/recipe-repository.interface.ts` — fixed return type
- `apps/api/src/recipes/repositories/recipe.repository.ts` — fixed return type

---

## Task: Recipe Engineering & Zones Admin (full implementation)

**Date:** 2026-07-11
**Prompt:** Follow taskprompt.md and implement what is not implemented

### What was done

#### Recipe Engineering & Multi-Level Inventory Mapping (Task 3) — Full Backend

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

#### Recipe Engineering — Frontend

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

#### Zone/Seat Admin CRUD Pages (Task 2, Section 8)

**New zone admin pages (apps/restaurant-ui/src/modules/zones/pages/):**
- `ZoneListPage.tsx` — table of zones with create/edit/delete/toggle-active, link to seats
- `ZoneSeatsPage.tsx` — grid of seats within a zone with create/edit/delete/status-change, category and capacity display

**New routes:**
- `/zones` — Zone list page
- `/zones/$zoneId/seats` — Zone seats management page

#### Test spec fixes

- Fixed `items.service.spec.ts`: added `productType` to mock, removed stale `page` property, fixed `restore` mock return type
- Fixed `kot.service.spec.ts`: replaced `tableNumber`/`tableNumbers` with `seatIds`
- Fixed `sales.service.spec.ts`: replaced `tableNumber`/`tableNumbers` with `seatIds`/`customerId`/`customer`, updated DTO shape to match new service signature, added mocks for new dependencies (PriceLevelsService, SeatsService, CustomersService, RecipesService, Item/Inventory/StockMovement repos)

### Outcome

- 0 TypeScript errors in both apps (`tsc --noEmit` passes clean)
- Recipe Engineering backend: complete module with entities, DTOs, service (cost computation, sale-time deduction, production entry), controller, module
- Recipe Engineering frontend: RecipeEditor on item edit page, Kitchen Prep standalone page
- Zone/Seat admin pages: full CRUD UI for managing zones and seats
- Item forms updated with productType select
- Sidebar updated with new nav entries
- Pre-existing test spec type errors (4) all resolved
- **Not done:** Unit tests for recipes service, e2e tests for recipes API (deferred — existing test infrastructure doesn't have the required mocks for the new dependencies, and the recipe service has complex transactional logic that needs proper integration test setup)

---

## Task: Zone Management UI with 3D seating visualization

**Date:** 2026-07-11
**Prompt:** "design zone management UI more better present some seating visualization with 3d views"

### What Was Done

Redesigned the entire zone management UI with a CSS-powered isometric 3D floor
plan visualization.

### Architecture

```
modules/zones/
  components/
    FloorPlanView.tsx   # Isometric 3D floor plan with perspective grid,
                        # stats bar, rotation control, seat selection
    SeatBlock.tsx       # 3D-ish isometric seat block with:
                        #   - Top face (isometric transform)
                        #   - Side faces (skew transforms)
                        #   - Status color coding (emerald/amber/red)
                        #   - Floor shadow with glow
                        #   - Hover lift effect
                        #   - Selected state with ring + scale
    ZoneHeader.tsx      # Zone detail header with back nav + seat count
    SeatForm.tsx        # Add/edit seat form (extracted from page)
  pages/
    ZoneListPage.tsx    # Enhanced with visual gradient zone cards
    ZoneSeatsPage.tsx   # Split layout: 3D floor plan + seat list panel
```

### 3D Visualization Details

- **Perspective**: CSS `perspective(800px) rotateX(55deg)` for isometric view
- **Grid floor**: Linear gradient stripes with perspective transform
- **Seat blocks**: Three CSS faces (top = `rotateX(55deg) rotateZ(45deg)`,
  right = `skewY(35deg)`, left = `skewX(35deg)`) with rounded corners
- **Rotation**: Button to rotate the entire scene 90° at a time
- **Status dots**: Pulsing amber for booked, solid green/red for available/occupied
- **Stats bar**: Live count of free/booked/occupied/total seats

### Files Changed

- `modules/zones/components/FloorPlanView.tsx` — created
- `modules/zones/components/SeatBlock.tsx` — created
- `modules/zones/components/ZoneHeader.tsx` — created
- `modules/zones/components/SeatForm.tsx` — created
- `modules/zones/pages/ZoneSeatsPage.tsx` — rewritten
- `modules/zones/pages/ZoneListPage.tsx` — rewritten

### Note

This entire zone/seat/customer/recipe workstream (Zone, Seat, 3D floor plan) was
later superseded by the "Floor Plan Restructure" (Modules 1–9, see
`floorplan-restructure_group.md`), which replaced `Seat` with a standalone
`Table` entity and rebuilt the floor plan UI around real stored coordinates.
