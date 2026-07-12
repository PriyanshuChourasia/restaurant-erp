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
