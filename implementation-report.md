# Implementation Report — Price Level Management + Customer Module

> **Date:** 2026-07-11
> **Scope:** Tasks 1 & partial Task 2 from `taskprompt.md`
> **Status:** Price Level Management ✅ Complete | Customer Module ✅ Backend | Zone/Seat ⬜ Pending | POS Integration ⬜ Pending | Recipe Engineering ⬜ Pending

---

## 📦 Task 1: Price Level Management

### What was built

A full Price Level system allowing restaurants to define multiple pricing tiers (Standard, Corporate, Staff, etc.) and set per-item price overrides for each tier.

### Backend files created (14 files)

| #  | File                                                                              | Purpose                                                                                                     |
| -- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1  | `apps/api/src/price-levels/entities/price-level.entity.ts`                      | `PriceLevel` entity — name, code, description, isDefault, isActive, soft-delete                          |
| 2  | `apps/api/src/price-levels/entities/item-price-level.entity.ts`                 | `ItemPriceLevel` junction — itemId + priceLevelId + price, CASCADE deletes, unique composite index       |
| 3  | `apps/api/src/price-levels/dto/create-price-level.dto.ts`                       | Create DTO with class-validator                                                                             |
| 4  | `apps/api/src/price-levels/dto/update-price-level.dto.ts`                       | PartialType(CreatePriceLevelDto)                                                                            |
| 5  | `apps/api/src/price-levels/dto/query-price-level.dto.ts`                        | Pagination + search + isActive filter                                                                       |
| 6  | `apps/api/src/price-levels/dto/upsert-item-price.dto.ts`                        | Single item price override DTO                                                                              |
| 7  | `apps/api/src/price-levels/dto/bulk-upsert-item-price.dto.ts`                   | Nested bulk upsert DTO (ItemPriceEntryDto[])                                                                |
| 8  | `apps/api/src/price-levels/interfaces/price-level-repository.interface.ts`      | IPriceLevelRepository interface                                                                             |
| 9  | `apps/api/src/price-levels/interfaces/item-price-level-repository.interface.ts` | IItemPriceLevelRepository interface + PricingGridRow type                                                   |
| 10 | `apps/api/src/price-levels/repositories/price-level.repository.ts`              | PriceLevel repo — CRUD, findByCode, findDefault, findAllActive                                             |
| 11 | `apps/api/src/price-levels/repositories/item-price-level.repository.ts`         | ItemPriceLevel repo — upsert, bulkUpsert (TypeORM native upsert), findByPriceLevel                         |
| 12 | `apps/api/src/price-levels/services/price-levels.service.ts`                    | Business logic — CRUD, setDefault (transactional), getEffectivePrice, getPricingGrid, bulkUpsertItemPrices |
| 13 | `apps/api/src/price-levels/controllers/price-levels.controller.ts`              | REST endpoints — CRUD, activate/deactivate, set-default, pricing-grid, effective-price                     |
| 14 | `apps/api/src/price-levels/price-levels.module.ts`                              | NestJS module — registers entities, exports service                                                        |

### Backend files modified (1 file)

| # | File                           | Change                                                         |
| - | ------------------------------ | -------------------------------------------------------------- |
| 1 | `apps/api/src/app.module.ts` | Added `PriceLevelsModule` and `CustomersModule` to imports |

### Frontend files created (12 files)

| #  | File                                                                           | Purpose                                                                                                                |
| -- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 1  | `apps/restaurant-ui/src/modules/price-level/types/price-level.types.ts`      | TypeScript interfaces — PriceLevel, PricingGridRow, request/query types                                               |
| 2  | `apps/restaurant-ui/src/modules/price-level/schemas/price-level.schema.ts`   | Zod validation schema — name (min 2), code (lowercase+hyphens regex), etc.                                            |
| 3  | `apps/restaurant-ui/src/modules/price-level/api/price-level.api.ts`          | Axios API client — all CRUD + actions + pricing grid + effective price endpoints                                      |
| 4  | `apps/restaurant-ui/src/modules/price-level/hooks/usePriceLevelQueries.ts`   | TanStack Query hooks — query key factory, useQuery for list/detail/pricing-grid, useMutation for all write operations |
| 5  | `apps/restaurant-ui/src/modules/price-level/pages/PriceLevelListPage.tsx`    | List page — table with name/code/status/default badges, search, pagination, action dropdown menu                      |
| 6  | `apps/restaurant-ui/src/modules/price-level/pages/PriceLevelFormPage.tsx`    | Create/Edit form — react-hook-form + zod, name/code/description/toggles                                               |
| 7  | `apps/restaurant-ui/src/modules/price-level/pages/PriceLevelPricingPage.tsx` | Pricing grid — editable table of all items with per-row price input, search/filter, bulk save                         |
| 8  | `apps/restaurant-ui/src/modules/price-level/index.ts`                        | Barrel export for the module                                                                                           |
| 9  | `apps/restaurant-ui/src/routes/price-levels.tsx`                             | Route:`GET /price-levels` → list page                                                                               |
| 10 | `apps/restaurant-ui/src/routes/price-levels_.create.tsx`                     | Route:`GET /price-levels/create` → create form                                                                      |
| 11 | `apps/restaurant-ui/src/routes/price-levels_.$id_.edit.tsx`                  | Route:`GET /price-levels/:id/edit` → edit form                                                                      |
| 12 | `apps/restaurant-ui/src/routes/price-levels_.$id_.pricing.tsx`               | Route:`GET /price-levels/:id/pricing` → pricing grid                                                                |

