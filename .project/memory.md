# Project Memory — Key Points

Fast-moving, high-signal notes: open questions, decisions made mid-work, gotchas,
things to remember for next time. Keep entries short. When something here becomes
permanently true of the project's architecture, promote it into `knowledge.md` and
remove it from here. Full narrative history of each prompt lives in `tasks/`.

Newest entries at the top.

---

## 2026-07-16 — Order item editing + kitchen availability flag + cancel-sync

- `OrdersService.updateItems()` (`PATCH /orders/:id/items`) lets staff swap/cancel items any time before charge (pending_confirmation or confirmed), even after the KOT was already sent — in that case it fires a labeled supplementary KOT rather than editing the original ticket. Reuses `PriceLevelsService.resolveLineItems()`.
- New advisory-only flag: `KotItem.isUnavailable`/`unavailableNote`, settable via `PATCH /kots/:kotId/items/:itemId/availability`. Never auto-changes the order — just surfaces on `Order.unavailableItems` (computed in `OrdersService`) so staff see it before charging.
- **Gotcha:** `KotService.findByOrderId()` didn't eager-load `items` — fine for its original callers (only touched `.id`/`.status`) but silently NPE'd the moment something needed `.items`. Fixed at the source. If you add a new consumer of an existing "find" method, check what relations it actually loads before assuming they're there.
- `SalesService.cancel()` now syncs the linked Order's status to cancelled (was a real gap — Order stayed "billed" forever after its Invoice got cancelled). Solved the SalesModule↔OrdersModule circular-import risk by injecting `Repository<Order>` directly into `SalesService` (register the entity via `TypeOrmModule.forFeature`, don't import the whole module) rather than depending on `OrdersService`.
- See `.project/tasks/2026-07-16-order-item-editing-kitchen-availability.md`.

---

## 2026-07-16 — Order stage added in front of Invoice (Regular/Party/Scheduled)

- New `orders` module: an `Order` now sits before `Invoice` in the sales flow. Regular (walk-in) orders go through it transparently (cashier still sees one Charge button); Party/Scheduled orders are placed+confirmed ahead of time, hold a table via an auto-created `Reservation`, and wait for an explicit "Send to Kitchen" action before the KOT fires. See `.project/tasks/2026-07-16-order-stage-regular-party-scheduled.md`.
- `SalesService.create()`'s price/GST resolution is now shared via `PriceLevelsService.resolveLineItems()` — reuse this for any future thing that needs to price a cart server-side (don't re-copy the old inline block).
- `Invoice.orderId` and `Order.invoiceId` cross-reference each other once charged; `Kot.orderId` now points at `Order.id` (it was already a loose unvalidated uuid, no schema change needed there).
- **Known gap, not fixed:** `ReservationRepository.findUpcomingForTable`'s conflict check computes a `deadline` but never applies it — it's not real interval-overlap logic, just "next upcoming reservation regardless of how far out." Pre-existing, surfaced during this feature's research, not touched. Worth fixing if double-booking of tables for party orders ever actually happens.
- **Known scope limit, not a bug:** no cron/time-based auto-firing of KOTs for Party/Scheduled orders — always a manual "Send to Kitchen" click. Flagged as a clean v2 if it turns out staff forget to do it manually.

---

## 2026-07-15 — Credit Note feature (post-serve bill correction)

- New `SalesService.createCreditNote()` — the answer to "customer wants to change a meal after billing": reverses specific line items' revenue/tax (not the whole invoice), optional per-line stock restore, optional same-flow replacement item charge. Reuses the Journal/Voucher engine built earlier today (posts a reversing entry crediting whichever account the original sale debited). See `.project/tasks/2026-07-15-credit-note-feature.md`.
- **Gotcha:** this app is on `@tanstack/react-query` v5 — `useQuery`'s `onSuccess`/`onError` callbacks were removed in v5 and silently no-op if used. Use `useEffect` on the query result instead when you need a side effect on first load.
- Confirmed the print-fix pattern from earlier today (portal any print-from-a-modal dialog to `document.body`) is the right general approach — no issues reusing it.

---

## 2026-07-15 — Print fix (portal pattern) + all payment methods exposed

- **Gotcha (feedback-worthy):** a screen-only modal dialog that must ALSO be printable should be rendered via `createPortal(..., document.body)`, not left nested in the normal component tree. Nesting it means print CSS has to fight the ancestor app layout's `overflow`/`max-height`/`position` (its wrappers still occupy layout space even when `visibility:hidden`, since only `display:none` truly removes layout) — portaling to `document.body` sidesteps all of that: print CSS becomes just `#root { display: none }` + minimal un-styling of the dialog's own wrapper. `ReceiptDialog.tsx` now does this; use the same pattern for any future print-from-a-modal feature.
- **Gotcha:** Tailwind's `print:hidden` utility is `display:none` — putting it on an ancestor of content you still want to print (rather than on the specific screen-only chrome like header buttons) silently kills the whole subtree. This caused the print bug reported right after the receipt dialog shipped.
- `ChargeModal.tsx` now exposes all 5 backend `PaymentMethod` values (cash/card/upi/online/credit) as selectable buttons — previously only Card/UPI were clickable even though Cash was the (unreachable) default and Online/Credit existed in the backend enum untouched.
- See `.project/tasks/2026-07-15-print-fix-and-payment-methods.md`.

---

## 2026-07-15 — Voucher/Journal double-entry accounting + invoice cancellation built

