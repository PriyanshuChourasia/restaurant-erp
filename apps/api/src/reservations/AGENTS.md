> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Reservations Module — Help & Schema Reference

## Overview

Table reservation management: handles booking requests with status tracking
(pending → confirmed → seated → completed/cancelled/no_show). Supports
conflict detection per table, walk-in registration, and seating assignment.

**Base path:** `/api/reservations`

## Entities (Tables)

### `reservations`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `customer_name` | `varchar(255)` | Guest name |
| `customer_phone` | `varchar(20) null` | Contact phone |
| `party_size` | `int` | Number of guests |
| `zone_id` | `uuid null` | Preferred zone |
| `table_id` | `uuid FK → tables null` | Assigned table |
| `scheduled_for` | `timestamp` | Reservation time |
| `duration_minutes` | `int` | Expected duration (default: 90) |
| `status` | `enum (pending, confirmed, seated, completed, cancelled, no_show)` | Reservation status |
| `source` | `enum (online, phone, walk_in)` | Booking source |
| `notes` | `text null` | Notes |
| `is_active` | `boolean` | Active flag (default: true) |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |
| `deleted_at` | `timestamp null` | Soft-delete timestamp |

**Indexes:** `idx_reservation_status`, `idx_reservation_scheduled`, `idx_reservation_table`, `idx_reservation_zone`, `idx_reservation_customer_phone`

## API Endpoints

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/reservations` | — | List reservations (filtered by date/status) |
| `GET` | `/reservations/table/:tableId/conflict` | — | Check table conflict window |
| `GET` | `/reservations/:id` | — | Get reservation by ID |
| `POST` | `/reservations` | — | Create reservation |
| `PATCH` | `/reservations/:id` | — | Update reservation |
| `PATCH` | `/reservations/:id/status` | — | Update status |
| `POST` | `/reservations/:id/seat` | — | Seat reservation at a table |
| `DELETE` | `/reservations/:id` | — | Delete reservation |

## Key Dependencies

- `SeatingModule` — for table/zone assignment
