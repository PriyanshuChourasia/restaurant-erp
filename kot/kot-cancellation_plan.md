# Module 11: KOT Cancellation

See [`README.md`](./README.md) for full background/goal. Depends on:
[`field-consistency-fix_plan.md`](./field-consistency-fix_plan.md) (module 1)
only, for the *basic* mechanism — it can ship right after module 1,
before any of modules 2–10. The **deeper integrations** described below
(stock reversal, KDS alerting, claim-aware notification, session/billing
exclusion) depend on
[`inventory-timing_plan.md`](./inventory-timing_plan.md) (module 7),
[`kds_plan.md`](./kds_plan.md) (module 9),
[`chef-workflow_plan.md`](./chef-workflow_plan.md) (module 10), and
[`../order-sessions/settlement_plan.md`](../order-sessions/settlement_plan.md)
respectively — land the basic mechanism early, wire each integration in
as its dependency becomes available, rather than blocking cancellation
entirely on the whole rest of the folder.

## What

This used to be a bullet inside `kot-lifecycle_plan.md` (module 5,
"reprint + SLA"). It's split out because cancellation in a real kitchen
is a lot more than "flip status to CANCELLED" — it touches money, stock,
and other people's in-progress work, none of which the original
one-paragraph treatment covered:

1. **No cancellation exists at all today.** `KotStatus.CANCELLED` is
   defined on the entity (`apps/api/src/kot/entities/kot.entity.ts:7-13`)
   but confirmed unused — no service method, no route sets it.
2. **No reason taxonomy.** A free-text reason tells nobody anything in
   aggregate — a manager asking "why are we cancelling so much" needs
   structured categories, the same lesson already applied to inventory
   wastage (`../inventory/wastage-tracking_plan.md`'s `WastageReason`
   enum) — cancellation should follow the same pattern for consistency
   across the codebase, not invent a second, differently-shaped taxonomy.
3. **No approval gating.** Cancelling a `pending` item that hasn't been
   touched is harmless. Cancelling something already `preparing` or
   `ready` represents real wasted food/labor and is a common vector for
   staff covering up mistakes or theft (ring up an item, cancel it after
   pocketing payment) if nobody has to approve it. Today there's no
   distinction — flag this to the user as a control decision, not
   something to silently skip.
4. **No stock reversal.** If module 7 (`inventory-timing_plan.md`)
   concludes stock deducts at KOT creation, a cancellation must reverse
   that deduction, or cancelled food's raw materials just silently stay
   marked "sold."
5. **No notification to whoever's already working the ticket.** Once
   module 10's claiming (`chef-workflow_plan.md`) exists, cancelling an
   item a chef has already claimed and started needs to actually reach
   them — not just quietly change a database row while they keep
   cooking it.
6. **No exclusion from billing.** Once `../order-sessions/` exists, a
   cancelled `OrderSessionItem`/KOT item must not appear on the eventual
   settled invoice — today there's no session layer yet, so this is
   forward-looking, not an existing bug.

## Files

**Basic mechanism (ships after module 1, no other dependency):**

- `apps/api/src/inventory/entities/inventory.entity.ts` (or a new shared
  location — check whether a cross-cutting "reason enum" home already
  exists before picking) — add
  `export enum KotCancelReason { CUSTOMER_CHANGED_MIND = 'customer_changed_mind', KITCHEN_ERROR = 'kitchen_error', OUT_OF_STOCK = 'out_of_stock', DUPLICATE_ORDER = 'duplicate_order', OTHER = 'other' }`,
  deliberately mirroring the shape of `WastageReason`
  (`../inventory/wastage-tracking_plan.md`) so cancellation and wastage
  reporting can eventually sit side by side in one "why did food not get
  served" report.
- `apps/api/src/kot/entities/kot.entity.ts` — add nullable
  `cancelReason: KotCancelReason | null` and `cancelledBy: string | null`
  (user id) to both `Kot` and `KotItem`.
