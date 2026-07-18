> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Category Module — Help & Schema Reference

## Overview

Tree-structured category management for menu items. Supports nested categories
with path-based hierarchy, display ordering, and soft-delete with restore.

**Base path:** `/api/categories`

## Entities (Tables)

### `categories`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `name` | `varchar(255)` | Category name |
| `description` | `text null` | Description |
| `slug` | `varchar(255) unique` | URL-friendly slug |
| `display_order` | `int` | Sorting order (default: 0) |
| `is_active` | `boolean` | Active flag (default: true) |
| `parent_id` | `uuid FK → categories null` | Parent category |
| `path` | `text` | Materialized path (e.g. `/root/sub/`) |
| `level` | `int` | Depth in tree (default: 0) |
| `icon` | `varchar(500) null` | Icon identifier |
| `image` | `varchar(500) null` | Image URL |
| `version` | `int` | Optimistic locking version |
| `created_by` | `uuid null` | Creator user ID |
| `updated_by` | `uuid null` | Last updater user ID |
| `deleted_by` | `uuid null` | Deleter user ID |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |
| `deleted_at` | `timestamp null` | Soft-delete timestamp |

**Indexes:** `idx_category_path`, `idx_category_parent_id`, `idx_category_is_active`, `idx_category_display_order`, `idx_category_level`, `idx_category_slug` (unique)

## API Endpoints

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/categories` | — | List categories (with search/filter) |
| `GET` | `/categories/tree` | — | Get full category tree |
| `GET` | `/categories/root` | — | Get root-level categories |
| `GET` | `/categories/:id` | — | Get category by ID |
| `GET` | `/categories/:id/children` | — | Get direct children |
| `GET` | `/categories/:id/descendants` | — | Get all descendants |
| `GET` | `/categories/:id/ancestors` | — | Get ancestor chain |
| `GET` | `/categories/:id/breadcrumb` | — | Get breadcrumb path |
| `POST` | `/categories` | `menu.create` | Create category |
| `PUT` | `/categories/:id` | `menu.update` | Update category |
| `PATCH` | `/categories/:id/move` | `menu.update` | Move category under new parent |
| `PATCH` | `/categories/:id/activate` | `menu.update` | Activate category |
| `PATCH` | `/categories/:id/deactivate` | `menu.update` | Deactivate category |
| `PATCH` | `/categories/:id/restore` | `menu.update` | Restore deleted category |
| `DELETE` | `/categories/:id` | `menu.delete` | Soft-delete category (`?force=true` to force) |

## Key Dependencies

- `CategoryEntity` referenced by `Item` entity
