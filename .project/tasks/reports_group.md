# Task Group: Business Reports (Backend + UI)

Tasks grouped: `2026-07-12-reports-backend-and-ui.md`

---

## Task: Reports Backend + UI Implementation

**Date:** 2026-07-12
**Prompt:** Create a business report plan with backend and UI for the Restaurant ERP system.

### What was done

#### Backend — New `reports` module (`apps/api/src/reports/`)
- Created `reports.module.ts` — NestJS module with TypeORM feature imports for Invoice, InvoiceItem, Item, CategoryEntity, Inventory, StockMovement, Purchase, LedgerAccount, LedgerEntry
- Created `reports.controller.ts` — 12 REST endpoints under `/reports` prefix
- Created `reports.service.ts` — 12 report query methods with TypeORM QueryBuilder
- Registered `ReportsModule` in `app.module.ts`

**API Endpoints:**
| Endpoint | Report |
|----------|--------|
| `GET /reports/sales/daily` | Daily sales summary |
| `GET /reports/sales/summary` | Sales report with daily trend |
| `GET /reports/sales/by-payment-method` | Revenue by payment channel |
| `GET /reports/sales/by-category` | Revenue by menu category |
| `GET /reports/sales/popular-items` | Top items by quantity sold |
| `GET /reports/sales/gst` | GST breakdown by rate |
| `GET /reports/sales/hourly-distribution` | Hourly order distribution |
| `GET /reports/sales/veg-nonveg` | Veg vs non-veg split |
| `GET /reports/inventory/stock-status` | Current stock levels |
| `GET /reports/inventory/low-stock` | Low stock alerts |
| `GET /reports/finance/balance-sheet` | Ledger balance sheet |
| `GET /reports/finance/profit-loss` | P&L statement |

#### Frontend — New report module structure (`apps/restaurant-ui/src/modules/reports/`)
- **`types/report.types.ts`** — 15 TypeScript interfaces for all report responses
- **`api/reports.api.ts`** — 12 typed API functions using `apiClient`
- **`hooks/useReportQueries.ts`** — 12 React Query hooks with key factory pattern
- **`components/DateRangeFilter.tsx`** — Reusable date range filter with presets (today/week/month/year) + custom date inputs
- **`components/ReportComponents.tsx`** — Shared `ReportPageHeader`, `KpiCard`, `ReportCard`, `LoadingSkeleton` components

#### Frontend — 8 Report Pages
1. **`ReportsPage.tsx`** — Hub page with KPI cards and clickable report cards linking to sub-reports
2. **`SalesSummaryPage.tsx`** — Revenue, orders, daily trend, today's summary, period stats
3. **`PaymentMethodPage.tsx`** — Revenue by payment method with distribution bar and detail table
4. **`CategorySalesPage.tsx`** — Revenue by category with bar chart and detail table
5. **`PopularItemsPage.tsx`** — Top items table + veg/non-veg split visualization
6. **`GstReportPage.tsx`** — GST rate summary table + tax distribution
7. **`StockStatusPage.tsx`** — Inventory status with KPI cards, stock table, value summary
8. **`LowStockPage.tsx`** — Low stock alerts with severity indicators
9. **`ProfitLossPage.tsx`** — Full P&L statement with margin gauges

#### Frontend — 8 Route Files (`apps/restaurant-ui/src/routes/reports/`)
- `/reports/sales`, `/reports/payment-methods`, `/reports/categories`, `/reports/popular-items`, `/reports/gst`, `/reports/stock`, `/reports/low-stock`, `/reports/profit-loss`

### Outcome
- **0 TypeScript errors** in both `apps/api` and `apps/restaurant-ui` (`tsc --noEmit` passes clean)
- 12 backend API endpoints ready for use
- 8 frontend report pages with proper routing
- All reports use the shared `DateRangeFilter` and `ReportComponents` for consistent UI
- Reports hub page (`/reports`) links to all sub-reports with live KPI cards
