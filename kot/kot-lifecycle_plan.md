# Module 5: Reprint + elapsed-time SLA on the KOT board

See [`README.md`](./README.md) for full background/goal. Depends on:
[`field-consistency-fix_plan.md`](./field-consistency-fix_plan.md) (module 1),
[`station-routing_plan.md`](./station-routing_plan.md) (module 2). Pairs
well with [`queue-management_plan.md`](./queue-management_plan.md)
(module 4) — that module's wait-time estimates are a natural input to
this module's SLA color thresholds, but neither hard-requires the other.
Void/cancel used to live in this module — it's now its own dedicated
module, [`kot-cancellation_plan.md`](./kot-cancellation_plan.md)
(module 11), since it turned out to need much deeper treatment (approval
gating, reason taxonomy, stock/ledger reversal, KDS alerting) than a
"pairs with reprint" bullet point could hold.

## What

`KotDisplayPage.tsx` has a "Print" button (`window.print()` — just
triggers the browser print dialog on the whole page, not a real per-KOT
reprint) and shows a flat list with no aging signal — a ticket that's
been `pending` for 25 minutes looks identical to one that's 30 seconds
old, so there's no way for kitchen staff to spot a forgotten ticket at a
glance.

Add:
1. A real reprint action per KOT card.
2. Elapsed-time display + color escalation (e.g. green under 10 min,
   amber 10–20 min, red past 20 min — configurable, not hardcoded
   thresholds if avoidable).

## Files

- `apps/restaurant-ui/src/modules/kot/pages/KotDisplayPage.tsx`:
  - Replace the page-level `window.print()` with a per-KOT print action
    that renders just that ticket (a small print-specific view/component,
    or a `window.open()` to a print-formatted route) — the current
    behavior prints the entire board, which isn't useful for handing a
    single ticket to a station.
  - Add an elapsed-time badge computed from `kot.createdAt` on each card,
    recomputed client-side on each of the existing 10s poll ticks
    (`refetchInterval: 10000`) — no new backend field needed, this is
    pure derived display state.

## Verification

- Manual: reprint a KOT — confirm it doesn't duplicate the ticket in the
  active list, just re-triggers the print, and only that ticket prints
  (not the whole board); leave a KOT pending past the amber/red threshold
  and confirm the color changes without a page refresh (within one 10s
  poll cycle).
