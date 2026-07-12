# Module 4: Settlement — turn a session into the real `Invoice`

See [`README.md`](./README.md) for full background/goal. Depends on:
[`order-session-entity_plan.md`](./order-session-entity_plan.md) (module 1),
[`add-round_plan.md`](./add-round_plan.md) (module 2),
[`running-bill_plan.md`](./running-bill_plan.md) (module 3) — settlement
should produce exactly what the running bill already previewed, not a
recomputed/different number.

## What

This is where the new session model reconnects to the existing, unchanged
`Invoice`/`SalesService` machinery — settlement doesn't reinvent billing,
it just feeds `SalesService` the session's accumulated items instead of a
one-shot cart.

## Files

- `apps/api/src/sales/services/sales.service.ts` — `create()` currently
  takes a flat `items: { itemId, quantity }[]` directly from the POS cart
  (`sales.service.ts:49-61`). Add a variant entry point,
  `createFromSession(session: OrderSession, items: OrderSessionItem[])`,
  that maps session items into the same internal shape `create()` already
  builds (`itemEntities` construction at lines 86-135) and reuses
  everything downstream (pricing, GST, recipe deduction) unchanged — the
  goal is one shared code path for "build an invoice from a list of
  {itemId, quantity}", called by both the legacy direct-cart flow (if
  it's kept for quick walk-in/takeaway orders that skip sessions
  entirely — a real product question, see below) and session settlement.
  Don't duplicate the pricing/GST logic a third time.
- `apps/api/src/order-sessions/services/order-sessions.service.ts` — new
  `settle(sessionId, paymentMethod, discount?)`:
  - Reject if session isn't `OPEN` (or already `SETTLING` from a prior
    failed attempt — see idempotency note below).
  - Flip to `SETTLING`, call `SalesService.createFromSession(...)`.
  - On success: set `invoiceId`, `status: BILLED`, `closedAt`, and release
    the table(s) (`TablesService.bulkUpdateStatus(tableIds, 'available')`
    — reuse, don't reimplement, `SalesService.clearSeats`'s existing
    logic here).
  - On failure: roll back to `OPEN` (wrap in a `DataSource.transaction`
    so a failure partway through can't leave the session `SETTLING`
    forever with no invoice and no way to retry — mirror the transactional
    pattern already used in `RecipesService.createProductionEntry`).
- `apps/api/src/order-sessions/controllers/order-sessions.controller.ts` —
  `POST /order-sessions/:id/settle`.
- Decide (flag to the user, don't assume): does the **existing**
  `POST /sales` endpoint (direct cart → invoice, no session) stay
  available for quick counter/takeaway orders that don't need a running
  table session, or does all billing now have to go through a session?
  Recommend keeping both — a takeaway order doesn't need an open running
  table session — but this determines whether
  `../kot/session-linkage_plan.md` needs to handle a "no session" KOT
  case too.

## Verification

- `tsc --noEmit` in `apps/api`.
- Update `sales.service.spec.ts` for the new `createFromSession` path —
  assert it produces byte-identical `Invoice`/`InvoiceItem` shapes to the
  existing direct-cart `create()` for equivalent input.
- Settle a session with 2 rounds (5 total items across them) — confirm
  exactly one `Invoice` with 5 `InvoiceItem` rows, correct combined GST/
  totals, table(s) released, session `status: BILLED` with `invoiceId`
  set.
- Force a failure mid-settlement (e.g. a missing item) — confirm the
  session rolls back to `OPEN` rather than getting stuck in `SETTLING`
  with no invoice.
