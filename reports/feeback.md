# Report Readiness Feedback

**Question asked:** is every business report in this plan ready to show real
data?

**Short answer: no.** The backend is much further along than the plan `.md`
files claim (`reports.service.ts` is 3,078 lines with 71 live endpoints —
not the ~12 `README.md`/`AGENTS.md` describe; nearly every report has a
wired frontend page via `GenericReportPage` + a config in
`apps/restaurant-ui/src/modules/reports/configs/`), but a lot of what's
"wired" is **partially fabricated** — real queries with one or two fields
silently hardcoded to `0`, `'N/A'`, or a constant, sitting next to genuinely
real aggregates in the same JSON response. That's a worse failure mode than
an obviously-missing report: a user can't tell which numbers on the page
are real and which are decoration.

Verified against the live code on 2026-07-13 (two research passes, cross-
checked; see Method below).

## Scorecard

| Verdict | Count | Meaning |
|---|---|---|
| ✅ READY | 24 / 71 (34%) | Data genuinely flows end-to-end from real business events; every field in the response is real. |
| ⚠️ PARTIAL | 42 / 71 (59%) | Endpoint + real data exist, but one or more fields are hardcoded/omitted/wrong, or a documented sub-view (trend, drill-down dimension, reason breakdown) from the spec is missing. |
| ❌ NOT_READY | 5 / 71 (7%) | No real data path — either hardcoded to a fixed value throughout, or the underlying event is never captured. |

**Every category has at least one PARTIAL report. Three categories
(Financial, Reservations, Operational) have *zero* fully-READY reports** —
every single report in those three categories has at least one fabricated
or missing field.

## Method

Two research passes read every report spec in `reports/*.md` against the
live code: `apps/api/src/reports/services/reports.service.ts` (all ~85
query methods), `apps/api/src/reports/controllers/reports.controller.ts`
(71 routes), the domain entities/services each report reads from (sales,
inventory, purchases, ledger, kot, customers, reservations, seating), and
the frontend consumers (`apps/restaurant-ui/src/routes/reports/*.tsx` →
`modules/reports/configs/*.config.ts`). Verdicts are evidenced with
`file:line` references, spot-checked afterward (e.g. confirmed
`reports.service.ts` is genuinely 3,078 lines / 71 `@Get()` routes, and that
`kot.preparedBy` exists on the entity but is never assigned anywhere in
`kot.service.ts`).

---

## Sales & Revenue (10 ready / 2 partial / 0 not ready)

| Code | Title | Verdict | Evidence |
|---|---|---|---|
| RPT-S01 | Daily Sales Summary | ✅ READY | Real query on `invoices`, wired end-to-end to `SalesSummaryPage.tsx`. |
| RPT-S02 | Sales Report (Date Range) | ✅ READY | Real aggregation + daily trend. |
| RPT-S03 | Sales by Payment Method | ✅ READY | Groups real `invoices.paymentMethod`. |
| RPT-S04 | Sales by Category | ✅ READY | Real join `invoice_items → items → categories`. |
| RPT-S05 | Popular Items | ✅ READY | Real quantity/revenue/times-ordered. |
| RPT-S06 | Hourly Sales Distribution | ✅ READY | Real `EXTRACT(HOUR FROM inv.createdAt)`. |
| RPT-S07 | Weekly/Monthly Trends | ✅ READY | Real `DATE_TRUNC` grouping + MoM/WoW %. |
| RPT-S08 | Discount Analysis | ⚠️ PARTIAL | Backend is genuinely real (`Invoice.discount` persisted). But the POS checkout UI never exposes a discount field — grep of `modules/pos` shows `discount` only in the API type, never rendered — so in practice this report will always show ₹0 discounts. |
| RPT-S09 | Tax Collection (GST Summary) | ✅ READY | Real CGST/SGST from `invoice_items`. |
| RPT-S10 | Invoice-Level Drill-Down | ✅ READY | Real per-invoice detail with tax breakdown. |
| RPT-S11 | Cancelled & Voided Transactions | ⚠️ PARTIAL | Counts/sums are real, but the spec's "Cancellation Reasons" field has nowhere to come from — `Invoice` has no reason/notes-on-cancel column. |
| RPT-S12 | Veg vs Non-Veg Split | ✅ READY | Real `items.isVeg` grouping. |

## Inventory & Stock (6 ready / 2 partial / 2 not ready)

