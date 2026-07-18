> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Sales Module — Help & Schema Reference

## Overview

Sales/invoicing: creates and manages invoices (bills), credit notes, payment
tracking, GST-compliant tax breakdown, and integration with orders, ledger,
and inventory.

**Base path:** `/api/sales`

## Entities (Tables)

### `invoices`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `invoice_number` | `varchar(50) unique` | Generated invoice number |
| `customer_name` | `varchar(255) null` | Customer name (walk-in) |
| `customer_phone` | `varchar(20) null` | Customer phone |
| `customer_gstin` | `varchar(20) null` | Customer GSTIN |
| `customer_id` | `uuid FK → customers null` | Registered customer |
| `table_ids` | `json null` | Associated table IDs |
| `invoice_date` | `date` | Invoice date |
| `status` | `enum (draft, confirmed, completed, cancelled)` | Invoice status |
| `payment_method` | `enum (cash, card, upi, online, credit)` | Payment method |
| `subtotal` | `decimal(14,2)` | Subtotal |
| `cgst_total` | `decimal(14,2)` | CGST total |
| `sgst_total` | `decimal(14,2)` | SGST total |
| `igst_total` | `decimal(14,2)` | IGST total |
| `tax_total` | `decimal(14,2)` | Total tax |
| `discount` | `decimal(14,2)` | Discount amount |
| `round_off` | `decimal(14,2)` | Round-off adjustment |
| `grand_total` | `decimal(14,2)` | Final total |
| `notes` | `text null` | Notes |
| `journal_entry_id` | `uuid null` | Associated journal entry |
| `voucher_id` | `uuid null` | Associated voucher |
| `order_id` | `uuid null` | Source order |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |

**Indexes:** `idx_invoice_status`, `idx_invoice_date`

### `invoice_items`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `invoice_id` | `uuid FK → invoices` | Parent invoice |
| `item_id` | `uuid` | Item ID |
| `item_name` | `varchar(255)` | Item name (snapshot) |
| `hsn_code` | `varchar(20)` | HSN code |
| `quantity` | `decimal(10,2)` | Quantity |
| `unit_price` | `decimal(12,2)` | Unit price |
| `taxable_value` | `decimal(12,2)` | Taxable value |
| `gst_rate` | `decimal(5,2)` | GST rate |
| `cgst_amount` | `decimal(12,2)` | CGST amount |
| `sgst_amount` | `decimal(12,2)` | SGST amount |
| `total_amount` | `decimal(12,2)` | Line total |

### `credit_notes`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `credit_note_number` | `varchar(50) unique` | Generated number |
| `invoice_id` | `uuid FK → invoices` | Original invoice |
| `invoice_number` | `varchar(50)` | Original invoice number |
| `status` | `enum (posted, cancelled)` | Status |
| `reason` | `text null` | Reason for credit |
| `subtotal` | `decimal(14,2)` | Subtotal |
| `cgst_total` | `decimal(14,2)` | CGST total |
| `sgst_total` | `decimal(14,2)` | SGST total |
| `tax_total` | `decimal(14,2)` | Tax total |
| `grand_total` | `decimal(14,2)` | Grand total |
| `journal_entry_id` | `uuid` | Journal entry |
| `replacement_invoice_id` | `uuid null` | Replacement invoice |
| `created_by` | `uuid null` | Creator |
| `created_at` | `timestamp` | Created timestamp |

**Indexes:** `idx_credit_note_invoice`

### `credit_note_items`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `credit_note_id` | `uuid FK → credit_notes` | Parent credit note |
| `invoice_item_id` | `uuid` | Original invoice item |
| `item_id` | `uuid` | Item ID |
| `item_name` | `varchar(255)` | Item name |
| `quantity` | `decimal(10,2)` | Quantity |
| `unit_price` | `decimal(12,2)` | Unit price |
| `taxable_value` | `decimal(12,2)` | Taxable value |
| `gst_rate` | `decimal(5,2)` | GST rate |
| `cgst_amount` | `decimal(12,2)` | CGST amount |
| `sgst_amount` | `decimal(12,2)` | SGST amount |
| `total_amount` | `decimal(12,2)` | Total |
| `stock_restored` | `boolean` | Whether stock was restored |

## API Endpoints

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/sales` | — | List invoices (paginated, filtered) |
| `GET` | `/sales/daily` | — | Get daily sales summary |
| `GET` | `/sales/reports/sales` | — | Sales report (date range) |
| `GET` | `/sales/reports/gst` | — | GST report (date range) |
| `GET` | `/sales/:id` | — | Get invoice by ID |
| `POST` | `/sales` | — | Create invoice |
| `PATCH` | `/sales/:id/status` | — | Update invoice status |
| `POST` | `/sales/:id/clear-tables` | — | Clear table assignments |
| `POST` | `/sales/:id/cancel` | `sales.cancel` | Cancel invoice |
| `POST` | `/sales/:id/credit-notes` | `sales.credit-note` | Create credit note |
| `GET` | `/sales/:id/credit-notes` | `sales.read` | Get credit notes for invoice |

## Key Dependencies

- `OrdersModule` — for order-to-invoice flow
- `PriceLevelsModule` — for pricing
- `CustomersModule` — for customer lookup
- `SeatingModule` — for table assignment
- `KotModule` — for KOT generation
- `VouchersModule` — for voucher creation
- `LedgerModule` — for journal entries
- `InventoryModule` — for stock deduction
- `RecipesModule` — for production cost
