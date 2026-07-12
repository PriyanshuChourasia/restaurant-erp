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
