> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Recipes Module — Help & Schema Reference

## Overview

Recipe/BOM management: defines how menu items are produced from component
ingredients. Supports yield quantity, per-ingredient proportions, recipe cost
computation, and production entry recording (stock consumption + yield).

**Base path:** `/api/recipes`

## Entities (Tables)

### `recipes`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `output_item_id` | `uuid FK → items unique` | Item this recipe produces |
| `yield_quantity` | `decimal(10,3)` | Output quantity per batch |
| `yield_unit` | `enum (piece, kg, gram, litre, ...)` | Output unit |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |
| `deleted_at` | `timestamp null` | Soft-delete timestamp |

**Indexes:** `idx_recipe_output_item` (unique)

### `recipe_ingredients`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `recipe_id` | `uuid FK → recipes` | Parent recipe |
| `component_item_id` | `uuid FK → items` | Component/raw material |
| `quantity` | `decimal(10,3)` | Quantity needed |
| `unit` | `enum` | Unit of measure |

**Unique:** `(recipeId, componentItemId)`

### `production_entries`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `item_id` | `uuid FK → items` | Item produced |
| `batch_quantity` | `decimal(10,3)` | Quantity produced |
| `produced_at` | `timestamp` | Production timestamp |
| `created_by` | `uuid null` | Creator |
| `created_at` | `timestamp` | Created timestamp |

## API Endpoints

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/recipes/:itemId` | — | Get recipe by output item |
| `GET` | `/recipes/:itemId/cost` | — | Compute recipe cost |
| `POST` | `/recipes` | — | Create/update recipe |
| `POST` | `/recipes/:itemId/recalculate-cost` | — | Persist computed cost to item |
| `POST` | `/recipes/production` | — | Create production entry (consumes stock) |
| `DELETE` | `/recipes/:itemId` | — | Delete recipe by output item |

## Key Dependencies

- `ItemsModule` — for item lookup
- `InventoryModule` — for stock consumption during production