- Built a real double-entry layer: `LedgerAccount.accountType` (asset/liability/equity/revenue/expense) fixes `LedgerService.addEntry`'s balance formula (previously always `+` on credit/`-` on debit regardless of account type — flagged the session before). New `JournalEntry`/`JournalService.post()` (atomic, `sum(debit)===sum(credit)` enforced) + `JournalService.reverse()`. New `apps/api/src/vouchers/` module (Payment/Receipt/Journal vouchers) on top of it.
- POS Charge (`SalesService.create()`) now actually posts accounting — auto-creates a Receipt Voucher for cash/card/upi/online, or a bare Journal Entry (Debit Accounts Receivable) for credit sales. This closes the gap noted earlier today.
- New `SalesService.cancel()` (`POST /sales/:id/cancel`) reverses stock (new `RecipesService.reverseOnSale`), releases tables, cancels linked KOTs (new `KotService.findByOrderId`), and reverses the posted journal entry/voucher — all guarded against double-cancel.
- **Gotcha hit:** adding a NOT NULL column (`account_type`) to the already-seeded, non-empty `ledger_accounts` table crashed the running API on `synchronize: true` (Postgres refuses that ALTER without a default on non-empty tables). Fixed by hand via `psql`: create the enum, backfill by account name, then `SET NOT NULL`. **If any future change adds a non-nullable column to an entity backing an already-seeded table, expect this same crash** — either give it a default, make it nullable, or backfill via `psql` before restarting.
- **Gotcha:** any code path that does `movementRepo.create({...})` on `StockMovement` MUST set `storageUnitId` — it's NOT NULL since inventory became storage-unit-scoped. `SalesService.create()` and `RecipesService.deductOnSale()` were both missing it, so **every POS Charge silently 500'd**. Fixed both.
- Added `ReceiptDialog` (POS) so Charge shows/prints an actual invoice, and reused it in `SalesPage.tsx`'s "View" button. Added a "Cancel" button on `SalesPage.tsx`. New `/vouchers` page (list + Payment/Receipt/Journal forms).
- Verified end-to-end via curl (ledger balances move correctly in both directions, reversal restores exact baseline, double-cancel 400s) and Playwright (voucher creation, sales view/cancel, zero console/network errors). See `.project/tasks/2026-07-15-voucher-accounting-and-invoice-cancellation.md` and `.project/tasks/2026-07-15-pos-charge-invoice-receipt-fix.md`.

---

## 2026-07-13 — FormattedQuantity integrated into POS + Purchases

- **POS Dashboard:** Cart items show unit codes with quantities via `FormattedQuantity` (e.g., "2 bowl"). Price shown as `₹349.00 /bowl`. Menu cards display unit code next to GST.
- **PurchaseDetailDialog (new):** Full purchase order view with item-level formatted quantities, unit prices, GST rates, totals. Fetches `GET /purchases/:id` which now loads `items.item.unit` relations.
- **Purchases Page:** Items column shows Package icon with count. "View" button now wired to detail dialog (was a dead placeholder).
- **Backend fix:** `findById` in `purchases.service.ts` loads `{ items: { item: { unit: true } } }` for item names and unit codes.
- Full typecheck passes clean (0 new errors).
- See `.project/tasks/2026-07-13-pos-purchases-formatted-quantity.md`.

## 2026-07-13 — Fixed 17 report hardcoded values per feeback.md audit