### Frontend files modified (1 file)

| # | File                                                        | Change                                                                             |
| - | ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1 | `apps/restaurant-ui/src/components/layout/AppSidebar.tsx` | Added `Price Levels` nav entry under "Products" section with `DollarSign` icon |

### How to test — Price Level Management

#### Backend (curl / REST client):

1. **Create a price level:**

   ```bash
   POST /api/price-levels
   {"name": "Standard", "code": "standard", "isDefault": true, "isActive": true}
   ```
2. **Create another:**

   ```bash
   POST /api/price-levels
   {"name": "Corporate", "code": "corporate", "isActive": true}
   ```
3. **List price levels:**

   ```bash
   GET /api/price-levels
   ```
4. **Set default (if not set at create):**

   ```bash
   PATCH /api/price-levels/:id/set-default
   ```
5. **Get pricing grid (shows all items with base/override/effective prices):**

   ```bash
   GET /api/price-levels/:id/pricing-grid
   ```
6. **Bulk upsert prices for a few items:**

   ```bash
   POST /api/price-levels/:id/pricing-grid
   {"items": [{"itemId": "<uuid>", "price": 299}, {"itemId": "<uuid>", "price": 599}]}
   ```
7. **Get effective price for an item at a price level:**

   ```bash
   GET /api/price-levels/:priceLevelId/items/:itemId/effective-price
   ```
8. **Activate/deactivate:**

   ```bash
   PATCH /api/price-levels/:id/activate
   PATCH /api/price-levels/:id/deactivate
   ```
9. **Soft delete / restore:**

   ```bash
   DELETE /api/price-levels/:id
   POST /api/price-levels/:id/restore
   ```

#### Frontend (browser):

1. Start both servers: `pnpm dev`
2. Login as admin
3. Navigate to **Products → Price Levels** in the sidebar
4. Click **"Create Price Level"** — fill name, code, toggle defaults, save
5. Click the **three-dot menu** on a row → Edit / Manage Pricing / Set as Default / Activate/Deactivate
6. Click **"Manage Pricing"** — the pricing grid page shows all items
7. Enter override prices for some items, click **"Save Changes"**
8. Reload the page — the overrides should persist
9. Toggle **"Overrides only"** checkbox to filter items with overrides

---

## 📦 Task 2 (partial): Customer Module — Backend Only

### Backend files created (7 files)

| # | File                                                                   | Purpose                                                                                                                                             |
| - | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | `apps/api/src/customers/entities/customer.entity.ts`                 | `Customer` entity — name, phone (unique), email, gstin, customerType (string column for extensibility), priceLevelId (FK), isActive, soft-delete |
| 2 | `apps/api/src/customers/dto/create-customer.dto.ts`                  | Create DTO — name, phone (regex validated), email, gstin, customerType (IsIn), priceLevelId                                                        |
| 3 | `apps/api/src/customers/dto/update-customer.dto.ts`                  | PartialType(CreateCustomerDto)                                                                                                                      |
| 4 | `apps/api/src/customers/dto/query-customer.dto.ts`                   | Pagination + search + isActive + customerType filter                                                                                                |
| 5 | `apps/api/src/customers/interfaces/customer-repository.interface.ts` | ICustomerRepository interface                                                                                                                       |
| 6 | `apps/api/src/customers/repositories/customer.repository.ts`         | Customer repo — CRUD, search (ILIKE name/phone for POS type-ahead), findByPhone                                                                    |
| 7 | `apps/api/src/customers/services/customers.service.ts`               | Business logic — CRUD, phone uniqueness, price level resolution (explicit > type-match > default fallback), search                                 |
| 8 | `apps/api/src/customers/controllers/customers.controller.ts`         | REST endpoints — CRUD + search + restore                                                                                                           |
| 9 | `apps/api/src/customers/customers.module.ts`                         | NestJS module — imports Customer + PriceLevel entities, exports service                                                                            |

### Price Level Resolution Logic

The `CustomersService.resolvePriceLevel()` implements:

