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

**Why It Is Needed:** The kitchen's real-time command center. Chefs need to know what's ordered, what's being cooked, and what's ready to serve — all organized by station. Prevents orders from being forgotten or lost. Answers: What needs to be cooked right now? Which orders are taking too long?

**Business Area Reviewed:** Real-time kitchen workflow management. Reviews all active orders grouped by preparation station and status. Used by head chef and station chefs for daily kitchen operations, prioritization, and order tracking.

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

**Why It Is Needed:** Speed is a key competitive advantage in restaurants. If food takes >30 minutes to arrive, customers leave bad reviews. This report measures exactly how fast the kitchen operates and identifies which station is the bottleneck. Answers: How fast are we getting food out? Is one station holding everything up? Are peak hours causing unacceptable delays?

**Business Area Reviewed:** Kitchen speed and efficiency. Reviews prep times, cook times, and total lead times by station and time period. Used by head chef and manager to identify bottlenecks, improve kitchen processes, and set speed targets.

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

**Why It Is Needed:** In a multi-station kitchen, some stations may be overwhelmed while others are idle. This report shows load distribution so the chef can move staff between stations as needed. Answers: Which station is overloaded? Can we shift some prep work to a less busy station?

**Business Area Reviewed:** Kitchen workload balance and staffing allocation. Reviews order volume distribution across preparation stations. Used by head chef for real-time staff reallocation between stations and kitchen layout planning.

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

**Why It Is Needed:** Tells the chef what to prep and in what quantities. If butter chicken is ordered 50 times every Saturday, the chef knows to prep 50 portions of gravy in advance. Answers: What items are most frequently ordered? When should we start prepping each item to meet demand?

**Business Area Reviewed:** Prep planning and mise en place. Reviews how often each menu item is ordered and at what times. Used by chef for advance preparation scheduling, ingredient staging, and reducing wait times during peak hours.

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

**Why It Is Needed:** KOT cancellations mean wasted ingredients and effort. High cancellation rates at a particular station may indicate training gaps or communication issues between servers and kitchen. Also helps track order errors — are waiters entering wrong items that then get cancelled? Answers: Why are orders being cancelled after reaching the kitchen? How much food is being wasted on cancelled KOTs?

**Business Area Reviewed:** Kitchen order accuracy and waste from cancellations. Reviews KOT cancellations by station, time, and volume. Used by head chef and manager to reduce kitchen waste, improve order accuracy, and address training gaps in order taking.

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

**Why It Is Needed:** Understanding kitchen capacity is essential for growth planning. If the kitchen maxes out at 100 orders/hour on Saturday nights and can't serve more, the restaurant has hit a capacity ceiling. This report helps decide if kitchen expansion or equipment upgrades are needed. Answers: What is our kitchen's maximum output? Are we hitting capacity limits during peak times?

**Business Area Reviewed:** Kitchen capacity and scalability. Reviews the maximum number of orders the kitchen can handle per hour/day. Used by owner and head chef for capacity planning, equipment investment decisions, and understanding growth constraints.

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

**Why It Is Needed:** Helps the kitchen plan ingredient procurement and prep ratios. If the trend shows growing demand for vegetarian items, the kitchen needs to allocate more prep space and ingredients accordingly. Also helps in menu planning — should we add more veg options? Answers: What is the veg/non-veg order split? Is the ratio changing over time?

**Business Area Reviewed:** Dietary demand trends and kitchen prep allocation. Reviews the proportion of vegetarian vs. non-vegetarian orders by station and over time. Used by chef for ingredient ordering ratios, prep space allocation, and menu development.

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