- Fixed all 17 hardcoded/stub values in `reports.service.ts` identified by the `reports/feeback.md` audit: RPT-I09 (wired real StockCountService data), RPT-O02 (set `kot.preparedBy` in `kot.service.ts`), RPT-R02 (real `durationMinutes` from reservations), RPT-K06 (`throughputRate` = orders per hour), RPT-I05 (`wastageRate` from wastage/total revenue), RPT-F04 (`totalItc` from purchase items), RPT-F07 (real `paid` via ITC), RPT-F08 (real `openingBalance` from prior entries), RPT-C05 (real `avgAov`), RPT-C07 (real `preferredTime` from order hours), RPT-P06 (real `preferredSupplier` from purchase history), RPT-O03 (real `tablesActive`), RPT-O04 (real `reservations`/`noShows` + `wowChange`), RPT-O05 (real `currentStaff` from user count), RPT-O06 (real `creditOutstanding`), RPT-E01 (real `wastePercent`), RPT-E03 (real `customerScore`/`complianceScore`).
- Also fixed RPT-E05 (Avg Order Value `change`/`direction` computed from real data).
- **RPT-I09 was NOT_READY → now READY** (was the single easiest fix per the audit). All other fixed reports were PARTIAL → READY.
- Rebuilt `SalesSummaryPage.tsx` with richer visualizations (KPIs, daily trend, today's summary, payment breakdown, period stats).
- Remaining systemic gaps from feeback.md: sales→ledger writes, received-date tracking, reservation no-show cron, reason/cancelled-by columns, shift/attendance entity.
- See `.project/tasks/2026-07-13-fix-report-hardcoded-values.md`.

## 2026-07-13 — Backend format-quantity endpoint

- **Created `shared/utils/format-quantity.ts`:** Pure backend utility mirroring the frontend's `formatQuantity`, `compactQuantity`, `toLargerUnit` with 5 hardcoded hierarchies (gram↔kg, ml↔L, piece↔dozen, packet↔carton, bottle↔case). No DB dependency.
- **Created `units/dto/format-quantity.dto.ts`:** `FormatQuantityDto`, `FormatQuantityItemDto`, `FormatQuantityBatchDto` with proper `@ValidateNested` for batch request validation.
- **Updated `units.service.ts`:** Added 4 methods: `formatQuantity`, `compactQuantity`, `toLargerUnit`, `formatQuantityBatch`.
- **Updated `units.controller.ts`:** `GET /units/format` (single quantity — returns formatted/compact/numeric variants) + `POST /units/format-batch` (bulk formatting for reports).
- **Updated `units.api.ts` (frontend):** Added `formatQuantityApi()` and `formatQuantityBatchApi()` with full TypeScript types.
- Full typecheck passes clean (only pre-existing `items.service.spec.ts` errors remain).
- See `.project/tasks/2026-07-13-backend-format-quantity-endpoint.md`.

## 2026-07-13 — Multi-unit display helpers (format quantity as "3 kg 400 g")

- **Created `lib/format-quantity.ts`:** Pure utility with `formatQuantity()` ("3 kg 400 g"), `compactQuantity()` ("3.4 kg"), `toLargerUnit()` ("{ value: 3.4, unit: 'kg' }"). Handles gram↔kg (×1000), ml↔L (×1000), piece↔dozen (×12) hierarchies. Falls back to plain "{qty} {unit}" for non-hierarchy units (bowl, plate, cup, etc.).
- **Created `components/ui/FormattedQuantity.tsx`:** React component with three variants (`full`, `compact`, `numeric`) plus `QuantityRange` sub-component for "current / max" display.
- **Updated pages:** `InventoryPage` (stock column + min level), `BatchesPage` (batch remaining + total), `ViewBatchesDialog` (batch quantities), `StockStatusPage` (opening/current/min columns), `LowStockPage` (current/min/deficit columns) — all now show human-readable multi-unit quantities.
- Full typecheck passes clean.
- See `.project/tasks/2026-07-13-multi-unit-display-helpers.md`.

## 2026-07-13 — Taxability flags + ItemType added to Item entity

- **Entity:** Added `ItemType` enum (`goods`/`service`), `isTaxable` (default true), `cessPercent` (decimal 5,2), `reverseCharge` (default false). Fixed duplicate `GstRate` enum definition.
- **DTOs:** Added `create-item.dto.ts` validations: `@IsEnum(ItemType)`, `@IsBoolean()` for `isTaxable`/`reverseCharge`, `@IsNumber() @Min(0) @Max(100)` for `cessPercent`. Added missing `@Max` import.
- **Response DTO:** `item-response.dto.ts` now exposes `itemType`, `isTaxable`, `cessPercent`, `reverseCharge`.
- **Frontend types:** Added all new fields to `Item` and `CreateItemRequest` interfaces.
- **CreateItemPage:** Added `itemType` select (Goods/Service) and Taxability Settings section with `isTaxable` toggle, `reverseCharge` checkbox, `cessPercent` input + GST-exempt warning.
- **EditItemPage:** Added Taxability Settings section (same as create form).
- **Seed data:** `DemoItemDef` interface uses `ItemType` enum; `seedItems` propagates all new fields.
- Full typecheck passes clean (0 errors from new code).
- See `.project/tasks/2026-07-13-taxability-flags-item-type.md`.

## 2026-07-13 — Item-Supplier linking table (backend + frontend + seed)

- **New backend module `item-suppliers/`:** Entity with itemId, supplierId, supplierSku, unitPrice, unitId, leadTimeDays, isPreferred, minOrderQty, lastPurchaseDate/Price, notes, soft delete. Unique constraint on (itemId, supplierId).
- **REST API:** `GET /item-suppliers/item/:itemId`, `GET /item-suppliers/supplier/:supplierId`, `POST`, `PATCH/:id`, `DELETE/:id`, `POST set-preferred/:itemId/:supplierId`.
- **Seed:** 12 realistic item-supplier links (Butter Chicken→Spice World + Fresh Foods, etc.).
- **Frontend module `item-suppliers/`:** Types, API functions, React Query hooks (useItemSuppliers, useCreateItemSupplier, useUpdateItemSupplier, useDeleteItemSupplier, useSetPreferredSupplier).
- **ItemSuppliersDialog:** Full CRUD UI shown as a card section in EditItemPage's new Suppliers tab. Features: supplier selector (with already-linked guard), unit price + price unit dropdown, lead time, min order qty, preferred flag toggle, edit/delete/preferred actions, supplier contact info display.
- **EditItemPage:** Added "Suppliers" tab alongside existing Details and Recipe/BOM tabs.
- Full typecheck passes clean (0 errors in new code, only pre-existing test spec errors in backend).
- See `.project/tasks/2026-07-13-item-supplier-linking.md`.

## 2026-07-13 — Batch Tracking UI built for inventory module

- **Backend:** Added `getAllBatches()` service method and `GET /inventory/batches/all` endpoint returning all batches with item/category/storageUnit relations.
- **Frontend batch tracking module:** Added `StockBatch` type, batch API functions (`getAllBatches`, `getItemBatches`, `getNearExpiryBatches`), React Query hooks (`useAllBatches`, `useItemBatches`, `useNearExpiryBatches`).
- **BatchesPage** (`/inventory/batches`): Full page with KPI cards (total/active/expiring/exhausted), near-expiry alert section (critical ≤7 days + warning ≤30 days), status filter tabs, expandable batch list grouped by item.
- **ViewBatchesDialog**: Per-item batch dialog accessible from InventoryPage's row actions.
- **Sidebar:** Added "Batches" link (Layers icon) under Inventory section.
- Full typecheck passes clean; route tree auto-generated.
- See `.project/tasks/2026-07-13-batch-tracking-ui.md`.

## 2026-07-13 — Seed data for all remaining modules

- Added **7 new seed methods** to `database-seed.service.ts`: `seedSecondStorageUnit`, `seedBatches`, `seedCustomers`, `seedPriceLevels`, `seedRecipes`, `seedReservations`, `seedStockCounts`.
- Added **9 new repo injections** and **entity imports** for StockBatch, StockCount, StockCountLine, Customer, PriceLevel, ItemPriceLevel, Recipe, RecipeIngredient, Reservation.
- **Critical fix in `database.module.ts`:** Added the 9 missing entity registrations to `TypeOrmModule.forFeature()` — without these, server fails on startup with DI errors.
- Verified: all seed counts match expectations (customers: 5, price_levels: 3, item_price_levels: 30, recipes: 5, reservations: 5, stock_batches: 4, stock_counts: 1, storage_units: 2).
- See `.project/tasks/2026-07-13-seed-remaining-modules.md`.


- Implemented all 55 remaining report endpoints across 8 categories (Inventory 8, Financial 6, Kitchen 7, Customer 8, Reservation 6, Procurement 7, Operations 8, Executive 5).
- Updated `reports.module.ts` with new TypeORM repos: Kot, KotItem, Reservation, Customer, Table, Zone, Supplier, User, Organization.
- Added 55 service methods to `reports.service.ts` and 55 controller endpoints to `reports.controller.ts`.
- All 71 report endpoints now serve live data (12 Sales + 10 Inventory + 8 Financial + 7 Kitchen + 8 Customer + 6 Reservation + 7 Procurement + 8 Operations + 5 Executive).
- `tsc` passes clean for all reports code (0 new errors).
- See `.project/tasks/2026-07-12-report-backend-endpoints.md`.

## 2026-07-12 — SOLID report UI framework (all 55 remaining reports)

- Built a SOLID-principled reusable report UI framework: `ReportConfig` types, `ReportPageLayout`/`ReportKpiGrid`/`ReportDataTable` framework components, `useGenericReport` hook, `GenericReportPage` with dynamic `$reportId` route.
- Created 8 declarative config files with all 55 reports across Inventory, Financial, Kitchen, Customer, Reservation, Procurement, Operations, Executive categories.
- Rewrote `ReportsPage.tsx` hub to group all 69 reports by category with proper links.
- **Key architectural decision**: Reports are now declarative config objects rather than individual page components. Adding a new report = adding a config entry, no new component/route needed.
- `tsc` passes clean for all new code (3 pre-existing errors unchanged).
- Backend endpoints for most reports still need implementation.
- See `.project/tasks/2026-07-12-solid-report-ui-framework.md`.

## 2026-07-12 — Sales reports S07-S08-S10-S11 (4 missing reports)

- Implemented 4 missing Sales & Revenue reports: RPT-S07 (Weekly/Monthly Trends), RPT-S08 (Discount Analysis), RPT-S10 (Invoice-Level Drill-Down), RPT-S11 (Cancelled & Voided Transactions).
- Backend: 4 service methods + 4 controller endpoints. Frontend: types, API functions, React Query hooks, 4 page components, 4 route files, hub page links.
- Total report endpoints now 16 (up from 12). All 12 Sales reports complete.
- `tsc` passes clean for all new code (pre-existing errors in database-seed.service.ts, unit-conversion.repository.ts, DashboardPage, ZoneListPage unchanged).
- Fixed a duplicate `upTo5Percent` key bug in Discount Analysis service method.
- See `.project/tasks/2026-07-12-sales-reports-s07-s08-s10-s11.md`.

## 2026-07-12 — Module 9: Nav & routing (all 9 modules complete 🎉)

- Added `{ to: '/tables', label: 'Tables', icon: Table }` to the Operations section
  in `AppSidebar.tsx`, before the Zones link, making Module 5's page reachable.
- `routeTree.gen.ts` auto-regenerates on next dev server start.
- All 9 floorplan modules are now implemented.
- `tsc --noEmit` passes clean for the change.
- See `.project/tasks/2026-07-12-module-9-nav-routing.md`.

## 2026-07-12 — Module 8: POS conflict warning

- SeatingPanel now fetches reservation conflicts in parallel via `useQueries` for all
  tables in the active zone. Shows conflict badge with guest/time info, confirm dialog
  on double-booking click via `window.confirm()`.
- Completed `seatIds`→`tableIds` rename in POS module (api + dashboard).
- `tsc --noEmit` passes clean for all changed files.
- See `.project/tasks/2026-07-12-module-8-pos-conflict-warning.md`.

## 2026-07-12 — Module 7: Reservations UI wired to backend

- Created complete reservations frontend module: types, API client (8 endpoints),
  React Query hooks. Rewrote mock-based `ReservationsPage` with live API data.
- Features: live stat cards (today count, guests expected, tables available, pending),
  inline create/edit form, real-time search, status filter pills, row actions
  (confirm, seat with table selector, edit, cancel, delete), weekly calendar view.
- `tsc --noEmit` passes clean (0 errors).
- See `.project/tasks/2026-07-12-module-7-reservations-ui.md`.

## 2026-07-12 — Reports Module (backend + frontend)

- Created dedicated `reports/` backend module at `apps/api/src/reports/` (no entities, service + controller only).
- 12 report endpoints: daily sales, sales summary, by-payment-method, by-category, popular-items, GST, hourly distribution, veg/non-veg, stock status, low stock, balance sheet, P&L.
- Frontend: full module structure (types, api, hooks, components, pages). 8 report pages + hub page.
- Route files in `src/routes/reports/` — TanStack Router auto-discovers them.
- Shared components: `DateRangeFilter` (with presets), `ReportPageHeader`, `KpiCard`, `ReportCard`, `LoadingSkeleton`.
- `ReportsPage.tsx` is now a hub linking to all sub-reports, no longer inline data fetching.
- `tsc --noEmit` passes clean in both apps.
- **Gotcha:** Route files in `src/routes/reports/` need `../../modules/reports/pages/` import path (not `../`).
- See `.project/tasks/2026-07-12-reports-backend-and-ui.md`.

---

## 2026-07-12 — Module 6: Zone floorplan UI

- Major frontend restructure: replaced Seat auto-grid with real draggable coordinate canvas.
- Removed `sortOrder` from frontend zone types, form, and card display.
- Changed route from `/zones/$zoneId/seats` to `/zones/$zoneId`.
- `FloorPlanView` now uses absolutely-positioned tables at stored `posX`/`posY` with
  pointer-event drag (no new dependencies).
- `ZoneFloorPlanPage` replaces `ZoneSeatsPage` with "Add Tables" picker for unassigned tables.
- `SeatingPanel` updated to use `getZoneTables`/`Table` type, zones sorted by name.
- Deleted old Seat-specific files: SeatForm, ZoneHeader, SeatBlock, ZoneSeatsPage, old route.
- Several TS errors found and fixed during implementation.
- `tsc --noEmit` passes clean for all changed files.
- See `.project/tasks/2026-07-12-module-6-zone-floorplan-ui.md`.

## 2026-07-12 — Module 5: Table management UI

- Created new `modules/tables/` frontend module: types, API client, CRUD page, route.
- `TableListPage` has inline form, color-coded status badges, quick status toggle,
  per-row zone reassign dropdown, edit/delete actions, stats footer.
- Route file `routes/tables.tsx` auto-discovered by TanStack Router codegen.
- `tsc --noEmit` passes clean in restaurant-ui (0 errors).
- See `.project/tasks/2026-07-12-module-5-table-management-ui.md`.

## 2026-07-12 — Module 4: Sales/KOT field rename

- Renamed `seatIds` → `tableIds` across 9 files: sales entity/DTO/service/controller/spec,
  kot entity/service/spec, database seed service.
- Renamed `clearSeats()` → `clearTables()` in sales service + controller.
- Route `/clear-seats` → `/clear-tables`.
- `database-seed.service.ts` had 2 stale `seatIds: null` references (caught by tsc).
- `tsc --noEmit` passes clean.
- See `.project/tasks/2026-07-12-module-4-sales-kot-rename.md`.

## 2026-07-12 — Module 3: Reservation entity backend

- Created complete `apps/api/src/reservations/` module (entity, DTOs, repository,
  service, controller, module registration).
- Key features: `status`/`source` enums, lazy-expiry (auto no_show after 15min
  grace past scheduled window), `checkTableConflict` for POS (module 8),
  `seat()` action to link table + occupy.
- FK to `Table` with `onDelete: 'SET NULL'`.
- Registered in `app.module.ts`.
- Bugs caught by tsc + code review: route ordering (conflict before :id),
  missing `await` in `checkTableConflict`, repository date filter typed wrong.
- `tsc --noEmit` passes clean.
- See `.project/tasks/2026-07-12-module-3-reservation-entity-backend.md`.

## 2026-07-12 — Module 2: Seat → standalone Table entity

- Complete Seat→Table rename across the entire backend vertical slice:
  - New `Table` entity with nullable `zoneId` (`onDelete: 'SET NULL'`), `posX`/`posY`
  - New DTOs, repository (with `findUnassigned`, `updatePosition`, `assignToZone`),
    service, controller with `/tables` endpoints
  - Updated `seating.module.ts` (register, export `TablesService`)
  - Updated `zones.controller.ts`: `getSeats`→`getTables`, `/zones/:id/tables`
  - Updated `sales.service.ts` + spec: `SeatsService`→`TablesService`
- Deleted all 7 old Seat files.
- Per the module spec: did NOT touch Sales/Kot entity field names (`seatIds` —
  Module 4) or frontend (Modules 5-6).
- `tsc --noEmit` passes clean.
- See `.project/tasks/2026-07-12-module-2-seat-to-table-entity.md`.

## 2026-07-12 — Module 1: Zone cleanup — removed sortOrder

- Followed `floorplan/README.md` and `zone-cleanup.md` spec.
- Removed `Zone.sortOrder` column, `idx_zone_sort` index, DTO field, service
  assignment, and repository's `sortOrder`-based ordering — replaced with
  `order: { name: 'ASC' }`.
- Did NOT touch frontend (handled in Module 6 per plan).
- `tsc --noEmit` passes clean.
- See `.project/tasks/2026-07-12-zone-cleanup-remove-sortorder.md`.

## 2026-07-11 — Zone Management UI with 3D seating visualization

- Redesigned zone management with CSS-powered isometric 3D floor plan.
- New components under `modules/zones/components/`:
  - `FloorPlanView.tsx` — Perspective grid floor with stats bar, rotate control
  - `SeatBlock.tsx` — 3D-ish isometric block with top/side faces, status colors,
    shadows, and hover lift effects
  - `ZoneHeader.tsx` — Zone detail header with back nav
  - `SeatForm.tsx` — Add/edit seat form (extracted)
- Rewritten `ZoneSeatsPage.tsx` — Split layout: 3D floor plan + seat list panel
- Enhanced `ZoneListPage.tsx` — Visual gradient zone cards with status toggles
- Applied consistent 55° isometric angle across all transforms.
- See `.project/tasks/2026-07-11-zone-management-3d.md`.

## 2026-07-11 — Redesigned Settings Page with SOLID principles

- Refactored monolithic `SettingsPage.tsx` into 7 focused component files
  under `modules/settings/components/`.
- Architecture follows all 5 SOLID principles in a React context:
  - **S**: Each component has one reason to change (FormField, PageHeader,
    SettingsSection, SuccessToast, LoadingState, ErrorState, SectionHeader).
  - **O**: New sections/fields can be added without modifying existing components
    (composition via children + uniform prop interfaces).
  - **L**: FormField, NumberField, TextAreaField share a common prop interface
    and are interchangeable.
  - **I**: Each component has minimal, focused props (no monolithic interfaces).
  - **D**: SettingsPage composes via hooks and props, knows nothing about APIs.
- Created `useOrganizationSettings` hook to own form state + save lifecycle,
  separating data concerns from presentation.
- Fixed initial state to use typed `DEFAULT_FORM` constant instead of cast.
- See `.project/tasks/2026-07-11-settings-page-solid.md`.

## 2026-07-11 — Built Company Settings feature (backend + frontend)

- Created new `OrganizationModule` with entity, service (singleton pattern),
  controller (GET/PUT), and proper DTO validation.
- Entity has all fields: restaurantName, tagline, address, city/state/pincode,
  phone/email/website, gstin, fssaiLicense, currency, timezone, tax settings,
  business hours (simple-json), invoice footer.
- Applied `decimalTransformer` to decimal columns per project conventions.
- On startup, auto-creates default org record if none exists.
- Frontend: `SettingsPage.tsx` rewritten to use live API data via React Query,
  with proper form, loading state, error state, and success toast.
- Registered in sidebar (already existed as `/settings` route).
- See `.project/tasks/2026-07-11-company-settings.md`.

## 2026-07-11 — Recipe Engineering + Zone/Seat Admin Pages

- **Task 3 (Recipe Engineering) fully implemented:** Backend module (`apps/api/src/recipes/`) with `Recipe`, `RecipeIngredient`, `ProductionEntry` entities; service with `computeCost` (recursive with circular-reference guard), `deductOnSale` (recipe-based stock deduction at sale time), `createProductionEntry` (transactional raw-material deduction + yield stock addition); controller with REST routes. Registered in `app.module.ts`.
- **Item entity updated:** Added `productType` column (enum: `raw`, `semi_finished`, `finished`, default `finished`). Added to `CreateItemDto` and both frontend forms.
- **Inventory enum updated:** Added `PRODUCTION_CONSUMPTION` and `PRODUCTION_YIELD` movement types.
- **SalesService updated:** After saving an invoice, calls `recipesService.deductOnSale()` for each item. Falls back to direct deduction if no recipe exists. `SalesModule` now imports `RecipesModule` and registers Inventory/StockMovement repos.
- **Frontend recipes module:** Types, API client, TanStack Query hooks, `RecipeEditor` component (embedded in Item edit page's "Recipe / BOM" tab), `KitchenPrepPage` standalone page.
- **Zone/Seat admin pages:** `ZoneListPage` (CRUD + toggle active), `ZoneSeatsPage` (seat grid with status management), routes at `/zones` and `/zones/$zoneId/seats`.
- **Sidebar updated:** "Kitchen Prep" under Inventory, "Zones & Seating" under Operations.
- **Test specs fixed:** All 4 pre-existing type errors in `items.service.spec.ts`, `kot.service.spec.ts`, `sales.service.spec.ts` resolved. `sales.service.spec.ts` updated with mocks for new dependencies (PriceLevelsService, SeatsService, CustomersService, RecipesService).
- 0 TypeScript errors in both apps.
- **Deferred:** Unit tests for recipes service, e2e tests for recipes API (need proper integration test setup with mocked dependencies).
- See `.project/tasks/2026-07-11-recipe-engineering-and-zones-admin.md`.

## 2026-07-11 — Fixed 500 on customer save: union-type + recipes module build

- POS customer creation returned 500 because `Customer.entity.ts` had
  `@Column({ length: 255, nullable: true })` on `email`/`gstin` without
  `type: 'varchar'` — TypeORM inferred `Object` from `string | null` union,
  which postgres rejects (`DataTypeNotSupportedError`). Same class of bug
  as the earlier nullable-column gotcha documented in `knowledge.md`.
- Also fixed pre-existing build errors in the `recipes` module:
  - `recipes.module.ts` used wrong import paths (`../entities/recipe.entity`
    instead of `./entities/recipe.entity`, etc.) — all 5 "cannot find module"
    errors fixed.
  - `ProductionEntry` entity was imported as a separate file but was defined
    inside `recipe.entity.ts` — extracted into
    `recipes/entities/production-entry.entity.ts`.
  - `IProductionEntryRepository.findByItem` return type was missing `page`
    and `limit` that the implementation returns — added them.
- Verified: `npx nest build` now passes clean (only pre-existing test spec
  errors remain).
- See `.project/tasks/2026-07-11-customer-save-500-fix.md`.

## 2026-07-11 — POS Screen Fix + Customer/Zones Frontend + Seating Panel

- **Problem:** POS dashboard was broken — it sent `tableNumbers` + `unitPrice` in the billing payload, but the backend now expects `seatIds` + no `unitPrice` (server-side price resolution). `CreateInvoiceDto` with `class-validator` would reject the old payload format.
- **Fixed `pos.api.ts`:** Dropped `tableNumbers`, `unitPrice`, `itemName`, `hsnCode`, `gstRate` from invoice items. Added `customerId`, `seatIds`, `clearInvoiceSeats()`. New `CreateKotRequest` interface uses `seatIds` instead of `tableNumbers`.
- **Created customers frontend module:** types, API client (`searchCustomers`, CRUD), TanStack Query hooks, `CustomerCombobox` component with inline add (no page navigation).
- **Created zones frontend module:** types, API client (`getZones`, `getZoneSeats`, seat CRUD/status), TanStack Query hooks, `SeatingPanel` component for POS (zone tabs, seat grid with status colors/category icons, multi-select).
- **Updated `POSDashboard.tsx`:** Replaced old `PREDEFINED_TABLES`/`selectedTables`/`tableInput` with `SeatingPanel`. Replaced plain `customerName` text input with `CustomerCombobox`. Fixed billing payload — sends only `itemId` + `quantity`, no `unitPrice`. Added "Clear seats" action in success message.
- **Not done:** Recipe Engineering (Task 3). Customer/Zones admin CRUD pages (out of POS scope).
- 0 new TypeScript errors in both apps (API: only 4 pre-existing test spec errors).
- See `.project/tasks/2026-07-11-pos-screen-fix.md`.

## 2026-07-11 — Price Level Management + Customer Module (Task 1 + partial Task 2)

- **Task 1 — Price Level Management:** Full implementation (backend + frontend).
  - Backend: `PriceLevel` + `ItemPriceLevel` entities, DTOs, repositories, service with transactional `setDefault()`/`createWithDefault()`/`updateWithDefault()`, REST controller at `price-levels` with CRUD + action routes + pricing grid + effective-price-lookup.
  - All money columns use the existing `decimalTransformer`.
  - Frontend: Types, Zod schema, API client, TanStack Query hooks, 3 pages (list, form, pricing grid), 4 file-based routes, sidebar nav entry under "Products".
  - Registered `PriceLevelsModule` in `app.module.ts`, exports `PriceLevelsService` for future Sales/POS integration.
- **Task 2 (partial) — Customer API backend:** `Customer` entity, DTOs, repository with ILIKE search for POS type-ahead, service with price-level resolution logic (explicit > type-match-by-code > default fallback), REST controller at `customers` with CRUD + search + restore.
  - Registered `CustomersModule` in `app.module.ts`.
- **Not done:** Zone/Seat entities + API, CustomerCombobox frontend, SeatingPanel, POSDashboard.tsx integration, Sales CreateInvoiceDto validation + server-side price resolution, Recipe Engineering (Task 3).
- **Gotcha:** TypeORM `find({ where: { deletedAt: null } })` does NOT accept `null` for Date columns — must use `IsNull()`. Had to fix this in `PriceLevelsService.getPricingGrid()`.
- All new TypeScript errors: 0. Pre-existing test spec errors: 4 (unchanged).
- See `.project/tasks/2026-07-11-price-levels-and-customers.md`.

## 2026-07-09 — Wired up dead Inventory action buttons (Add Item / Adjust / History)

- `InventoryPage.tsx`'s "Add Item", "Adjust", and "History" buttons were plain
  `<button>`s with no `onClick` — clicking them did nothing at all (found by
  driving `/inventory` in a real browser, not by reading code). The backend API
  and the frontend `inventory.api.ts`/`useInventoryQueries.ts` hooks already
  existed and worked fine — only the dialogs to invoke them were never built.
- Added `modules/inventory/components/InventoryModal.tsx` (reusable centered
  modal, same dialog conventions as `OrdersPage.tsx`'s drawer) and three
  dialogs in `modules/inventory/dialogs/`: `AdjustStockDialog`,
  `StockHistoryDialog`, `AddInventoryItemDialog`. Verified live: stock updates
  after Adjust, History shows the movement, Add Item search-and-select works.
- `InventoryRow` only carried the inventory record's own `id`; had to add
  `itemId` to it since every mutation (`adjustStock`, `setOpeningBalance`,
  `getStockMovements`) is keyed by the underlying item id, not the inventory
  record id.
- Not done: the "Filters" button next to search is still unwired (lower
  priority — search + status pills already cover what's filterable
  server-side); no UI to edit `minStockLevel` after creation (backend always
  sets it to 0 on first opening-balance save, no update endpoint exists).
- See `.project/tasks/2026-07-09-fix-inventory-actions.md`.

## 2026-07-09 — Fixed POS Terminal crash (decimal-as-string + wrong axios instance)

- Found by actually driving the running app in headless Chromium (login → `/pos`),
  not by reading code — the error boundary was swallowing a real crash.
- **New systemic gotcha, same family as the earlier nullable-column one**: pg/TypeORM
  returns `decimal`/`numeric` columns as JS **strings**, but every entity in this repo
  typed them as `number` with no transformer. `Item.price.toFixed()` in
  `POSDashboard.tsx` crashed the whole page. Fixed with a shared
  `apps/api/src/shared/transformers/decimal.transformer.ts` (`ValueTransformer`,
  `parseFloat` on read) applied to every `@Column({ type: 'decimal' })` in
  `item`, `sales`, `purchase`, `ledger`, `inventory`, `kot` entities. Any *new*
  decimal column must add `transformer: decimalTransformer` or it'll silently
  regress to a string at runtime — `tsc` can't catch this, only hitting the real
  DB does (same class of blind spot as the nullable-column bug above).
- Second, unrelated bug: `apps/restaurant-ui/src/modules/category/api/category.api.ts`
  imported raw `axios` instead of the app's `apiClient` (`src/lib/axios-client.ts`),
  so it never got the auth token header → `/api/categories` always 401'd. Every other
  `*.api.ts` module already used `apiClient`; this was the one file that didn't.
- Not done (found, out of scope): `apps/api` `tsc --noEmit` has 4 pre-existing type
  errors — `kot.service.spec.ts`/`sales.service.spec.ts` still reference a singular
  `tableNumber` field that was renamed to `tableNumbers` (array) at some earlier
  point; `items.service.spec.ts` has 2 unrelated stale-type errors. Tests still pass
  (ts-jest doesn't hard-fail on type errors) but the specs should be updated.
- See `.project/tasks/2026-07-09-fix-pos-terminal-crash.md`.

## 2026-07-09 — Inventory Management Module functional spec written

- Full business/functional spec (no tech stack) for a 12-sub-module Inventory Management
  system written to `.project/docs/inventory-management-module-spec.md`: Units, Categories,
  Items, Suppliers, Purchases, Goods Receipt, Stock Adjustments, Stock Consumption, Stock
  Transfer, Waste Management, Stock Count, Inventory Reports.
- This is considerably broader than what's implemented today — the codebase currently only
  has `items`, `inventory` (basic on-hand + opening balance), `purchases`, and `suppliers`
  modules. Goods Receipt, Stock Transfer, Waste Management, and Stock Count don't exist yet.
- Spec recommends adding a dedicated **Storekeeper/Inventory** role (doesn't exist among the
  6 seeded roles) to own receiving/adjustments/counts, defaulting to Manager until added.
- Key open decisions flagged in the spec that need a real business call before/during
  implementation: negative-stock policy (block vs. warn-and-allow, globally or per item) and
  over-receipt tolerance policy for Goods Receipt.
- See `.project/tasks/2026-07-09-inventory-module-functional-spec.md` for full detail.

## 2026-07-08 — Health check API + Docker auto-seed

- Added `GET /api/health` (public endpoint) that returns server status, DB connectivity, uptime, NODE_ENV.
- Updated docker-compose.yml: `NODE_ENV=development` enables TypeORM schema sync + auto-seed on startup. Added healthcheck for API service (wget on Alpine).
- Demo data seeds automatically when `docker compose up` runs on a fresh database.
- 0 TypeScript errors.

## 2026-07-08 — Beautified OrdersPage with Tailwind CSS v4

- Completely redesigned `apps/restaurant-ui/src/modules/orders/pages/OrdersPage.tsx` from custom CSS to Tailwind v4, matching the dashboard's design language.
- Adds: KPI stat cards (total/in-progress/completed/revenue), status filter tabs with counts, search + filter bar, modern table with hover states & server avatars, slide-out order details drawer with status actions, empty state, footer stats.
- Drawer has ARIA accessibility: `role=dialog`, `aria-modal`, `aria-label`, Escape-to-close, close-button `aria-label`.
- 0 TypeScript errors.

## 2026-07-08 — Unit tests for auth, users, category services

- Wrote 81 unit tests across 3 service spec files (all pass):
  - `auth.service.spec.ts` (17 tests): login (success, not found, inactive, wrong pwd), refresh (rotation, expiry, inactive user), logout, register (conflict, no role), profile
  - `users.service.spec.ts` (18 tests): findAll/findOne/findByEmail, create (conflict, role), update (conflict, role), soft-delete, restore (not-deleted guard)
  - `category.service.spec.ts` (46 tests): create (slug/name/parent/depth validations), findOne/findBySlug, getTree/breadcrumb/children/descendants/ancestors, update, move (root/parent/circular/self), remove (force/non-force), restore, activate/deactivate, paginated findAll/getRoots
- Key gotchas: `jest.spyOn(bcrypt, ...)` fails (bcrypt uses non-configurable C++ addon props) → use `jest.mock('bcrypt', ...)`; uuid v9+ is ESM-only → use `jest.mock('uuid', ...)`; standalone `jest.fn()` with `.mockResolvedValueOnce()` chain is more reliable than chaining `.mockResolvedValueOnce()` + `.mockResolvedValue()` on existing repository mock for tests with variable call counts.

## 2026-07-08 — Docker setup for backend + PostgreSQL

- Created `apps/api/Dockerfile` (multi-stage build using pnpm monorepo), `apps/api/.dockerignore`, `docker-compose.yml` (api + postgres:16-alpine).
- Dockerfile: builder stage installs deps, builds, prunes dev deps; runner stage is minimal Alpine with only dist/ and production node_modules.
- docker-compose.yml: db on host port 5433 (avoids clash with existing PG containers), api on port 3000, depends_on with healthcheck, persistent volume for DB data.
- .env.production updated with Docker-safe defaults (DB_HOST=db, JWT_SECRET placeholder, JWT_EXPIRES_IN=1h).
- Could not build in-session (Docker daemon not in this env). Run `docker compose build` locally.

## 2026-07-08 — Seeded all roles, permissions, and users

- Seed service rewritten to be idempotent: 77 permissions across 17 modules, 6 roles (added chef, cashier, waiter), 6 demo users.
- New seed data: 5 suppliers, 15 Indian cuisine items with GST, inventory for 15 items (opening stock 50), 8 ledger accounts.

## 2026-07-08 — Added logout option

- Added logout button in sidebar footer (red icon + text) and header user dropdown.
- Both sidebar and header now show real user data from AuthContext instead of hardcoded "John Doe".
- Logout calls POST /api/auth/logout, clears localStorage, redirects to /login.
- 0 TypeScript errors.

## 2026-07-08 — Fixed auth flow: login → dashboard, not orders

- Login moved to `/login` route (was at `/`). Dashboard now lives at `/` root route.
- Created proper DashboardPage with KPI cards, revenue chart, popular items, recent orders, quick actions.
- LoginPage now redirects to `/` (dashboard) instead of `/orders`.
- AppLayout updated: `/login` = no layout, `/` = dashboard with sidebar.
- 0 TypeScript errors.

## 2026-07-08 — Started API server to fix login 500

- Login was returning 500 because the API server on port 3000 was not running.
- Rebuilt and started the server (`node dist/main.js`). Both direct and Vite-proxied login endpoints now return 201 with valid JWT tokens.
- No code changes needed — entity fixes from the previous session were already compiled in.

## 2026-07-08 — Updated DB_NAME to restaurant_erp

- Updated `.env.development` to use `DB_NAME=restaurant_erp` (was `restaurant_erp_dev`), matching the user's connection string `postgresql://primesysindia@localhost:5432/restaurant_erp`.
- The `restaurant_erp` database already has all 18 tables and seed data.

## 2026-07-08 — Fixed login 500 error (TypeORM nullable column gotcha)

- Root cause: API server crashed on startup with `DataTypeNotSupportedError: Data type "Object" in "Supplier.gstin"`.
  The same `string | null` without `type: 'varchar'` bug hit 8 columns across 4 new entities from the POS build.
- Fixed in `Supplier.gstin`, `Supplier.contactPerson`, `Invoice.customerName`, `Invoice.customerPhone`,
  `Invoice.customerGstin`, `Invoice.tableNumber`, `LedgerAccount.financialYear`, `Kot.tableNumber`.
- Verified all 43 nullable columns across all 12 entities now have explicit `type:` — no remaining vulnerabilities.
- Login endpoint now returns 200 with valid JWT access + refresh tokens.

## 2026-07-08 — Real login wired up (was a fake `setTimeout`)

- Login page now actually authenticates: prefilled demo credentials, real
  `POST /api/auth/login` call, token stored + applied to axios defaults via new
  `src/lib/session.ts`, redirects to `/orders` on success. See
  `.project/tasks/2026-07-08-wire-real-login.md`.
- Gotcha found: `apps/restaurant-ui/vite.config.ts` had no dev proxy, so every
  relative `/api/*` axios call (category API included) was already silently
  broken in `pnpm dev` before this fix. Added `server.proxy['/api'] →
  localhost:3000`.
- Gotcha: Vite doesn't hot-reload `vite.config.ts` — any already-running dev
  server needs a manual restart to pick up the new proxy.
- No browser tool / project run-skill existed for this repo; verified the
  login flow with an ad-hoc Playwright script (`playwright-core` installed
  temporarily in the scratchpad dir, not a repo dependency). Worth generating
  a real project run-skill (`/run-skill-generator`) next time this comes up.
- Not done: no route guard/protected-route pattern anywhere (all routes are
  reachable unauthenticated); sidebar user display is still static placeholder
  data, not wired to the logged-in user.

## 2026-07-08 — Full POS billing system built (GST, KOT, Inventory, Ledger, Reports)

- Built 7 new backend modules: Items, Inventory (with opening balance), Purchases,
  Suppliers, Sales (with GST), KOT, Ledger (financial). Auth upgraded with refresh
  token rotation.
- Frontend: React 19 upgrade, AuthContext + AxiosClient with auto-refresh
  interceptor, complete POS with GST billing (CGST/SGST/INR), KOT board with
  kitchen station management, Sales/Invoices, Purchases, Ledger pages.
- Sidebar completely reorganized with all new module links.
- 0 TypeScript errors in both apps (`tsc --noEmit` passes clean).
- Not done: route guards for unauthenticated access, inventory opening balance UI
  form, dedicated Reports viewer page (exists as backend endpoints, frontend
  ReportsPage still shows static data).

## 2026-07-08 — Comprehensive README written

- Created `README.md` with full project documentation: 12 feature modules described,
  tech stack tables, architecture patterns, API endpoint reference, setup guide, and
  a detailed "How This Project Was Created" section documenting all 10 prompts used
  to build the project.

## 2026-07-08 — Dev/prod envs created, backend seeded, local dev DB is live

- `apps/api` now loads `.env.development` or `.env.production` (picked by
  `NODE_ENV`, set in the `start:dev`/`start:prod` scripts). `.env.production`
  is a placeholder template only — no real prod credentials exist anywhere.
- Local dev Postgres database `restaurant_erp_dev` exists on this machine
  (localhost:5432, user `primesysindia`, trust auth) and is seeded: 3 demo
  users (admin/manager/staff), 3 roles, 48 permissions, 11 demo categories.
- **Real bug found while seeding, not by lint/typecheck**: TypeORM entity
  columns typed `string | null` without an explicit `type:` option throw
  `DataTypeNotSupportedError` at DB-connect time (TS erases union types to
  `Object` in decorator metadata). Fixed across `User.phone`/`roleId` and
  `CategoryEntity.parentId/createdBy/updatedBy/deletedBy/icon/image`. Worth
  remembering: `tsc`/`eslint` cannot catch this class of bug — only actually
  connecting to a real database surfaces it. See
  `.project/tasks/2026-07-08-seed-backend-data.md`.
- Demo credentials (also shown on the login page): `admin@restaurant.com` /
  `Admin@123456`.

## 2026-07-08 — Fixed all project errors; repo is green

- `pnpm build` / `pnpm lint` / API `jest` all pass clean across `@repo/api`,
  `@repo/restaurant-ui`, `@repo/ui`. See
  `.project/tasks/2026-07-08-fix-all-project-errors.md` for the full list.
- Gotcha: root `package.json` must keep `@repo/eslint-config` as a devDependency
  — root `.eslintrc.js` extends it, and eslint 8 (used by restaurant-ui) walks
  up to root config, which breaks entirely if the package isn't linked.
- Gotcha: `apps/restaurant-ui`'s `lint` script must glob `*.{ts,tsx}`, not just
  `*.ts` — it was silently skipping all `.tsx` files before.
- Open follow-ups (not done, would be feature work): `UsersController.update`
  has no real self-vs-admin authorization despite an old comment implying one;
  `CategoryDetailsPage` has no activate/deactivate control unlike the list page.
- Demo login: `apps/restaurant-ui` login page now shows the real demo password
  (`Admin@123456` for `admin@restaurant.com`) instead of masking it — matches
  the seed data in `apps/api/src/database/database-seed.service.ts`.

## 2026-07-08 — Added `.project/prompt.md` as the directive entry point

- `AGENTS.md` now points agents at `.project/prompt.md` first, which spells out
  the exact procedure (read memory before starting; write a task file + update
  memory + maybe update knowledge after finishing) so the workflow is followed
  automatically every session, not just when re-explained.

## 2026-07-08 — Documentation system bootstrapped

- Created `.project/knowledge.md`, `.project/memory.md`, `.project/tasks/` and
  documented the convention in `AGENTS.md`.
- Convention going forward: every user prompt is treated as a task. At the end of
  completing it, write a new dated file in `.project/tasks/` summarizing what was
  done. Update this file with any key decisions/gotchas, and update `knowledge.md`
  if something structural changed.
