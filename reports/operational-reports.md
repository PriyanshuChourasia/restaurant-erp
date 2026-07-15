# Daily Operations Reports

## Data Sources
- All entities — cross-module operational data
- `users` — name, email, isActive, roleId
- `roles` — name (admin/manager/chef/cashier/waiter/staff)
- `invoices`, `kots`, `reservations`, `inventory`, `purchases`, `ledger_entries`
- `organization_settings` — restaurantName, businessHours

---

## RPT-O01: Daily Operations Summary
**Status:** Not Built

| Field | Source |
|-------|--------|
| **Date** | Today or selected date |
| **Sales** | |
| Today's Revenue | SUM(invoices.grandTotal) |
| Invoice Count | COUNT(invoices) |
| Avg Order Value | revenue / count |
| **Kitchen** | |
| KOTs Generated | COUNT(kots) |
| KOTs Completed | COUNT WHERE status='served' |
| Avg Serve Time | AVG(servedAt - createdAt) |
| Pending KOTs | COUNT WHERE status IN ('pending','preparing') |
| **Seating** | |
| Tables Occupied | COUNT WHERE status='occupied' |
| Reservations Honored | COUNT WHERE status='completed' |
| No-Shows | COUNT WHERE status='no_show' |
| **Inventory** | |
| Low Stock Items | COUNT WHERE currentStock < minStockLevel |
| Items Consumed | SUM from stock_movements WHERE type='sale_out' |
| **Staff on Duty** | COUNT(users) WHERE active |

**Visualization:** Executive dashboard cards + mini charts
**Filters:** Date, view toggle (today/week/month)

**Why It Is Needed:** The manager's morning coffee report — a single page that tells you everything about yesterday or today. Combines sales, kitchen, seating, inventory, and staffing into one view. Answers: How did we do today overall? Anything urgent needing attention (low stock, pending KOTs, no-shows)?

**Business Area Reviewed:** Daily cross-functional operations health. Reviews all departments (sales, kitchen, seating, inventory, staff) in a single unified view. Used by manager and owner for daily stand-up meetings and quick operational decisions.

---

## RPT-O02: Staff Activity Report
**Status:** Not Built

| Field | Source |
|-------|--------|
| Staff Member | `users.name` |
| Role | `roles.name` |
| Actions Performed | COUNT(ledger_entries.createdBy + production_entries.createdBy + stock_movements.createdBy) |
| Orders Handled | COUNT(invoices/kots linked to staff) |
| Last Active | Most recent activity timestamp |
| Permissions | `roles` → `permissions` count |

**Visualization:** Staff leaderboard + activity timeline
**Filters:** Date range, role
**Insight:** Staff productivity, workload distribution

**Why It Is Needed:** Helps identify high-performing staff and those who may need more training or supervision. Also reveals if workload is unevenly distributed — are some servers handling 50 orders while others handle 10? Answers: Who are our most productive staff? Is anyone underperforming or overburdened?

**Business Area Reviewed:** Staff productivity and workload balance. Reviews individual staff activity and contribution levels across roles. Used by manager for performance reviews, training needs assessment, and fair shift allocation.

---

## RPT-O03: Hourly Operations Dashboard
**Status:** Not Built

| Field | Source |
|-------|--------|
| Hour | 6AM - 12AM (restaurant hours) |
| Sales | Revenue per hour |
| Orders | Invoice count per hour |
| KOTs | KOT count per hour |
| Tables Active | Occupied tables per hour |
| Staff on Duty | Active users per hour |

**Visualization:** Real-time dashboard with hourly update
**Filters:** Date, today vs historical comparison
**Insight:** Real-time operational awareness

**Why It Is Needed:** A live view of how the current day is tracking. If sales at 2 PM are far below typical levels, the manager can run a lunch special or adjust staffing. If KOTs are piling up, more kitchen help may be needed. Answers: How is today comparing to a normal day? Do we need to make adjustments right now?

**Business Area Reviewed:** Real-time operational pulse. Reviews hour-by-hour sales, orders, kitchen load, table occupancy, and staffing side by side. Used by shift manager for real-time decision-making — when to call in extra staff, run promos, or close sections.

---

## RPT-O04: Weekly Operations Review
**Status:** Not Built

| Field | Source |
|-------|--------|
| Day | Mon-Sun |
| Revenue | Daily revenue |
| Orders | Daily order count |
| Avg Order Value | Daily AOV |
| KOTs Completed | Daily kitchen output |
| Reservations | Daily reservation count |
| No-Shows | Daily no-show count |
| Week-over-Week | Same metrics from previous week |
| Best Day | Day with highest revenue |
| Worst Day | Day with lowest revenue |

**Visualization:** Week calendar view + comparison cards
**Filters:** Week selector, comparison period
**Insight:** Weekly performance trends

**Why It Is Needed:** The weekly rhythm of a restaurant is critical — Monday is different from Saturday. This report helps understand day-level patterns: is Sunday brunch growing? Is Tuesday dinner consistently slow (perhaps the day for a promotion)? Answers: Which days drive our business? How is this week trending vs last week?

**Business Area Reviewed:** Weekly performance patterns. Reviews daily breakdown of sales, kitchen output, reservations, and no-shows across the week. Used by manager and owner for day-specific strategy — staffing, promotions, and operating hours decisions.

---

## RPT-O05: Peak Hours & Staffing Analysis
**Status:** Not Built

| Field | Source |
|-------|--------|
| Hour | Business hours breakdown |
| Revenue per Hour | Sales during each hour |
| Orders per Hour | Invoice count per hour |
| KOTs per Hour | Kitchen load per hour |
| Staff Needed | Based on orders/hour × avg prep time |
| Current Staffing | Users active per hour |
| Staffing Gap | needed - current |
| Recommended Staff | Based on historical demand |

