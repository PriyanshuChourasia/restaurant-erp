> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Organization Module — Help & Schema Reference

## Overview

Organization/restaurant settings: manages the restaurant's profile including
name, address, contact info, tax configuration, currency, timezone, business
hours, and invoice footer.

**Base path:** `/api/organization`

## Entities (Tables)

### `organization_settings`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Primary key |
| `restaurant_name` | `varchar(255)` | Restaurant display name |
| `tagline` | `varchar(255) null` | Tagline/slogan |
| `address` | `text null` | Address |
| `city` | `varchar(100) null` | City |
| `state` | `varchar(100) null` | State |
| `pincode` | `varchar(20) null` | Pincode |
| `phone` | `varchar(20) null` | Contact phone |
| `email` | `varchar(255) null` | Contact email |
| `website` | `varchar(255) null` | Website |
| `gstin` | `varchar(20) null` | GSTIN |
| `fssai_license` | `varchar(20) null` | FSSAI license number |
| `currency` | `varchar(10)` | Currency code (default: INR) |
| `currency_symbol` | `varchar(5)` | Currency symbol (default: ₹) |
| `timezone` | `varchar(50)` | Timezone (default: Asia/Kolkata) |
| `tax_label` | `varchar(20)` | Tax label (default: GST) |
| `default_tax_rate` | `decimal(5,2)` | Default tax % |
| `service_charge_percent` | `decimal(5,2)` | Service charge % |
| `business_hours` | `json null` | Per-day business hours |
| `invoice_footer` | `text null` | Invoice footer text |
| `is_active` | `boolean` | Active flag (default: true) |
| `created_at` | `timestamp` | Created timestamp |
| `updated_at` | `timestamp` | Updated timestamp |

## API Endpoints

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/organization` | — | Get organization settings |
| `PUT` | `/organization` | `settings.update` | Update organization settings |

## Key Dependencies

- Standalone module (no external module dependencies)
