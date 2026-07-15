# Procurement & Supplier Reports

## Data Sources
- `suppliers` — name, email, phone, address, gstin, contactPerson, isActive, notes
- `purchases` — purchaseNumber, supplierId, status (draft/ordered/received/cancelled), purchaseDate, subtotal, discount, taxAmount, totalAmount, notes
- `purchase_items` — itemId, itemName (not stored, needs JOIN), quantity, unitPrice, gstRate, totalPrice
- `items` — name, sku, unit, costPrice
- `stock_movements` — type='purchase_in', quantity, reference, createdAt
- `inventory` — currentStock, unitCost

---

## RPT-P01: Purchase Order Summary
**Status:** Not Built

| Field | Source |
|-------|--------|
| Period | Purchase order date range |
| Total POs Created | COUNT(purchases) |
| Total PO Value | SUM(totalAmount) |
| Draft POs | COUNT WHERE status='draft' |
| Ordered POs | COUNT WHERE status='ordered' |
| Received POs | COUNT WHERE status='received' |
| Cancelled POs | COUNT WHERE status='cancelled' |
| Avg PO Value | total_value / total_pos |
| Outstanding Orders | POs in 'ordered' status (not yet received) |

**Visualization:** KPI cards + status breakdown bar chart
**Filters:** Date range, supplier, status
**Insight:** Procurement pipeline visibility

**Why It Is Needed:** Gives a bird's-eye view of all purchasing activity. Shows how many purchase orders are pending, how much inventory is on its way, and total spend on procurement. Answers: What is our total procurement spend? How many outstanding orders are yet to be delivered?

**Business Area Reviewed:** Procurement pipeline and spend overview. Reviews all purchase orders by status (draft, ordered, received, cancelled) and total value. Used by inventory manager and owner for spend tracking, procurement planning, and ensuring no orders are stuck in draft.

---

## RPT-P02: Supplier Performance Report
**Status:** Not Built

| Field | Source |
|-------|--------|
| Supplier | `suppliers.name` |
| Total Orders | COUNT(purchases) |
| Total Spend | SUM(totalAmount) |
| Avg Order Value | total_spend / total_orders |
| On-Time Delivery | % of POs received on/before expected date |
| Order Fulfillment | % of POs fully received vs partially received |
| Cancelled Orders | % cancelled |
| Avg Lead Time | AVG(received_date - order_date) |
| Items Supplied | DISTINCT items across all POs |
| GST Compliance | POs with valid GSTIN |

**Visualization:** Supplier scorecard + ranking table
**Filters:** Date range, minimum order count
**Insight:** Supplier selection, negotiation leverage

**Why It Is Needed:** Not all suppliers are equal. This report scores suppliers on delivery reliability, lead time, and fulfillment rate. A supplier who is consistently late causes stockouts and lost sales. A supplier with high cancellations wastes staff time. Answers: Which suppliers are reliable? Which ones should we replace? Who is our best value supplier?

**Business Area Reviewed:** Supplier reliability and vendor management. Reviews each supplier's delivery performance, order fulfillment, and lead times. Used by inventory manager and owner for supplier selection, contract negotiation, and vendor performance reviews.

---

## RPT-P03: Purchase by Item/Category
**Status:** Not Built

| Field | Source |
|-------|--------|
| Item | `items.name` |
| Category | `categories.name` |
| Total Quantity Purchased | SUM(purchase_items.quantity) |
| Total Cost | SUM(purchase_items.totalPrice) |
| Avg Unit Price | total_cost / total_quantity |
| Price Trend | Unit price over time per item |
| Purchase Frequency | COUNT(DISTINCT purchaseId) |
| Primary Supplier | Most frequent supplier for item |

**Visualization:** Category tree + item price trend lines
**Filters:** Date range, category, supplier
**Insight:** Price volatility, bulk purchasing opportunities

**Why It Is Needed:** Shows what the restaurant is buying and at what price. Price trend lines reveal inflation in ingredient costs — if tomato prices have doubled, menu prices may need adjustment. Also identifies items where bulk purchasing could save money. Answers: What are we buying most of? Are ingredient prices rising? Should we buy in bulk?

**Business Area Reviewed:** Spend analysis by item and price trend monitoring. Reviews purchasing volumes, costs, and unit price changes over time. Used by chef and inventory manager for ingredient costing, identifying price inflation, and planning bulk purchases.

---

## RPT-P04: Supplier Price Comparison
**Status:** Not Built

| Field | Source |
|-------|--------|
| Item | `items.name` |
| Supplier A | Price from Supplier A's latest PO |
| Supplier B | Price from Supplier B's latest PO |
| Price Difference | delta between suppliers |
| % Difference | (max - min) / min * 100 |
| Best Value | Lowest price supplier |
| Volume Discounts | Price breaks at different quantities |

