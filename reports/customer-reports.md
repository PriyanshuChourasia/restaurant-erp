# Customer Analytics Reports

## Data Sources
- `customers` — name, phone, email, gstin, customerType (regular/corporate/staff), priceLevelId, isActive
- `invoices` — customerName, customerPhone, customerGstin, customerId, grandTotal, invoiceDate, paymentMethod, status
- `invoice_items` — itemName, quantity, totalAmount
- `price_levels` — name, code, isDefault
- `item_price_levels` — price (override price per customer-tier per item)

---

## RPT-C01: Customer Directory & Segmentation
**Status:** Not Built

| Field | Source |
|-------|--------|
| Customer Name | `customers.name` |
| Phone | `customers.phone` |
| Email | `customers.email` |
| Customer Type | `customers.customerType` (regular/corporate/staff) |
| Price Level | `price_levels.name` |
| Total Visits | COUNT(invoices WHERE customerId) |
| Total Spend | SUM(invoices.grandTotal) WHERE customerId |
| Avg Order Value | total_spend / total_visits |
| Last Visit | MAX(invoiceDate) |
| Days Since Last Visit | TODAY - last_visit |
| Status | Active/Inactive based on recent activity |

**Visualization:** Customer list table with segmentation badges
**Filters:** Customer type, price level, activity status, spend range
**Grouping:** By type, by price level, by spend tier

---

## RPT-C02: Customer Revenue Analysis
**Status:** Not Built

| Field | Source |
|-------|--------|
| Customer | `customers.name` |
| Customer Type | `customers.customerType` |
| Total Revenue | SUM(grandTotal) |
| % of Total Revenue | customer_revenue / total_revenue * 100 |
| Revenue Trend | Monthly revenue per customer |
| Revenue by Payment Method | Breakdown across payment methods |
| Revenue by Item Category | What they order most |

**Visualization:** Pareto chart (80/20 analysis) + trend
**Filters:** Date range, customer type, minimum spend
**Insight:** Identify top revenue-generating customers

---

## RPT-C03: Customer Loyalty & Retention
**Status:** Not Built

| Field | Source |
|-------|--------|
| Customer | `customers.name` |
| First Visit | MIN(invoiceDate) |
| Last Visit | MAX(invoiceDate) |
| Total Visits | COUNT(DISTINCT invoiceDate) |
| Visit Frequency | total_visits / days_since_first_visit |
| Repeat Rate | customers with >1 visit / total customers * 100 |
| Churn Risk | Customers with no visit in >30 days |
| Loyalty Score | Based on frequency + recency + monetary (RFM) |

**Visualization:** RFM scatter plot + cohort analysis table
**Filters:** Date range, loyalty tier, churn risk level
**Insight:** Customer retention, loyalty program design

---

## RPT-C04: New vs Returning Customers
**Status:** Not Built

| Field | Source |
|-------|--------|
| Period | Month or week |
| New Customers | First-time buyers (MIN(invoiceDate) in period) |
| Returning Customers | Repeat buyers (MIN(invoiceDate) < period start) |
| New Customer Revenue | SUM from new customers |
| Returning Customer Revenue | SUM from returning customers |
| New Customer % | new_count / total_count * 100 |
| Retention Rate | returning / (total from previous period) * 100 |

**Visualization:** Stacked bar chart + retention funnel
**Filters:** Date range, granularity
**Insight:** Customer acquisition vs retention effectiveness

---

## RPT-C05: Customer Type Analysis
**Status:** Not Built

| Field | Source |
|-------|--------|
| Type | `customers.customerType` (regular/corporate/staff) |
| Customer Count | COUNT per type |
| Total Revenue | SUM(grandTotal) per type |
| Avg Order Value | revenue / visits per type |
| Preferred Payment Method | Mode(paymentMethod) per type |
| Top Items | Most ordered items per type |
| Price Sensitivity | Avg price level used per type |

**Visualization:** Comparison cards + radar chart
**Filters:** Date range
**Insight:** Tailor offerings per customer segment

---

## RPT-C06: Customer Lifetime Value (CLV)
**Status:** Not Built

| Field | Source |
|-------|--------|
| Customer | `customers.name` |
| Customer Tenure | Days from first to last visit |
| Total Lifetime Spend | SUM(grandTotal) |
| Avg Monthly Spend | total_spend / tenure_months |
| Purchase Frequency | total_visits / tenure_months |
| Projected Annual Value | avg_monthly_spend * 12 |
| CLV Segment | High (>₹1L) / Medium (>₹25K) / Low (<₹25K) |

**Visualization:** CLV distribution histogram + top customers table
**Filters:** CLV segment, tenure range
**Insight:** Customer value prioritization, marketing ROI

---

## RPT-C07: Customer Order Preferences
**Status:** Not Built

| Field | Source |
|-------|--------|
| Customer | `customers.name` |
| Favorite Items | Top 5 most ordered items |
| Avg Items per Order | COUNT(invoice_items) / COUNT(invoices) |
| Preferred Category | Most ordered category |
| Preferred Station | Most ordered station type (veg/non-veg) |
| Order Time Pattern | Most common order time/day |
| Avg Spend per Visit | Total spend / total visits |

**Visualization:** Customer profile card + preference radar
**Filters:** Customer, date range
**Insight:** Personalized recommendations, upselling

---

## RPT-C08: Walk-in vs Registered Customers
**Status:** Not Built

| Field | Source |
|-------|--------|
| Segment | Registered (customerId IS NOT NULL) vs Walk-in (customerId IS NULL) |
| Invoice Count | COUNT per segment |
| Total Revenue | SUM(grandTotal) per segment |
| Avg Order Value | revenue / count per segment |
| Payment Method Distribution | Per segment |
| Growth Trend | Walk-in vs registered ratio over time |

**Visualization:** Comparison cards + trend line
**Filters:** Date range
**Insight:** Registration conversion, walk-in revenue impact

---

## Backend Implementation Notes

### Customer Type Values
```
regular    — Standard dine-in customers
corporate  — Corporate accounts with billing
staff      — Internal staff orders (often discounted)
```

### RFM Scoring Model (for RPT-C03)
```
Recency (R): Days since last visit
  5 = <7 days, 4 = 7-14, 3 = 14-30, 2 = 30-60, 1 = >60

Frequency (F): Number of visits in period
  5 = >20 visits, 4 = 10-20, 3 = 5-10, 2 = 2-5, 1 = 1

Monetary (M): Total spend in period
  5 = >₹50K, 4 = ₹25-50K, 3 = ₹10-25K, 2 = ₹5-10K, 1 = <₹5K

RFM Score = R*100 + F*10 + M (e.g., 543 = High recency, High frequency, Medium monetary)
```

### New Endpoints Needed
```typescript
@Get('customers/directory')            // RPT-C01
@Get('customers/revenue-analysis')    // RPT-C02
@Get('customers/loyalty-retention')   // RPT-C03
@Get('customers/new-vs-returning')    // RPT-C04
@Get('customers/type-analysis')       // RPT-C05
@Get('customers/lifetime-value')      // RPT-C06
@Get('customers/preferences')         // RPT-C07
@Get('customers/walkin-vs-registered') // RPT-C08
```

### Customer Linkage Challenge
Currently, invoices store `customerName` and `customerPhone` as text, but `customerId` is nullable. Reports should handle both linked and unlinked invoices:
- Linked: JOIN on `customerId` → `customers`
- Unlinked: Group by `customerPhone` as proxy identifier
