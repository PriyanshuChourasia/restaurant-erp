# Sales & Revenue Reports

## Data Sources
- `invoices` — invoiceNumber, invoiceDate, status, paymentMethod, subtotal, cgstTotal, sgstTotal, igstTotal, taxTotal, discount, roundOff, grandTotal
- `invoice_items` — itemName, quantity, unitPrice, taxableValue, gstRate, cgstAmount, sgstAmount, totalAmount
- `customers` — name, customerType (regular/corporate/staff), priceLevelId
- `items` — name, price, costPrice, gstRate, isVeg, productType
- `categories` — name, slug, parentCategory (tree hierarchy)

---

## RPT-S01: Daily Sales Summary
**Status:** Partially Built (`GET /sales/daily`)

| Field | Source |
|-------|--------|
| Date | `invoices.invoiceDate` |
| Total Invoices | COUNT(invoices WHERE status = 'completed') |
| Total Revenue | SUM(grandTotal) |
| Total Tax Collected | SUM(taxTotal) |
| Total Discounts Given | SUM(discount) |
| Net Revenue | SUM(grandTotal) - SUM(discount) |

**Visualization:** KPI cards + daily trend line chart
**Filters:** Single date (defaults to today)

---

## RPT-S02: Sales Report (Date Range)
**Status:** Built (`GET /sales/reports/sales`)

| Field | Source |
|-------|--------|
| Invoice Count | COUNT(completed invoices in range) |
| Total Sales | SUM(grandTotal) |
| Total Tax | SUM(taxTotal) |
| Average Order Value | totalSales / invoiceCount |
| Min/Max Order Value | MIN/MAX(grandTotal) |
| Period | fromDate — toDate |

**Visualization:** KPI cards + trend line
**Filters:** fromDate, toDate, groupBy (day/week/month)

---

## RPT-S03: Sales by Payment Method
**Status:** Not Built

| Field | Source |
|-------|--------|
| Payment Method | `invoices.paymentMethod` (cash/card/upi/online/credit) |
| Invoice Count | COUNT per method |
| Total Amount | SUM(grandTotal) per method |
| Percentage of Total | method_total / grand_total * 100 |

**Visualization:** Pie chart + bar chart + table
**Filters:** Date range
**Grouping:** By payment method

---

## RPT-S04: Sales by Category
**Status:** Not Built

| Field | Source |
|-------|--------|
| Category | `categories.name` (top-level) |
| Sub-Category | `categories.name` (child level) |
| Items Sold | SUM(invoice_items.quantity) |
| Revenue | SUM(invoice_items.totalAmount) |
| % of Total Revenue | category_revenue / total_revenue * 100 |
| Avg Price per Item | revenue / items_sold |

**Visualization:** Treemap + horizontal bar chart
**Filters:** Date range, category depth (1-3 levels)

---

## RPT-S05: Popular Items Report
**Status:** Card exists on frontend, no backend

| Field | Source |
|-------|--------|
| Rank | Position in sorted list |
| Item Name | `items.name` |
| Category | `categories.name` |
| Quantity Sold | SUM(invoice_items.quantity) |
| Revenue Generated | SUM(invoice_items.totalAmount) |
| Times Ordered | COUNT(DISTINCT invoiceId) |
| Avg Quantity per Order | quantity_sold / times_ordered |
| Is Veg | `items.isVeg` |

**Visualization:** Top 10/20 bar chart + full table
**Filters:** Date range, veg-only toggle, category filter
**Sorting:** By quantity sold or revenue (toggle)

---

## RPT-S06: Hourly Sales Distribution
**Status:** Not Built

| Field | Source |
|-------|--------|
| Hour | Extracted from `invoices.invoiceDate` |
| Invoice Count | COUNT per hour |
| Revenue | SUM(grandTotal) per hour |
| Avg Order Value | revenue / count per hour |

**Visualization:** Heatmap (hour of day vs day of week) + bar chart
**Filters:** Date range, day-of-week filter
**Insight:** Identifies peak hours for staffing optimization

---

## RPT-S07: Weekly/Monthly Trend Analysis
**Status:** Not Built

| Field | Source |
|-------|--------|
| Period | Week number or Month |
| Revenue | SUM(grandTotal) |
| Invoice Count | COUNT |
| Avg Order Value | revenue / count |
| Period-over-Period Change | (current - previous) / previous * 100 |

