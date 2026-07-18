> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Vouchers Module — Help & Schema Reference

## Overview

Voucher management: creates and manages accounting vouchers (payment, receipt,
journal). Integrated with the ledger module for automatic journal entry
creation. Supports voucher type classification and cancellation.

**Base path:** `/api/vouchers`

## Entities (Tables)

### `vouchers`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `voucher_number` | `varchar(50) unique` | Generated voucher number |
| `voucher_type_id` | `uuid FK → voucher_types null` | Voucher type |
| `status` | `enum (posted, cancelled)` | Voucher status |
| `voucher_date` | `date` | Voucher date |
| `party_type` | `varchar(50) null` | Party type |
| `party_id` | `uuid null` | Party ID |
| `payment_mode` | `varchar(20) null` | Payment mode |
| `amount` | `decimal(14,2)` | Voucher amount |
| `narration` | `text null` | Description |
| `journal_entry_id` | `uuid` | Associated journal entry |
| `reference_invoice_id` | `uuid null` | Reference invoice |
| `created_by` | `uuid null` | Creator |
| `created_at` | `timestamp` | Created timestamp |

**Indexes:** `idx_voucher_type`, `idx_voucher_date`, `idx_voucher_reference_invoice`

### `voucher_types`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `super_key` | `bigint unique` | Sequential display ID |
| `code` | `varchar(30) unique` | Stable code (e.g. payment, receipt, journal) |
| `name` | `varchar(100)` | Display name |
| `voucher_module_id` | `uuid FK → voucher_modules` | Module classification |
| `affects_accounts` | `boolean` | Affects ledger accounts |
| `affects_inventory` | `boolean` | Affects inventory |
| `affects_tax` | `boolean` | Affects tax |
| `is_system` | `boolean` | System-protected (default: true) |
| `is_active` | `boolean` | Active flag (default: true) |
| `description` | `text null` | Description |

### `voucher_modules`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `super_key` | `bigint unique` | Sequential display ID |
| `code` | `varchar(30) unique` | Code (accounting, inventory, sales, purchase) |
| `name` | `varchar(100)` | Display name |
| `description` | `text null` | Description |
| `display_order` | `int` | Sort order |
| `is_system` | `boolean` | System-protected (default: true) |
| `is_active` | `boolean` | Active flag (default: true) |

## API Endpoints

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/vouchers` | `vouchers.read` | List vouchers (paginated, filtered) |
| `GET` | `/vouchers/:id` | `vouchers.read` | Get voucher by ID |
| `POST` | `/vouchers/payment` | `vouchers.create` | Create payment voucher |
| `POST` | `/vouchers/receipt` | `vouchers.create` | Create receipt voucher |
| `POST` | `/vouchers/journal` | `vouchers.create` | Create journal voucher |
| `POST` | `/vouchers/:id/cancel` | `vouchers.cancel` | Cancel voucher |

## Key Dependencies

- `LedgerModule` — for automatic journal entry creation
