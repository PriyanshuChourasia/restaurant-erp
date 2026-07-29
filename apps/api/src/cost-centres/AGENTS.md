> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Cost Centres Module — Help & Schema Reference

## Overview

Cost centre master data: named, coded units used to tag and allocate costs
(e.g. Kitchen, Bar, Front of House) across the ledger and expense entries.
Base CRUD with soft-delete and search.

**Base path:** `/api/cost-centres`

## Entities (Tables)

### `cost_centres`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `name` | `varchar(100) unique` | Cost centre name |
| `code` | `varchar(20) unique` | Short code |
| `description` | `text null` | Description |
| `is_active` | `boolean` | Active flag (default: true) |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |
| `deleted_at` | `timestamp null` | Soft-delete timestamp |

**Indexes:** `idx_cost_centre_active`

## API Endpoints

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/cost-centres` | — | List cost centres (paginated, searchable) |
| `GET` | `/cost-centres/:id` | — | Get cost centre by ID |
| `POST` | `/cost-centres` | — | Create cost centre |
| `PATCH` | `/cost-centres/:id` | — | Update cost centre |
| `DELETE` | `/cost-centres/:id` | — | Soft-delete cost centre |

## Key Dependencies

- Used by: `LedgerModule` (future cost allocation on ledger entries)