**Visualization:** Staffing demand curve + actual staffing overlay
**Filters:** Date range, day-of-week
**Insight:** Optimal staff scheduling

**Why It Is Needed:** Labor cost is the second-largest expense after food (typically 25-35% of revenue). Overstaffing wastes money; understaffing loses customers to poor service. This report helps match staff schedules to actual demand, hour by hour. Answers: Are we overstaffed on slow days? Understaffed on busy nights? What's the optimal schedule?

**Business Area Reviewed:** Labor cost optimization and staffing efficiency. Reviews the relationship between customer demand and staff scheduling. Used by manager for creating data-driven shift schedules, reducing labor costs, and ensuring adequate coverage during peak hours.

---

## RPT-O06: Payment Collection Report
**Status:** Not Built

| Field | Source |
|-------|--------|
| Payment Method | `invoices.paymentMethod` (cash/card/upi/online/credit) |
| Invoice Count | COUNT per method |
| Total Collected | SUM(grandTotal) per method |
| % of Total | method_total / grand_total * 100 |
| Avg Transaction Value | total / count per method |
| Credit Outstanding | COUNT WHERE paymentMethod='credit' AND status='completed' |
| Credit Aging | Days since invoice for credit payments |

**Visualization:** Pie chart + collection timeline
**Filters:** Date range, payment method
**Insight:** Cash flow forecasting, credit management

**Why It Is Needed:** For restaurants that extend credit to corporate customers, this report tracks who owes money and for how long. Aging receivables can become bad debt if not collected. Also helps manage cash flow by showing how much is coming in as immediate payment vs. credit. Answers: Who owes us money and how old are those debts? Are we collecting efficiently?

**Business Area Reviewed:** Receivables management and cash collection. Reviews payment method mix and tracks credit outstanding aging. Used by manager and accountant for follow-up on unpaid credit invoices, cash flow forecasting, and bad debt prevention.

---

## RPT-O07: Cancellation & Void Summary
**Status:** Not Built

| Field | Source |
|-------|--------|
| Category | Invoices / KOTs / Reservations |
| Total Created | COUNT per category |
| Total Cancelled | COUNT WHERE status='cancelled' |
| Cancel Rate | cancelled / created * 100 |
| Revenue Impact | SUM(grandTotal) of cancelled items |
| Cancel by Reason | (requires reason tracking) |
| Cancel by Time | When cancellations occur most |
| Cancel by Staff | Who processes most cancellations |

**Visualization:** Category comparison + trend line
**Filters:** Date range, category
**Insight:** Process improvement, fraud detection

**Why It Is Needed:** A high cancellation rate across any category signals a problem. Cancelled invoices could mean customers unhappy with service. Cancelled KOTs could mean kitchen errors. High voids by a specific staff member could indicate fraud. Answers: Is cancellation rate normal or concerning? Is a particular staff member or station involved in most cancellations?

**Business Area Reviewed:** Operational quality control and fraud prevention. Reviews cancellations across invoices, KOTs, and reservations. Used by owner and manager for detecting fraud, improving order accuracy, and identifying service or kitchen issues.

---

## RPT-O08: End-of-Day Reconciliation
**Status:** Not Built

| Field | Source |
|-------|--------|
| **Cash Reconciliation** | |
| Cash Sales | SUM(grandTotal WHERE paymentMethod='cash') |
| Cash in Drawer | Physical cash count |
| Variance | physical - system |
| **Card/UPI Reconciliation** | |
| Card Sales | SUM WHERE paymentMethod='card' |
| UPI Sales | SUM WHERE paymentMethod='upi' |
| Online Sales | SUM WHERE paymentMethod='online' |
| **Tax Collection** | |
| Total GST Collected | SUM(taxTotal) |
| **Inventory Check** | |
| Items with Movement | COUNT items with stock_movements today |
| Wastage Today | SUM wastage movements |
| **Summary** | |
| Total Revenue | SUM(grandTotal) |
| Total Invoices | COUNT |
| Cancelled Invoices | COUNT WHERE cancelled |

**Visualization:** Reconciliation checklist + variance alerts
**Filters:** Date
**Action:** Sign-off workflow for manager approval

**Why It Is Needed:** The most critical control report for preventing cash theft. Every restaurant must reconcile cash in the drawer against system records at the end of each shift/day. Variances must be investigated immediately. Also ensures all card/UPI transactions are accounted for and GST collected matches records. Answers: Does the cash in hand match sales? Are there any unexplained variances?

**Business Area Reviewed:** Cash accountability and end-of-day controls. Reviews cash drawer count vs. system sales, payment method totals, and daily GST collection. Used by manager for daily sign-off, cash handover, and theft prevention.

---

## Backend Implementation Notes

### New Endpoints Needed
```typescript
@Get('operations/daily-summary')      // RPT-O01
@Get('operations/staff-activity')     // RPT-O02
@Get('operations/hourly-dashboard')   // RPT-O03
@Get('operations/weekly-review')      // RPT-O04
@Get('operations/peak-hours')        // RPT-O05
@Get('operations/payment-collection') // RPT-O06
@Get('operations/cancellation')       // RPT-O07
@Get('operations/eod-reconciliation') // RPT-O08
```

### Cross-Module Joins
These reports require joining data from multiple modules:
- Sales + Kitchen: Link invoices to KOTs via tableIds
- Sales + Seating: Link invoices to tables
- Inventory + Sales: Track consumption vs revenue
- Users + All: Track who performed what action
