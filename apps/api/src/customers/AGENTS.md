> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Customers Module — Help & Schema Reference

## Overview

Customer management: stores customer profiles with name, phone, email, GSTIN,
customer type classification, and price level assignment.

**Base path:** `/api/customers`

## Entities (Tables)

### `customers`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `name` | `varchar(255)` | Customer name |
| `phone` | `varchar(20) unique` | Phone number |
| `email` | `varchar(255) null` | Email address |
| `gstin` | `varchar(20) null` | GSTIN |
| `customer_type` | `varchar(50)` | Type (regular, corporate, staff) |
| `price_level_id` | `uuid FK → price_levels null` | Assigned price level |
| `is_active` | `boolean` | Active flag (default: true) |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |
| `deleted_at` | `timestamp null` | Soft-delete timestamp |

**Indexes:** `idx_customer_phone` (unique), `idx_customer_active`, `idx_customer_type`

## API Endpoints

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/customers` | — | List customers (paginated, filtered) |
| `GET` | `/customers/search` | — | Search customers by name/phone |
| `GET` | `/customers/:id` | — | Get customer by ID |
| `POST` | `/customers` | — | Create customer |
| `PATCH` | `/customers/:id` | — | Update customer |
| `DELETE` | `/customers/:id` | `customers.delete` | Soft-delete customer |
| `POST` | `/customers/:id/restore` | `customers.update` | Restore deleted customer |

## Key Dependencies

- `PriceLevelsModule` — for price level assignment
- Used by: `OrdersModule`, `SalesModule`
