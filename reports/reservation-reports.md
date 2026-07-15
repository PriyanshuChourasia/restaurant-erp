# Reservations & Seating Reports

## Data Sources
- `zones` — name, description, isActive
- `tables` — zoneId, label, capacity, category (online/walk_in/flexible), status (available/booked/occupied), posX, posY, isActive
- `reservations` — customerName, customerPhone, partySize, zoneId, tableId, scheduledFor, durationMinutes, status (pending/confirmed/seated/completed/cancelled/no_show), source (online/phone/walk_in), notes
- `invoices` — tableIds (JSON array), invoiceDate, grandTotal
- `kots` — tableIds (JSON array), createdAt, servedAt

---

## RPT-R01: Reservation Overview
**Status:** Not Built

| Field | Source |
|-------|--------|
| Total Reservations | COUNT(reservations) |
| Confirmed | COUNT WHERE status='confirmed' |
| Seated | COUNT WHERE status='seated' |
| Completed | COUNT WHERE status='completed' |
| Cancelled | COUNT WHERE status='cancelled' |
| No-Show | COUNT WHERE status='no_show' |
| Today's Reservations | COUNT WHERE scheduledFor = TODAY |
| Upcoming (Next 7 Days) | COUNT WHERE scheduledFor BETWEEN NOW AND NOW+7 |

**Visualization:** KPI cards + daily reservation timeline
**Filters:** Date range, status, source
**Real-time:** Today's view updates continuously

**Why It Is Needed:** The host stand's primary tool — shows all reservations at a glance. Know how many guests are expected today and in the coming week to plan staffing and table allocation. Also tracks conversion funnel (confirmed → seated → completed). Answers: How many reservations do we have today/this week? What's our reservation pipeline looking like?

**Business Area Reviewed:** Reservation pipeline and booking volume. Reviews total reservations by status and time horizon. Used by host, manager, and owner for staffing planning, table allocation, and understanding reservation demand trends.

---

## RPT-R02: Table Utilization Report
**Status:** Not Built

| Field | Source |
|-------|--------|
| Table | `tables.label` |
| Zone | `zones.name` |
| Capacity | `tables.capacity` |
| Category | `tables.category` (online/walk_in/flexible) |
| Hours Occupied | SUM(duration) from reservations WHERE status='completed' |
| Utilization Rate | hours_occupied / total_hours_available * 100 |
| Avg Duration | AVG(durationMinutes) |
| Revenue Generated | SUM(invoices.grandTotal) WHERE tableIds CONTAINS table |
| Revenue per Seat | revenue / capacity |
| Peak Occupancy Time | Hour with highest occupancy |

**Visualization:** Floor plan heatmap + utilization bar chart
**Filters:** Date range, zone, table category
**Insight:** Table profitability, layout optimization

**Why It Is Needed:** Tables are the restaurant's most valuable real estate. Low utilization means lost revenue opportunity. This report reveals which tables are underperforming (e.g., a corner table nobody likes) and what time slots are empty. Answers: Are all tables being used efficiently? Which tables generate the most revenue? Should we change the layout?

**Business Area Reviewed:** Table asset utilization and revenue per seat. Reviews occupancy rates, revenue generation, and duration per table. Used by manager and owner for floor plan optimization, table reconfiguration, and understanding which areas of the restaurant are most/least profitable.

---

## RPT-R03: Reservation Source Analysis
**Status:** Not Built

| Field | Source |
|-------|--------|
| Source | `reservations.source` (online/phone/walk_in) |
| Count | COUNT per source |
| % of Total | source_count / total_count * 100 |
| Avg Party Size | AVG(partySize) per source |
| No-Show Rate | no_show_count / source_count * 100 per source |
| Avg Duration | AVG(durationMinutes) per source |
| Conversion to Revenue | Reservations that resulted in invoices |

**Visualization:** Pie chart + comparison table
**Filters:** Date range
**Insight:** Channel effectiveness, online booking ROI

**Why It Is Needed:** Shows which booking channels are driving the most business. If online reservations are growing but have high no-show rates, a deposit policy may be needed. If phone reservations are declining, maybe the website booking flow needs improvement. Answers: Where are our reservations coming from? Which channel has the best conversion? Should we invest more in online booking?

**Business Area Reviewed:** Booking channel effectiveness and ROI. Reviews reservation volume, quality, and no-show rates by source (online, phone, walk-in). Used by owner and marketing manager for channel investment decisions — should you pay for an online booking platform? Is phone staffing adequate?

---

## RPT-R04: No-Show & Cancellation Report
**Status:** Not Built

