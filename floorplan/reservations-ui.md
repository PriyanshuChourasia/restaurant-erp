# Module 7: Reservations wired to backend

See [`README.md`](./README.md) for full background/goal. Depends on:
[`reservation-entity.md`](./reservation-entity.md) (module 3).

## What

`/reservations` already has a sidebar nav entry and a page
(`apps/restaurant-ui/src/modules/reservations/pages/ReservationsPage.tsx`)
but it's 100% hardcoded mock data (a static `reservations` array, static
stat numbers). Wire it to the real `Reservation` backend from module 3.

## Files

- New `apps/restaurant-ui/src/modules/reservations/api/reservations.api.ts`:
  `getReservations()` (date range/status filter), `getReservation(id)`,
  `createReservation()`, `updateReservation()`,
  `updateReservationStatus()`, `deleteReservation()` — hitting the
  `/reservations` endpoints from module 3.
- New `apps/restaurant-ui/src/modules/reservations/types/reservation.types.ts`:
  `Reservation` (id, customerName, customerPhone, partySize, zoneId,
  tableId, scheduledFor, durationMinutes, status, source, notes,
  timestamps), request types.
- `pages/ReservationsPage.tsx`:
  - Replace the hardcoded `reservations` array (lines 4-12 today) with a
    `useQuery` call to `getReservations()`.
  - Wire the 4 stat cards to real numbers: "Tables Available" from
    `getTables()` (module 5) minus tables with `status: 'occupied'`;
    "Today's Reservations" / "Guests Expected" / "Pending Requests"
    derived from the `getReservations()` result.
  - Replace the "New Reservation" button with a real create form
    (customer name/phone, party size, zone picker, optional table picker,
    date/time) using `useMutation` + `createReservation()`.
  - Wire row actions: "Edit" → `updateReservation()`, "Manage" → a small
    menu with "Confirm" / "Seat" / "Cancel" calling
    `updateReservationStatus()` (or the dedicated `seat` action from
    module 3 for "Seat", since that also occupies the table).

## Verification

- `tsc --noEmit`.
- Manually: create a reservation for a future time, confirm it, mark it
  seated — confirm the linked table (if any) flips to `occupied` in
  `/tables`.
