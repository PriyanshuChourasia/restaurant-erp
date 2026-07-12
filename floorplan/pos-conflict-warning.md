# Module 8: POS conflict warning

See [`README.md`](./README.md) for full background/goal. Depends on:
[`reservation-entity.md`](./reservation-entity.md) (module 3),
[`sales-kot-rename.md`](./sales-kot-rename.md) (module 4),
[`zone-floorplan-ui.md`](./zone-floorplan-ui.md) (module 6).

## What

This is the module that actually solves the "online seat not booked yet
vs. sold to walk-in" conflict described in the original request. Today
`SeatingPanel.tsx` lets staff select a `status: 'booked'` table with just
a tooltip ("Booked - click to confirm") and no real info about *when* it's
booked or for whom. Surface the real reservation and make staff explicitly
confirm before double-booking, instead of silently colliding or being
hard-blocked.

## Files

- `apps/restaurant-ui/src/modules/pos/components/SeatingPanel.tsx`:
  - Switch from `getZones`/`getZoneSeats` to the module 6 table endpoints
    (`getZones`, `getZoneTables`).
  - When rendering each table button, check for an upcoming reservation
    within 2 hours — either via a per-zone bulk endpoint
    (`GET /zones/:id/tables?includeReservations=true`, if you extend
    module 2/3 to support it) or a per-table call to
    `GET /reservations/table/:tableId/conflict` (module 3). Show a small
    badge when one exists — reuse the existing amber `AlertCircle`
    treatment already used for `status === 'booked'` at
    `SeatingPanel.tsx:134-136`, with a tooltip like "7:00 PM · Johnson
    Family · 4 guests".
  - On click, if a near-term reservation exists, use the same
    `confirm()`-dialog pattern already used elsewhere in this codebase
    (e.g. `ZoneSeatsPage.tsx`'s delete confirm) — "Table T4 has a 7:00 PM
    reservation for Johnson Family (4 guests) — seat walk-in anyway?" —
    before toggling selection into `selectedSeatIds`/the cart. If
    confirmed, proceed as normal (the reservation itself is left alone —
    staff can separately mark it cancelled/no-show from
    `/reservations`, module 7).
- `apps/restaurant-ui/src/modules/pos/api/pos.api.ts` /
  `pages/POSDashboard.tsx`: rename `seatIds` → `tableIds` in
  `CreateInvoiceRequest`/`CreateKotRequest` and all local state
  (`selectedSeatIds` → `selectedTableIds` is optional/cosmetic, but the
  wire-format field must match module 4's backend rename).

## Verification

- `tsc --noEmit`.
- Manually: create a reservation (module 7) for a table 30 minutes from
  now. Open `/pos`, try to select that table for a walk-in order —
  confirm the warning dialog appears with the correct customer/time info,
  and that dismissing it does NOT select the table while confirming it
  does.
- Select a table with no reservation — confirm no dialog appears (no
  regression for the normal path).
