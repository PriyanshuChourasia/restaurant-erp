# Executive Dashboard & Strategic Reports

## Data Sources
All modules — aggregated cross-functional data for C-level decision making.

---

## RPT-E01: Executive KPI Dashboard
**Status:** Mock Data (frontend has hardcoded dashboard)

| KPI | Source | Calculation |
|-----|--------|-------------|
| **Revenue KPIs** | | |
| Total Revenue | `invoices.grandTotal` | SUM WHERE status='completed' |
| Revenue Growth | Same period last year | (current - previous) / previous * 100 |
| Avg Order Value | invoices | SUM(grandTotal) / COUNT |
| Revenue per Seat | invoices + tables | total_revenue / total_seats |
| **Profitability KPIs** | | |
| Gross Profit | Revenue - COGS | Calculated from sales + purchases + inventory |
| Gross Margin % | gross_profit / revenue * 100 |
| Net Profit | Gross Profit - Operating Expenses | From ledger entries |
| Net Margin % | net_profit / revenue * 100 |
| **Operational KPIs** | | |
| Table Turnover | invoices + tables | orders / available_tables / hours |
| Avg Table Duration | invoices | AVG session duration |
| Kitchen Efficiency | kots | avg_time_to_serve |
| Reservation Fill Rate | reservations | seated / total_reservations * 100 |
| **Customer KPIs** | | |
| Total Customers | `customers` | COUNT active |
| Repeat Customer Rate | customers + invoices | repeat / total * 100 |
| Customer Satisfaction | (requires feedback system) | N/A currently |
| **Inventory KPIs** | | |
| Inventory Value | `inventory` | SUM(currentStock * unitCost) |
| Stock Turnover | COGS / avg_inventory | Times inventory turns over |
| Waste % | wastage_value / total_consumption * 100 |

**Visualization:** Grid of KPI cards with sparklines, trend arrows
**Filters:** Period (today/this week/this month/this quarter/this year), comparison (vs last period, vs last year)
**Refresh:** Auto-refresh every 5 minutes

**Why It Is Needed:** The single screen that tells the owner everything they need to know about the business in 10 seconds. No digging through multiple reports — key metrics for revenue, profit, operations, customers, and inventory are all in one place. Answers: Is the business healthy overall? Which area needs my attention right now?

**Business Area Reviewed:** Overall business performance across all dimensions. Reviews financial, operational, customer, and inventory KPIs on a single screen. Used by owner and CEO for daily pulse check, identifying issues early, and strategic decision-making.

---

## RPT-E02: Profitability Analysis by Dimension
**Status:** Not Built

| Dimension | Breakdown |
|-----------|-----------|
| **By Category** | Revenue, COGS, Gross Profit per menu category |
| **By Item** | Revenue, food cost %, margin per item |
| **By Customer Type** | Revenue, avg order value, profitability per segment |
| **By Zone/Table** | Revenue, utilization, profit per zone |
| **By Time** | Revenue, profit margin by hour/day/week/month |
| **By Payment Method** | Revenue, collection efficiency, processing cost |

**Visualization:** Multi-tab report with drill-down per dimension
**Filters:** Period, comparison period, dimension selector
**Insight:** Where is the restaurant most/least profitable?

**Why It Is Needed:** Not all revenue is good revenue. Some menu items, customer segments, or time slots may be unprofitable. This report slices profitability across every dimension imaginable to pinpoint exactly where profit is made and lost. Answers: Which menu categories are most profitable? Are corporate customers more profitable than walk-ins? Is happy hour actually profitable after discounts?

**Business Area Reviewed:** Multi-dimensional profit analysis. Reviews profitability across menu, customer segments, zones, time periods, and payment methods. Used by owner and manager for strategic decisions — which items to promote, which customer segments to target, which time slots to optimize.

---

## RPT-E03: Business Health Scorecard
**Status:** Not Built

| Score Category | Metrics | Weight |
|----------------|---------|--------|
| **Financial Health** | | 35% |
| Revenue growth rate | Current vs prior period | 10% |
| Profit margin | Net margin % | 15% |
| Cash flow | Operating cash flow positive | 10% |
| **Operational Efficiency** | | 25% |
| Table utilization | Avg utilization rate | 10% |
| Kitchen throughput | Orders per hour | 10% |
| Inventory turnover | Stock turns per month | 5% |
| **Customer Health** | | 20% |
| Repeat rate | Returning customer % | 10% |
| Avg order value | AOV trend | 5% |
| No-show rate | Reservation no-show % | 5% |
| **Compliance** | | 20% |
| GST filing status | On-time GST returns | 10% |
| Tax accuracy | Reconciliation match % | 10% |