**Visualization:** Side-by-side comparison table + bar chart
**Filters:** Item, date range
**Insight:** Cost optimization, supplier negotiation

**Why It Is Needed:** The fastest way to reduce costs is by comparing supplier prices and negotiating. This report shows exactly who offers the best price for each ingredient. Armed with this data, the manager can negotiate better rates or switch suppliers. Answers: Which supplier offers the best price for each item? How much could we save by switching suppliers?

**Business Area Reviewed:** Cost optimization through competitive pricing. Reviews prices from different suppliers for the same items. Used by inventory manager and owner for supplier negotiation, cost reduction, and sourcing decisions.

---

## RPT-P05: Purchase-to-Pay Cycle
**Status:** Not Built

| Field | Source |
|-------|--------|
| PO Number | `purchases.purchaseNumber` |
| Supplier | `suppliers.name` |
| Order Date | `purchases.purchaseDate` |
| Order Value | `purchases.totalAmount` |
| Status | `purchases.status` |
| Received Date | Timestamp when status changed to 'received' |
| Days to Receive | received_date - order_date |
| Payment Status | (requires payment tracking enhancement) |

**Visualization:** Pipeline funnel + timeline
**Filters:** Date range, supplier, status
**Insight:** Cash flow planning, payment scheduling

**Why It Is Needed:** Tracks the entire lifecycle from order to payment. Helps understand cash outflow timing — when will supplier payments be due? Also highlights POs that have been received but not yet paid (accrued liabilities). Answers: What payments are coming due soon? How long does it take from ordering to receiving goods?

**Business Area Reviewed:** Purchase cycle time and payment planning. Reviews the end-to-end purchase lifecycle and payment timing. Used by accountant and manager for cash flow planning, payment scheduling, and ensuring timely payments to avoid supply disruption.

---

## RPT-P06: Inventory Reorder Report
**Status:** Not Built

| Field | Source |
|-------|--------|
| Item | `items.name` |
| Current Stock | `inventory.currentStock` |
| Min Stock Level | `inventory.minStockLevel` |
| Reorder Point | minStockLevel * 1.5 (safety stock buffer) |
| Avg Daily Consumption | From stock_movements WHERE type='sale_out' |
| Days Until Stockout | currentStock / avg_daily_consumption |
| Suggested Reorder Qty | Based on lead time × daily consumption |
| Preferred Supplier | Most frequent supplier for item |
| Last Purchase Price | Most recent unit price |

**Visualization:** Alert table sorted by urgency
**Filters:** Category, urgency level
**Action:** Auto-generate PO suggestions

**Why It Is Needed:** The single most important procurement tool — it tells you exactly what to order, how much, and from whom. By combining current stock, consumption rate, and supplier lead time, it calculates the optimal order quantity. Answers: What should we order today or this week? How much of each item? From which supplier at what price?

**Business Area Reviewed:** Automated reorder planning and stock optimization. Reviews stock levels against consumption and lead time to calculate reorder quantities. Used by inventory manager to streamline the ordering process, reduce stockouts, and optimize order quantities.

---

## RPT-P07: Monthly Purchase Trend
**Status:** Not Built

| Field | Source |
|-------|--------|
| Month | `purchases.purchaseDate` |
| POs Created | COUNT per month |
| Total Value | SUM(totalAmount) per month |
| Avg PO Value | value / count per month |
| MoM Change | (current - previous) / previous * 100 |
| Top Supplier | Highest spend supplier per month |
| Top Item | Highest spend item per month |

**Visualization:** Line chart + monthly summary table
**Filters:** Year, granularity
**Insight:** Spending trends, budget planning

**Why It Is Needed:** Tracks procurement spending over time to identify seasonality and budget adherence. If purchase costs spike in December (holiday season), the restaurant should plan for it. Also helps compare actual purchasing costs against budget. Answers: How does our procurement spend vary month to month? Are we staying within budget? Which months require higher inventory?

**Business Area Reviewed:** Procurement spend trends and budget tracking. Reviews monthly purchasing patterns and total spend. Used by owner and accountant for budget planning, cash flow forecasting, and identifying seasonal procurement patterns.

---

## Backend Implementation Notes

### Purchase Status Lifecycle
```
draft → ordered → received
              ↓
         cancelled
```

### New Endpoints Needed
```typescript
@Get('procurement/summary')           // RPT-P01
@Get('procurement/supplier-performance') // RPT-P02
@Get('procurement/by-item')           // RPT-P03
@Get('procurement/price-comparison')  // RPT-P04
@Get('procurement/payment-cycle')     // RPT-P05
@Get('procurement/reorder')           // RPT-P06
@Get('procurement/monthly-trend')     // RPT-P07
```

### Data Gap
Purchase items don't currently store `itemName` — reports need to JOIN through `purchase_items.itemId` → `items.name`. This should be considered when building queries.
