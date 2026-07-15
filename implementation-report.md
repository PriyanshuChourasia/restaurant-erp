# Implementation Report — Price Level Management + Customer Module + Full Floorplan Restructure

> **Date:** 2026-07-12
> **Scope:** All 9 floorplan modules from `floorplan/` spec documents
> **Status:** All modules ✅ Complete — 0 TypeScript errors in both apps, full build passing

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
| 4  | `apps/restaurant-ui/src/modules/price-level/hooks/usePriceLevelQueries.ts   | TanStack Query hooks — query key factory, useQuery for list/detail/pricing-grid, useMutation for all write operations |
| 5  | `apps/restaurant-ui/src/modules/price-level/pages/PriceLevelListPage.tsx    | List page — table with name/code/status/default badges, search, pagination, action dropdown menu                      |
| 6  | `apps/restaurant-ui/src/modules/price-level/pages/PriceLevelFormPage.tsx    | Create/Edit form — react-hook-form + zod, name/code/description/toggles                                               |
| 7  | `apps/restaurant-ui/src/modules/price-level/pages/PriceLevelPricingPage.tsx | Pricing grid — editable table of all items with per-row price input, search/filter, bulk save                         |
| 8  | `apps/restaurant-ui/src/modules/price-level/index.ts                        | Barrel export for the module                                                                                           |
| 9  | `apps/restaurant-ui/src/routes/price-levels.tsx                             | Route:`GET /price-levels` → list page                                                                               |
| 10 | `apps/restaurant-ui/src/routes/price-levels_.create.tsx                     | Route:`GET /price-levels/create` → create form                                                                      |
| 11 | `apps/restaurant-ui/src/routes/price-levels_.$id_.edit.tsx                  | Route:`GET /price-levels/:id/edit` → edit form                                                                      |
| 12 | `apps/restaurant-ui/src/routes/price-levels_.$id_.pricing.tsx               | Route:`GET /price-levels/:id/pricing` → pricing grid                                                                |

### Frontend files modified (1 file)

| # | File                                                        | Change                                                                             |
| - | ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1 | `apps/restaurant-ui/src/components/layout/AppSidebar.tsx | Added `Price Levels` nav entry under "Products" section with `DollarSign` icon |

---

## 📦 Task 2 (partial): Customer Module — Backend Only

### Backend files created (9 files)

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

---

## 🏗 Floorplan Restructure — Modules 1–9

### What was done

The entire floorplan system was restructured from a "Seat" mental model to a "Table" mental model, with full CRUD, POS integration, reservation conflict detection, and sidebar navigation.

### Module 1 — Zone Cleanup (`floorplan/zone-cleanup.md`)

Removed `sortOrder` from the Zone entity and exposed the tables API through the zones module.

| File | Change |
|------|--------|
| `zone.types.ts` | Removed `sortOrder` from Zone, removed Seat types, re-exported Table |
| `zone.api.ts` | Replaced seat API with table API pointing at `/zones/:id/tables` |
| `useZoneQueries.ts` | Replaced seat hooks with table hooks |
| `ZoneListPage.tsx` | Removed sortOrder field/card display, link → `/zones/$zoneId` |

### Module 2 — Table Entity (`floorplan/table-entity.md`)

Created the Table entity, repository, service, controller, and module on the backend.

| File | Purpose |
|------|---------|
| `apps/api/src/seating/entities/table.entity.ts` | Table entity — zoneId (FK), label, capacity, status, shape, posX, posY, soft-delete |
| `apps/api/src/seating/dto/` | Create/Update/Query DTOs with class-validator |
| `apps/api/src/seating/interfaces/` | ITableRepository interface |
| `apps/api/src/seating/repositories/` | Table repo with zone-based and unassigned queries |
| `apps/api/src/seating/services/` | Business logic — CRUD, status management, unassigned filter |
| `apps/api/src/seating/controllers/` | REST endpoints — CRUD, status toggle, position update, unassigned list |
| `apps/api/src/seating/seating.module.ts` | NestJS module |

### Module 3 — Reservation Entity (`floorplan/reservation-entity.md`)

Created the Reservation entity, repository, service, controller, and module on the backend.

| File | Purpose |
|------|---------|
| `apps/api/src/reservations/` | Full backend module — entity, DTOs, repo, service, controller |

### Module 4 — Sales/KOT Rename (`floorplan/sales-kot-rename.md`)

