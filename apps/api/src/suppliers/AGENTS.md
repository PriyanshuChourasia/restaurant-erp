> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Suppliers Module — Help & Schema Reference

## Overview

Supplier management: stores supplier information including name, contact
details, GSTIN, and address. Base CRUD with soft-delete and search.

**Base path:** `/api/suppliers`

## Entities (Tables)

### `suppliers`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `name` | `varchar(255)` | Supplier name |
| `email` | `varchar(255) unique` | Email address |
| `phone` | `varchar(20) null` | Phone number |
| `address` | `text null` | Physical address |
| `gstin` | `varchar(20) null` | GSTIN |
| `contact_person` | `varchar(255) null` | Contact person name |
| `is_active` | `boolean` | Active flag (default: true) |
| `notes` | `text null` | Notes |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |
| `deleted_at` | `timestamp null` | Soft-delete timestamp |

**Indexes:** `idx_supplier_active`

## API Endpoints

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/suppliers` | — | List suppliers (paginated, searchable) |
| `GET` | `/suppliers/:id` | — | Get supplier by ID |
| `POST` | `/suppliers` | — | Create supplier |
| `PATCH` | `/suppliers/:id` | — | Update supplier |
| `DELETE` | `/suppliers/:id` | — | Soft-delete supplier |

## Key Dependencies

- Used by: `PurchasesModule`, `ItemSuppliersModule`
