**Date:** 2026-07-11
**Prompt:** Pick one pending task and implement it — Zone/Seat Backend API

## What was done

### Zone/Seat Backend Module (9 new files, 1 modified)

**Files created:**

| # | File | Purpose |
|---|------|---------|
| 1 | `apps/api/src/seating/entities/zone.entity.ts` | `Zone` entity — name, description, sortOrder, isActive, soft-delete |
| 2 | `apps/api/src/seating/entities/seat.entity.ts` | `Seat` entity — zoneId (FK CASCADE), label, capacity, category (online/walk_in/flexible string column), status (available/booked/occupied string column), isActive, soft-delete |
| 3 | `apps/api/src/seating/dto/create-zone.dto.ts` | Zone create DTO |
| 4 | `apps/api/src/seating/dto/update-zone.dto.ts` | Zone update DTO (PartialType) |
| 5 | `apps/api/src/seating/dto/create-seat.dto.ts` | Seat create DTO — zoneId, label, capacity, category (IsIn), status |
| 6 | `apps/api/src/seating/dto/update-seat.dto.ts` | Seat update DTO (PartialType) |
| 7 | `apps/api/src/seating/dto/update-seat-status.dto.ts` | Seat status update DTO — status (IsIn available/booked/occupied) |
| 8 | `apps/api/src/seating/repositories/zone.repository.ts` | Zone repo — findAll (with includeInactive), CRUD, soft-delete |
| 9 | `apps/api/src/seating/repositories/seat.repository.ts` | Seat repo — findByZone, findByIds, updateStatus, CRUD, soft-delete |
| 10 | `apps/api/src/seating/services/zones.service.ts` | Zone service — CRUD with NotFound checks |
| 11 | `apps/api/src/seating/services/seats.service.ts` | Seat service — CRUD + updateStatus + bulkUpdateStatus |
| 12 | `apps/api/src/seating/controllers/zones.controller.ts` | Zone routes — GET /, GET /:id, GET /:id/seats, POST, PATCH :id, DELETE :id |
| 13 | `apps/api/src/seating/controllers/seats.controller.ts` | Seat routes — GET /, GET /:id, POST, PATCH :id, PATCH :id/status, DELETE :id |
| 14 | `apps/api/src/seating/seating.module.ts` | NestJS module — registers Zone + Seat entities, both controllers/services/repos, exports SeatsService |

**Files modified:**
| 15 | `apps/api/src/app.module.ts` | Added `SeatingModule` to imports |

### How to test

1. **Create a zone:**
   ```bash
   POST /api/zones  {"name": "AC Lounge", "sortOrder": 1}
   POST /api/zones  {"name": "Family Dining", "sortOrder": 2}
   ```

2. **List zones:**
   ```bash
   GET /api/zones
   ```

3. **Create seats in a zone:**
   ```bash
   POST /api/seats  {"zoneId": "<zone-uuid>", "label": "T1", "capacity": 4}
   POST /api/seats  {"zoneId": "<zone-uuid>", "label": "T2", "capacity": 6, "category": "flexible"}
   ```

4. **List seats in a zone:**
   ```bash
   GET /api/zones/:id/seats
   ```

5. **Update seat status (e.g., occupy when order is placed):**
   ```bash
   PATCH /api/seats/:id/status  {"status": "occupied"}
   ```

6. **Clear seat (when bill is settled):**
   ```bash
   PATCH /api/seats/:id/status  {"status": "available"}
   ```

### What's still pending

- CustomerCombobox frontend component (POS type-ahead + inline add)
- SeatingPanel frontend component (zone tabs + seat grid replacing flat table selector)
- POSDashboard.tsx integration (customer picker + seat selector + price-level-aware cart)
- Sales CreateInvoiceDto validation + server-side price resolution
- Invoice/Kot entity updates (customerId, seatIds columns)
- Recipe Engineering (Task 3)

## Outcome

- Zone/Seat backend: fully functional (entities, DTOs, repositories, services, controllers, module, registered)
- 0 new TypeScript errors (only pre-existing test spec errors remain)
