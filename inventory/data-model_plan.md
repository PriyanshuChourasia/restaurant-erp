# Module 0: Inventory Data Model — Items, Categories, Units, Storage Units, Inventory, Stock Movements, Batch Tracking, Opening Stock

See [`README.md`](./README.md) for the overall module index and priority
order. This file has no "Depends on" — it is the schema reference every
other module file in this folder is written against. Read this **first**.

## Why this file exists

The other files in this folder (`units_plan.md`, `purchase-receiving_plan.md`,
`ledger-integration_plan.md`, `batch-tracking_plan.md`,
`wastage-tracking_plan.md`, `stock-count_plan.md`) each describe one
behavioral gap and the entity changes needed to close it, but no single
document shows how **all** of the core inventory entities relate to each
other as one schema. That gap is exactly why the old `multi-location_plan.md`
had to warn "this touches every earlier module" — storage location wasn't
part of the schema from day one, so retrofitting it later meant auditing
every call site. This file fixes that by designing the full entity graph —
`Category`, `Unit`, `Item`, `StorageUnit`, `Inventory`, `StockMovement`,
`StockBatch`, `OpeningStockEntry` — together, up front, so every later
module is implemented against the final shape instead of a moving target.

Two decisions made here change the trajectory of the rest of the plan
(both are new relative to the original module set — see
[`README.md`](./README.md) for the updated module order):

1. **Storage location is part of the schema from the start, not bolted on
   later.** `Inventory` and `StockMovement` are keyed by `(item_id,
   storage_unit_id)`, not just `item_id`, from the first migration onward.
   Rollout is still non-breaking (§ Rollout below) — a single seeded
   "Main Store" location means day-one behavior is identical to today — but
   every module built after this one (purchase receiving, batch tracking,
   wastage, stock count) is written against the two-column key immediately,
   instead of module 7's old plan to add it as an afterthought.
2. **`ItemUnit` becomes a real reference table (`units`), not a hardcoded
   TypeScript enum.** Enums can't carry metadata (unit type, whether it's a
   conversion anchor) and can't be queried/joined. A `units` table lets
   `unit_conversions` express real foreign keys instead of comparing enum
   strings, and lets new units be added without a code deploy.

## Entity-relationship overview

```
 categories                     units
     │  1                         │ 1
     │  parent_id (self-ref,      │  unit_id (stock unit)
     │  nullable)                 │  purchase_unit_id (nullable)
     │  N                         │ N
     └───────────► items ◄────────┘
                     │  N              ┐
                     │                 │ item_id nullable override
                     │                 ▼
                     │           unit_conversions
                     │  1
        ┌────────────┼─────────────────────────────┐
        │            │                              │
        │ N          │ N                            │ N
        ▼            ▼                              ▼
  opening_stock_  inventory                   stock_batches
  entries         (item_id, storage_unit_id)  (item_id, storage_unit_id,
  (item_id,        UNIQUE                      purchase_id?, parent_batch_id?)
   storage_unit_id)     ▲                              │
   UNIQUE                │ N:1                          │ 1
        │ 1:1 creates     │                              │ N
        └───────────► stock_movements ◄──────────────────┘
                      (item_id, storage_unit_id,
                       batch_id?, transfer_group_id?)
                              ▲
                              │ N
                              │
                        storage_units
                    (Main Store, Kitchen Line 1, ...)
```

`storage_units` sits underneath `inventory`, `stock_movements`,
`stock_batches`, and `opening_stock_entries` — every one of those four
tables carries a `storage_unit_id` foreign key. `items` sits underneath
everything as the master record; `categories` and `units` describe an item,
they don't move stock.

## Table-by-table spec

