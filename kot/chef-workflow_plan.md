# Module 10: Chef Workflow (claim tickets, prep method visibility, 86/sold-out, hold-and-fire)

See [`README.md`](./README.md) for full background/goal. Depends on:
[`kitchen-routing_plan.md`](./kitchen-routing_plan.md) (module 3),
[`queue-management_plan.md`](./queue-management_plan.md) (module 4),
[`kds_plan.md`](./kds_plan.md) (module 9) — this module is about what a
chef *does* once a ticket is on their screen, so the screen and queue it
acts on need to already exist. Also touches
[`../inventory/`](../inventory/README.md) for the 86/sold-out piece.

## What

Everything built in modules 1–9 gets a ticket onto the right screen in
the right order. None of it addresses what a working chef actually needs
day-to-day, confirmed absent from the current model:

1. **No recipe/method visibility at the ticket.** `KotItem` only carries
   `itemName`, `quantity`, and a customer-facing `instructions` string
   (e.g. "no onions") — confirmed in
   `apps/api/src/kot/entities/kot.entity.ts:94-101`. The `recipes` module
   (`apps/api/src/recipes/entities/recipe.entity.ts`) tracks ingredient
   quantities for **costing**, but has no prep method/steps field at all
   — a chef seeing a ticket for an item they don't have memorized has
   nowhere in the system to check how it's made.
2. **No ticket claiming.** Confirmed no `assignedTo`/`claimedBy` field
   exists on `KotItem` or `Kot`. On a busy shared station with 2+ cooks,
   nothing stops two people from both starting the same ticket, or a
   ticket sitting unclaimed because everyone assumes someone else has it.
3. **No 86 (sold-out) workflow.** `Item.isActive`
   (`apps/api/src/items/entities/item.entity.ts:93`) is a permanent
   on/off switch — there's no "temporarily unavailable for the rest of
   today's service" state a chef can flip mid-shift when an ingredient
   runs out, that immediately stops POS from letting staff order it,
   distinct from deactivating the item from the menu entirely.
4. **No hold-and-fire control.** Every item in a round
   (`../order-sessions/add-round_plan.md`) goes to the kitchen the moment
   the round is sent — there's no "hold the mains, fire them when the
   starters are cleared" coordination point, which is standard
   multi-course service and currently just has to happen informally
   (staff manually waiting to send the next round).

## Files

- `apps/api/src/recipes/entities/recipe.entity.ts` — add nullable
  `method: string | null` (or `text` column) to `Recipe` — free-text prep
  steps, separate from the ingredient/costing data already there.
- `apps/api/src/recipes/services/recipes.service.ts` /
  `recipes.controller.ts` — `upsert()` accepts `method`; expose it on
  whatever endpoint the KDS/KOT board reads recipe data from (a chef
  viewing a ticket needs a "View Method" action that fetches
  `GET /recipes/:itemId` — check this route already returns `method` once
  added, no new endpoint needed).
- `apps/restaurant-ui/src/modules/recipes/pages/RecipePage.tsx` — add a
  method/steps textarea to the existing recipe editor
  (`RecipeEditor`), alongside the ingredient table.
- `apps/api/src/kot/entities/kot.entity.ts` — `KotItem` gains
  `claimedBy: string | null` (user id).
- `apps/api/src/kot/services/kot.service.ts` — new `claimItem(kotId,
  itemId, userId)` (rejects if already claimed by someone else —
  surface a clear conflict rather than silently overwriting), `unclaimItem`
  (release, e.g. cook steps away). Claiming does **not** change
  `KotItem.status` — it's an assignment, not a prep-state transition, so
  it composes with module 8's quantity/instruction actions and module
  11's cancellation, rather than replacing them.
- `apps/api/src/items/entities/item.entity.ts` — add
  `is86d: boolean` (default `false`) + `eightySixedAt: Date | null`,
  distinct from `isActive` (menu-level, permanent-ish) — `is86d` is a
  same-day, easily-reversed flag.
- `apps/api/src/items/services/items.service.ts` — `set86(itemId, is86d:
  boolean)`. Recommend a scheduled/manual daily reset (e.g. clear all
  `is86d` flags at end-of-day close-out, wherever that concept lives in
  this codebase — check for an existing daily-close routine before adding
  a new one) so a sold-out flag from last Tuesday doesn't silently
  persist forever.
- `apps/restaurant-ui/src/modules/pos/pages/POSDashboard.tsx` — menu item
  tiles check `is86d` and render disabled/"86'd" instead of orderable,
  same list `isActive` already filters against.
- `apps/api/src/order-sessions/services/order-sessions.service.ts`
  (`../order-sessions/add-round_plan.md`) — `addRound()` should reject (or
  warn) if any submitted item is currently `is86d`, so a stale POS screen
  can't push a sold-out item through anyway.
- `apps/api/src/order-sessions/entities/order-session.entity.ts`
  (`../order-sessions/order-session-entity_plan.md`) — `OrderSessionItem`
  gains `holdUntilFired: boolean` (default `false`) + `firedAt: Date |
  null`. When a round is added with items marked "hold" (e.g. the mains of
  a multi-course order), those items' KOTs aren't created yet.
- `apps/api/src/order-sessions/services/order-sessions.service.ts` — new
  `fireHeldItems(sessionId, itemIds[])` — the deferred equivalent of
  `addRound()` for previously-held items: creates their KOT(s) now,
  stamps `firedAt`. This reuses `addRound`'s station-splitting/KOT
  creation internals rather than duplicating them — held items are just a
  round whose KOT-creation step was deferred, not a different kind of
  item.
- Frontend: waiter/floor view (wherever `../order-sessions/pos-ui-rework_plan.md`'s
  round-sending UI lives) gets a "Hold" toggle per item before sending,
  and a "Fire held items" action once ready for the next course.

## Verification

- `apps/api`: `tsc --noEmit`; extend `kot.service.spec.ts` for claim/
  unclaim conflict handling, and `items.service.spec.ts` for `set86`.
- Manual: mark an item 86'd — confirm it's immediately un-orderable in
  POS while a colleague's already-open POS tab (stale data) gets rejected
  server-side if they try anyway via `addRound`.
- Claim a ticket item as one user — confirm a second user's claim attempt
  is rejected with a clear conflict, and unclaiming frees it up again.
- Send a round with mains marked "hold" — confirm no KOT is created for
  those items yet; fire them later — confirm their KOT appears at that
  point, correctly station-routed, exactly as an immediate round would
  be.
- Add a `method` to a recipe — confirm it's visible from the KDS/KOT
  ticket view for that item (module 9's terminal, or the general
  `/kot` board).
