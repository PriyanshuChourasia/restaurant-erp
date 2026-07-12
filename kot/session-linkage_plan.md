# Module 6: Wire KOT creation to Order Sessions (not one-shot checkout)

See [`README.md`](./README.md) for full background/goal. Depends on:
[`station-routing_plan.md`](./station-routing_plan.md) (module 2) and
[`kitchen-routing_plan.md`](./kitchen-routing_plan.md) (module 3) — a
session round needs somewhere real to route to before this module wires
creation up to it. **Must not start before**
[`../order-sessions/settlement_plan.md`](../order-sessions/settlement_plan.md)
has landed — this module adapts KOT creation to that folder's finished
model, it doesn't design the model itself.

## What

Confirmed in `apps/restaurant-ui/src/modules/pos/pages/POSDashboard.tsx:107-142`:
`billMutation` calls `createInvoice()` then `createKot()` back-to-back in
one click — "send to the kitchen" and "close the bill" are the same
action today. That means there is no way to send a starters round, let
the table keep eating, then send a mains round and finally bill once at
the end — every checkout is a brand-new, immediately-finalized invoice.

`../order-sessions/` introduces `OrderSession` (an open running order per
table) and `OrderSessionItem` (accumulated lines across rounds), with a
"send to kitchen" action that adds a round without billing
(`../order-sessions/add-round_plan.md`) and a separate settlement action
that turns the accumulated session into the real `Invoice`
(`../order-sessions/settlement_plan.md`). This module makes KOT creation
follow *that* round boundary instead of firing alongside every checkout.

## Files

- `apps/api/src/kot/entities/kot.entity.ts` — add nullable
  `orderSessionId: string | null` (replacing/supplementing the existing
  loosely-typed `orderId: string | null`, which today is just
  whatever id the frontend happens to pass — check at implementation
  time whether `orderId` already means "invoice id" anywhere else before
  repurposing it, and add a distinct column if so rather than overload
  one field with two meanings).
- `apps/api/src/kot/services/kot.service.ts` — `create()` (or the
  station-split bulk method from module 2) becomes the thing
  `OrderSessionService`'s "add round" method calls internally, rather
  than something the POS frontend calls directly. The frontend no longer
  calls `POST /kots` itself.
- `apps/restaurant-ui/src/modules/pos/api/pos.api.ts` — remove the direct
  `createKot()` export (or keep it only for a standalone/admin re-send
  case) since round-adding now goes through
  `../order-sessions/`'s API surface.
- `apps/restaurant-ui/src/modules/pos/pages/POSDashboard.tsx` — remove
  the `createKot()` call from `billMutation` entirely; KOT creation now
  happens as a side effect of the order-session "send round" action
  (built in `../order-sessions/pos-ui-rework_plan.md`), not as part of
  billing.
- `apps/restaurant-ui/src/modules/kot/pages/KotDisplayPage.tsx` — no
  structural change needed here; it keeps reading `/kots/active` exactly
  as before, it just now reflects rounds sent from an open session
  instead of one-shot checkouts.

## Verification

- `apps/api`: `tsc --noEmit`.
- Manual, using the flow built in `../order-sessions/`: open a table
  session, send a starters round — confirm a KOT appears on `/kot`
  *without* an invoice being created yet (`/sales` list unaffected).
  Send a second round for the same session — confirm a second KOT
  appears, both referencing the same session. Settle the session —
  confirm exactly one invoice is created covering all rounds, and the
  table frees up per `../order-sessions/settlement_plan.md`'s
  verification steps.