### `categories` (existing — `apps/api/src/category/entities/category.entity.ts`, unchanged)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name`, `slug` (unique), `description` | varchar/text | |
| `parent_id` | uuid, nullable, FK → `categories.id` | self-referencing tree |
| `path`, `level` | text, int | materialized path for subtree queries |
| `display_order` | int | |
| `is_active` | bool | |
| `version` | int | optimistic locking |
| soft-delete + audit columns | | `deleted_at`, `created_by`, `updated_by`, `deleted_by` |

**Relations:** one `category` → many `items` (`items.category_id`,
nullable — an item can be uncategorized). No direct relation to inventory;
categories describe menu/catalog structure, not stock.

### `units` (NEW — replaces the `ItemUnit` enum as the source of truth)

```ts
export enum UnitType { WEIGHT = 'weight', VOLUME = 'volume', COUNT = 'count' }

@Entity('units')
@Index('idx_unit_code', ['code'], { unique: true })
@Index('idx_unit_type', ['unitType'])
export class Unit {
  id!: string;
  code!: string;        // stable short code: 'kg', 'gram', 'piece', 'litre', 'ml', 'dozen', 'plate', ... (seeded 1:1 from today's ItemUnit enum values so no data is renamed)
  name!: string;        // display name: "Kilogram"
  unitType!: UnitType;  // groups convertible units — weight units convert to weight units, etc.
  isBaseUnit!: boolean; // exactly one true per unitType (kg for weight, litre for volume, piece for count) — the anchor global conversions are expressed against
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
```

**Relations:** one `unit` → many `items` via `items.unit_id` (stock/base
unit); one `unit` → many `items` via `items.purchase_unit_id` (nullable —
the unit a supplier bills in, when it differs from the stock unit); one
`unit` → many `unit_conversions` rows as either `from_unit_id` or
`to_unit_id`.

### `unit_conversions` (from [`units_plan.md`](./units_plan.md), FK'd to `units` instead of comparing enum strings)

```ts
@Entity('unit_conversions')
@Unique(['itemId', 'fromUnitId', 'toUnitId'])
export class UnitConversion {
  id!: string;
  itemId!: string | null;   // null = global conversion (kg<->gram, litre<->ml); set = item-specific override (e.g. "Whole Chicken" piece<->kg)
  fromUnitId!: string;      // FK -> units.id
  toUnitId!: string;        // FK -> units.id
  factor!: number;          // qty_in_fromUnit * factor = qty_in_toUnit
}
```

**Relations:** many `unit_conversions` → one `item` (nullable — global rows
have no item); many `unit_conversions` → one `unit` (×2, as `from`/`to`).

