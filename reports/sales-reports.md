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

**Why It Is Needed:** The first report a manager looks at each day to know how the business performed. Answers: Did we hit today's target? How does today compare to yesterday? Are we on track for the month? Enables quick corrective action if sales are down.

**Business Area Reviewed:** Daily top-line performance. Reviews total revenue, invoice count, discounts, and tax collected. Used by manager and owner for daily pulse check and target tracking.

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

**Why It Is Needed:** Core report for tracking sales performance over any period. Helps answer: Is revenue growing month-over-month? What is the average ticket size? Are customers spending more or less over time? Used for target setting and performance reviews.

**Business Area Reviewed:** Revenue performance over time. Reviews sales volume, value, and order patterns across days, weeks, or months. Used by owner and manager for trend analysis and goal tracking.

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

**Why It Is Needed:** Tells the manager how customers prefer to pay. If digital payments are rising, the restaurant may need better UPI/card infrastructure. If cash is dominant, bank deposit planning changes. Also critical for cash management — if card/UPI is >80%, less physical cash needs to be kept on premises.

**Business Area Reviewed:** Payment preference trends and cash management. Reviews the mix of cash, card, UPI, and credit transactions. Used by manager and accountant for cash handling procedures, bank deposit planning, and payment infrastructure decisions.

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

**Why It Is Needed:** Reveals which menu categories drive revenue. Are starters outselling mains? Is the beverage category underperforming? Enables data-driven menu engineering — promote high-margin categories, rework or replace underperforming ones. Answers: Which food categories should we focus on?

**Business Area Reviewed:** Menu category performance and contribution mix. Reviews revenue distribution across food categories (e.g., starters, mains, desserts, beverages). Used by owner, chef, and manager for menu engineering and category strategy.

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

**Why It Is Needed:** The most actionable report for a chef and manager. Identifies best-sellers (keep and promote) and slow-movers (rework or remove). Answers: What are customers coming here for? Which items should be featured on promotions? Combined with food cost data, this becomes the foundation of menu profitability analysis.

**Business Area Reviewed:** Menu item performance and customer preference. Reviews each item's popularity by quantity sold and revenue generated. Used by chef and owner for menu optimization, pricing decisions, and promotion planning.

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

**Why It Is Needed:** Directly informs staffing schedules. If 60% of revenue comes between 7-10 PM, that's where most staff should be scheduled. Also helps plan happy hours, lunch specials, or off-peak promotions. Answers: When are we busiest? When should we have more servers and kitchen staff?

**Business Area Reviewed:** Sales distribution by time of day and day of week. Reviews revenue patterns across operating hours. Used by manager for staffing optimization, shift scheduling, and timing of promotions.

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

**Why It Is Needed:** Reveals the restaurant's growth trajectory and seasonal patterns. Answers: Are we growing compared to last month/last year? Which months are naturally high/low? Enables setting realistic targets and comparing performance against industry benchmarks. Essential for understanding seasonality in the restaurant business.

**Business Area Reviewed:** Revenue growth trajectory and seasonality. Reviews period-over-period (monthly, weekly, yearly) performance changes. Used by owner for strategic planning, target setting, and evaluating business direction.

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

**Why It Is Needed:** Discounts directly eat into profit. This report prevents revenue leakage by surfacing who is giving discounts, how much, and whether they are effective. Answers: Are we giving away too much? Are discounts driving enough additional volume to justify the margin loss? Critical for preventing staff abuse of discounting power.

**Business Area Reviewed:** Discount discipline and promotion ROI. Reviews the extent and pattern of discounts affecting revenue. Used by owner and manager to control discount leakage, evaluate promo effectiveness, and prevent staff misuse.

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

**Why It Is Needed:** Mandatory for reconciling tax collected with what will be filed in GST returns. Helps verify that correct GST rates are being applied to menu items. Also identifies if certain items are incorrectly taxed (e.g., charging 5% when it should be 12%).

**Business Area Reviewed:** Tax collection accuracy and compliance. Reviews GST collected by rate slab across all sales. Used by accountant and manager to ensure correct tax application and prepare for GST filing.

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

**Why It Is Needed:** Provides the transaction-level detail behind any summary number. When a customer disputes a bill, the accountant needs to match the invoice, or the manager needs to audit a suspicious transaction — this is where you go. Answers: What exactly was ordered, when, by whom, and how was it paid?

**Business Area Reviewed:** Transaction-level audit and verification. Reviews full details of any individual sale. Used by manager, accountant, and customer service for dispute resolution, audit, and verification of summary data.

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

**Why It Is Needed:** High cancellation rates can signal process problems — orders going to wrong tables, long wait times causing customers to leave, or even staff fraud (false cancellations to steal cash). Answers: How much revenue are we losing to cancellations? Is the rate normal or rising? This is a key control report for fraud detection.

**Business Area Reviewed:** Order accuracy and revenue leakage. Reviews transaction cancellations and their impact on revenue. Used by owner and manager for fraud detection, process improvement, and minimizing revenue loss.

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

**Why It Is Needed:** Helps understand customer dietary preferences in the restaurant's location. If veg is 70% of sales, the menu should emphasize vegetarian options. Also useful for inventory planning — which raw materials to stock more of. Answers: What is the veg/non-veg ratio of our customer base? Should we add more veg or non-veg items?

**Business Area Reviewed:** Dietary preference trends and menu-mix balance. Reviews split between vegetarian and non-vegetarian item sales. Used by chef for menu development and by owner for understanding customer demographics.

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
