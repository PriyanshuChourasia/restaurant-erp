> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Inventory Module — Help & Schema Reference

## Overview

Inventory and stock management: tracks stock levels across storage units,
records movements (purchase in, sale out, adjustments, transfers, wastage),
batch tracking with FEFO, stock counts with variance reconciliation, and
expiry date sweep.

**Base paths:** `/api/inventory`, `/api/storage-units`, `/api/inventory/stock-counts`

## Entities (Tables)

### `inventory`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `item_id` | `uuid FK → items` | Item |
| `storage_unit_id` | `uuid FK → storage_units` | Storage location |
| `opening_balance` | `decimal(14,3)` | Opening balance |
| `current_stock` | `decimal(14,3)` | Current stock quantity |
| `min_stock_level` | `decimal(14,3)` | Reorder level |
| `unit_cost` | `decimal(14,2)` | Weighted-average unit cost |
| `status` | `varchar(50)` | Status (default: active) |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |

**Unique:** `(itemId, storageUnitId)`

### `stock_movements`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `item_id` | `uuid` | Item |
| `storage_unit_id` | `uuid FK → storage_units` | Storage location |
| `type` | `enum` | Movement type (opening_balance, purchase_in, sale_out, adjustment_in, adjustment_out, wastage, transfer_out, transfer_in, production_consumption, production_yield) |
| `quantity` | `decimal(14,3)` | Quantity moved |
| `balance_before` | `decimal(14,3)` | Stock before movement |
| `balance_after` | `decimal(14,3)` | Stock after movement |
| `transfer_group_id` | `uuid null` | Transfer batch ID |
| `reference` | `varchar(255) null` | Reference document |
| `notes` | `text null` | Notes |
| `batch_id` | `uuid null` | Associated stock batch |
| `created_by` | `uuid null` | Creator |
| `created_at` | `timestamp` | Created timestamp |

### `storage_units`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `name` | `varchar(255)` | Storage unit name |
| `code` | `varchar(50) unique` | Short code |
| `type` | `enum (store, kitchen, bar, cold_storage, other)` | Type |
| `is_default` | `boolean` | Default flag |
| `is_active` | `boolean` | Active flag |

### `stock_batches`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `item_id` | `uuid FK → items` | Item |
| `storage_unit_id` | `uuid FK → storage_units` | Location |
| `purchase_id` | `uuid null` | Source purchase |
| `parent_batch_id` | `uuid null` | Parent batch (splitting) |
| `batch_number` | `varchar(100)` | Batch/lot number |
| `quantity_received` | `decimal(14,3)` | Initial quantity |
| `quantity_remaining` | `decimal(14,3)` | Current quantity |
| `unit_cost` | `decimal(14,2)` | Per-unit cost |
| `received_date` | `date` | Receipt date |
| `expiry_date` | `date null` | Expiry date |
| `status` | `enum (active, exhausted, expired, written_off)` | Batch status |

### `opening_stock_entries`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `item_id` | `uuid FK → items` | Item |
| `storage_unit_id` | `uuid FK → storage_units` | Location |
| `quantity` | `decimal(14,3)` | Opening quantity |
| `unit_cost` | `decimal(14,2)` | Unit cost |
| `as_of_date` | `date` | Effective date |
| `stock_movement_id` | `uuid FK → stock_movements` | Generated movement |
| `created_by` | `uuid null` | Creator |

### `stock_counts` / `stock_count_lines`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Stock count header |
| `storage_unit_id` | `uuid FK` | Location being counted |
| `count_date` | `date` | Count date |
| `status` | `enum (draft, completed)` | Status |
| **Lines:** `item_id`, `system_quantity`, `counted_quantity`, `variance`, `notes` | — | Per-item count lines |

### `stock_items` (Stock Groups)

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `super_key` | `bigint unique` | Sequential display ID |
| `name` | `varchar(100)` | Group name (RM, FG, PKG, etc.) |
| `code` | `varchar(20) unique` | Short code |
| `parent_category_id` | `uuid FK → stock_categories null` | Parent category |

### `stock_categories`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `super_key` | `bigint unique` | Sequential display ID |
| `name` | `varchar(100)` | Category name |
| `parent_category_id` | `uuid FK → stock_categories null` | Parent |

### `stock_ledgers`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `super_key` | `bigint unique` | Sequential display ID |
| `stock_item_id` | `uuid FK → units` | Stock item |
| `warehouse_id` | `uuid FK → storage_units` | Warehouse |
| `transaction_type` | `varchar(50)` | Type |
| `reference_type` | `varchar(50) null` | Source document type |
| `reference_id` | `uuid null` | Source document ID |
| `quantity_change` | `decimal(18,3)` | Signed quantity change |
| `unit_cost` | `decimal(18,2) null` | Cost per unit |
| `batch_id` | `uuid null` | Batch |
| `transaction_date` | `timestamp` | Transaction date |
| `remarks` | `text null` | Remarks |
| `created_by` | `uuid null` | Creator |

## API Endpoints

### Inventory

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/inventory` | — | List inventory (paginated, filtered) |
| `GET` | `/inventory/low-stock` | — | Get low stock alerts |
| `GET` | `/inventory/valuation/summary` | — | Inventory valuation report |
| `GET` | `/inventory/batches/all` | — | List all batches |
| `GET` | `/inventory/near-expiry` | — | Get near-expiry batches |
| `GET` | `/inventory/:itemId` | — | Get inventory for item |
| `GET` | `/inventory/:itemId/movements` | — | Get stock movements |
| `GET` | `/inventory/:itemId/batches` | — | Get batches for item |
| `GET` | `/inventory/:itemId/opening-stock` | — | Get opening stock |
| `POST` | `/inventory/:itemId/opening-stock` | — | Declare opening stock |
| `POST` | `/inventory/:itemId/opening-balance` | — | Set opening balance (legacy) |
| `POST` | `/inventory/:itemId/adjust` | — | Adjust stock |
| `POST` | `/inventory/transfer` | — | Transfer stock between units |

### Storage Units

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/storage-units` | — | List storage units |
| `GET` | `/storage-units/default` | — | Get default storage unit |
| `GET` | `/storage-units/:id` | — | Get by ID |
| `POST` | `/storage-units` | — | Create storage unit |
| `PATCH` | `/storage-units/:id` | — | Update storage unit |
| `PATCH` | `/storage-units/:id/set-default` | — | Set as default |
| `DELETE` | `/storage-units/:id` | — | Delete storage unit |

### Stock Counts

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/inventory/stock-counts` | — | List stock counts |
| `GET` | `/inventory/stock-counts/:id` | — | Get stock count with lines |
| `POST` | `/inventory/stock-counts` | — | Create stock count |
| `POST` | `/inventory/stock-counts/:id/submit` | — | Submit counted quantities |
| `POST` | `/inventory/stock-counts/:id/complete` | — | Complete count and post adjustments |

## Key Dependencies

- `ItemsModule` — for item lookup
- `LedgerModule` — for ledger integration (stock movements → ledger entries)
- Used by: `SalesModule`, `PurchasesModule`, `RecipesModule`