| Code | Title | Verdict | Evidence |
|---|---|---|---|
| RPT-I01 | Current Stock Status | ✅ READY | Real `Inventory`+`Item` join, kept live by purchase receipt/sale. |
| RPT-I02 | Low Stock Alerts | ✅ READY | Real `currentStock <= minStockLevel` filter. |
| RPT-I03 | Stock Movement Ledger | ✅ READY | Real `StockMovement` rows, populated by sales, `adjustStock`, `postPurchaseReceipt`, and production entries. |
| RPT-I04 | Stock Valuation | ✅ READY | Real `currentStock × unitCost`, both live-updated. |
| RPT-I05 | Wastage Report | ⚠️ PARTIAL | Real mechanism (staff can log wastage via the Adjust Stock dialog), but `wastageRate` is hardcoded `0` and "reason" is a freeform notes field, not the structured reason code the spec wants. |
| RPT-I06 | Consumption Analysis | ✅ READY | Real `SALE_OUT` + `PRODUCTION_CONSUMPTION` sums, live days-to-stockout. |
| RPT-I07 | Production Report | ✅ READY | Real `PRODUCTION_YIELD` movements from `RecipesService.createProductionEntry()`. |
| RPT-I08 | Recipe Cost Analysis | ⚠️ PARTIAL | Uses `item.costPrice`, which only reflects the true recipe cost if someone has manually hit "recalculate cost" — `upsert()` doesn't auto-recompute it, so it can be stale or unset. |
| RPT-I09 | Stock Reconciliation | ❌ NOT_READY | **Hardcodes `variance = 0` always.** The real feature already exists (`StockCountService`, real `countedQuantity`/`variance`, posts real adjustments) — the report endpoint just never queries it. This is the single easiest fix in the whole list. |
| RPT-I10 | Purchase-to-Stock Timeline | ❌ NOT_READY | Uses PO `createdAt` as "received date" — but that's set at creation, not receipt. `Purchase` has no real receipt timestamp, so lead time is always ≈0. |

## Financial & Accounting (0 ready / 7 partial / 1 not ready)

| Code | Title | Verdict | Evidence |
|---|---|---|---|
| RPT-F01 | Balance Sheet | ⚠️ PARTIAL | Inventory-side accounts (Inventory Asset, COGS, Purchase Payable, Wastage) update live via `inventory.service.ts`. **Sales Revenue, Cash, GST Payable are only ever set once by the seed script** — `sales.service.ts` never writes a `LedgerEntry`. Balance sheet goes stale on the sales side from day one. |
| RPT-F02 | Profit & Loss Statement | ⚠️ PARTIAL | Revenue/COGS are computed directly from invoices/purchases (real, correctly bypasses the broken ledger), but `operatingExpenses` reads `ledger_entries`, which are never posted automatically — shows stale/zero expenses unless someone manually posts them. |
| RPT-F03 | Cash Flow Statement | ❌ NOT_READY | Same ledger-staleness problem as F01, plus the spec's Investing/Financing sections (equipment purchases, owner drawings) have no data model at all — no asset/equity tracking exists anywhere. |
| RPT-F04 | GST Return (GSTR-1/3B) | ⚠️ PARTIAL | Outward-supply (sales) side is real. **Input tax credit is hardcoded `totalItc = 0`** — purchase-side GST is never summed despite the data existing on `PurchaseItem`. |
| RPT-F05 | Expense Report | ⚠️ PARTIAL | Correct query, but inherits F01/F02's gap — only manually-posted or seed-time entries ever show up. |
| RPT-F06 | Revenue vs Expense Comparison | ⚠️ PARTIAL | Revenue side real; expense side inherits the same gap. |
| RPT-F07 | Tax Summary Report | ⚠️ PARTIAL | Tax collected is real; **`paid: 0` is hardcoded for every tax type** — no ITC computation, no TDS modeling. |
| RPT-F08 | Ledger Account Statement | ⚠️ PARTIAL | Real running balance per account, but **`openingBalance: 0` is hardcoded** instead of reading the account's actual opening balance. |

## Kitchen Operations (1 ready / 6 partial / 0 not ready)

