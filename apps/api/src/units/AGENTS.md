> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Units Module — Help & Schema Reference

## Overview

Units of Measure management: manages UOMs (kg, g, L, ml, pcs, etc.) with
base-unit conversion factors, item-specific unit conversions, and multi-unit
formatting (display as "3 kg 400 g" or compact as "3.4 kg").

Also hosts the Stock Items Master (`units` table) — every inventoried item
(raw materials, finished goods, etc.) with stock group/category classification.

**Base paths:** `/api/units`, `/api/stock-items`

## Entities (Tables)

### `unit_of_measures`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `super_key` | `bigint unique` | Sequential display ID |
| `name` | `varchar(50)` | Unit name (e.g. Kilogram) |
| `symbol` | `varchar(10) unique` | Short symbol (e.g. kg) |
| `description` | `text null` | Description |
| `base_unit_id` | `uuid FK → unit_of_measures null` | Base unit reference |
| `conversion_factor` | `decimal(18,6)` | Factor to base unit (default: 1) |
| `decimal_allowed` | `boolean` | Allow decimal quantities (default: true) |
| `is_active` | `boolean` | Active flag (default: true) |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |

**Indexes:** `idx_uom_symbol` (unique), `idx_uom_active`, `idx_uom_base`

### `unit_conversions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `item_id` | `uuid FK → items null` | Item-specific conversion |
| `from_unit_id` | `uuid FK → unit_of_measures` | Source unit |
| `to_unit_id` | `uuid FK → unit_of_measures` | Target unit |
| `factor` | `decimal(14,6)` | Conversion factor |

**Unique:** `(itemId, fromUnitId, toUnitId)`

### `stock_items_master` (entity: `Unit`)

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `super_key` | `bigint unique` | Sequential display ID |
| `code` | `varchar(20) unique` | Stock item code |
| `name` | `varchar(150)` | Item name |
| `alias` | `varchar(150) null` | Alternate name |
| `stock_group_id` | `uuid FK → stock_items null` | Stock group (RM/FG/PKG) |
| `stock_category_id` | `uuid FK → stock_categories null` | Stock category |
| `unit_id` | `uuid FK → unit_of_measures null` | UOM |
| `description` | `text null` | Description |
| `opening_quantity` | `decimal(18,3) null` | Opening stock qty |
| `opening_rate` | `decimal(18,2) null` | Opening unit rate |
| `reorder_level` | `decimal(18,3) null` | Reorder threshold |
| `hsn_code` | `varchar(20) null` | HSN code |
| `gst_rate` | `decimal(5,2) null` | GST rate |
| `barcode` | `varchar(100) null` | Barcode |
| `track_batch` | `boolean` | Batch tracking flag |
| `track_expiry` | `boolean` | Expiry tracking flag |
| `is_active` | `boolean` | Active flag (default: true) |
| `created_by` | `uuid null` | Creator |
| `updated_by` | `uuid null` | Last updater |

## API Endpoints

### Units

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/units` | — | List units of measure |
| `GET` | `/units/convert` | — | Convert quantity between units |
| `GET` | `/units/format` | — | Format quantity as multi-unit display |
| `POST` | `/units/format-batch` | — | Batch format multiple quantities |

### Stock Items

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/stock-items` | — | List stock items (paginated, filtered by group/category) |

## Key Dependencies

- `ItemsModule` — for item-specific conversions
- Used by: `PurchasesModule` (for unit handling)
