> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Item Suppliers Module — Help & Schema Reference

## Overview

Item-supplier linking: manages supplier-specific pricing, SKUs, lead times,
and preferred supplier designation for each inventory item. Enables purchase
price comparison and preferred vendor selection.

**Base path:** `/api/item-suppliers`

## Entities (Tables)

### `item_suppliers`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `item_id` | `uuid FK → items` | Item |
| `supplier_id` | `uuid FK → suppliers` | Supplier |
| `supplier_sku` | `varchar(100) null` | Supplier's SKU for this item |
| `unit_price` | `decimal(12,2)` | Supplier unit price |
| `unit_id` | `uuid FK → unit_of_measures null` | Pricing unit |
| `lead_time_days` | `int` | Lead time in days (default: 0) |
| `is_preferred` | `boolean` | Preferred supplier flag |
| `min_order_qty` | `decimal(14,3)` | Minimum order quantity |
| `last_purchase_date` | `date null` | Last purchase date |
| `last_purchase_price` | `decimal(12,2)` | Last paid price |
| `is_active` | `boolean` | Active flag (default: true) |
| `notes` | `text null` | Notes |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |
| `deleted_at` | `timestamp null` | Soft-delete timestamp |

**Unique:** `(itemId, supplierId)`

## API Endpoints

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/item-suppliers/item/:itemId` | — | Get suppliers for an item |
| `GET` | `/item-suppliers/supplier/:supplierId` | — | Get items for a supplier |
| `GET` | `/item-suppliers/:id` | — | Get one item-supplier link |
| `POST` | `/item-suppliers` | — | Create item-supplier link |
| `PATCH` | `/item-suppliers/:id` | — | Update item-supplier link |
| `DELETE` | `/item-suppliers/:id` | — | Delete item-supplier link |
| `POST` | `/item-suppliers/set-preferred/:itemId/:supplierId` | — | Set preferred supplier for item |

## Key Dependencies

- `ItemsModule` — for item lookup
- `SuppliersModule` — for supplier lookup
- `UnitsModule` — for pricing unit