| Field | Source |
|-------|--------|
| Total No-Shows | COUNT WHERE status='no_show' |
| Total Cancellations | COUNT WHERE status='cancelled' |
| No-Show Rate | no_shows / total_reservations * 100 |
| Cancel Rate | cancellations / total_reservations * 100 |
| Lost Revenue | Est. party_size * avg_spend_per_person |
| No-Show by Source | Which source has highest no-show |
| No-Show by Time | Which hours have most no-shows |
| Repeat No-Shows | Customers with multiple no-shows |

**Visualization:** Trend line + source breakdown + repeat offender table
**Filters:** Date range, source
**Insight:** Overbooking policy, deposit requirements

**Why It Is Needed:** No-shows are pure revenue loss — the table sat empty when it could have been given to another customer. A high no-show rate (industry average: 5-15%) signals the need for deposit requirements, confirmation calls, or overbooking policies. Answers: How much revenue are we losing to no-shows? Should we require deposits for large parties or weekend reservations?

**Business Area Reviewed:** Revenue loss from no-shows and cancellation policy. Reviews no-show rates and cancellation patterns across sources, times, and customers. Used by manager and owner for implementing no-show policies, deposit requirements, overbooking strategy, and confirmation call protocols.

---

## RPT-R05: Peak Hours & Demand Forecasting
**Status:** Not Built

| Field | Source |
|-------|--------|
| Hour | Extracted from `reservations.scheduledFor` |
| Day of Week | Extracted from `reservations.scheduledFor` |
| Reservation Count | COUNT per hour per day |
| Avg Party Size | AVG(partySize) per slot |
| Demand Score | reservation_count * avg_party_size |
| Availability Gap | tables_available - demand |
| Historical Pattern | Same day/hour from previous weeks |

**Visualization:** Weekly heatmap (hour × day) + demand curve
**Filters:** Date range, zone
**Insight:** Staffing levels, table allocation, overbooking thresholds

**Why It Is Needed:** Predict demand patterns so you can staff and allocate tables accordingly. If Friday 8 PM is always fully booked, you know to have full staff and protect tables for reservations. If Monday lunch is always empty, you might run a promotion. Answers: When is demand highest/lowest? How many tables should we hold for walk-ins vs. reservations at each time slot?

**Business Area Reviewed:** Demand prediction and capacity planning. Reviews historical reservation patterns to forecast future demand by hour and day. Used by manager for staff scheduling, walk-in vs. reservation table allocation, promotion timing, and overbooking thresholds.

---

## RPT-R06: Zone Performance Report
**Status:** Not Built

| Field | Source |
|-------|--------|
| Zone | `zones.name` |
| Table Count | COUNT(tables) |
| Total Capacity | SUM(tables.capacity) |
| Avg Utilization | AVG(utilization_rate) across tables |
| Reservation Count | COUNT(reservations WHERE zoneId) |
| Avg Party Size | AVG(partySize) |
| Revenue | SUM(invoices.grandTotal) linked to zone tables |
| Revenue per Seat | revenue / total_capacity |
| Wait Time Avg | Avg time from reservation to seating |

**Visualization:** Zone comparison cards + layout map
**Filters:** Date range
**Insight:** Zone profitability, layout expansion decisions

**Why It Is Needed:** Some zones in a restaurant may outperform others (e.g., window seating vs. interior). This report compares zones by revenue, utilization, and popularity. Helps decide whether to expand a popular zone or rework an underperforming one. Answers: Which area of the restaurant is most profitable? Should we add more tables in the outdoor/balcony area?

**Business Area Reviewed:** Seating zone profitability and layout optimization. Reviews performance metrics per zone (outdoor, indoor, balcony, private dining, etc.). Used by owner and manager for restaurant layout planning, zone-level pricing, and expansion decisions.

---

## Backend Implementation Notes

### Reservation Status Lifecycle
```
pending → confirmed → seated → completed
                 ↓          ↓
            cancelled    no_show (auto-set after scheduled time + duration)
```

### Table Status Values
```
available  — Free for seating
booked     — Has upcoming reservation
occupied   — Currently in use
```

### New Endpoints Needed
```typescript
@Get('reservations/overview')          // RPT-R01
@Get('reservations/table-utilization') // RPT-R02
@Get('reservations/source-analysis')   // RPT-R03
@Get('reservations/no-shows')         // RPT-R04
@Get('reservations/demand-forecast')  // RPT-R05
@Get('reservations/zone-performance') // RPT-R06
```

### Key Relationship
- `reservations.tableId` → `tables.id` → `tables.zoneId` → `zones.id`
- `invoices.tableIds` is a JSON array of UUIDs (not FK) — requires JSON query
- `kots.tableIds` is also a JSON array — same pattern
