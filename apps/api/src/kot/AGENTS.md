> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# KOT Module — Help & Schema Reference

## Overview

Kitchen Order Tickets (KOTs): manages order items sent to the kitchen for
preparation. Tracks per-item status through the cooking lifecycle
(pending → preparing → ready → served). Supports station routing, item
availability marking, and order-to-kitchen handoff.

**Base path:** `/api/kots`

## Entities (Tables)

### `kots`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `kot_number` | `varchar(50) unique` | Generated KOT number |
| `order_id` | `uuid null` | Source order |
| `table_ids` | `json null` | Table assignments |
| `status` | `enum (pending, preparing, ready, served, cancelled)` | KOT status |
| `station` | `enum (main_kitchen, tandoor, beverages, desserts, snacks)` | Kitchen station |
| `notes` | `text null` | Kitchen notes |
| `prepared_by` | `uuid null` | Chef who prepared |
| `started_at` | `timestamp null` | Preparation start |
| `completed_at` | `timestamp null` | Preparation end |
| `served_at` | `timestamp null` | When served |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |

**Indexes:** `idx_kot_status`, `idx_kot_station`, `idx_kot_order`

### `kot_items`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `kot_id` | `uuid FK → kots` | Parent KOT |
| `item_id` | `uuid` | Item ID |
| `item_name` | `varchar(255)` | Item name |
| `quantity` | `decimal(10,2)` | Quantity |
| `instructions` | `text null` | Cooking instructions |
| `status` | `enum (pending, preparing, ready, served, cancelled)` | Item status |
| `is_unavailable` | `boolean` | 86/mark unavailable |
| `unavailable_note` | `text null` | Reason for unavailability |

## API Endpoints

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/kots` | — | List KOTs (paginated, filtered by status/station) |
| `GET` | `/kots/active` | — | Get active KOTs (optionally filtered by station) |
| `GET` | `/kots/:id` | — | Get KOT by ID |
| `POST` | `/kots` | — | Create a new KOT |
| `PATCH` | `/kots/:id/status` | — | Update KOT status (with preparedBy) |
| `PATCH` | `/kots/:kotId/items/:itemId/status` | — | Update individual item status |
| `PATCH` | `/kots/:kotId/items/:itemId/availability` | — | Mark item as (un)available |

## Key Dependencies

- `OrdersModule` — for order-to-KOT flow