Renamed `seatIds` → `tableIds` across Sales (Invoice) and KOT entities to align with the Table model.

| File | Change |
|------|--------|
| `apps/api/src/sales/entities/sales.entity.ts` | Renamed `seatIds` → `tableIds` column |
| `apps/api/src/kot/entities/kot.entity.ts` | Renamed `seatIds` → `tableIds` column |
| `apps/api/src/sales/dto/create-invoice.dto.ts` | Updated DTO to use `tableIds` |
| `apps/api/src/sales/services/sales.service.ts` | Updated all references |
| `apps/api/src/kot/services/kot.service.ts` | Updated all references |
| `apps/restaurant-ui/src/modules/pos/api/pos.api.ts` | Updated request types |
| `apps/restaurant-ui/src/modules/pos/pages/POSDashboard.tsx` | Updated state/function names |

### Module 5 — Table Management UI (`floorplan/table-management-ui.md`)

Full CRUD frontend for the Tables module with 3D floor plan visualization.

| File | Purpose |
|------|---------|
| `modules/tables/types/table.types.ts` | TypeScript types for Table entity |
| `modules/tables/schemas/table.schema.ts` | Zod validation schema |
| `modules/tables/api/table.api.ts` | Axios API client |
| `modules/tables/hooks/useTableQueries.ts` | React Query hooks |
| `modules/tables/pages/TableListPage.tsx` | Table list with table cards and 3D-ish view |
| `routes/tables.tsx` | File-based route for `/tables` |

### Module 6 — Zone Floorplan UI (`floorplan/zone-floorplan-ui.md`)

Interactive 3D floor plan with drag-to-position tables.

| File | Change |
|------|--------|
| `FloorPlanView.tsx` | Real coordinate canvas with pointer-event drag |
| `TableBlock.tsx` | Renamed from `SeatBlock`, uses `Table` type, draggable support |
| `ZoneFloorPlanPage.tsx` | New page with "Add Tables" picker from unassigned tables |
| `routes/zones.$zoneId.tsx` | New route replacing `zones.$zoneId.seats.tsx` |
| **Deleted** | `SeatForm`, `ZoneHeader`, `SeatBlock`, `ZoneSeatsPage`, old route |

### Module 7 — Reservations UI (`floorplan/reservations-ui.md`)

Rewrote mock reservations page with real backend API integration.

| File | Purpose |
|------|---------|
| `modules/reservations/types/reservation.types.ts` | TypeScript types matching backend entity |
| `modules/reservations/api/reservations.api.ts` | All 8 API endpoints |
| `modules/reservations/hooks/useReservationsQueries.ts` | 7 React Query hooks (queries + mutations) |
| `modules/reservations/pages/ReservationsPage.tsx` | Fully rewritten from mock data → real API with live stat cards, inline CRUD form, status filters, seat action, weekly calendar |

### Module 8 — POS Conflict Warning (`floorplan/pos-conflict-warning.md`)

Added reservation conflict detection in the POS seating panel.

| File | Change |
|------|--------|
| `SeatingPanel.tsx` | Added parallel conflict queries via `useQueries`, reservation badge/tooltip, `window.confirm()` on double-booking attempt |
| `pos.api.ts` | Renamed `seatIds` → `tableIds`, `clearInvoiceSeats` → `clearInvoiceTables`, URL `/clear-seats` → `/clear-tables` |
| `POSDashboard.tsx` | All state/function renames to match: `selectedTableIds`, `handleTableToggle`, `clearInvoiceTables` |

### Module 9 — Nav Routing (`floorplan/nav-routing.md`)

Added Tables link to sidebar, final verification.

| File | Change |
|------|--------|
| `AppSidebar.tsx` | Added `{ to: '/tables', label: 'Tables', icon: Table }` link in Operations section |

---

## ✅ What Is Now Implemented

All pending items from the original report are now **completed**:

| Original pending item | Status | Module |
|---|---|---|
| Zone/Seat (Table) entities + API | ✅ **Done** — Table entity replaces Seat, full CRUD backend | Module 2 |
| SeatingPanel frontend component | ✅ **Done** — zone tabs + table grid + conflict warnings | Modules 6, 8 |
| CustomerCombobox frontend component | ✅ **Done** — POS type-ahead with inline add | Pre-floorplan |
| POSDashboard.tsx integration | ✅ **Done** — seating panel + customer combobox + price resolution | Modules 4, 8 |
| Sales CreateInvoiceDto + server-side price resolution | ✅ **Done** — class-validator DTO with price-level resolution | Module 4 |
| Invoice.customerId / tableIds columns | ✅ **Done** — `tableIds` replaces old `seatIds` | Module 4 |
| Recipe Engineering / Bill of Materials | ✅ **Done** — Recipe + RecipeIngredient + ProductionEntry | Pre-floorplan |
| Reservation module backend + frontend | ✅ **Done** — full CRUD, status management, conflict checking | Modules 3, 7 |
| Tables CRUD frontend | ✅ **Done** — list, create, edit, status toggle, table cards | Module 5 |
| Zone floorplan with drag | ✅ **Done** — 3D-ish isometric view, pointer-event drag | Module 6 |
| POS conflict warning | ✅ **Done** — parallel conflict queries, badge/tooltip, confirm dialog | Module 8 |
| Sidebar navigation | ✅ **Done** — Tables + Zones links in Operations section | Module 9 |
| Seed data for default price level | ✅ **Done** — auto-created in seed script | Database seed |

---

## 📋 Implementation Stats

| Metric                           | Count                                                        |
| -------------------------------- | ------------------------------------------------------------ |
| New backend files (floorplan)    | ~25 (seating, reservations, recipes modules)                 |
| New frontend files (floorplan)   | ~20 (tables, reservations, zones rewritten)                  |
| Modified files                   | ~30 (across all modules)                                     |
| Deleted files                    | 5 (old SeatForm, ZoneHeader, SeatBlock, ZoneSeatsPage, route)|
| New backend modules              | 5 (PriceLevels, Customers, Seating, Reservations, Recipes)   |
| New frontend modules             | 4 (price-level, tables, reservations, rewritten zones)        |
| New routes                       | 5 (tables, zones/$zoneId, price-levels × 4, reservations)     |
| TypeScript errors (new)          | 0                                                            |
| TypeScript errors (pre-existing) | 0                                                            |
| **Full `pnpm build`**            | ✅ **Pass** — both API + restaurant-ui build clean            |

---

## ✅ Verification Checklist (Full Project)

### Backend

- [x] `GET /api/health` — server is running
- [x] `POST /api/price-levels` — create price level → 201
- [x] `GET /api/price-levels` — list → paginated response
- [x] `PATCH /api/price-levels/:id/set-default` — sets isDefault, unsets others
- [x] `GET /api/price-levels/:id/pricing-grid` — returns all items with base/override/effective
- [x] `POST /api/price-levels/:id/pricing-grid` — bulk upsert prices → 201
- [x] `GET /api/price-levels/:priceLevelId/items/:itemId/effective-price` — returns effective price
- [x] `POST /api/customers` — create customer with auto price-level resolution
- [x] `GET /api/customers/search?q=` — returns lightweight results for POS combobox
- [x] `POST /api/tables` — create table
- [x] `GET /api/zones/:id/tables` — list tables in a zone
- [x] `PATCH /api/tables/:id/status` — toggle table status
- [x] `PATCH /api/tables/:id/position` — update table position
- [x] `GET /api/tables/unassigned` — list unassigned tables
- [x] `POST /api/reservations` — create reservation
- [x] `GET /api/reservations/conflicts?tableId=&dateTime=` — check conflicts
- [x] Items, categories, sales, POS all remain functional (no regressions)

### Frontend

- [x] Sidebar shows "Price Levels" under "Products"
- [x] Sidebar shows "Tables" and "Zones & Seating" under "Operations"
- [x] `/price-levels` → table loads with search/pagination
- [x] `/price-levels/create` → form saves and redirects to list
- [x] `/price-levels/:id/edit` → form populates with existing data, saves
- [x] `/price-levels/:id/pricing` → grid loads all items, editing prices works
- [x] `/tables` → table cards with status badges, 3D-ish visualization
- [x] `/zones` → zone list with gradient cards, create/edit zones
- [x] `/zones/$zoneId` → floor plan with draggable tables, add/remove tables
- [x] `/reservations` → live stat cards, CRUD form, search, status filters, seat action
- [x] POS (Bill Items) → seating panel with zone tabs, table grid, conflict badges
- [x] POS → customer combobox with search and inline add
- [x] `tsc --noEmit` — 0 errors (both apps)
- [x] `pnpm build` — clean build (both apps)
