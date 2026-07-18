> ⚠️ **READ-ONLY:** This file is read-only documentation. Do not modify unless explicitly directed. Any changes must be explicitly requested.

# Reports Module — Help & Schema Reference

## Overview

Business intelligence and reporting: provides 71+ reports across 9 business
areas — Sales, Inventory, Financial, Kitchen, Customer, Reservation,
Procurement, Operations, and Executive. All reports are read-only query
endpoints that aggregate data from across the system.

**Base path:** `/api/reports`

## API Endpoints

### Sales Reports

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/reports/sales/daily` | Daily sales summary |
| `GET` | `/reports/sales/summary` | Sales report (date range) |
| `GET` | `/reports/sales/by-payment-method` | Sales grouped by payment method |
| `GET` | `/reports/sales/by-category` | Sales grouped by category |
| `GET` | `/reports/sales/popular-items` | Top selling items |
| `GET` | `/reports/sales/gst` | GST report |
| `GET` | `/reports/sales/hourly-distribution` | Hourly sales distribution |
| `GET` | `/reports/sales/veg-nonveg` | Veg vs non-veg split |
| `GET` | `/reports/sales/trends` | Sales trends (weekly/monthly) |
| `GET` | `/reports/sales/discount-analysis` | Discount analysis |
| `GET` | `/reports/sales/cancelled` | Cancelled transactions |
| `GET` | `/reports/sales/invoice/:id` | Invoice drill-down |

### Inventory Reports

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/reports/inventory/stock-status` | Current stock status |
| `GET` | `/reports/inventory/low-stock` | Low stock alerts |
| `GET` | `/reports/inventory/movements` | Stock movement log |
| `GET` | `/reports/inventory/valuation` | Inventory valuation |
| `GET` | `/reports/inventory/wastage` | Wastage report |
| `GET` | `/reports/inventory/consumption` | Consumption analysis |
| `GET` | `/reports/inventory/production` | Production report |
| `GET` | `/reports/inventory/recipe-costs` | Recipe cost analysis |
| `GET` | `/reports/inventory/reconciliation` | Stock reconciliation |
| `GET` | `/reports/inventory/purchase-timeline` | Purchase timeline |

### Financial Reports

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/reports/finance/balance-sheet` | Balance sheet |
| `GET` | `/reports/finance/profit-loss` | P&L statement |
| `GET` | `/reports/finance/cash-flow` | Cash flow statement |
| `GET` | `/reports/finance/gst-return` | GST return summary |
| `GET` | `/reports/finance/expenses` | Expense report |
| `GET` | `/reports/finance/revenue-vs-expense` | Revenue vs expense |
| `GET` | `/reports/finance/tax-summary` | Tax summary |
| `GET` | `/reports/finance/ledger-statement` | Ledger statement |

### Kitchen Reports

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/reports/kitchen/queue-status` | Kitchen queue status |
| `GET` | `/reports/kitchen/performance` | Kitchen performance metrics |
| `GET` | `/reports/kitchen/station-load` | Station load analysis |
| `GET` | `/reports/kitchen/item-frequency` | Item order frequency |
| `GET` | `/reports/kitchen/cancellation` | Kitchen cancellations |
| `GET` | `/reports/kitchen/throughput` | Kitchen throughput |
| `GET` | `/reports/kitchen/dietary-mix` | Dietary preference mix |

### Customer Reports

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/reports/customer/directory` | Customer directory |
| `GET` | `/reports/customer/revenue` | Customer revenue analysis |
| `GET` | `/reports/customer/loyalty` | Customer loyalty metrics |
| `GET` | `/reports/customer/new-vs-returning` | New vs returning customers |
| `GET` | `/reports/customer/type-analysis` | Customer type analysis |
| `GET` | `/reports/customer/lifetime-value` | Customer lifetime value |
| `GET` | `/reports/customer/preferences` | Customer preferences |
| `GET` | `/reports/customer/walkin-vs-registered` | Walk-in vs registered |

### Reservation Reports

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/reports/reservation/overview` | Reservation overview |
| `GET` | `/reports/reservation/table-utilization` | Table utilization |
| `GET` | `/reports/reservation/source` | Reservation source analysis |
| `GET` | `/reports/reservation/no-show` | No-show analysis |
| `GET` | `/reports/reservation/peak-hours` | Peak hours analysis |
| `GET` | `/reports/reservation/zone-performance` | Zone performance |

### Procurement Reports

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/reports/procurement/po-summary` | PO summary |
| `GET` | `/reports/procurement/supplier-performance` | Supplier performance |
| `GET` | `/reports/procurement/purchase-by-item` | Purchase by item |
| `GET` | `/reports/procurement/price-comparison` | Price comparison |
| `GET` | `/reports/procurement/purchase-to-pay` | Purchase-to-pay cycle |
| `GET` | `/reports/procurement/reorder` | Reorder recommendations |
| `GET` | `/reports/procurement/monthly-trend` | Monthly purchase trend |

### Operations Reports

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/reports/operations/daily-summary` | Daily operation summary |
| `GET` | `/reports/operations/staff-activity` | Staff activity log |
| `GET` | `/reports/operations/hourly` | Hourly operations |
| `GET` | `/reports/operations/weekly-review` | Weekly review |
| `GET` | `/reports/operations/peak-staffing` | Peak staffing analysis |
| `GET` | `/reports/operations/payment-collection` | Payment collection |
| `GET` | `/reports/operations/cancellation-summary` | Cancellation summary |
| `GET` | `/reports/operations/eod-reconciliation` | End-of-day reconciliation |

### Executive Reports

| Method | Path | Permissions | Description |
|--------|------|-------------|-------------|
| `GET` | `/reports/executive/kpi-dashboard` | KPI dashboard |
| `GET` | `/reports/executive/profitability` | Profitability analysis |
| `GET` | `/reports/executive/health-scorecard` | Business health scorecard |
| `GET` | `/reports/executive/trend-forecast` | Trend forecasting |
| `GET` | `/reports/executive/comparative` | Comparative analysis |

## Key Dependencies

- Reads from: Invoices, Items, Categories, Inventory, Stock Movements,
  Stock Counts, Purchases, Ledger, KOTs, Reservations, Customers, Tables,
  Zones, Suppliers, Users, Organization entities
