> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Price Levels Module — Help & Schema Reference

## Overview

Pricing tiers: manages price levels (e.g. regular, happy hour, corporate) and
item-level price overrides per level. Supports bulk pricing grid updates and
effective price resolution with fallback to base item price.

**Base path:** `/api/price-levels`

## Entities (Tables)

### `price_levels`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `name` | `varchar(255) unique` | Price level name |
| `code` | `varchar(100) unique` | Stable code identifier |
| `description` | `text null` | Description |
| `is_default` | `boolean` | Default level flag |
| `is_active` | `boolean` | Active flag (default: true) |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |
| `deleted_at` | `timestamp null` | Soft-delete timestamp |

**Indexes:** `idx_price_level_code` (unique), `idx_price_level_active`, `idx_price_level_default`

### `item_price_levels`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `item_id` | `uuid FK → items` | Item |
| `price_level_id` | `uuid FK → price_levels` | Price level |
| `price` | `decimal(12,2)` | Override price |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |

**Unique:** `(itemId, priceLevelId)`

## API Endpoints

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/price-levels` | — | List price levels |
| `GET` | `/price-levels/active` | — | List active price levels |
| `GET` | `/price-levels/:id` | — | Get price level by ID |
| `GET` | `/price-levels/:id/pricing-grid` | — | Get item-price grid |
| `GET` | `/price-levels/:priceLevelId/items/:itemId/effective-price` | — | Get effective price for item |
| `POST` | `/price-levels` | `pricing.create` | Create price level |
| `PATCH` | `/price-levels/:id` | `pricing.update` | Update price level |
| `PATCH` | `/price-levels/:id/activate` | `pricing.update` | Activate price level |
| `PATCH` | `/price-levels/:id/deactivate` | `pricing.update` | Deactivate price level |
| `PATCH` | `/price-levels/:id/set-default` | `pricing.update` | Set as default |
| `POST` | `/price-levels/:id/pricing-grid` | `pricing.update` | Bulk upsert item prices |
| `DELETE` | `/price-levels/:id` | `pricing.delete` | Soft-delete price level |
| `POST` | `/price-levels/:id/restore` | `pricing.update` | Restore deleted level |

## Key Dependencies

- `ItemsModule` — for item lookup
- `CustomersModule` — for customer-to-price-level mapping
- Used by: `OrdersModule`, `SalesModule`
