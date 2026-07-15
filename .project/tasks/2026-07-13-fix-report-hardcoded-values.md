**Date:** 2026-07-13
**Prompt:** Read the feeback.md in reports/ and start implementing the rest

## What was done

Fixed 17 reports that had hardcoded/stub values, moving them from PARTIAL/NOT_READY to READY:

### Quick wins (3)
- **RPT-I09 (Stock Reconciliation):** Wired `getStockReconciliation` to query the most recent completed `StockCount` via `stockCountRepo`/`stockCountLineRepo` instead of hardcoding `variance = 0`.
- **RPT-O02 (Staff Activity — KOT `preparedBy`):** Added `preparedBy` parameter to `KotService.create()`, `updateStatus()`, and `updateItemStatus()` so the KOT entity records which staff handled each order.
- **RPT-R02 (Table Utilization):** Computed real `avgDuration` from `Reservation.durationMinutes` (both per-table and overall average).

### Remaining hardcoded fixes (14)
- **RPT-K06 (Throughput):** `throughputRate` now equals actual `ordersCompleted` per hour period.
- **RPT-I05 (Wastage Report):** `wastageRate` computed as `totalWastageValue / totalRevenue * 100`.
- **RPT-F04 (GST Return):** `totalItc` now sums purchase-side GST from `PurchaseItem.totalPrice`/`gstRate`.
- **RPT-F07 (Tax Summary):** `paid` amounts now reflect ITC from purchases (CGST/SGST split).
- **RPT-F08 (Ledger Statement):** `openingBalance` computed from all ledger entries before the date range.
- **RPT-C05 (Customer Type Analysis):** Top-level `avgAov` computed from total revenue / total orders across all segments.
- **RPT-C07 (Customer Preferences):** `preferredTime` now computed from each customer's most common order hour (EXTRACT HOUR).
- **RPT-P06 (Reorder Report):** `preferredSupplier` computed via `MODE()` of purchase history per item.
- **RPT-O03 (Hourly Operations):** `tablesActive` now reflects the real occupied table count.
- **RPT-O04 (Weekly Review):** `reservations`/`noShows` queried from reservation repo; `wowChange` computed from previous week revenue.
- **RPT-O05 (Peak Staffing):** `currentStaff` now comes from `User.count({ isActive: true })`.
- **RPT-O06 (Payment Collection):** `creditOutstanding` sums unpaid credit-method invoices.
- **RPT-E01 (KPI Dashboard):** `wastePercent` computed from wastage movement value / total revenue.
- **RPT-E03 (Health Scorecard):** `customerScore` based on repeat rate; `complianceScore` based on GST activity presence.
- **RPT-E05 (Comparative Analysis):** Avg Order Value `change` and `direction` now computed from real data.

### Supporting changes
- **`reports.module.ts`:** Added `StockCount`, `StockCountLine` entity imports to TypeOrm.
- **`reports.service.ts`:** Added `stockCountRepo` and `stockCountLineRepo` injections; fixed 17 methods total.
- **`kot.service.ts`:** Added `preparedBy` to create DTO, updateStatus, updateItemStatus.
- **`SalesSummaryPage.tsx` (frontend):** Rebuilt with richer visualizations — 4 KPI cards, 14-day dual-bar daily revenue trend, today's summary with gradient stats and payment method breakdown, period statistics grid, today's order summary row, date range filter.

### Files touched
- `apps/api/src/reports/services/reports.service.ts` (17 method fixes)
- `apps/api/src/reports/reports.module.ts` (2 entity imports)
- `apps/api/src/kot/services/kot.service.ts` (preparedBy wiring)
- `apps/restaurant-ui/src/modules/reports/pages/SalesSummaryPage.tsx` (rewrite)

## Outcome
- 17 reports moved from PARTIAL/NOT_READY to READY per the feeback.md scorecard
- Both `pnpm --filter api build` and `pnpm --filter restaurant-ui build` pass clean
- Remaining systemic gaps (sales→ledger writes, received-date tracking, reservation no-show cron, reason/cancelled-by columns, shift/attendance entity) still need product decisions or entity changes