### `items` (existing — `apps/api/src/items/entities/item.entity.ts`, extended)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name`, `sku` (unique), `hsn_code`, `description` | | existing |
| `price`, `cost_price` | decimal | existing (`cost_price` is also recomputed by `RecipesService.computeCost` for recipe items — two costing inputs, documented in README background) |
| `gst_rate` | enum | existing |
| ~~`unit`~~ → **`unit_id`** | uuid, FK → `units.id` | **changed**: was `ItemUnit` enum, now FK. This is the item's stock/base unit — the unit `Inventory.currentStock` and `StockMovement.quantity` are always expressed in. |
| **`purchase_unit_id`** | uuid, nullable, FK → `units.id` | **new** (moved here from `units_plan.md`'s original design, now FK not enum). Null = same as `unit_id`, no conversion needed at goods receipt. |
| **`shelf_life_days`** | int, nullable | **new** (from [`batch-tracking_plan.md`](./batch-tracking_plan.md)). Non-perishables leave this null; used to compute a batch's `expiry_date` at receipt. |
| `product_type` | enum (`raw`/`semi_finished`/`finished`) | existing |
| `category_id` | uuid, nullable, FK → `categories.id` | existing |
| `is_active`, `is_veg`, `image` | | existing |

**Relations:** many `items` → one `category` (nullable); many `items` → one
`unit` (required); many `items` → one `unit` as purchase unit (nullable);
one `item` → many `inventory` rows (one per storage unit it's stocked in);
one `item` → many `stock_movements`; one `item` → many `stock_batches`; one
`item` → many `unit_conversions` (item-specific overrides); one `item` →
zero-or-one `opening_stock_entries` **per storage unit** (see unique
constraint below, not per item globally).

### `storage_units` (NEW — promoted from the old `multi-location_plan.md`'s "lowest priority, only if needed" `StockLocation` to a core, day-one entity)

```ts
export enum StorageUnitType { STORE = 'store', KITCHEN = 'kitchen', BAR = 'bar', COLD_STORAGE = 'cold_storage', OTHER = 'other' }

@Entity('storage_units')
@Index('idx_storage_unit_code', ['code'], { unique: true })
@Index('idx_storage_unit_active', ['isActive'])
export class StorageUnit {
  id!: string;
  name!: string;         // "Central Store", "Kitchen Line 1", "Walk-in Fridge", "Bar Counter"
  code!: string;         // short stable code for references/reports, e.g. "MAIN", "KITCHEN-1"
  type!: StorageUnitType;
  isDefault!: boolean;   // exactly one row has this true — see rollout below; new inventory/purchases/opening-stock default here unless a location is explicitly chosen
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
```

**Explicitly distinct from `zones`** (`apps/api/src/seating/entities/zone.entity.ts`).
`zones`/`tables` model where **guests** sit; `storage_units` model where
**stock** physically lives. Do not merge or reuse one for the other — a
"Central Store" is never a seating zone, and a "family dining zone" is
never a place stock is counted.

**Relations:** one `storage_unit` → many `inventory` rows; one
`storage_unit` → many `stock_movements`; one `storage_unit` → many
`stock_batches`; one `storage_unit` → many `opening_stock_entries`.

### `inventory` (existing table, **key changed**)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `item_id` | uuid, FK → `items.id` | existing |
| **`storage_unit_id`** | uuid, FK → `storage_units.id` | **new**. Unique index moves from `(item_id)` to **`(item_id, storage_unit_id)`** — an item now has one `Inventory` row *per storage unit it's stocked in*, not one globally. |
| `opening_balance`, `current_stock`, `min_stock_level`, `unit_cost`, `status` | decimal/varchar | existing, now scoped per storage unit — the same item can have different `current_stock`/`unit_cost` in "Central Store" vs. "Kitchen Line 1" |
| `created_at`, `updated_at` | | existing |

**Relations:** many `inventory` rows → one `item`; many `inventory` rows →
one `storage_unit`. A "total stock for an item across the restaurant" view
is `SUM(current_stock) WHERE item_id = :id GROUP BY item_id` — no longer a
direct column read, since stock is now location-scoped (see worked query
below).

### `stock_movements` (existing table, extended)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `item_id` | uuid, FK → `items.id` | existing |
| **`storage_unit_id`** | uuid, **not null**, FK → `storage_units.id` | **new** — every movement happens at a location. `balance_before`/`balance_after` are the location's balance, not the item's global balance. |
| **`batch_id`** | uuid, nullable, FK → `stock_batches.id` | **new** (from [`batch-tracking_plan.md`](./batch-tracking_plan.md)) — which physical batch this out-movement drew from. Null for in-movements that don't reference an existing batch (e.g. `opening_balance`) and for pre-batch-tracking history. |
| **`transfer_group_id`** | uuid, nullable | **new** — when `type` is `transfer_in`/`transfer_out`, both movement rows in the pair share this value so a transfer can be reconstructed as one logical event instead of two independent rows. Not a FK (no `transfers` table — the pair *is* the record); just a shared correlation id generated once per transfer. |
| `type`, `quantity`, `balance_before`, `balance_after`, `reference`, `notes`, `created_by`, `created_at` | | existing, unchanged shape |

**Relations:** many `stock_movements` → one `item`; many `stock_movements`
→ one `storage_unit`; many `stock_movements` → zero-or-one `stock_batch`.

### `stock_batches` (NEW — from [`batch-tracking_plan.md`](./batch-tracking_plan.md), extended here with the storage-unit dimension)

```ts
@Entity('stock_batches')
@Index(['itemId', 'storageUnitId', 'expiryDate'])
export class StockBatch {
  id!: string;
  itemId!: string;                 // FK -> items.id
  storageUnitId!: string;          // FK -> storage_units.id — new: a batch physically sits in one location
  purchaseId!: string | null;      // FK -> purchases.id, traceability back to the GRN
  parentBatchId!: string | null;   // FK -> stock_batches.id, self-ref — new: set when a transfer splits part of a batch to another storage unit, so both halves trace to one physical delivery
  batchNumber!: string;            // e.g. "CHK-20260710-01"
  quantityReceived!: number;
  quantityRemaining!: number;
  unitCost!: number;
  receivedDate!: Date;
  expiryDate!: Date | null;
  status!: 'active' | 'exhausted' | 'expired' | 'written_off';
}
```

**Relations:** many `stock_batches` → one `item`; many `stock_batches` →
one `storage_unit`; many `stock_batches` → zero-or-one `purchase`; many
`stock_batches` → zero-or-one parent `stock_batch` (self-ref, for
transfer-splits); one `stock_batch` → many `stock_movements` (the
consumption draws that depleted it).

**Transfer/split rule:** transferring an entire batch to another storage
unit updates its `storage_unit_id` in place (same physical goods, new
location, no new row). Transferring *part* of a batch creates a new
`stock_batches` row at the destination with `parent_batch_id` pointing at
the source batch, `quantity_received = quantity_remaining = <transferred
qty>`, and decrements the source batch's `quantity_remaining` — mirroring
how a real kitchen splits a half-used tray between the walk-in and the
line.

### `opening_stock_entries` (NEW — the pillar with no dedicated entity today)

Today "opening stock" is just whatever `InventoryService.setOpeningBalance()`
writes to `Inventory.openingBalance` plus one `StockMovement` row typed
`OPENING_BALANCE` — and that method can be called again later, silently
overwriting both the balance and the audit trail's meaning (a second
"opening balance" movement doesn't mean what it says). This table makes
"declare opening stock" a one-time, tracked event instead.

```ts
@Entity('opening_stock_entries')
@Unique(['itemId', 'storageUnitId'])
export class OpeningStockEntry {
  id!: string;
  itemId!: string;             // FK -> items.id
  storageUnitId!: string;      // FK -> storage_units.id
  quantity!: number;
  unitCost!: number;
  asOfDate!: Date;             // the date stock is considered to start being tracked (go-live date, or start of a financial year for a newly-added item)
  stockMovementId!: string;    // FK -> stock_movements.id, 1:1 — the actual OPENING_BALANCE ledger row this created
  createdBy!: string | null;
  createdAt!: Date;
}
```

**Relations:** many `opening_stock_entries` → one `item`; many
`opening_stock_entries` → one `storage_unit`; one `opening_stock_entry` →
one `stock_movement` (the row it posted). The `Unique(['itemId',
'storageUnitId'])` constraint is the enforcement mechanism: an item can
only be opened once per storage unit. Any later correction — miscounted
opening stock, or stock discovered after go-live — goes through
`adjustment_in`/`adjustment_out` (a normal, repeatable movement type), not
a second opening entry. This is the same "don't hand-edit the ledger"
principle [`stock-count_plan.md`](./stock-count_plan.md) already applies to
physical-count variances.

## Cardinality summary

| Relationship | Cardinality | Enforced by |
|---|---|---|
| Category → Item | 1:N, nullable | `items.category_id` FK |
| Category → Category (parent) | 1:N, nullable, self-ref | `categories.parent_id` FK |
| Unit → Item (stock unit) | 1:N, required | `items.unit_id` FK |
| Unit → Item (purchase unit) | 1:N, nullable | `items.purchase_unit_id` FK |
| Item/Unit → UnitConversion | 1:N (each) | `unit_conversions.item_id` (nullable), `.from_unit_id`, `.to_unit_id` |
| Item × StorageUnit → Inventory | 1:1 per pair | `UNIQUE(inventory.item_id, inventory.storage_unit_id)` |
| Item × StorageUnit → StockMovement | 1:N per pair | `stock_movements.item_id` + `.storage_unit_id` FKs |
| Item × StorageUnit → StockBatch | 1:N per pair | `stock_batches.item_id` + `.storage_unit_id` FKs |
| Item × StorageUnit → OpeningStockEntry | 1:1 per pair | `UNIQUE(opening_stock_entries.item_id, .storage_unit_id)` |
| StockBatch → StockMovement | 1:N, nullable | `stock_movements.batch_id` FK |
| StockBatch → StockBatch (parent) | 1:N, nullable, self-ref | `stock_batches.parent_batch_id` FK |
| Purchase → StockBatch | 1:N, nullable | `stock_batches.purchase_id` FK |
| OpeningStockEntry → StockMovement | 1:1 | `opening_stock_entries.stock_movement_id` FK |

## Design decisions & rationale

- **Enum → table for units**: enables joins/reporting ("which items use a
  unit that has no global conversion defined?") and lets ops add a new unit
  without a deploy. Seeded 1:1 from the current `ItemUnit` enum values so
  `code` strings stay stable — nothing that reads `item.unit` as a string
  today needs to change meaning, only its storage (FK vs. enum column).
- **Storage-unit-scoped `Inventory`/`StockMovement` from day one**: the old
  `multi-location_plan.md` deferred this and flagged it as the riskiest
  possible change because every earlier module would need retrofitting.
  Building it into the schema before any of the gap-fix modules (purchase
  receiving, ledger, batch tracking) removes that risk entirely — those
  modules are now written once, against the final key shape.
- **One seeded default `StorageUnit`, not a "location-optional" design**:
  keeping `storage_unit_id` **required** (not nullable) on `inventory` and
  `stock_movements` avoids a permanent "some rows have a location, some
  don't" split. A single "Main Store" row with `is_default = true` makes
  day-one behavior identical to the current single-location system (see
  Rollout below) while keeping the schema honest.
- **`transfer_group_id` instead of a `transfers` table**: a transfer is
  fully represented by its paired `TRANSFER_OUT`/`TRANSFER_IN` movement
  rows (existing `MovementType` values, already defined, currently unused —
  confirmed by grep in the original `multi-location_plan.md`). A
  correlation id is enough to reconstruct the pair for display; a full
  parent table would duplicate data the two rows already carry.
- **`OpeningStockEntry` as its own table, not just a movement type**: makes
  "has this item/location's opening stock been declared" a queryable,
  constrained fact (`UNIQUE(item_id, storage_unit_id)`) instead of
  something only inferable by scanning `stock_movements` for a row typed
  `OPENING_BALANCE` that might have been overwritten by a second call.

## Rollout (non-breaking, phased)

No DB migration tooling exists in this repo (confirmed: no `migrations/`
folder, no `migration:*` scripts; `synchronize: process.env.NODE_ENV !==
'production'` applies entity changes automatically on next dev server
start). Flag to the user before running any of this that existing dev data
in `inventory`/`stock_movements` will need re-seeding once the unique key
changes shape — `synchronize` cannot migrate a `(item_id)` unique index to
`(item_id, storage_unit_id)` in place.

1. **Seed one `StorageUnit`**: `{ name: 'Main Store', code: 'MAIN', type:
   'store', isDefault: true, isActive: true }` in
   `database-seed.service.ts`, before any `Inventory`/`StockMovement` seed
   data is created.
2. **Seed `units` from the current `ItemUnit` enum values** (13 rows: kg,
   gram, litre, ml, piece, dozen, plate, bowl, cup, glass, bottle, box,
   packet) with `unitType`/`isBaseUnit` assigned per the grouping in the
   `units` table spec above.
3. Every write path that creates an `Inventory`, `StockMovement`,
   `StockBatch`, or `OpeningStockEntry` row defaults `storage_unit_id` to
   the `is_default` `StorageUnit` unless a caller explicitly passes one —
   so existing single-location flows (purchase receipt, sale, manual
   adjustment) don't need to change their calling code at all for this
   phase.
4. Once modules 1–6 (see [`README.md`](./README.md)) are implemented
   against this schema, a second storage unit can be created and stock
   transferred into it (`transfer_in`/`transfer_out`) as a real,
   non-speculative feature — at that point the location picker surfaces in
   the frontend (purchase receiving, manual adjust, POS if line-level
   stock visibility becomes a requirement). Until then, the UI can
   continue to omit a location selector entirely; the schema is ready, the
   product surface isn't forced to expose it early.

## Cross-cutting invariants (build as standing checks, not one-off queries)

- `Σ(inventory.current_stock) GROUP BY item_id` reconciles to
  `Σ(stock_movements signed by type) GROUP BY item_id` — the same
  before/after bookkeeping `InventoryService.adjustStock()` already does
  per-row, just summable across locations.
- `Σ(stock_batches.quantity_remaining) WHERE item_id = :x AND
  storage_unit_id = :y` reconciles to `inventory.current_stock` for that
  `(item_id, storage_unit_id)` pair, once batch tracking (module 6) is
  live — every unit of stock on the shelf should be attributable to some
  batch.
- `opening_stock_entries` has at most one row per `(item_id,
  storage_unit_id)` — enforced by the unique index, not just convention.

## Worked query examples

Total stock for an item across all locations (replaces the old
single-row read):

```sql
SELECT i.name, SUM(inv.current_stock) AS total_stock
FROM inventory inv
JOIN items i ON i.id = inv.item_id
WHERE inv.item_id = :itemId
GROUP BY i.name;
```

Per-location breakdown with unit and category, for a stock-by-location
report:

```sql
SELECT su.name AS storage_unit, inv.current_stock, inv.unit_cost,
       u.code AS unit, c.name AS category
FROM inventory inv
JOIN items i ON i.id = inv.item_id
JOIN storage_units su ON su.id = inv.storage_unit_id
JOIN units u ON u.id = i.unit_id
LEFT JOIN categories c ON c.id = i.category_id
WHERE inv.item_id = :itemId
ORDER BY su.name;
```

Movement history for an item at a specific location, with the batch it
drew from:

```sql
SELECT sm.created_at, sm.type, sm.quantity, sm.balance_after,
       sb.batch_number, sb.expiry_date
FROM stock_movements sm
LEFT JOIN stock_batches sb ON sb.id = sm.batch_id
WHERE sm.item_id = :itemId AND sm.storage_unit_id = :storageUnitId
ORDER BY sm.created_at DESC;
```

## Verification

- `tsc --noEmit` in `apps/api` once the schema changes from this file are
  applied across `items`, `units`, `unit_conversions`, `storage_units`,
  `inventory`, `stock_movements`, `stock_batches`, `opening_stock_entries`.
- All three worked queries above return correct joined rows on seed data.
- Creating a second `Inventory` row for the same `(item_id,
  storage_unit_id)` pair is rejected by the unique index (not just
  app-level validation).
- Creating a second `OpeningStockEntry` for the same `(item_id,
  storage_unit_id)` pair is rejected by the unique index; a second
  "opening" attempt must be redirected to `adjustment_in`/`adjustment_out`.
- With only the seeded "Main Store" location present, every existing
  inventory/purchase/sale/wastage flow behaves identically to before this
  module — confirms the rollout is genuinely non-breaking.
