# Module 2: "Send to Kitchen" — add a round without billing

See [`README.md`](./README.md) for full background/goal. Depends on:
[`order-session-entity_plan.md`](./order-session-entity_plan.md) (module 1).

## What

This is the core un-fusing this whole folder exists for: today
`POSDashboard.tsx`'s `billMutation` creates the invoice **and** the KOT
together (`apps/restaurant-ui/src/modules/pos/pages/POSDashboard.tsx:107-142`).
Replace "send to kitchen" with an action that appends items to the
session as a new round and creates KOT(s) for just those new items,
touching `Invoice` not at all.

## Files

- `apps/api/src/order-sessions/services/order-sessions.service.ts` — new
  `addRound(sessionId, items: { itemId, itemName, quantity, instructions? }[])`:
  - Load the session, reject if not `OPEN`.
  - Compute `round = (max existing round for this session) + 1`.
  - Save one `OrderSessionItem` row per item, `status: 'ordered'`.
  - Call into the KOT module to create the actual kitchen ticket(s) for
    just this round's items, station-split per
    `../kot/station-routing_plan.md` — inject `KotService` (or whatever
    bulk-create method that module lands) rather than duplicating station
    logic here.
  - Return the created `OrderSessionItem` rows + resulting KOT(s) so the
    frontend can show both immediately.
- `apps/api/src/order-sessions/order-sessions.module.ts` — import the KOT
  module (mirrors the existing `SalesModule` → `RecipesModule` import
  pattern already used elsewhere in this codebase) to get `KotService`.
- `apps/api/src/order-sessions/controllers/order-sessions.controller.ts` —
  new `POST /order-sessions/:id/rounds` accepting the item list.
- `apps/api/src/kot/entities/kot.entity.ts` — needs the `orderSessionId`
  column from `../kot/session-linkage_plan.md` to exist before this
  method can stamp it on the created KOT(s); if that module hasn't landed
  yet, do this module first and leave `orderSessionId` unset temporarily,
  or land them together — don't block on ordering unnecessarily, just be
  aware of the dependency direction (this module produces the KOTs,
  `../kot/session-linkage_plan.md` is what makes the KOT *entity* aware of
  which session it came from).

## Verification

- `tsc --noEmit` in `apps/api`.
- `addRound()` on a non-open session is rejected.
- Two calls to `addRound()` on the same session produce `round: 1` and
  `round: 2` respectively, and two separate KOT-creation calls (verify via
  a mocked `KotService` in the new service spec) — not one merged call.
- Manual: open a session, send a round, confirm a KOT appears on `/kot`
  and `GET /sales` shows no new invoice.
