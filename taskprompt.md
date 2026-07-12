## Rule — follow before every prompt in this file

Before starting *any* task below, and before ending your turn on it, follow the workflow defined in `.project/prompt.md`. In short: read `.project/memory.md` (newest first) and skim `.project/knowledge.md` before starting, and when you finish (or hit a natural stopping point) create a task file under `.project/tasks/YYYY-MM-DD-<slug>.md`, update `.project/memory.md` with new decisions/gotchas, and update `.project/knowledge.md` only if something structurally true about the project changed. This applies to every task in this document — do not skip it.

## Rule — the data models below are not fixed

Every entity/table/field list given in the tasks below is a starting point, not a spec to copy verbatim. Before creating any new database table, work out its full details yourself — required columns, types, constraints, indexes, defaults — based on what the feature actually needs and how it will really be used, rather than only what's explicitly listed. Also make sure every new table is properly connected to the rest of the schema: add the foreign keys, join tables, and indexes needed so it relates correctly to existing tables (and to other new tables introduced in these tasks) — no orphaned tables that aren't reachable through a relationship from the core schema (items, inventory, sales, customers, etc).

---

# Task: Implement Price Level Management (API + Frontend)

You are implementing a new "Price Level" feature in an existing monorepo restaurant ERP application. Follow every step below in order. This document is self-contained — do not assume any prior conversation context. Match the existing codebase conventions exactly as described; do not introduce new libraries, ORMs, UI kits, or architectural patterns.

## 0. Repo facts you must know before starting

- Monorepo managed with pnpm workspaces + turborepo. Backend at `apps/api` (NestJS + TypeORM + PostgreSQL). Frontend at `apps/restaurant-ui` (React + TanStack Router + TanStack Query + Tailwind CSS v4, no UI kit like MUI/AntD — components are hand-rolled with Tailwind classes and `lucide-react` icons).
- Backend has NO migration files and NO TypeORM CLI configured. Schema is created via `synchronize: true` in non-production (set in `apps/api/src/app.module.ts`). Do not add migration files — just define/modify entities and let synchronize handle schema changes in dev.
- Every entity is plain TypeORM, no shared `BaseEntity` class. Repeat these fields on every new entity:
  ```ts
  @PrimaryGeneratedColumn('uuid') id!: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at' }) deletedAt!: Date | null; // soft delete, include on both new entities
  ```
- Table names: `@Entity('price_levels')` and `@Entity('item_price_levels')` (snake_case, plural). Column names snake_case via `@Column({ name: 'some_field' })`.
- Any money/decimal column MUST reuse the existing shared transformer — do not write a new one:
  ```ts
  import { decimalTransformer } from '../../shared/transformers/decimal.transformer';
  // apps/api/src/shared/transformers/decimal.transformer.ts
  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: decimalTransformer })
  price!: number;
  ```
- Reference module to copy structure/style from: `apps/api/src/items/` (entities/, dto/, controllers/, services/, repositories/, interfaces/, `items.module.ts`) and `apps/api/src/category/` (simpler CRUD-only example, closest match for the new PriceLevel entity itself).
- DTOs use `class-validator` (`IsString`, `IsNotEmpty`, `IsOptional`, `IsUUID`, `IsNumber({ maxDecimalPlaces: 2 })`, `IsBoolean`, `Min`, `Max`). Update DTOs extend create DTOs via `PartialType` from `@nestjs/mapped-types`.
- Controllers follow REST conventions: `@Controller('price-levels')`, routes `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`, plus action sub-routes like `PATCH /:id/activate`, `PATCH /:id/deactivate`, `PATCH /:id/set-default` (mirrors existing `items`/`category` action routes).
- New feature modules must be registered in `apps/api/src/app.module.ts` imports array, same as `ItemsModule`/`CategoryModule`.
- Global guards (`JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`) are already applied via `APP_GUARD` in `app.module.ts` — no per-controller guard wiring needed, just add `@Roles(...)` / permission decorators consistent with how `items.controller.ts` protects its write routes (copy the exact decorator usage from that file).
- Frontend module structure to copy: `apps/restaurant-ui/src/modules/category/` — subfolders `api/`, `components/`, `dialogs/`, `forms/`, `hooks/`, `pages/`, `schemas/`, `types/`, `utils/`, `index.ts`.
- Frontend API calls go through the shared axios instance `apiClient` from `apps/restaurant-ui/src/lib/axios-client.ts` (baseURL `/api`, handles JWT + refresh). Do not create a new axios instance.
- Data fetching uses TanStack Query with a query-key factory object per module (e.g. `categoryKeys`) and `invalidateQueries` in mutation `onSuccess` callbacks — copy this pattern from `apps/restaurant-ui/src/modules/category/hooks/useCategoryQueries.ts`.
- Forms use `react-hook-form` + `zod` schemas (see `apps/restaurant-ui/src/modules/category/schemas/category.schema.ts`), except the newest `inventory` module which sometimes uses plain `useState` + manual validation inside a custom `InventoryModal`-style wrapper (see `apps/restaurant-ui/src/modules/inventory/dialogs/`) — prefer the react-hook-form + zod pattern for consistency with `category`, since Price Level is a simple CRUD form.
- Routing is file-based via TanStack Router under `apps/restaurant-ui/src/routes/` (e.g. `categories.tsx`, `categories_.create.tsx`, `categories_.$id_.edit.tsx`). New routes must follow this exact naming convention and import pages from the module's `pages/` folder.
- Existing entities relevant for integration: `apps/api/src/items/entities/item.entity.ts` has a flat `price` (decimal) and `costPrice` (decimal) column. `apps/api/src/sales/entities/sales.entity.ts` `InvoiceItem.unitPrice` is a snapshot value copied at invoice-creation time — this feature does not need to modify sales/invoice logic yet, but must expose a clean service method for resolving an item's effective price at a given price level, so a future task can wire it into billing.

## 1. Data model to implement

Create two new entities:

**`PriceLevel`** (`apps/api/src/price-levels/entities/price-level.entity.ts`)
- `id` (uuid, pk)
- `name` (string, unique, not null) — e.g. "Standard", "Corporate", "Staff"
- `code` (string, unique, not null) — short slug, e.g. `standard`, `corporate`, `staff`
- `description` (string, nullable)
- `isDefault` (boolean, default false) — exactly one price level should be marked default at a time (the fallback level for walk-in/regular pricing)
- `isActive` (boolean, default true)
- `createdAt`, `updatedAt`, `deletedAt` (soft delete)

