> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Ledger Module — Help & Schema Reference

## Overview

Financial ledger and accounting: manages ledger accounts (chart of accounts),
ledger entries (debits/credits), journal entries, and balance sheet generation.
Supports double-entry bookkeeping with audit trail.

**Base path:** `/api/ledger`

## Entities (Tables)

### `ledger_accounts`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `name` | `varchar(255)` | Account name |
| `code` | `varchar(20) null` | Account code |
| `account_type` | `enum (asset, liability, equity, revenue, expense)` | Account classification |
| `description` | `text null` | Description |
| `opening_balance` | `decimal(14,2)` | Opening balance (default: 0) |
| `current_balance` | `decimal(14,2)` | Current balance (default: 0) |
| `financial_year` | `varchar(20) null` | Financial year |
| `is_active` | `boolean` | Active flag (default: true) |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |

### `ledger_entries`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `account_id` | `uuid FK → ledger_accounts` | Account |
| `entry_date` | `date` | Entry date |
| `type` | `enum (credit, debit)` | Entry type |
| `amount` | `decimal(14,2)` | Amount |
| `description` | `text null` | Description |
| `category` | `enum (sales, purchase, expense, salary, tax, miscellaneous)` | Category |
| `reference` | `varchar(255) null` | Reference document |
| `balance_after` | `decimal(14,2)` | Running balance |
| `journal_entry_id` | `uuid null` | Associated journal entry |
| `created_by` | `uuid null` | Creator |
| `created_at` | `timestamp` | Created timestamp |

**Indexes:** `idx_ledger_account`, `idx_ledger_date`

### `journal_entries`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `entry_number` | `varchar(50) unique` | Generated entry number |
| `entry_date` | `date` | Entry date |
| `narration` | `text null` | Description |
| `source_type` | `enum (invoice, voucher, stock_movement, manual, reversal, credit_note)` | Source system |
| `source_id` | `uuid null` | Source document ID |
| `reversal_of_id` | `uuid null` | Reversed entry reference |
| `created_by` | `uuid null` | Creator |
| `created_at` | `timestamp` | Created timestamp |

**Indexes:** `idx_journal_entry_date`, `idx_journal_entry_source`

## API Endpoints

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/ledger/accounts` | — | List all ledger accounts |
| `GET` | `/ledger/accounts/:id` | — | Get account by ID |
| `GET` | `/ledger/accounts/:id/entries` | — | Get entries for an account |
| `GET` | `/ledger/balance-sheet` | — | Get balance sheet |
| `POST` | `/ledger/accounts` | — | Create account |
| `POST` | `/ledger/accounts/:id/opening-balance` | — | Set opening balance |
| `POST` | `/ledger/entries` | — | Add a ledger entry |

## Key Dependencies

- Used by: `SalesModule`, `VouchersModule`, `InventoryModule`, `ReportsModule`