| Code | Title | Verdict | Evidence |
|---|---|---|---|
| RPT-K01 | Kitchen Order Queue Status | ✅ READY | Real KOT status/station/elapsed-time query. |
| RPT-K02 | Kitchen Performance Metrics | ⚠️ PARTIAL | Prep/cook time computed from real timestamps, but never uses `kot.servedAt` — "Time to Serve" from the spec is never calculated. |
| RPT-K03 | Station Load Distribution | ⚠️ PARTIAL | Raw pending count only — the spec's "Overdue Orders" (elapsed > 20 min) threshold is never applied. |
| RPT-K04 | Menu Item Prep Frequency | ⚠️ PARTIAL | Item/quantity/station real; "Peak Hours" and "By Day of Week" breakdowns are never computed. |
| RPT-K05 | KOT Cancellation & Void Report | ⚠️ PARTIAL | Station cancel-rate is real, but there's no reason/void-reason column on `Kot` at all — "Cancel by Time" and "Wasted Prep Time" can't be computed. |
| RPT-K06 | Kitchen Throughput Analysis | ⚠️ PARTIAL | **`throughputRate` is hardcoded to `1` for every period.** "Capacity Utilization" is never calculated. |
| RPT-K07 | Dietary Mix Report | ⚠️ PARTIAL | Real aggregate veg/non-veg split, but no trend-over-time as the spec's chart requires. |

## Customer Analytics (3 ready / 5 partial / 0 not ready)

| Code | Title | Verdict | Evidence |
|---|---|---|---|
| RPT-C01 | Customer Directory & Segmentation | ✅ READY | Real `Customer` + `Invoice` join, real `customerType`. |
| RPT-C02 | Customer Revenue Analysis | ⚠️ PARTIAL | Revenue/share/order-count real; "Revenue Trend", "by Payment Method", "by Item Category" from the spec are unimplemented. |
| RPT-C03 | Customer Loyalty & Retention | ⚠️ PARTIAL | A real RFM-style repeat/churn calc exists from invoice data, but **no loyalty/points system exists anywhere in the codebase** — this report is a proxy metric, not what the title promises. |
| RPT-C04 | New vs Returning Customers | ✅ READY | Real per-period cohort logic. |
| RPT-C05 | Customer Type Analysis | ⚠️ PARTIAL | Per-row average order value is real, but the top-line **`avgAov: 0` is hardcoded**. |
| RPT-C06 | Customer Lifetime Value (CLV) | ✅ READY | Real tenure/monthly-avg/projected-annual from invoice history. |
| RPT-C07 | Customer Order Preferences | ⚠️ PARTIAL | **`preferredTime: 'N/A'` is hardcoded**; "Preferred Station" (veg/non-veg) is entirely absent. |
| RPT-C08 | Walk-in vs Registered Customers | ⚠️ PARTIAL | Segments by whether a free-text `customerName` was typed, not by real `customerId` — a walk-in who gives their name gets miscounted as "registered". |

## Reservations & Seating (0 ready / 6 partial / 0 not ready)

