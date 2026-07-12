# 2026-07-12 — Module 7: Reservations UI wired to backend

## Prompt

Continue with Module 7 of the floorplan restructure (reservations-ui.md).

## What was done

Created a complete reservations frontend module and rewrote the mock-data-based
`ReservationsPage` to use the real backend API from Module 3.

### Files created

- **`types/reservation.types.ts`** — `Reservation`, `CreateReservationRequest`,
  `UpdateReservationRequest`, `ReservationStatus`, `ReservationSource` types

- **`api/reservations.api.ts`** — API client for all 8 endpoints:
  `getReservations()` (with date/status filters), `getReservation()`,
  `getTableConflict()`, `createReservation()`, `updateReservation()`,
  `updateReservationStatus()`, `seatReservation()`, `deleteReservation()`

- **`hooks/useReservationsQueries.ts`** — React Query hooks:
  `useReservations`, `useReservation`, `useCreateReservation`,
  `useUpdateReservation`, `useUpdateReservationStatus`,
  `useSeatReservation`, `useDeleteReservation`

### Files rewritten

- **`pages/ReservationsPage.tsx`** — Replaced 100% hardcoded mock data with:
  - **4 live stat cards**: Today's Reservations, Guests Expected (from confirmed
    reservations), Tables Available (from `getTables()`), Pending Requests
  - **Inline add/edit form**: name, phone, party size, date, time, source (phone/
    online/walk_in), table selector (shows available-only tables)
  - **Real-time search** and **status filter pills** (All/Pending/Confirmed/Seated/Cancelled)
  - **Action buttons per row**: Confirm (pending→confirmed), Seat selector with
    available table dropdown (confirmed→seated via `seatReservation`), Edit, Cancel,
    Delete
  - **Weekly calendar** showing real booking counts per day from API data
  - Proper empty states for filtered vs unfiltered views

### Verification

- `tsc --noEmit` passes clean — 0 TypeScript errors.
- Route at `/reservations` already registered; sidebar link already exists (Module 9).
