> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Purchases Module — Help & Schema Reference

## Overview

Purchase order management: creates, updates, and receives purchase orders.
Tracks supplier, items, quantities, pricing, GST, and integrates with
inventory to post stock movements upon receipt.

**Base path:** `/api/purchases`

## Entities (Tables)

### `purchases`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `purchase_number` | `varchar(50) unique` | Generated PO number |
| `supplier_id` | `uuid FK → suppliers` | Supplier |
| `status` | `enum (draft, ordered, received, cancelled)` | Purchase status |
| `purchase_date` | `date` | Order date |
| `subtotal` | `decimal(14,2)` | Subtotal |
| `discount` | `decimal(14,2)` | Discount amount |
| `tax_amount` | `decimal(14,2)` | Tax amount |
| `total_amount` | `decimal(14,2)` | Grand total |
| `notes` | `text null` | Notes |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |
| `deleted_at` | `timestamp null` | Soft-delete timestamp |

**Indexes:** `idx_purchase_status`, `idx_purchase_date`

### `purchase_items`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `purchase_id` | `uuid FK → purchases` | Parent purchase |
| `item_id` | `uuid FK → items` | Item |
| `quantity` | `decimal(12,2)` | Quantity |
| `unit_price` | `decimal(12,2)` | Unit price |
| `gst_rate` | `decimal(5,2)` | GST rate |
| `total_price` | `decimal(14,2)` | Line total |

## API Endpoints

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/purchases` | — | List purchases (paginated, filtered) |
| `GET` | `/purchases/:id` | — | Get purchase by ID |
| `POST` | `/purchases` | — | Create purchase order |
| `PATCH` | `/purchases/:id/status` | — | Update status |
| `PATCH` | `/purchases/:id/receive` | — | Receive (goods receipt note) |

## Key Dependencies

- `InventoryModule` — for stock posting on receipt
- `UnitsModule` — for unit-related operations
- `SuppliersModule` — for supplier lookup
