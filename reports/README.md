# Restaurant ERP — Business Report Plan

## Overview

This document serves as the master index for all business reports that can be generated from the Restaurant ERP system. Reports are organized by business domain, covering sales, inventory, finance, kitchen operations, customer analytics, reservations, procurement, and executive-level dashboards.

## Report Categories

| # | Category | File | Reports | Priority |
|---|----------|------|---------|----------|
| 1 | **Sales & Revenue** | [sales-reports.md](./sales-reports.md) | 12 reports | High |
| 2 | **Inventory & Stock** | [inventory-reports.md](./inventory-reports.md) | 10 reports | High |
| 3 | **Financial & Accounting** | [financial-reports.md](./financial-reports.md) | 8 reports | High |
| 4 | **Kitchen Operations** | [kitchen-reports.md](./kitchen-reports.md) | 7 reports | Medium |
| 5 | **Customer Analytics** | [customer-reports.md](./customer-reports.md) | 8 reports | Medium |
| 6 | **Reservations & Seating** | [reservation-reports.md](./reservation-reports.md) | 6 reports | Medium |
| 7 | **Procurement & Suppliers** | [procurement-reports.md](./procurement-reports.md) | 7 reports | Medium |
| 8 | **Daily Operations** | [operational-reports.md](./operational-reports.md) | 8 reports | Medium |
| 9 | **Executive Dashboard** | [executive-dashboard.md](./executive-dashboard.md) | 5 reports | High |

**Total: 71 reports across 9 categories**

## Data Sources

Reports are derived from the following database entities:

```
┌─────────────────────────────────────────────────────────────┐
│                     DATA SOURCE MAP                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SALES          INVENTORY       FINANCE         KITCHEN     │
│  ─────────      ──────────      ──────────      ──────────  │
│  invoices       inventory       ledger_accounts  kots       │
│  invoice_items  stock_movements ledger_entries   kot_items  │
│                                                             │
│  MENU           CUSTOMERS       PROCUREMENT     SEATING     │
│  ─────────      ──────────      ──────────      ──────────  │
│  items          customers       suppliers       zones       │
│  categories     price_levels    purchases       tables      │
│  item_price_lvl                 purchase_items  reservations│
│                                                             │
│  RECIPES        USERS           ORG SETTINGS                │
│  ─────────      ──────────      ──────────                  │
│  recipes        users           organization_               │
│  recipe_ingr    roles             settings                   │
│  production_entries permissions                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Priority

### Phase 1 — Foundation (Week 1-2)
- Sales summary & daily reports
- GST report
- Inventory stock status
- Executive dashboard KPIs

### Phase 2 — Core Analytics (Week 3-4)
- Sales by category/item/time
- Popular items report
- Financial balance sheet
- Purchase summary

### Phase 3 — Advanced (Week 5-6)
- Kitchen performance metrics
- Customer analytics
- Reservation efficiency
- Food cost analysis

### Phase 4 — Strategic (Week 7-8)
- Trend analysis & forecasting
- Supplier performance scoring
- Profitability analysis
- Custom date-range comparative reports

## Report Format Standards

Each report should support:
- **Date range filtering** (daily, weekly, monthly, custom)
- **Export** to PDF and CSV
- **Print-friendly** layout
- **Visual charts** (line, bar, pie, heatmap) where applicable
- **KPI summary cards** at the top of each report
- **Drill-down** capability to view underlying transactions

## API Endpoint Convention

```
GET /api/reports/{category}/{report-name}
  ?fromDate=2026-01-01
  &toDate=2026-01-31
  &groupBy=day|week|month
  &format=json|csv|pdf
```

## Current API Endpoints (Already Built)

| Endpoint | Report | Status |
|----------|--------|--------|
| `GET /sales/daily` | Daily sales summary | Built |
| `GET /sales/reports/sales` | Sales report (date range) | Built |
| `GET /sales/reports/gst` | GST breakdown by rate | Built |
| `GET /ledger` | Balance sheet | Built |

All other reports listed in this plan require new backend endpoints and frontend pages.
