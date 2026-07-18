> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Seating Module — Help & Schema Reference

## Overview

Restaurant seating layout: manages zones (dining areas/floors) and tables
within them. Tables have spatial positions (for floorplan UI), capacity,
status tracking (available/booked/occupied), and category classification.

**Base paths:** `/api/zones`, `/api/tables`

## Entities (Tables)

### `zones`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `name` | `varchar(255) unique` | Zone name |
| `description` | `text null` | Description |
| `floor` | `int` | Floor number (default: 0) |
| `is_active` | `boolean` | Active flag (default: true) |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |
| `deleted_at` | `timestamp null` | Soft-delete timestamp |

**Indexes:** `idx_zone_name` (unique), `idx_zone_active`, `idx_zone_floor`

### `tables`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `zone_id` | `uuid FK → zones null` | Parent zone |
| `label` | `varchar(100)` | Table label/number |
| `capacity` | `int null` | Seating capacity |
| `category` | `varchar(50)` | Category (online, walk_in, flexible) |
| `status` | `varchar(50)` | Status (available, booked, occupied) |
| `pos_x` | `float null` | Floorplan X position |
| `pos_y` | `float null` | Floorplan Y position |
| `is_active` | `boolean` | Active flag (default: true) |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |
| `deleted_at` | `timestamp null` | Soft-delete timestamp |

**Indexes:** `idx_table_zone_label` (unique), `idx_table_zone`, `idx_table_status`, `idx_table_active`

## API Endpoints

### Zones

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/zones` | — | List zones |
| `GET` | `/zones/:id` | — | Get zone by ID |
| `GET` | `/zones/:id/tables` | — | Get tables in a zone |
| `POST` | `/zones` | — | Create zone |
| `PATCH` | `/zones/:id` | — | Update zone |
| `DELETE` | `/zones/:id` | — | Delete zone |

### Tables

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/tables` | — | List tables (filtered by zone, unassigned) |
| `GET` | `/tables/:id` | — | Get table by ID |
| `POST` | `/tables` | — | Create table |
| `PATCH` | `/tables/:id` | — | Update table |
| `PATCH` | `/tables/:id/status` | — | Update status |
| `PATCH` | `/tables/:id/zone` | — | Assign/remove zone |
| `PATCH` | `/tables/:id/position` | — | Update floorplan position |
| `DELETE` | `/tables/:id` | — | Delete table |

## Key Dependencies

- Used by: `OrdersModule`, `ReservationsModule`, `SalesModule`, `DashboardModule`
