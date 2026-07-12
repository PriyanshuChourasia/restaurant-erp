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