1. If `explicitPriceLevelId` is provided → use it (admin override)
2. If `customerType === 'regular'` → use the `PriceLevel` with `isDefault = true`
3. Otherwise → find a `PriceLevel` whose `code` matches `customerType` (e.g. `'corporate'` matches `code: 'corporate'`)
4. If nothing matches → fall back to the default price level

### How to test — Customer API

1. **Create a customer (regular — auto-resolves to default price level):**

   ```bash
   POST /api/customers
   {"name": "John Doe", "phone": "+91-9876543210"}
   ```
2. **Create a corporate customer (resolves to price level with code 'corporate'):**

   ```bash
   POST /api/customers
   {"name": "Acme Corp", "phone": "+91-9876543211", "customerType": "corporate"}
   ```
3. **Create a customer with explicit price level:**

   ```bash
   POST /api/customers
   {"name": "VIP Customer", "phone": "+91-9876543212", "priceLevelId": "<uuid>"}
   ```
4. **Search customers (POS type-ahead):**

   ```bash
   GET /api/customers/search?q=john
   ```
5. **List with filters:**

   ```bash
   GET /api/customers?customerType=corporate
   GET /api/customers?isActive=true
   ```

---

## ❌ What Is NOT Implemented (Pending Tasks)

These sections from `taskprompt.md` have **not been built yet**:

| Section                                                               | Status         | Notes                                                                                                                      |
| --------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Zone/Seat entities + API (Task 2, Sec 5-6)                            | ⬜ Not started | `Zone` and `Seat` entities, controllers, services, module                                                              |
| SeatingPanel frontend component (Task 2, Sec 9)                       | ⬜ Not started | Zone tabs + seat grid replacing the flat table selector                                                                    |
| CustomerCombobox frontend component (Task 2, Sec 7)                   | ⬜ Not started | Type-ahead with inline "Add new" in POS                                                                                    |
| POSDashboard.tsx integration (Task 2, Sec 7)                          | ⬜ Not started | Replace plain-text customer input with combobox, replace table selector with seating panel, add price-level cart repricing |
| Sales CreateInvoiceDto + server-side price resolution (Task 2, Sec 4) | ⬜ Not started | Replace `@Body() dto: any` with class-validator DTO, inject PriceLevelsService, resolve prices server-side               |
| Invoice.customerId / seatIds columns (Task 2, Sec 4-6)                | ⬜ Not started | Modify Invoice and Kot entities                                                                                            |
| Recipe Engineering / Bill of Materials (Task 3)                       | ⬜ Not started | Recipe, RecipeIngredient, ProductionEntry entities + cost computation + sale-time deduction + e2e tests                    |
| Seed data for default price level (Task 1, Sec 2.7)                   | ⬜ Skipped     | No seed script mechanism found; manual setup step                                                                          |

---

## 📋 Implementation Stats

| Metric                           | Count                                                      |
| -------------------------------- | ---------------------------------------------------------- |
| New backend files                | 23                                                         |
| New frontend files               | 12                                                         |
| Modified files                   | 3 (app.module.ts, AppSidebar.tsx, price-levels.service.ts) |
| New backend modules              | 2 (PriceLevelsModule, CustomersModule)                     |
| New frontend modules             | 1 (price-level)                                            |
| New routes                       | 4 (price-levels, create, edit, pricing)                    |
| TypeScript errors (new)          | 0                                                          |
| TypeScript errors (pre-existing) | 4 (test specs only)                                        |

---

## ✅ Verification Checklist (Backend)

- [ ] `GET /api/health` — server is running
- [ ] `POST /api/price-levels` — create price level → 201
- [ ] `GET /api/price-levels` — list → paginated response
- [ ] `PATCH /api/price-levels/:id/set-default` — sets isDefault, unsets others
- [ ] `GET /api/price-levels/:id/pricing-grid` — returns all items with base/override/effective
- [ ] `POST /api/price-levels/:id/pricing-grid` — bulk upsert prices → 201
- [ ] `GET /api/price-levels/:priceLevelId/items/:itemId/effective-price` — returns effective price
- [ ] `POST /api/customers` — create customer with auto price-level resolution
- [ ] `GET /api/customers/search?q=` — returns lightweight results for POS combobox
- [ ] Items, categories, sales, POS all remain functional (no regressions)

## ✅ Verification Checklist (Frontend)

- [ ] Sidebar shows "Price Levels" under "Products"
- [ ] `/price-levels` → table loads with search/pagination
- [ ] `/price-levels/create` → form saves and redirects to list
- [ ] `/price-levels/:id/edit` → form populates with existing data, saves
- [ ] `/price-levels/:id/pricing` → grid loads all items, editing prices works
- [ ] Action dropdown menu shows Edit / Manage Pricing / Set as Default / Activate/Deactivate / Delete
- [ ] Set as Default updates the list immediately
- [ ] Activate/Deactivate toggles the status badge
- [ ] Delete shows confirmation dialog