**Overall Score:** Weighted average → Color coded (Green >80, Yellow 60-80, Red <60)

**Visualization:** Radar chart + score cards + trend arrows
**Filters:** Period
**Insight:** At-a-glance business health

**Why It Is Needed:** The one-number answer to "how is my restaurant doing?" Converts dozens of metrics into a single, weighted health score. The radar chart immediately shows which area is weakest (e.g., operations score low → look at kitchen throughput). Answers: What is our overall business health score? Which of the four pillars (financial, operations, customers, compliance) needs improvement?

**Business Area Reviewed:** Composite business health assessment. Reviews a weighted score across financial, operational, customer, and compliance dimensions. Used by owner and investor for quick health assessment, identifying weak areas, and tracking improvement over time.

---

## RPT-E04: Trend Analysis & Forecasting
**Status:** Not Built

| Metric | Historical | Forecast |
|--------|-----------|----------|
| Revenue | Last 12 months actual | Next 3 months projected |
| Orders | Last 12 months actual | Next 3 months projected |
| Avg Order Value | Last 12 months actual | Next 3 months projected |
| Customers | Last 12 months actual | Next 3 months projected |
| Food Cost % | Last 12 months actual | Next 3 months projected |

**Forecasting Method:** Simple moving average + seasonal adjustment

**Visualization:** Line chart with historical (solid) + forecast (dashed) lines + confidence bands
**Filters:** Metric selector, forecast horizon
**Insight:** Growth trajectory, seasonal planning

**Why It Is Needed:** The past tells you what happened; the forecast tells you what's coming. Enables proactive decision-making — if the forecast shows a revenue dip next quarter, you can plan promotions now. If food costs are projected to rise, you can adjust menu prices ahead of time. Answers: Where is the business headed? What should we prepare for in the coming months?

**Business Area Reviewed:** Business trajectory and forward planning. Reviews historical trends and projects future performance for key metrics. Used by owner for proactive strategy — seasonal planning, budget preparation, and early warning for potential downturns.

---

## RPT-E05: Comparative Analysis Report
**Status:** Not Built

| Comparison | Metrics |
|------------|---------|
| **Period vs Period** | This month vs last month |
| **Year vs Year** | This quarter vs same quarter last year |
| **Day vs Day** | Today vs same day last week |
| **Category vs Category** | Revenue, margin, growth by menu category |
| **Zone vs Zone** | Revenue, utilization, profit by zone |
| **Supplier vs Supplier** | Cost, lead time, reliability |

**Visualization:** Side-by-side comparison bars + delta indicators
**Filters:** Comparison type, periods, dimensions
**Insight:** Relative performance, improvement tracking

**Why It Is Needed:** A number in isolation means nothing. Revenue of ₹5L — is that good? Only compared to last month, last year, or a target. This report provides the context needed to evaluate performance. Answers: Are we improving? How do different areas of the business compare? How do we stack up against our targets?

**Business Area Reviewed:** Contextual performance evaluation. Reviews current performance against historical periods, targets, and cross-business comparisons. Used by owner to track progress, evaluate strategy effectiveness, and benchmark performance.

---

## Backend Implementation Notes

### New Endpoints Needed
```typescript
@Get('executive/kpi-dashboard')         // RPT-E01
@Get('executive/profitability')         // RPT-E02
@Get('executive/health-scorecard')      // RPT-E03
@Get('executive/trends')              // RPT-E04
@Get('executive/comparative')          // RPT-E05
```

### Dashboard Current State
The frontend dashboard (`DashboardPage.tsx`) is entirely hardcoded with mock data. It needs to be rewired to:
1. Fetch from `GET /sales/daily` for revenue KPIs
2. Fetch from `GET /sales/reports/sales` for trends
3. Fetch from `GET /ledger` for financial summary
4. Fetch new endpoints for operational KPIs

### Real-Time Considerations
- Executive dashboard should auto-refresh (polling every 5 min or WebSocket)
- Consider caching expensive queries (profitability, forecasting)
- Use materialized views for complex aggregations in production