**`ItemPriceLevel`** (`apps/api/src/price-levels/entities/item-price-level.entity.ts`) — junction entity storing a per-item price override for a given price level
- `id` (uuid, pk)
- `itemId` (uuid, FK -> `items.id`, not null) — `@ManyToOne(() => Item)` + `@JoinColumn({ name: 'item_id' })`
- `priceLevelId` (uuid, FK -> `price_levels.id`, not null) — `@ManyToOne(() => PriceLevel)` + `@JoinColumn({ name: 'price_level_id' })`
- `price` (decimal 12,2, not null, uses `decimalTransformer`) — the overridden price for this item at this price level
- `createdAt`, `updatedAt`
- Add a unique composite index on (`itemId`, `priceLevelId`) via `@Index('idx_item_price_level_unique', ['itemId', 'priceLevelId'], { unique: true })` so an item can only have one price per level.

Business rule: if an item has no `ItemPriceLevel` row for a given price level, the effective price falls back to `Item.price` (the base price). Implement this fallback in the service layer (see step 2.4).

## 2. Backend implementation steps

Work inside a new module folder `apps/api/src/price-levels/`.

### 2.1 Entities
Create `entities/price-level.entity.ts` and `entities/item-price-level.entity.ts` per the field lists in Section 1. Follow the exact decorator style used in `apps/api/src/items/entities/item.entity.ts` (indexes at class level, `@Column({ name: '...' })` for every column, soft-delete column included on `PriceLevel` only — `ItemPriceLevel` does not need soft delete, hard-delete rows when an item or price level is removed via `onDelete: 'CASCADE'` on both `@JoinColumn`s).

### 2.2 DTOs
In `dto/`, create:
- `create-price-level.dto.ts` — `name`, `code`, `description?`, `isDefault?`, `isActive?`
- `update-price-level.dto.ts` — `extends PartialType(CreatePriceLevelDto)`
- `query-price-level.dto.ts` — optional `isActive`, `search` (matches name/code), pagination fields matching the pattern in `apps/api/src/items/dto/query-item.dto.ts`
- `upsert-item-price.dto.ts` — `itemId` (uuid), `priceLevelId` (uuid), `price` (number, `IsNumber({ maxDecimalPlaces: 2 })`, `Min(0)`)
- `bulk-upsert-item-price.dto.ts` — `priceLevelId` (uuid), `items: { itemId: string; price: number }[]` (nested validation with `@ValidateNested({ each: true })` and `@Type(() => ItemPriceEntryDto)`) — this lets the frontend save an entire price-level pricing grid in one request.