| Code | Title | Verdict | Evidence |
|---|---|---|---|
| RPT-R01 | Reservation Overview | ⚠️ PARTIAL | Queries the reservation table directly, **bypassing the lazy no-show-expiry logic** (which only runs when a specific reservation is fetched individually — there's no scheduled sweep). Undercounts no-shows. "Upcoming 7 Days" also missing. |
| RPT-R02 | Table Utilization Report | ⚠️ PARTIAL | **`avgDuration: 90` is hardcoded** instead of using the real `durationMinutes` column that already exists. |
| RPT-R03 | Reservation Source Analysis | ⚠️ PARTIAL | Real source breakdown, same no-show undercount issue as R01; "Conversion to Revenue" unimplemented. |
| RPT-R04 | No-Show & Cancellation Report | ⚠️ PARTIAL | Most exposed to the lazy-expiry gap (it's the report's core metric); **`lostRevenue` uses a flat hardcoded ₹500/person** instead of real average spend; "Repeat No-Shows" not computed. |
| RPT-R05 | Peak Hours & Demand Forecasting | ⚠️ PARTIAL | Real hour/day-of-week aggregation, but "Availability Gap" and "Historical Pattern" are never computed. |
| RPT-R06 | Zone Performance Report | ⚠️ PARTIAL | Real Zone/Table/Reservation/Invoice join for revenue + utilization; "Wait Time Avg" from the spec is never computed. |

## Procurement & Suppliers (4 ready / 1 partial / 2 not ready)

| Code | Title | Verdict | Evidence |
|---|---|---|---|
| RPT-P01 | Purchase Order Summary | ✅ READY | Real status/value counts from `purchases`. |
| RPT-P02 | Supplier Performance Report | ❌ NOT_READY | "On-time delivery" is actually just `status === RECEIVED` — there's no expected-delivery-date field to compare against. "Avg lead time" is computed from `createdAt − purchaseDate`, which are set at the same moment, so it's always ≈0. Both headline metrics are fake. |
| RPT-P03 | Purchase by Item/Category | ✅ READY | Real `purchase_items` aggregation. |
| RPT-P04 | Supplier Price Comparison | ✅ READY | Real per-supplier average unit price, correctly finds best/worst. |
| RPT-P05 | Purchase-to-Pay Cycle | ❌ NOT_READY | Same fake "received date" issue as I10/P02, and there is **no payment/AP tracking anywhere** — "Payment Status" from the spec doesn't exist as a concept in the codebase. |
| RPT-P06 | Inventory Reorder Report | ⚠️ PARTIAL | Real consumption-based days-to-stockout, but **`preferredSupplier: 'Default'` is hardcoded** despite real purchase history existing to compute it. |
| RPT-P07 | Monthly Purchase Trend | ✅ READY | Real monthly grouping + MoM % + top supplier. |

## Daily Operations (0 ready / 8 partial / 0 not ready)

| Code | Title | Verdict | Evidence |
|---|---|---|---|
| RPT-O01 | Daily Operations Summary | ⚠️ PARTIAL | Returns only ~5 of the spec's ~12 fields — KOT counts, avg serve time, reservations honored/no-shows, items consumed, staff on duty are all missing. |
| RPT-O02 | Staff Activity Report | ⚠️ PARTIAL | Joins on `kot.preparedBy`, but **that field is never set anywhere in `kot.service.ts`** — every staff member's order count will show `0`. |
| RPT-O03 | Hourly Operations Dashboard | ⚠️ PARTIAL | **`tablesActive: 0` is hardcoded** for every hour, despite table status being tracked in real time. |
| RPT-O04 | Weekly Operations Review | ⚠️ PARTIAL | **`reservations: 0, noShows: 0` hardcoded for every day** — the reservation repo isn't even queried in this method; `wowChange` is always `null`. |
| RPT-O05 | Peak Hours & Staffing Analysis | ⚠️ PARTIAL | **`currentStaff: 2` is a hardcoded constant for every hour** — no shift/attendance entity exists anywhere in the codebase, so "Staffing Gap" is measured against a made-up baseline. |
| RPT-O06 | Payment Collection Report | ⚠️ PARTIAL | **`creditOutstanding: 0` hardcoded**; "Credit Aging" unimplemented despite a real `CREDIT` payment method existing. |
| RPT-O07 | Cancellation & Void Summary | ⚠️ PARTIAL | Real cross-module (invoice/KOT/reservation) cancel counts and revenue impact, but "Cancel by Reason" and "Cancel by Staff" can't be computed — no reason/cancelledBy column exists anywhere. |
| RPT-O08 | End-of-Day Reconciliation | ⚠️ PARTIAL | Real revenue/invoice/wastage numbers, but there's no cash-drawer physical-count input anywhere, so the report's headline "Variance" metric (the whole point of the report — theft prevention) can never be computed. |

## Executive Dashboard (0 ready / 5 partial / 0 not ready)

| Code | Title | Verdict | Evidence |
|---|---|---|---|
| RPT-E01 | Executive KPI Dashboard | ⚠️ PARTIAL | Genuinely composes real sales/P&L/repeat-customer data (not mock, despite what the plan doc implies) — but **`wastePercent: 0` is hardcoded** and "Customer Satisfaction" is N/A (no feedback system exists). |
| RPT-E02 | Profitability Analysis by Dimension | ⚠️ PARTIAL | Only the "by item" dimension is implemented; by-category, by-customer-type, by-zone, by-time, by-payment-method are all missing — spec wants a multi-tab drill-down, code has one flat table. |
| RPT-E03 | Business Health Scorecard | ⚠️ PARTIAL | Financial/operational scores derive from real data; **`customerScore: 70` and `complianceScore: 85` are hardcoded constants** — literally half the weighted score is fabricated. |
| RPT-E04 | Trend Analysis & Forecasting | ⚠️ PARTIAL | Real 12-month historical trend, but the "forecast" is a naive fixed +3%/month assumption, not the spec's moving-average/seasonal method. |
| RPT-E05 | Comparative Analysis Report | ⚠️ PARTIAL | Real period-over-period revenue/order comparison, but **Avg Order Value's `change: 0, direction: 'up'` is hardcoded**; Year-vs-Year, Category-vs-Category, Zone-vs-Zone, Supplier-vs-Supplier comparisons from the spec don't exist — only one generic period comparison does. |

---

## Systemic gaps (fix these once, many reports improve)

1. **Sales never writes to the ledger.** `sales.service.ts` doesn't import or
   call `LedgerService`/`LedgerEntry` at all — only the inventory side
   (purchases, wastage, adjustments) posts live ledger entries. This alone
   is why Balance Sheet, Cash Flow, Expense, and Revenue-vs-Expense
   (F01/F03/F05/F06) are structurally unreliable past the first day of
   real use. Highest-impact single fix in this list.
2. **"Received date" is faked as PO creation date everywhere.** `Purchase`
   has no real receipt timestamp or expected-delivery-date column. This
   silently breaks RPT-I10, RPT-P02, and RPT-P05 — their headline lead-
   time/on-time metrics are always ≈0, which reads as "great supplier
   performance" instead of "not measured."
3. **Stock reconciliation report ignores a feature that already works.**
   `StockCountService` genuinely computes and posts real variances — the
   RPT-I09 endpoint just never queries it and hardcodes `variance = 0`
   instead. This is the cheapest fix on this entire list: wire an existing
   working feature into an existing report endpoint.
4. **No shift/attendance/loyalty-points entity exists anywhere in the
   codebase.** Every "staff on duty" or "current staffing" number
   (RPT-O01, O05) and the "loyalty program" framing of RPT-C03 are proxies
   or hardcoded constants, not real tracked data — this is a product
   decision (build the entity) more than a report-layer bug.
5. **Reservation no-show detection is lazy and per-record, with no
   scheduled sweep.** A stale `confirmed` reservation only flips to
   `no_show` when that one record happens to be fetched individually; the
   only `@Cron` job in the whole repo is for inventory expiry, not
   reservations. Every reservation report queries the table directly via
   QueryBuilder, bypassing this logic — no-show counts are systematically
   undercounted across R01/R03/R04.
6. **No reason/cancelled-by/void-reason column exists on `Kot`, `Invoice`,
   or `Reservation`.** Every "why was this cancelled/voided" breakdown
   (RPT-K05, RPT-O07) can report a rate but never a cause.
7. **A cluster of silent hardcoded placeholders reads as real data in the
   UI but never moves**: `throughputRate: 1` (K06), `avgDuration: 90`
   (R02), `tablesActive: 0` (O03), `reservations`/`noShows: 0` (O04),
   `creditOutstanding: 0` (O06), `wastePercent: 0` (E01),
   `customerScore`/`complianceScore` constants (E03), `avgAov: 0` (C05),
   `preferredTime: 'N/A'` (C07), `preferredSupplier: 'Default'` (P06),
   `totalItc: 0` (F04), `openingBalance: 0` (F08). None of these throw an
   error or show an empty state — they render as plausible-looking zeros
   or defaults, which is worse than showing nothing.
8. **`kot.preparedBy` exists on the entity but is never assigned** in
   `kot.service.ts`'s create/update flow — confirmed by reading the full
   service file. RPT-O02's entire premise (staff activity by KOT) returns
   zero for every user until this is wired.

## Suggested priority order

1. **Quick wins** (existing data, just not connected to the report query):
   RPT-I09 (wire `StockCountService`), RPT-O02 (set `kot.preparedBy`),
   RPT-R02 (read real `durationMinutes` instead of hardcoded 90).
2. **Foundational fix, many downstream reports improve**: wire
   `sales.service.ts` to post real `LedgerEntry` rows on invoice
   creation/cancellation (fixes F01, F02, F03, F05, F06 together).
3. **Add missing columns** (small entity changes, unblock several reports
   each): `Purchase.expectedDeliveryDate` + `receivedAt` (I10, P02, P05);
   a `cancelReason`/`voidReason` column on `Kot`/`Invoice`/`Reservation`
   (K05, O07); a scheduled cron for reservation no-show expiry (R01, R03,
   R04).
4. **Product decisions needed before more report work makes sense**: is
   there a real shift/attendance system planned (O01, O05)? A loyalty
   program (C03)? A cash-drawer count-in/count-out flow (O08)? These
   reports can't become fully real without a decision on whether the
   underlying feature gets built at all.