**Visualization:** Line chart with trend line + percentage change indicators
**Filters:** Granularity (weekly/monthly), comparison period (MoM, YoY)
**Insight:** Growth trajectory and seasonality patterns

---

## RPT-S08: Discount Analysis
**Status:** Not Built

| Field | Source |
|-------|--------|
| Total Discounts Given | SUM(discount) |
| Discount Rate | total_discount / total_subtotal * 100 |
| Avg Discount per Invoice | SUM(discount) / COUNT(invoices) |
| Discount by Payment Method | SUM(discount) grouped by paymentMethod |
| High-Discount Invoices | Invoices where discount > threshold |

**Visualization:** Trend line + breakdown table
**Filters:** Date range, minimum discount threshold
**Insight:** Discount leakage and promotion effectiveness

---

## RPT-S09: Tax Collection Report (TAX Summary)
**Status:** Built (`GET /sales/reports/gst`)

| Field | Source |
|-------|--------|
| GST Rate | `invoice_items.gstRate` (0/5/12/18/28%) |
| Taxable Value | SUM(taxableValue) per rate |
| CGST Amount | SUM(cgstAmount) per rate |
| SGST Amount | SUM(sgstAmount) per rate |
| IGST Amount | SUM(igstTotal) per rate |
| Total Tax Collected | SUM(taxTotal) per rate |
| Grand Total | SUM(totalAmount) per rate |

**Visualization:** Stacked bar chart + summary table
**Filters:** Date range
**Compliance:** Required for GST filing

---

## RPT-S10: Invoice-Level Drill-Down
**Status:** Not Built

| Field | Source |
|-------|--------|
| Invoice Number | `invoices.invoiceNumber` |
| Date | `invoices.invoiceDate` |
| Customer | `invoices.customerName` |
| Items | `invoice_items` line items with quantities and prices |
| Subtotal | `invoices.subtotal` |
| Tax Breakdown | CGST, SGST, IGST per item |
| Discount | `invoices.discount` |
| Grand Total | `invoices.grandTotal` |
| Payment Method | `invoices.paymentMethod` |
| Status | `invoices.status` |

**Visualization:** Detailed invoice card / printable receipt
**Filters:** Invoice number, date range, customer, status
**Drill-down:** From any sales summary report into individual invoices

---

## RPT-S11: Cancelled & Voided Transactions
**Status:** Not Built

| Field | Source |
|-------|--------|
| Cancelled Invoices | COUNT(invoices WHERE status = 'cancelled') |
| Lost Revenue | SUM(grandTotal WHERE status = 'cancelled') |
| Cancel Rate | cancelled_count / total_count * 100 |
| Cancellation Reasons | (requires new field on invoices) |

**Visualization:** KPI card + trend line
**Filters:** Date range
**Insight:** Revenue loss from cancellations

---

## RPT-S12: Veg vs Non-Veg Sales Split
**Status:** Not Built

| Field | Source |
|-------|--------|
| Category | `items.isVeg` (true/false) |
| Items Sold | SUM(quantity) |
| Revenue | SUM(totalAmount) |
| % of Total | veg_revenue / total_revenue * 100 |
| Avg Order Value | revenue / invoice_count |

**Visualization:** Donut chart + comparison bar
**Filters:** Date range
**Insight:** Menu mix and dietary preference trends

---

## Backend Implementation Notes

### Existing Endpoints
```typescript
// apps/api/src/sales/controllers/sales.controller.ts
@Get('daily')           // RPT-S01
@Get('reports/sales')   // RPT-S02
@Get('reports/gst')     // RPT-S09
```

### New Endpoints Needed
```typescript
@Get('reports/by-payment-method')    // RPT-S03
@Get('reports/by-category')          // RPT-S04
@Get('reports/popular-items')        // RPT-S05
@Get('reports/hourly-distribution')  // RPT-S06
@Get('reports/trends')              // RPT-S07
@Get('reports/discount-analysis')   // RPT-S08
@Get('reports/invoice/:id')         // RPT-S10
@Get('reports/cancelled')           // RPT-S11
@Get('reports/veg-nonveg')          // RPT-S12
```

### SQL Query Patterns
Most reports require:
1. JOIN `invoices` → `invoice_items` → `items` → `categories`
2. Filter by `invoiceDate` BETWEEN fromDate AND toDate
3. Filter by `invoices.status = 'completed'` (exclude drafts/cancelled unless specified)
4. GROUP BY the report dimension (category, payment method, hour, etc.)
5. Aggregate with SUM, COUNT, AVG, MIN, MAX
