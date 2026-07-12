# Kitchen Operations Reports

## Data Sources
- `kots` — kotNumber, orderId, tableIds (JSON), status, station (main_kitchen/tandoor/beverages/desserts/snacks), notes, preparedBy, startedAt, completedAt, servedAt, createdAt
- `kot_items` — itemName, quantity, instructions, status
- `invoice_items` — itemName, quantity, gstRate
- `items` — name, isVeg, productType, category

---

## RPT-K01: Kitchen Order Queue Status
**Status:** Partially Built (KOT board exists in frontend)

| Field | Source |
|-------|--------|
| KOT Number | `kots.kotNumber` |
| Station | `kots.station` |
| Table(s) | `kots.tableIds` |
| Status | `kots.status` (pending/preparing/ready/served/cancelled) |
| Items Count | COUNT(kot_items) |
| Ordered At | `kots.createdAt` |
| Preparation Started | `kots.startedAt` |
| Elapsed Time | NOW() - createdAt (real-time) |
| Priority | Based on wait time |

**Visualization:** Kanban board (columns: Pending → Preparing → Ready → Served)
**Filters:** Station, status
**Real-time:** Auto-refresh every 30 seconds

---

## RPT-K02: Kitchen Performance Metrics
**Status:** Not Built

| Field | Source |
|-------|--------|
| **Turnaround Times** | |
| Avg Time to Start Prep | AVG(startedAt - createdAt) per KOT |
| Avg Prep Time | AVG(completedAt - startedAt) per KOT |
| Avg Time to Serve | AVG(servedAt - startedAt) per KOT |
| Total Avg Lead Time | AVG(servedAt - createdAt) per KOT |
| **By Station** | |
| Station-wise Avg Times | AVG times grouped by station |
| Busiest Station | Station with most KOTs in period |
| **By Time of Day** | |
| Peak Hour Performance | Avg serve times during peak vs off-peak |

**Visualization:** Gauge charts for avg times + bar charts by station
**Filters:** Date range, station, time-of-day
**Insight:** Kitchen bottleneck identification

---

## RPT-K03: Station Load Distribution
**Status:** Not Built

| Field | Source |
|-------|--------|
| Station | `kots.station` (main_kitchen/tandoor/beverages/desserts/snacks) |
| KOT Count | COUNT(kots) per station |
| Items Count | SUM(kot_items) per station |
| Avg Items per KOT | items_count / kot_count |
| Pending Orders | COUNT WHERE status='pending' |
| Overdue Orders | COUNT WHERE elapsed > threshold (e.g., 20 min) |
| Station Utilization | station_kots / total_kots * 100 |

**Visualization:** Horizontal bar chart + heat map
**Filters:** Date range, time-of-day
**Insight:** Workload balancing across stations

---

## RPT-K04: Menu Item Prep Frequency
**Status:** Not Built

| Field | Source |
|-------|--------|
| Item Name | `kot_items.itemName` |
| Times Ordered | COUNT(kot_items) |
| Total Quantity | SUM(kot_items.quantity) |
| Station | Mapped from KOT |
| Avg Quantity per Order | total_quantity / times_ordered |
| Peak Hours | Hours when most ordered |
| By Day of Week | Frequency by day |

**Visualization:** Top items bar chart + hourly heatmap
**Filters:** Date range, station, category
**Insight:** Prep scheduling, ingredient pre-staging

---

## RPT-K05: KOT Cancellation & Void Report
**Status:** Not Built

| Field | Source |
|-------|--------|
| Cancelled KOTs | COUNT(kots WHERE status='cancelled') |
| Cancelled Items | COUNT(kot_items WHERE status='cancelled') |
| Cancel Rate | cancelled / total * 100 |
| Cancel by Station | Distribution across stations |
| Cancel by Time | When cancellations happen most |
| Wasted Prep Time | Time spent on cancelled orders before cancellation |

**Visualization:** Trend line + station breakdown
**Filters:** Date range, station
**Insight:** Order accuracy, kitchen waste

---

## RPT-K06: Kitchen Throughput Analysis
**Status:** Not Built

| Field | Source |
|-------|--------|
| Period | Hour, day, or week |
| Orders Completed | COUNT(kots WHERE status='served') |
| Items Prepared | SUM(kot_items WHERE status='served') |
| Throughput Rate | orders_per_hour or items_per_hour |
| Peak Throughput | Max hourly throughput |
| Avg Throughput | Avg hourly throughput |
| Capacity Utilization | actual_throughput / max_theoretical * 100 |

**Visualization:** Line chart with moving average
**Filters:** Date range, granularity
**Insight:** Kitchen capacity planning

---

## RPT-K07: Dietary Mix Report (Veg vs Non-Veg)
**Status:** Not Built

| Field | Source |
|-------|--------|
| Category | `items.isVeg` |
| KOT Count | COUNT(DISTINCT kotId) with at least one veg/non-veg item |
| Item Count | COUNT(kot_items) by veg type |
| % Veg Items | veg_count / total_count * 100 |
| % Non-Veg Items | nonveg_count / total_count * 100 |
| Trend | Veg vs non-veg ratio over time |

**Visualization:** Donut chart + trend line
**Filters:** Date range, station
**Insight:** Dietary preference trends, menu planning

---

## Backend Implementation Notes

### KOT Status Lifecycle
```
pending → preparing → ready → served
                        ↓
                   cancelled (at any stage)
```

### Station Types
```
main_kitchen  — Primary cooking station
tandoor       — Tandoor/grill items
beverages     — Drinks, juices, shakes
desserts      — Sweet items
snacks        — Quick bites, appetizers
```

### New Endpoints Needed
```typescript
@Get('kitchen/queue-status')           // RPT-K01 (enhance existing)
@Get('kitchen/performance')           // RPT-K02
@Get('kitchen/station-load')          // RPT-K03
@Get('kitchen/item-frequency')        // RPT-K04
@Get('kitchen/cancellation')          // RPT-K05
@Get('kitchen/throughput')            // RPT-K06
@Get('kitchen/dietary-mix')           // RPT-K07
```

### Timestamps Available for Calculation
```
kots.createdAt      — When order was placed
kots.startedAt      — When kitchen started preparing
kots.completedAt    — When preparation finished
kots.servedAt       — When food was served to table
```