- `apps/api/src/kot/services/kot.service.ts`:
  - New `cancelKot(id, reason, userId)` — sets `status: CANCELLED`,
    `cancelReason`, `cancelledBy`, and cancels all non-served items in
    it. Reject if the KOT is already fully `served` (can't cancel a
    finished ticket — that's a wastage/return concern, handled by
    `../inventory/`, not a KOT concern).
  - New `cancelKotItem(kotId, itemId, reason, userId)` — sets that item's
    status to `CANCELLED` + reason + canceller, then re-runs the existing
    auto-rollup logic from `updateItemStatus` (extract the rollup into a
    shared private method so both call sites use the same rule instead of
    duplicating it — this was already true before the split and stays
    true now).
- `apps/api/src/kot/controllers/kot.controller.ts` — `PATCH :id/cancel`
  and `PATCH :kotId/items/:itemId/cancel`, each accepting `{ reason,
  userId }`.
- `apps/restaurant-ui/src/modules/kot/api/kot.api.ts` — `cancelKot(id,
  reason)`, `cancelKotItem(kotId, itemId, reason)`.
- `apps/restaurant-ui/src/modules/kot/pages/KotDisplayPage.tsx` — a
  "Cancel" button per item/ticket with a reason **select** (not a free
  `prompt()` — use the structured enum from the start so there's no
  later migration from free text to structured reasons).

**Approval gating (flag to the user before building — a real policy
decision, not inferred):**

- If the item's current status is `preparing` or `ready`, require a
  second field on the cancel request — e.g. a manager PIN/approval id —
  before `cancelKot`/`cancelKotItem` will execute. `pending` items cancel
  freely (no work has started yet). Exactly what "approval" means
  (a manager PIN lookup? a separate approval-role check against the
  existing `apps/api/src/roles`/`permissions` modules?) should reuse
  whatever role/permission system already exists in this codebase rather
  than inventing a parallel one — check
  `apps/api/src/permissions/` and `apps/api/src/roles/` before designing
  this gate.

**Stock reversal (depends on module 7's decision):**

- `apps/api/src/kot/services/kot.service.ts` — `cancelKot`/`cancelKotItem`
  call whatever reversal method module 7 lands (an `adjustment_in`
  posted through `InventoryService`, per
  `../inventory/ledger-integration_plan.md`'s existing movement→ledger
  posting) for the cancelled quantity, so the movement ledger reads
  "deducted, then reversed because cancelled" rather than either double-
  counting or silently understating stock.

**KDS/chef notification (depends on modules 9 and 10):**

- `apps/api/src/kot/gateways/kds.gateway.ts` (module 9) — emit a
  `kot.item.cancelled` event scoped to the affected station's room so an
  already-open KDS terminal reflects the cancellation immediately, not on
  its next poll.
- If the cancelled item has a `claimedBy` chef (module 10), surface a
  distinct, more prominent alert on their terminal specifically (not just
  a generic ticket update) — the person mid-prep on that item is the one
  who most needs to see it *now*.

**Billing exclusion (depends on `../order-sessions/`):**

- `apps/api/src/order-sessions/services/order-sessions.service.ts` —
  `getRunningBill()`/`settle()` must exclude any `OrderSessionItem` whose
  corresponding KOT item was cancelled — confirm this exclusion exists
  before `../order-sessions/settlement_plan.md` is considered complete;
  cross-reference this requirement back into that module's verification
  if it lands first.

## Verification

- `apps/api`: `tsc --noEmit`; extend `kot.service.spec.ts` with cases for
  `cancelKot` (rejects if already served) and `cancelKotItem` (rollup
  still correct after a cancel — e.g. cancelling one item in a 2-item KOT
  where the other is `ready` should still roll the parent up correctly;
  reason is always one of `KotCancelReason`, never free text).
- Manual (basic mechanism): cancel a single `pending` item on a
  multi-item KOT — confirm the KOT stays active with correct rolled-up
  status; cancel an entire KOT — confirm it disappears from
  `/kots/active`.
- Manual (approval gating, once built): attempt to cancel a `preparing`
  item without approval — confirm it's rejected; with approval — confirm
  it succeeds and the approver is recorded.
- Manual (stock reversal, once module 7 lands): cancel an item whose
  stock was already deducted — confirm `GET /inventory/:itemId/movements`
  shows a reversing entry and `currentStock` returns to its
  pre-deduction value.
- Manual (KDS alert, once module 9 lands): with a KDS terminal open on
  the affected station, cancel an item from the admin board — confirm
  the terminal reflects it within about a second, not on its next poll.
