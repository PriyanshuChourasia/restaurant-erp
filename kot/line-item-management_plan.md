# Module 8: KOT line-item management (modify quantity, add/remove items on a live ticket, per-item timing)

See [`README.md`](./README.md) for full background/goal. Depends on:
[`kot-cancellation_plan.md`](./kot-cancellation_plan.md) (module 11) —
void needs to exist before "reduce quantity" (a partial void) can reuse
it; [`session-linkage_plan.md`](./session-linkage_plan.md) (module 6) —
items get added to a *round* within a session, not to a bare KOT.

## What

Module 3 covers voiding a whole KOT item. This module covers everything
else that happens to a `KotItem` *while it's live*, none of which exists
today (confirmed by grep — `KotItem` has no update path besides
`updateItemStatus`'s status-only transition in
`apps/api/src/kot/services/kot.service.ts:67-81`):

1. **Quantity correction** — "make that 3 naan, not 2" after the ticket
   already printed, without voiding and re-firing the whole item (which
   would confuse the station into thinking it's a brand-new item to
   start from scratch).
2. **Add an item to an already-fired KOT** — a table adds one more dish
   to a round that's already in the kitchen's hands, rather than only
   being able to add items via a brand-new round
   (`../order-sessions/add-round_plan.md`). Distinguish this from "new
   round" deliberately: an added single item to an *in-progress* round
   should probably still print as its own addendum ticket so the station
   sees it as new work, not merged silently into an existing card.
3. **Edit instructions/notes** post-creation — "no onions" was missed at
   order time, corrected before the item enters `preparing`.
4. **Per-item elapsed time**, not just per-KOT (module 5 added
   ticket-level elapsed time; a 4-item KOT where one item has been
   sitting since `pending` while three others are already `ready` needs
   its own signal, since the ticket-level badge would be misleadingly
   green/served-looking once most items are done).

## Files

- `apps/api/src/kot/entities/kot.entity.ts` — `KotItem` gains
  `startedAt: Date | null` / `readyAt: Date | null` (currently only the
  parent `Kot` has these timestamps; per-item timing needs its own
  columns to support point 4).
- `apps/api/src/kot/services/kot.service.ts`:
  - `updateItemStatus()` (existing) — stamp `startedAt`/`readyAt` on the
    `KotItem` itself in addition to the existing parent-level rollup, so
    per-item elapsed time has a real timestamp to compute from.
  - New `updateItemQuantity(kotId, itemId, newQuantity)` — only allowed
    while the item's status is `pending` or `preparing` (not after
    `ready`/`served` — a station that's already plated 2 can't retroactively
    make it 3 without a real new preparation step; require a void +
    fresh item add instead once it's `ready`). Reducing quantity here is
    conceptually a partial void — consider funneling it through the same
    reversal hook module 7 (`inventory-timing_plan.md`) added for full
    voids in module 11 (`kot-cancellation_plan.md`), scaled to the
    quantity delta, if that module's stock-timing decision means quantity
    changes need a matching stock adjustment.
  - New `updateItemInstructions(kotId, itemId, instructions)` — simple
    field update, only while `pending`.
  - New `addItemToKot(kotId, item: { itemId, itemName, quantity, instructions? })` —
    appends a `KotItem` to an existing, still-active `Kot`, flags it
    `isAddendum: true` (new boolean column) so the KOT board / print
    layout can visually separate "original ticket" items from "added
    after the fact" items instead of silently blending them.
- `apps/api/src/kot/controllers/kot.controller.ts` — `PATCH
  :kotId/items/:itemId/quantity`, `PATCH :kotId/items/:itemId/instructions`,
  `POST :kotId/items`.
- `apps/restaurant-ui/src/modules/kot/pages/KotDisplayPage.tsx`:
  - Per-item elapsed-time badge (derived from the new `KotItem.startedAt`,
    same client-side computation pattern as module 5's ticket-level
    badge).
  - Visual marker (e.g. a small "+" tag) on `isAddendum` items so kitchen
    staff can tell "this was added after the ticket printed" at a glance.
    If [`kot-merge-plan.md`](./kot-merge-plan.md) (module 12) lands, an
    item can carry both this addendum tag and that module's
    `mergedFromKotNumber` provenance caption at once (an addendum item on
    a KOT that later gets merged) — render both, don't let one badge
    replace the other.
  - Inline quantity/instructions edit controls on `pending` items only
    (disabled once `preparing`+, matching the backend guard).
- `apps/restaurant-ui/src/modules/kot/api/kot.api.ts` — corresponding
  client functions for the three new endpoints.

## Verification

- `apps/api`: `tsc --noEmit`; extend `kot.service.spec.ts` — quantity/
  instruction edits rejected once an item is `ready`/`served`; addendum
  items correctly flagged and included in the parent KOT's auto-rollup
  status computation (an addendum item still `pending` should keep the
  whole KOT from rolling up to `ready`, same as any other item).
- Manual: fire a KOT, add a new item to it mid-prep — confirm it shows as
  a visually distinct addendum on the board; correct a quantity on a
  still-`pending` item — confirm it's rejected once that item moves to
  `preparing`.
