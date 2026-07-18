> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Orders Module — Help & Schema Reference

## Overview

Order management: creates, confirms, and charges orders. Supports regular,
party, and scheduled order types with dine-in, takeaway, and delivery
fulfillment. Integrates with kitchen (KOT) and billing (sales).

**Base path:** `/api/orders`

## Entities (Tables)

### `orders`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `order_number` | `varchar(50) unique` | Generated order number |
| `order_type` | `enum (regular, party, scheduled)` | Order classification |
| `fulfillment_method` | `enum (dine_in, takeaway, delivery)` | Service method |
| `status` | `enum (pending_confirmation, confirmed, billed, cancelled)` | Order status |
| `customer_name` | `varchar(255) null` | Customer name |
| `customer_phone` | `varchar(20) null` | Customer phone |
| `customer_gstin` | `varchar(20) null` | Customer GSTIN |
| `customer_id` | `uuid FK → customers null` | Registered customer |
| `table_ids` | `json null` | Table assignments |
| `reservation_id` | `uuid null` | Associated reservation |
| `scheduled_for` | `timestamp null` | Scheduled time |
| `party_size` | `int null` | Party size |
| `discount_percent` | `decimal(5,2) null` | Discount percentage |
| `subtotal` | `decimal(14,2)` | Subtotal |
| `cgst_total` | `decimal(14,2)` | CGST total |
| `sgst_total` | `decimal(14,2)` | SGST total |
| `tax_total` | `decimal(14,2)` | Tax total |
| `grand_total` | `decimal(14,2)` | Grand total |
| `notes` | `text null` | Notes |
| `invoice_id` | `uuid null` | Generated invoice |
| `kot_sent` | `boolean` | Whether KOT has been sent |
| `created_by` | `uuid null` | Creator |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |

**Indexes:** `idx_order_status`, `idx_order_type`, `idx_order_scheduled_for`

### `order_items`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `order_id` | `uuid FK → orders` | Parent order |
| `item_id` | `uuid` | Item ID |
| `item_name` | `varchar(255)` | Item name |
| `hsn_code` | `varchar(20)` | HSN code |
| `quantity` | `decimal(10,2)` | Quantity |
| `unit_price` | `decimal(12,2)` | Unit price |
| `taxable_value` | `decimal(12,2)` | Taxable value |
| `gst_rate` | `decimal(5,2)` | GST rate |
| `cgst_amount` | `decimal(12,2)` | CGST amount |
| `sgst_amount` | `decimal(12,2)` | SGST amount |
| `total_amount` | `decimal(12,2)` | Line total |

## API Endpoints

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/orders` | `orders.read` | List orders (paginated, filtered) |
| `GET` | `/orders/:id` | `orders.read` | Get order by ID (with flags) |
| `POST` | `/orders` | `orders.create` | Create a new order |
| `PATCH` | `/orders/:id/items` | `orders.update` | Update order items |
| `POST` | `/orders/:id/confirm` | `orders.update` | Confirm order |
| `POST` | `/orders/:id/send-to-kitchen` | `orders.update` | Send KOT to kitchen |
| `POST` | `/orders/:id/charge` | `orders.charge` | Charge (create invoice) |
| `POST` | `/orders/:id/cancel` | `orders.cancel` | Cancel order |

## Key Dependencies

- `CustomersModule` — for customer lookup
- `SeatingModule` — for table management
- `PriceLevelsModule` — for pricing
- `KotModule` — for KOT generation
- `SalesModule` — for billing/charging
- `ReservationsModule` — for reservation linkage