### 2.3 Repository
Create `repositories/price-level.repository.ts` and `repositories/item-price-level.repository.ts` plus matching interfaces in `interfaces/`, mirroring `apps/api/src/items/repositories/item.repository.ts` and its interface. Standard methods: `findAll(query)`, `findById(id)`, `findByCode(code)`, `create(dto)`, `update(id, dto)`, `softDelete(id)`, `restore(id)`, plus on the item-price-level repo: `findByPriceLevel(priceLevelId)`, `findByItemAndLevel(itemId, priceLevelId)`, `upsert(itemId, priceLevelId, price)` (use TypeORM's `upsert()` with the conflict target `['itemId', 'priceLevelId']`), `bulkUpsert(priceLevelId, entries)`.

### 2.4 Service
Create `services/price-levels.service.ts` with:
- Standard CRUD methods delegating to the repository (`findAll`, `findOne`, `create`, `update`, `remove`, `restore`).
- `activate(id)` / `deactivate(id)` — toggle `isActive`.
- `setDefault(id)` — inside a transaction: unset `isDefault` on every other price level, then set it true on the target one. Reuse the existing transaction pattern from another service in the codebase if one exists (check `apps/api/src/items/services/items.service.ts` or `apps/api/src/sales/services/sales.service.ts` for how `DataSource`/`QueryRunner` transactions are used elsewhere); otherwise use `dataSource.transaction(async (manager) => {...})`.
- `getEffectivePrice(itemId, priceLevelId)` — looks up `ItemPriceLevel` for the pair; if found return its `price`; if not found, load the `Item` and return its base `price`. Throw `NotFoundException` if the item itself doesn't exist.
- `getPricingGrid(priceLevelId)` — returns all items joined with their effective price at this level (override price if present, else base price) — used to render the frontend pricing table.
- `bulkUpsertItemPrices(priceLevelId, entries)` — validates the price level exists, then calls repository `bulkUpsert`.

### 2.5 Controller
Create `controllers/price-levels.controller.ts` with `@Controller('price-levels')`:
- `GET /` — list (query filters)
- `GET /:id` — get one
- `POST /` — create
- `PATCH /:id` — update
- `DELETE /:id` — soft delete
- `PATCH /:id/restore` — restore
- `PATCH /:id/activate`, `PATCH /:id/deactivate`
- `PATCH /:id/set-default`
- `GET /:id/pricing-grid` — calls `getPricingGrid`
- `POST /:id/pricing-grid` — body `{ items: [...] }`, calls `bulkUpsertItemPrices`
- `GET /items/:itemId/effective-price/:priceLevelId` — calls `getEffectivePrice` (place this route in a separate small controller or as an extra route here, whichever keeps `@Controller('price-levels')` prefix consistent — prefer nesting it under `price-levels` as `GET /:priceLevelId/items/:itemId/effective-price`)

Copy the exact `@Roles`/permission-guard decorator usage from `apps/api/src/items/controllers/items.controller.ts` write routes (POST/PATCH/DELETE should require an admin/manager-level role; GET routes can be open to any authenticated role — match whatever pattern items.controller.ts already uses).

### 2.6 Module
Create `price-levels.module.ts` registering the entities via `TypeOrmModule.forFeature([PriceLevel, ItemPriceLevel, Item])` (import `Item` too since the service reads item base prices), the controller, service, and repositories as providers. Export the service in case another module (future sales/POS integration) needs to inject it later.

Register `PriceLevelsModule` in the `imports` array of `apps/api/src/app.module.ts`, alongside `ItemsModule`/`CategoryModule`.

### 2.7 Seed a default price level (optional but recommended)
If the project has a seed script (check for one referenced in `apps/api/package.json` or a `seed` folder), add a seed entry creating one `PriceLevel` with `code: 'standard'`, `isDefault: true`, `isActive: true`, so the system always has a fallback level out of the box. If no seed mechanism exists, skip this and note it as a manual setup step in your PR description.

## 3. Frontend implementation steps

Work inside a new module folder `apps/restaurant-ui/src/modules/price-level/`.

### 3.1 Types
`types/price-level.types.ts` — `PriceLevel`, `ItemPriceLevel`, `PricingGridRow` (itemId, itemName, basePrice, effectivePrice, isOverridden) matching the API response shapes from Section 2.

### 3.2 Schema
`schemas/price-level.schema.ts` — zod schema for the create/edit form: `name` (min 2 chars), `code` (lowercase, no spaces, regex `^[a-z0-9-]+$`), `description` (optional), `isActive` (boolean, default true). Follow the exact style of `apps/restaurant-ui/src/modules/category/schemas/category.schema.ts`.

### 3.3 API client
`api/price-level.api.ts` using the shared `apiClient` from `apps/restaurant-ui/src/lib/axios-client.ts`, `const BASE_URL = '/price-levels'`. Functions: `getPriceLevels(params?)`, `getPriceLevel(id)`, `createPriceLevel(dto)`, `updatePriceLevel(id, dto)`, `deletePriceLevel(id)`, `restorePriceLevel(id)`, `activatePriceLevel(id)`, `deactivatePriceLevel(id)`, `setDefaultPriceLevel(id)`, `getPricingGrid(priceLevelId)`, `saveBulkPricing(priceLevelId, entries)`, `getEffectivePrice(priceLevelId, itemId)`.

### 3.4 Query hooks
`hooks/usePriceLevelQueries.ts` — copy the structure of `apps/restaurant-ui/src/modules/category/hooks/useCategoryQueries.ts`: a `priceLevelKeys` factory object (`all`, `lists()`, `list(filters)`, `detail(id)`, `pricingGrid(id)`), `useQuery` hooks for list/detail/pricing-grid, `useMutation` hooks for create/update/delete/activate/deactivate/setDefault/saveBulkPricing, each invalidating the relevant query keys `onSuccess`.

### 3.5 Pages
`pages/PriceLevelListPage.tsx` — table of price levels (name, code, active/default badges, row actions: edit, activate/deactivate, set default, delete) — copy layout/table patterns from `apps/restaurant-ui/src/modules/category/pages/` or `apps/restaurant-ui/src/modules/inventory/pages/InventoryPage.tsx`.
`pages/PriceLevelFormPage.tsx` — create/edit form using the zod schema + react-hook-form, reused for both create and edit routes.
`pages/PriceLevelPricingPage.tsx` — the pricing grid for one price level: a table of all items with an editable price cell per row (defaulting to base price when no override exists), a "Save" button that submits the whole grid via `saveBulkPricing`. Fetch items list using the existing `getItems` function from `apps/restaurant-ui/src/modules/items/api/items.api` (do not duplicate item-fetching logic).

### 3.6 Dialogs/components (optional polish)
If a lightweight confirm-dialog component already exists in the codebase (check `apps/restaurant-ui/src/modules/inventory/dialogs/` or `apps/restaurant-ui/src/modules/category/components/` for a reusable `ConfirmDialog`), reuse it for delete/deactivate confirmations instead of writing a new one.

### 3.7 Routes
Under `apps/restaurant-ui/src/routes/`, create following the exact file-based naming convention seen for categories:
- `price-levels.tsx` → list page
- `price-levels_.create.tsx` → create form page
- `price-levels_.$id_.edit.tsx` → edit form page
- `price-levels_.$id_.pricing.tsx` → pricing grid page

### 3.8 Navigation
Add a "Price Levels" nav entry in whatever sidebar/nav config file drives the existing menu (find it by searching for where the "Categories" or "Inventory" nav link is defined, e.g. under a `components/layout/` or `config/nav.ts` file) so the new pages are reachable from the UI.

## 4. Verification

1. Backend: start the API (`pnpm --filter api dev` or the project's existing dev script), confirm `price_levels` and `item_price_levels` tables are created via TypeORM synchronize (check Postgres with `\dt` or a DB client).
2. Use REST client / curl to: create a price level, mark it default, bulk-upsert prices for 2-3 items at that level, fetch the pricing grid and confirm overridden items show the new price while un-overridden items show the base `Item.price`, fetch effective price for an item with and without an override.
3. Frontend: run the dev server (`pnpm --filter restaurant-ui dev`), navigate to the new "Price Levels" nav link, create a price level, open its pricing grid, edit a few item prices, save, reload the page and confirm the saved prices persist.
4. Confirm existing `items` and `sales` flows are unaffected (base `Item.price` and invoice creation still work exactly as before — this feature is additive only).
5. Run any existing lint/test scripts in `apps/api` and `apps/restaurant-ui` (`pnpm lint`, `pnpm test`) and fix any errors introduced by the new files.

---

# Task: POS Customer Picker + Price-Level Billing + Zone-Based Seating

You are implementing three connected changes to an existing NestJS + TypeORM API (`apps/api`) and React + TanStack (Router/Query) + Tailwind frontend (`apps/restaurant-ui`) in the restaurant-erp monorepo. This document is self-contained. It depends on the "Price Level" feature specified earlier in this file (`PriceLevel` entity, `PriceLevelsService.getEffectivePrice(itemId, priceLevelId)`) — implement that first if it does not already exist at `apps/api/src/price-levels/` (verify before starting; it may not be built yet).

Match existing conventions exactly (see the "Repo facts" section above this one for entity/DTO/controller/frontend-module conventions — reuse the same patterns: plain TypeORM entities with `id/createdAt/updatedAt/deletedAt`, snake_case columns via `@Column({ name: '...' })`, `class-validator` DTOs, TanStack Query hooks with a key-factory, file-based TanStack Router routes, Tailwind-only UI, shared `apiClient` from `apps/restaurant-ui/src/lib/axios-client.ts`).

## 1. Current state you are replacing/extending (exact references)

- **POS customer field is currently a plain text box**, not linked to any customer record: `apps/restaurant-ui/src/modules/pos/pages/POSDashboard.tsx:30` (`const [customerName, setCustomerName] = useState('')`) and `:217` (the `<input type="text" placeholder="Customer name (optional)" .../>`). It is sent as `customerName` inside the `billMutation` payload at line 97. No `customerPhone`/`customerGstin` inputs exist in the UI even though the API type supports them.
- `apps/restaurant-ui/src/modules/pos/api/pos.api.ts:12-21` defines `CreateInvoiceRequest` (`customerName?`, `customerPhone?`, `customerGstin?`, `tableNumbers?: string[]`, `paymentMethod?`, `discount?`, `notes?`, `items`).
- **Cart prices are computed client-side and trusted as-is by the server**: `POSDashboard.tsx:101` computes `unitPrice: i.price / (1 + i.gstRate / 100)` from the catalog `item.price`. `apps/api/src/sales/services/sales.service.ts:33-91` `create()` takes a loosely-typed `dto` and uses the client-supplied `unitPrice` directly (line 46 param, line 51 `taxableValue = i.quantity * i.unitPrice`) — it never re-resolves price server-side. `apps/api/src/sales/controllers/sales.controller.ts:41-44` has `create(@Body() dto: any)` with **no DTO class / no `class-validator` at all**. You must fix this as part of wiring in price-level-aware billing (Section 5).
- `apps/api/src/sales/entities/sales.entity.ts:32-42` — `Invoice.customerName`, `customerPhone`, `customerGstin` (plain nullable varchars, no FK) and `tableNumbers` (`simple-json`, nullable).
- **The "table section" to remove**: `POSDashboard.tsx` has a flat, non-zoned table selector — `PREDEFINED_TABLES` array (lines 18-21, e.g. `'Table 1'..'Table 15','Takeaway','Dine-in Lounge','Private Room'`), state `selectedTables`/`tableInput` (lines 27-29), handlers `addTable`/`removeTable`/`handleTableKeyDown` (lines 37-56), and the JSX block (lines 173-216: selected-table chips, an "Add table..." input, quick-select buttons). Selected values are sent as `tableNumbers` to both `createInvoice` (line 96) and `createKot` (line 109). **No backend `Table`/`Zone`/`Seat` entity exists at all** — these are free-text strings only.
- `apps/restaurant-ui/src/modules/reservations/pages/ReservationsPage.tsx` is a fully static mock (hardcoded array, a `table: 'Table 5'` string field) with no backend — not wired up, out of scope here, but Zones/Seats should be built so this module can be connected to it later.
- No reusable searchable-select/combobox/autocomplete component exists anywhere in the frontend — you must build the customer picker from scratch as a small standalone component.

## 2. Data model — Customer

Create `apps/api/src/customers/entities/customer.entity.ts`:
- `id` (uuid, pk), `createdAt`, `updatedAt`, `deletedAt` (soft delete)
- `name` (string, not null)
- `phone` (string, not null, unique) — primary search/lookup key
- `email` (string, nullable)
- `gstin` (string, nullable)
- `customerType` (enum, not null, default `'regular'`) — define `export enum CustomerType { REGULAR = 'regular', CORPORATE = 'corporate', STAFF = 'staff' }` in the entity file; treat it as extensible (admin may add more types later, so store as a plain string column with a check against the enum in the DTO rather than a hard Postgres enum type, to keep it easy to extend without a migration mechanism in this synchronize-only project)
- `priceLevelId` (uuid, nullable, FK -> `price_levels.id`, `@ManyToOne(() => PriceLevel)` + `@JoinColumn({ name: 'price_level_id' })`)
- `isActive` (boolean, default true)

**Price level resolution rule** (implement in the service, not the DB): when a customer is created/updated without an explicit `priceLevelId`:
- If `customerType === 'regular'`, resolve to whichever `PriceLevel` has `isDefault = true`.
- Otherwise, resolve to the `PriceLevel` whose `code` equals the `customerType` value; if none matches, fall back to the default price level.
- The admin can always override by explicitly passing `priceLevelId` in the create/update DTO — this takes precedence over the automatic resolution.

## 3. Backend — Customer API

Folder `apps/api/src/customers/` mirroring the `items`/`category` structure (`entities/`, `dto/`, `controllers/`, `services/`, `repositories/`, `interfaces/`, `customers.module.ts`).

- `dto/create-customer.dto.ts`: `name` (`IsString`, `IsNotEmpty`), `phone` (`IsString`, `Matches` a phone pattern), `email?` (`IsEmail`, `IsOptional`), `gstin?` (`IsOptional`), `customerType?` (`IsOptional`, `IsIn(['regular','corporate','staff'])`, default handled in service), `priceLevelId?` (`IsOptional`, `IsUUID`).
- `dto/update-customer.dto.ts`: `extends PartialType(CreateCustomerDto)`.
- `dto/query-customer.dto.ts`: `search?` (matches name OR phone, case-insensitive), `isActive?`, `customerType?`, pagination fields matching `apps/api/src/items/dto/query-item.dto.ts`.
- Service `CustomersService`: standard CRUD + `resolvePriceLevel(customerType, explicitPriceLevelId)` implementing the rule in Section 2, used inside `create`/`update`. Add `search(term, limit = 10)` returning lightweight results (`id, name, phone, customerType, priceLevelId`) for the POS type-ahead.
- Controller `@Controller('customers')`: `GET /` (list + search via query), `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` (soft delete), `PATCH /:id/restore`. Apply the same `@Roles`/guard decorators used on `items.controller.ts` write routes.
- Register `CustomersModule` (importing `PriceLevel` via `TypeOrmModule.forFeature`) in `apps/api/src/app.module.ts`.

## 4. Backend — Billing integration (price-level-aware, and fixes an existing validation gap)

This section both wires in the new feature and fixes the pre-existing lack of validation on invoice creation — do both together since they touch the same code path.

- Add `customerId` (uuid, nullable, FK -> `customers.id`) to `Invoice` in `apps/api/src/sales/entities/sales.entity.ts`, alongside the existing `customerName`/`customerPhone`/`customerGstin` (keep those as a point-in-time snapshot for invoice printing/history — do not remove them, just add the FK).
- Create a real `CreateInvoiceDto` (and nested `CreateInvoiceItemDto`) with `class-validator` decorators, replacing `@Body() dto: any` in `apps/api/src/sales/controllers/sales.controller.ts:41-44`. Fields: `customerId?` (`IsUUID`, `IsOptional`), `customerName?`, `customerPhone?`, `customerGstin?`, `seatIds?: string[]` (see Section 6 — replaces `tableNumbers`), `paymentMethod`, `discount?`, `notes?`, `items: CreateInvoiceItemDto[]` (`itemId` uuid, `quantity` number `Min(0.01)`) — **do not accept `unitPrice` from the client at all**.
- In `apps/api/src/sales/services/sales.service.ts` `create()`: resolve the effective price level as `customer?.priceLevelId ?? defaultPriceLevel.id` (look up the customer by `customerId` if provided; otherwise use the `PriceLevel` where `isDefault = true`), then for every line item call `priceLevelsService.getEffectivePrice(itemId, priceLevelId)` to compute `unitPrice` server-side instead of trusting client input. Inject `PriceLevelsService` into `SalesModule`/`SalesService` (import `PriceLevelsModule` and export the service from it, per Section 2.6 of the Price Level task above).
- This means: changing the selected customer in the POS cart must change the price actually billed, not just a display label — the frontend cart preview should also call the pricing lookup so what the cashier sees matches what the server will charge (see Section 7).

## 5. Data model — Zone & Seat (replaces the flat table list)

Create module `apps/api/src/seating/` with two entities:

**`Zone`** (`entities/zone.entity.ts`) — a physical floor-plan section, e.g. "AC Lounge", "Family Dining", "Normal/Non-AC Dining":
- `id`, `createdAt`, `updatedAt`, `deletedAt`
- `name` (string, unique, not null)
- `description` (string, nullable)
- `sortOrder` (int, default 0) — controls tab ordering in the UI
- `isActive` (boolean, default true)

**`Seat`** (`entities/seat.entity.ts`) — an individual table/seat within a zone:
- `id`, `createdAt`, `updatedAt`, `deletedAt`
- `zoneId` (uuid, FK -> `zones.id`, `onDelete: 'CASCADE'`)
- `label` (string, not null) — e.g. `"T1"`, `"Seat 5"`
- `capacity` (int, nullable)
- `category` (string column, values validated against `export enum SeatCategory { ONLINE = 'online', WALK_IN = 'walk_in', FLEXIBLE = 'flexible' }`, default `'walk_in'`):
  - `ONLINE` — reserved for online bookings only.
  - `WALK_IN` — for walk-in customers only; status only ever toggles `AVAILABLE` ↔ `OCCUPIED` (never `BOOKED`).
  - `FLEXIBLE` — "any time" seats: staff can mark them `BOOKED` directly, at any time, without needing an online reservation record (unlike `ONLINE` seats, whose `BOOKED` status should only ever be set via a future reservation-linking flow — out of scope here, just leave the status field open for it).
- `status` (string column, values `export enum SeatStatus { AVAILABLE = 'available', BOOKED = 'booked', OCCUPIED = 'occupied' }`, default `'available'`)
- `isActive` (boolean, default true)
- Unique index on (`zoneId`, `label`) so labels don't collide within a zone.

## 6. Backend — Zone/Seat API

Inside `apps/api/src/seating/`, follow the two-entities-one-module pattern used by `price-levels` (`PriceLevel` + `ItemPriceLevel`):

- `services/zones.service.ts` + `controllers/zones.controller.ts` at `@Controller('zones')`: standard CRUD (`GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`), plus `GET /:id/seats` to list seats in a zone.
- `services/seats.service.ts` + `controllers/seats.controller.ts` at `@Controller('seats')`: standard CRUD, plus `PATCH /:id/status` (body `{ status: 'available' | 'booked' | 'occupied' }`) used by POS when an order is placed against a seat or the table is cleared.
- `seating.module.ts` registers both entities via `TypeOrmModule.forFeature([Zone, Seat])`, both controllers, both services; register `SeatingModule` in `app.module.ts`.
- In `apps/api/src/sales/entities/sales.entity.ts`, replace the free-text `tableNumbers: simple-json` column with `seatIds` (`simple-json`, nullable, array of seat uuids) on both `Invoice` and the KOT entity (`apps/api/src/kot/entities/kot.entity.ts` — check its current table-related column name and rename/replace it the same way). When `sales.service.ts create()` receives `seatIds`, set each referenced seat's `status` to `'occupied'` (call `SeatsService`, inject it into `SalesModule` the same way as `PriceLevelsService`). Add a `PATCH /sales/:invoiceId/clear-seats` (or equivalent) endpoint that sets those seats back to `'available'` when a bill is settled/table is cleared.

## 7. Frontend — Customer picker (replaces the POS customer text input)

Create `apps/restaurant-ui/src/modules/customers/` mirroring the `category` module structure (`api/customer.api.ts`, `hooks/useCustomerQueries.ts`, `schemas/customer.schema.ts`, `types/customer.types.ts`, `pages/` for an admin customer list if useful, `components/CustomerCombobox.tsx`).

- `api/customer.api.ts`: `searchCustomers(term)` → `GET /customers?search=`, `createCustomer(dto)`, plus standard CRUD functions, all via the shared `apiClient`.
- `components/CustomerCombobox.tsx` — a standalone type-ahead component (no existing combobox to reuse, per Section 1):
  - A text input bound to a local `query` state; on change, debounce ~300ms and call `searchCustomers(query)` via a `useQuery` (enabled only when `query.length >= 2`).
  - Render a dropdown list below the input showing matches (`name` — `phone` — a small `customerType` badge).
  - Always render one more row at the bottom of the dropdown: **"+ Add '{query}' as new customer"**. Clicking it expands inline fields within that same dropdown row (name pre-filled from `query` if it looks like a name, phone, a `customerType` select defaulting to `Regular`) with a Save button — on save, call `createCustomer`, then immediately select the newly created customer and close the dropdown. Do not navigate away from POS or open a separate modal/page — it must stay inline in the list, per the requirement.
  - Selecting any customer (existing or newly created) calls an `onSelect(customer)` prop.
- In `POSDashboard.tsx`: replace the `customerName` state (line 30) and the text input (line 217) with `<CustomerCombobox onSelect={setSelectedCustomer} />`, storing the full selected `Customer` object (or `null` for walk-in/no customer) in state. Remove the old plain-text customer state entirely.
- When `selectedCustomer` changes, re-price the current cart: fetch the effective price for each cart item at `selectedCustomer.priceLevelId` (or the default price level if `selectedCustomer` is `null`) via the Price Level API from the earlier task (`getEffectivePrice` or `getPricingGrid`), and update the displayed cart line prices accordingly — this is what makes the price change "reflect on billing" live in the UI, not just on the server at submit time.
- Update `billMutation`'s payload (`POSDashboard.tsx:97`) to send `customerId: selectedCustomer?.id`, plus keep `customerName`/`customerPhone`/`customerGstin` as a snapshot only if you want them still editable/overridable for printing — otherwise auto-fill them from the selected customer and remove manual entry. Do not send `unitPrice` in `items` anymore (per Section 4, the server now computes it) — send only `itemId` and `quantity`.
- Update `apps/restaurant-ui/src/modules/pos/api/pos.api.ts:12-21` `CreateInvoiceRequest` to match: drop `tableNumbers`, add `seatIds?: string[]`; drop `unitPrice` from the cart item shape sent to the API; add `customerId?`.

## 8. Frontend — Zone/Seat admin management

Create `apps/restaurant-ui/src/modules/zones/` (mirroring the `category`/`price-level` module shape): CRUD pages for zones (`ZoneListPage`, `ZoneFormPage`) and, within a zone's detail view, a seat manager (`ZoneSeatsPage`) to add/edit seats with `label`, `capacity`, `category` (Online/Walk-in/Flexible dropdown). Follow the same TanStack Query hook + zod schema + file-based route conventions used for `price-level` (Section 3 of the task above this one) — do not repeat those instructions here, just apply them to `Zone`/`Seat`.

## 9. Frontend — POS seating panel (replaces the removed table section)

In `POSDashboard.tsx`, delete the `PREDEFINED_TABLES` array, `selectedTables`/`tableInput` state, `addTable`/`removeTable`/`handleTableKeyDown` handlers, and the JSX block described in Section 1. Replace with a `SeatingPanel` component (`apps/restaurant-ui/src/modules/pos/components/SeatingPanel.tsx`):
- Fetch zones (with nested seats, or zones + a separate seats-by-zone query) via the Zone/Seat API from Section 8.
- Render zone tabs in `sortOrder` (e.g. "AC Lounge" | "Family Dining" | "Normal/Non-AC Dining").
- Within the active zone tab, render seats as a grid of chips/buttons, color-coded by `status` (available/booked/occupied) and badge/icon by `category` (online/walk-in/flexible).
- Allow multi-select of available seats within the current order (preserve the old table-selector's ability to combine multiple tables for one order — same UX, now grouped by zone), storing `seatIds: string[]` in POS state instead of the old `selectedTables`.
- Disable/prevent selecting seats already `occupied`; allow selecting `booked` flexible seats only with an explicit confirm (since `booked` there just means "held", not necessarily occupied yet).
- Pass `seatIds` into the `createInvoice`/`createKot` payloads in place of the removed `tableNumbers`.
- Add a "Clear seats" action (available once the order/invoice is settled) that calls the `clear-seats` endpoint from Section 6 to free the seats back to `available`.

## 10. Verification

1. Backend: start the API, confirm `customers`, `zones`, `seats` tables are created (TypeORM synchronize), and that `invoices`/`kot` gained `customer_id`/`seat_ids` columns.
2. Create a customer via `POST /customers` with no `customerType` — confirm it defaults to `regular` and its `priceLevelId` resolves to the default price level. Create another with `customerType: corporate` and confirm it resolves to the price level whose `code` is `corporate` (or falls back sensibly if none exists).
3. Create a zone and a few seats across all three categories; confirm `PATCH /seats/:id/status` transitions correctly.
4. In the POS UI: type a partial name/phone in the new customer picker, confirm matching customers appear; type a name with no match, confirm the inline "+ Add" row appears, add a customer without leaving the screen, confirm it's auto-selected and the cart re-prices according to that customer's price level.
5. Submit an order with a selected customer and one or more selected seats (from different zones' categories); confirm the created invoice has the correct `customerId`, server-resolved `unitPrice` values (matching the customer's price level, not the raw base price), and `seatIds`; confirm those seats flip to `occupied`.
6. Confirm walk-in orders with no customer selected still work exactly as before (default price level pricing, no seat required).
7. Run `pnpm lint` / `pnpm test` in both `apps/api` and `apps/restaurant-ui` and fix any errors introduced.

---

# Task: Recipe Engineering & Multi-Level Inventory Mapping (Bill of Materials)

You are adding Recipe Engineering to this NestJS + TypeORM API (`apps/api`) and React frontend (`apps/restaurant-ui`). This is a clean-slate feature — confirmed no `recipe`/`bom`/`ingredient`/`composite`/`production`/`prep` concept exists anywhere in the repo today. Follow existing conventions (see "Repo facts" near the top of this file): plain TypeORM entities with `id/createdAt/updatedAt/deletedAt`, snake_case columns, `class-validator` DTOs, module folder shape (`entities/`, `dto/`, `controllers/`, `services/`, `repositories/`), TanStack Query hooks on the frontend.

**Goal**: model how Raw Materials → Semi-Finished prep items → Finished menu dishes relate, including composite dishes (a Thali) that bundle other Finished/Semi-Finished items, so that selling a dish automatically deducts the correct component stock and its true cost can be computed from ingredient costs.

## 1. Current state
`apps/api/src/items/entities/item.entity.ts:43-103` — `Item` has `price`, a single flat `costPrice`, `gstRate`, `unit` (`ItemUnit` enum), `categoryId`, no `productType` and no BOM concept. `apps/api/src/inventory/entities/inventory.entity.ts` has `Inventory` (running balance: `itemId`, `currentStock`, `minStockLevel`, `unitCost`) and `StockMovement` (append-only ledger with `type: MovementType` enum — `opening_balance/purchase_in/sale_out/adjustment_in/adjustment_out/wastage/transfer_out/transfer_in`, plus `quantity/balanceBefore/balanceAfter/reference/notes`). This ledger is what recipe-driven deductions must write to.

## 2. Data model
- Add `productType` column to `Item` (string, validated against `export enum ProductType { RAW = 'raw', SEMI_FINISHED = 'semi_finished', FINISHED = 'finished' }`, default `'finished'` for backward compatibility with existing rows).
- New module `apps/api/src/recipes/` with:
  - `Recipe` entity — one per output item: `id`, `outputItemId` (FK -> `items.id`, unique), `yieldQuantity` (decimal, `decimalTransformer`), `yieldUnit` (reuse `ItemUnit`), timestamps.
  - `RecipeIngredient` entity — `id`, `recipeId` (FK -> `recipes.id`, `onDelete: 'CASCADE'`), `componentItemId` (FK -> `items.id` — may itself be `RAW`, `SEMI_FINISHED`, or `FINISHED`, which is what makes nested composites like a Thali possible), `quantity` (decimal), `unit` (`ItemUnit`). Unique index on (`recipeId`, `componentItemId`).
- Add two `MovementType` values to the existing enum in `inventory.entity.ts`: `PRODUCTION_CONSUMPTION = 'production_consumption'` (raw deducted during a prep batch) and `PRODUCTION_YIELD = 'production_in'` (semi-finished stock added from a prep batch).
- New `ProductionEntry` entity (`apps/api/src/recipes/entities/production-entry.entity.ts`) — logs a kitchen prep run: `id`, `itemId` (the semi-finished item produced), `batchQuantity` (decimal), `producedAt`, `createdBy`, `createdAt`.

## 3. Backend logic
- CRUD: `GET/POST/PATCH/DELETE /recipes/:itemId` — `POST`/`PATCH` accept the full ingredient list in one payload (`{ yieldQuantity, yieldUnit, ingredients: [{ componentItemId, quantity, unit }] }`) and replace the recipe's ingredients transactionally, mirroring the bulk-upsert pattern from the Price Level task above.
- `RecipesService.computeCost(itemId)` — recursive: if the item has no recipe, return its own `costPrice`; otherwise `sum(ingredient.quantity * computeCost(componentItemId)) / yieldQuantity`. Guard against circular references (throw a clear error if an item's recipe graph references itself). Expose via `GET /recipes/:itemId/cost` (return the total plus a per-ingredient breakdown) and `POST /recipes/:itemId/recalculate-cost` (persists the computed value to `Item.costPrice`).
- Sale-time deduction: in `apps/api/src/sales/services/sales.service.ts create()`, for each sold item that has a `Recipe`, deduct each `RecipeIngredient`'s component stock directly (`requiredQty = (soldQuantity / recipe.yieldQuantity) * ingredient.quantity`, write a `StockMovement` of type `sale_out` against `componentItemId` referencing the invoice number) instead of deducting the parent item's own stock. **Do not recurse further** — a component's own `Inventory` balance is authoritative (it's replenished via `ProductionEntry`, not exploded live), which is what makes the Thali example correct (deducts 1 Dal Makhani + 1 Paneer + Jeera Rice prep portions, not raw onions/rice). Items with no recipe keep the existing direct-deduction behavior unchanged.
- `ProductionEntry` creation: on save, look up the produced item's `Recipe`, for every `RecipeIngredient` deduct `(batchQuantity / yieldQuantity) * ingredient.quantity` from the raw/component item's `Inventory` via a `production_consumption` movement, then add `batchQuantity` to the produced item's own `Inventory.currentStock` via one `production_in` movement.
- Keep menu-engineering (Stars/Plowhorses/Puzzles/Dogs) and full variance-vs-physical-count reporting out of scope for this task — note them as a follow-up once this BOM foundation exists; do not build them now.

## 4. Frontend
- `Item` create/edit form: add a `productType` select (Raw / Semi-Finished / Finished).
- New module `apps/restaurant-ui/src/modules/recipes/` (same shape as `category`/`price-level`: `api/`, `hooks/`, `schemas/`, `types/`).
  - A "Recipe" tab/section on the item detail page: editable ingredient table (search-select component item via the existing items API, quantity, unit; add/remove rows), saved via the bulk endpoint from Section 3, showing the live computed cost breakdown from `GET /recipes/:itemId/cost`.
  - A "Kitchen Prep" page to log `ProductionEntry` runs: pick a semi-finished item (must already have a recipe), enter batch quantity, submit; show the resulting raw-ingredient deductions and updated stock.
- No POS change is required — selling a Thali uses the existing checkout flow; deduction happens server-side per Section 3.

## 5. Tests (required — both unit and API/e2e)
- **Unit tests** (`apps/api/src/recipes/services/recipes.service.spec.ts`): `computeCost` for a flat item (no recipe), a single-level recipe, and a multi-level/nested recipe (Thali-style, composed of other Finished + Semi-Finished items) — assert correct rolled-up cost at each level; a circular-recipe case that must throw. Sale-time deduction logic: mock the inventory service and assert it's called with the exact expected quantities for a nested example (selling 1 Thali → exactly 1× Dal Makhani portion, 1× Paneer portion, 1× 150g Jeera Rice prep deducted — not raw ingredients).
- **API/e2e tests are required** — add `apps/api/test/recipes.e2e-spec.ts` following the existing pattern in `apps/api/test/api.e2e-spec.ts` (`Test.createTestingModule({ imports: [AppModule] })`, `.overrideGuard(JwtAuthGuard/RolesGuard/PermissionsGuard).useValue({ canActivate: () => true })`, global prefix `api` + `ValidationPipe`, then `request(app.getHttpServer())...`). Cover: `POST /api/recipes/:itemId` creates a recipe with ingredients; `GET /api/recipes/:itemId/cost` returns the correct rolled-up cost; `POST` a `ProductionEntry` and confirm via `GET /api/inventory/:itemId` that raw stock decreased and the produced item's stock increased by the right amounts; and one full scenario test that sells a composite Thali-style item through the existing `/api/sales` endpoint and asserts each component item's inventory decremented by the expected quantity.
- Run `apps/api`'s `test` and `test:e2e` scripts and ensure they pass before considering this task done.
- Frontend has no test runner configured yet (no vitest/jest/testing-library in `apps/restaurant-ui/package.json`) — do not add new test infra as part of this task; instead verify manually: build a recipe in the UI, reload and confirm it persisted, log a production entry and confirm stock moved, then sell the composite item via POS and confirm each component's inventory decremented on the inventory page.

---

# Task: Reusable Thermal Tax Invoice + Multi-Location Stock

You are adding two connected pieces to this NestJS + TypeORM API (`apps/api`) and React frontend (`apps/restaurant-ui`): (A) a reusable, printable text-format Tax Invoice generated for every bill, and (B) a Storage Location concept so item stock (raw, semi-finished, and finished — e.g. Butter Chicken) is tracked per physical location instead of one global number. Part B builds on the already-implemented Recipe Engineering module at `apps/api/src/recipes/` (verify its current field/method names before wiring into it — implementation may have drifted slightly from its original spec earlier in this file).

## Part A — Reusable Tax Invoice / Receipt

### 1. Current state
`Invoice`/`InvoiceItem` (`apps/api/src/sales/entities/sales.entity.ts:26-147`) already has everything needed except guest count: `invoiceNumber`, `customerName/Phone/Gstin/customerId`, `seatIds`, `invoiceDate` (date only), `paymentMethod`, `subtotal`, `cgstTotal`/`sgstTotal`/`igstTotal`/`taxTotal`, `discount`, `roundOff`, `grandTotal`, `items` (with `itemName`, `hsnCode`, `quantity`, `unitPrice`, `taxableValue`, `gstRate`, `cgstAmount`, `sgstAmount`, `totalAmount` per line), `createdAt` (has the time component `invoiceDate` lacks). `invoiceNumber` is generated in `sales.service.ts:147-149` via a simple `count()+1` scheme — leave as-is unless you notice it breaking concurrently. **No restaurant/business profile entity exists anywhere in the backend** — `apps/restaurant-ui/src/modules/settings/pages/SettingsPage.tsx` only has hardcoded mock "Restaurant Info" (fake name/address, no GSTIN, not wired to any API). **No receipt/print component exists in the frontend at all.**

### 2. Data model
- `apps/api/src/settings/entities/restaurant-profile.entity.ts` — a singleton row: `id`, `name`, `address` (text), `gstin`, `phone`, `email` (nullable), `fssaiLicense` (nullable), `updatedAt`. Service should fetch-or-create a single default row rather than supporting multiple profiles.
- Add `guestCount` (int, nullable) to `Invoice`.

### 3. Backend
- `apps/api/src/settings/` module: `GET /settings/restaurant-profile` (returns the singleton, creating a blank default row on first call if none exists), `PATCH /settings/restaurant-profile` (upserts it).
- A shared formatter, e.g. `apps/api/src/sales/utils/receipt-formatter.ts`, exporting `formatReceiptText(invoice: Invoice, profile: RestaurantProfile): string` — pure function, no DB access, so it's reusable everywhere a receipt needs rendering (POS, reprint from sales history, etc). Build the output to this exact layout (40-character width, monospace; use `padEnd`/`padStart` to align columns — treat this as the literal target, not a loose guideline):
  ```
          {RESTAURANT NAME, centered}
        {address, centered, wrap if long}
           GSTIN: {gstin}
  ----------------------------------------
  Invoice No: {invoiceNumber}   Table: {seat labels or 'Walk-in'}
  Date: {DD-MM-YYYY}            Time: {HH:mm}
  Guests: {guestCount or '-'}
  ----------------------------------------
  Sr  Item Name          Qty   Rate  Amount
  ----------------------------------------
  {sr}  {itemName, truncated/padded}  {qty}  {rate}  {amount}
  ...
  ----------------------------------------
  Sub-Total                          {subtotal}
  Discount{(pct)? if applicable}     -{discount}
  Taxable Value                      {taxableValue}
  CGST @2.5%                          {cgstTotal}
  SGST @2.5%                          {sgstTotal}
  ----------------------------------------
  Grand Total                        {grandTotal}
  Round Off                          {+/-roundOff}
  ----------------------------------------
  NET PAYABLE                        {final rounded total}
  ----------------------------------------
        Thank You! Please Visit Again.
  ```
  Derive Date from `invoiceDate`, Time from `createdAt`. Taxable Value = `subtotal - discount`. If `igstTotal > 0` instead of CGST/SGST, print an `IGST @5%` line instead of the two — don't hardcode CGST/SGST-only if the invoice used IGST.
- Endpoint `GET /sales/:id/receipt` — calls the formatter with the invoice (with `items` relation loaded) and the restaurant profile, returns `{ text: string }`.

### 4. Frontend
- Wire `SettingsPage.tsx`'s "Restaurant Info" section to the new `GET`/`PATCH /settings/restaurant-profile` endpoints instead of hardcoded mock data.
- New `apps/restaurant-ui/src/modules/sales/components/ReceiptView.tsx` — fetches `GET /sales/:id/receipt`, renders the returned text in a `<pre>` block with a monospace font, plus a "Print" button (`window.print()` with a print media-query stylesheet sized for thermal-width paper). Show this automatically after a successful `billMutation` in `POSDashboard.tsx`, and add a "View/Print Receipt" action to each row in `apps/restaurant-ui/src/modules/sales/pages/SalesPage.tsx` for reprints.

## Part B — Storage Location (Multi-Location Stock)

### 1. Current state
`Inventory` and `StockMovement` (`apps/api/src/inventory/entities/inventory.entity.ts:23-89`) track one global stock balance per item — no `locationId`/`warehouseId` field exists. `MovementType` already defines `transfer_out`/`transfer_in` values but nothing uses them yet. Recipe Engineering (`apps/api/src/recipes/`) currently deducts/produces stock without any location awareness either — check its service methods and extend them, don't duplicate them.

### 2. Data model
- New module `apps/api/src/storage-locations/entities/storage-location.entity.ts`: `id`, `name` (unique, e.g. "Central Kitchen", "Outlet Counter", "Cold Storage"), `type` (string column validated against an extensible enum: `KITCHEN`, `COUNTER`, `WAREHOUSE`, `COLD_STORAGE`), `address` (nullable), `isActive`, soft delete + timestamps.
- Add `locationId` (FK -> `storage_locations.id`, not null) to both `Inventory` and `StockMovement`. Change `Inventory`'s uniqueness from per-`itemId` to a composite unique index on (`itemId`, `locationId`) — every item now has one stock balance *per location*, not one balance total. This is a breaking schema change to existing tables: since the project has no migrations (`synchronize: true` only — see Repo facts at the top of this file), write a one-time data-backfill step (a seed/startup script, not a TypeORM migration) that creates a default `StorageLocation` (e.g. "Main Store") and assigns it as `locationId` on every pre-existing `Inventory`/`StockMovement` row so historical data isn't orphaned by the new NOT NULL column.
- The stock item and its unit of measure remain exactly what `Item`/`Item.unit` (`ItemUnit` enum) already model — do not create a duplicate "stock item" entity; a location only adds *where* the existing item's stock sits, not a new definition of the item itself.

### 3. Backend
- Standard CRUD for `StorageLocation` under `@Controller('storage-locations')`, mirroring the `category`/`price-levels` module shape.
- Update `InventoryService`/`StockMovement`-writing call sites (inventory adjustments, purchase receiving, and — critically — the Recipe Engineering sale-time deduction and `ProductionEntry` consumption/yield logic from the Recipe task) to accept and require a `locationId`, defaulting to the single "Main Store" location if the caller doesn't specify one (so single-location restaurants keep working with zero extra input).
- Add `POST /inventory/transfer` (`{ itemId, fromLocationId, toLocationId, quantity }`) that atomically writes a `transfer_out` movement at the source and a `transfer_in` movement at the destination, adjusting both locations' `Inventory.currentStock`. This is the "Indent Flow" pattern (central kitchen sending prepped stock to an outlet counter) referenced conceptually in the Zone-based seating task above.
- Accounts tie-in: when a transfer's item has a non-zero `unitCost`, also write a `LedgerEntry` (`apps/api/src/ledger/entities/ledger.entity.ts`) of category `miscellaneous` recording the value moved between locations (`quantity * unitCost`), so inter-location stock movement is visible in the ledger, not just the stock ledger. Look at how `sales.service.ts` or `purchases` currently creates `LedgerEntry` rows (if they do) and follow the same pattern; if neither does yet, keep this ledger write minimal and additive — don't restructure the ledger module.
- `GET /inventory` and item stock views must support an optional `locationId` filter, and a per-item summary endpoint should be able to show the breakdown across all locations (e.g. `GET /inventory/:itemId/by-location`).

### 4. Frontend
- New `apps/restaurant-ui/src/modules/storage-locations/` module (same shape as `category`/`price-level`) for CRUD on locations.
- `apps/restaurant-ui/src/modules/inventory/pages/InventoryPage.tsx` — add a location filter/selector, and show per-location stock breakdown for an item instead of (or alongside) the single global number it shows today.
- Recipe Engineering's "Kitchen Prep" page (`apps/restaurant-ui/src/modules/recipes/`, from the earlier task) and any transfer UI you add should let staff pick a `StorageLocation` for the production run / transfer.

## Verification
1. Backend: create a restaurant profile, create an invoice via POS, call `GET /sales/:id/receipt` and confirm the returned text matches the layout above exactly (correct alignment, correct CGST/SGST vs IGST branch, correct rounding line).
2. Print-preview the receipt from the frontend `ReceiptView` after completing a POS sale; confirm it also renders for a past invoice from `SalesPage.tsx`.
3. Create two `StorageLocation`s, confirm the backfill step assigned existing inventory to a default location without data loss, confirm `Inventory` now enforces one row per (item, location).
4. Sell a recipe-based item (e.g. Butter Chicken) at a specific location and confirm the correct location's component stock decremented — not a different location's.
5. Run `POST /inventory/transfer` between two locations, confirm both sides' stock and a corresponding `LedgerEntry` were created correctly.
6. Run `pnpm lint` / `pnpm test` in `apps/api` and `apps/restaurant-ui` and fix any errors introduced.
