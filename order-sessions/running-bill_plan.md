# Module 3: Live running bill + table merge/split

See [`README.md`](./README.md) for full background/goal. Depends on:
[`order-session-entity_plan.md`](./order-session-entity_plan.md) (module 1),
[`add-round_plan.md`](./add-round_plan.md) (module 2).

## What

Two related capabilities that don't exist today (confirmed: the POS cart
is ephemeral client state reset on checkout, and there's no way to
combine two tables' orders into one bill — e.g. two tables pushed
together for a large party):

1. **Running bill preview** — at any point during an open session, staff
   should be able to see what's been ordered so far and the running
   total, without that action finalizing anything.
2. **Merge/split** — combine multiple tables into one session (large
   party across pushed-together tables), or split one table's session
   into two (party splits the bill) before final settlement.

## Files

- `apps/api/src/order-sessions/services/order-sessions.service.ts`:
  - `getRunningBill(sessionId)` — loads all `OrderSessionItem` rows for
    the session (all rounds), resolves pricing the same way
    `SalesService.create()` does today (reuse `PriceLevelsService`, GST
    split logic) **without** persisting an `Invoice` — this is a
    read-only projection. If `order-session-entity_plan.md`'s open
    question about price-snapshot-at-add-time is resolved as "yes,
    snapshot it", this method reads the snapshotted price instead of
    re-resolving live (keeps the preview and the eventual settled invoice
    consistent by construction).
  - `mergeSessions(primarySessionId, otherSessionIds[])` — reassigns all
    `OrderSessionItem` rows from the other sessions to the primary,
    unions `tableIds`, closes the other sessions as `VOIDED` with a note
    pointing at the merge target (don't hard-delete — keep the audit
    trail).
  - `splitSession(sessionId, itemAssignments: { newSessionTableIds, itemIds[] }[])` —
    creates new session(s) for the split-off items, removes them from the
    original. Flag to the user: splitting *after* any round already has
    KOTs in flight only affects billing, not the kitchen tickets already
    sent — the KOT board doesn't need to know about a bill split, only
    the eventual invoice does.
- `apps/api/src/order-sessions/controllers/order-sessions.controller.ts` —
  `GET /order-sessions/:id/running-bill`, `POST /order-sessions/:id/merge`,
  `POST /order-sessions/:id/split`.

## Verification

- `tsc --noEmit` in `apps/api`.
- `getRunningBill()` matches what settlement (module 4) would eventually
  produce for the same session state — write a test asserting both paths
  compute the same total for the same `OrderSessionItem` set, since a
  mismatch here would mean the preview lies to staff about what the
  customer will actually be charged.
- Merge two sessions, confirm the primary's running bill includes both
  tables' items and the secondary session is `VOIDED` not deleted.
- Split a session, confirm both resulting sessions' running bills sum to
  the original's pre-split total.
