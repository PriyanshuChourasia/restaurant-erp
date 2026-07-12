# Module 7: When should stock actually leave inventory relative to a KOT?

See [`README.md`](./README.md) for full background/goal. Depends on:
[`kot-cancellation_plan.md`](./kot-cancellation_plan.md) (module 11) —
voiding needs to exist before this module can decide what happens to
already-deducted stock on a void. (Circular-looking on paper — module
11 also references this module's reversal hook. In practice, build a
basic `cancelKot`/`cancelKotItem` first without stock reversal, land
this module's timing decision, then wire the reversal call from module
11 into whatever this module decided. See module 11's note on this.)

## What

Confirmed in `apps/api/src/sales/services/sales.service.ts:176-205`:
recipe-based stock deduction (`RecipesService.deductOnSale`, or the
direct-inventory fallback) happens inside `SalesService.create()` — i.e.
**at invoice creation**, not at any KOT status transition. Today that's
the same instant as "send to kitchen" (module 6's whole point is to
un-fuse those), so once sessions/rounds exist, there are two defensible
timing models and this repo should pick one deliberately rather than
inherit whatever falls out of the refactor by accident:

1. **Deduct at "send to kitchen" (KOT created)** — matches how most POS/
   KDS systems work: once the kitchen has been told to cook it, the raw
   material commitment is real, regardless of whether the customer later
   sends it back. Simple, matches current behavior most closely.
2. **Deduct at "served"** (`KotStatus.SERVED`, already an existing status
   with a `servedAt` timestamp on `Kot`) — more accurate if voids are
   common (module 3's cancel flow returns stock to shelf without ever
   having removed it), but means kitchen stock isn't reflected as "in
   use" while a dish is actively being cooked, which understates
   in-progress consumption for a busy kitchen checking real-time stock
   levels mid-service.

Recommendation: **option 1 (deduct at KOT creation)**, since it matches
existing behavior and keeps `RecipesService`/`InventoryService` as the
single deduction path already wired from `SalesService`. Voiding a KOT or
KOT item (module 3) should then explicitly **reverse** the deduction
(post an `adjustment_in` / reverse movement) rather than never having
deducted at all — this keeps the movement ledger's audit trail honest
("we took it out, then put it back because it was cancelled" is more
truthful than making it look like it was never touched). Flag this
recommendation to the user before implementing — it's a product decision,
not something to infer silently.

## Files (once the option above, or an alternative, is confirmed)

- `apps/api/src/kot/services/kot.service.ts` — on KOT creation (or the
  station-split bulk method), call `RecipesService.deductOnSale`
  per item (same call `SalesService` makes today) instead of/in addition
  to `SalesService` doing it — **pick one caller, not both**, or every
  sale double-deducts. This likely means moving the deduction call out of
  `SalesService.create()` into wherever KOT rounds are created (the
  `../order-sessions/add-round_plan.md` service), and `SalesService`
  stops deducting stock at settlement time entirely.
- `apps/api/src/kot/services/kot.service.ts` (`cancelKot`/`cancelKotItem`,
  module 3) — call the corresponding reversal (`adjustment_in` for the
  quantity being voided) so cancelled items don't leave a phantom
  deduction on the books.
- Update `sales.service.spec.ts` and `kot.service.spec.ts` mocks
  accordingly — this is a meaningful behavior move between two services,
  not a rename, so expect real test logic changes, not just fixture
  renames.

## Verification

- `apps/api`: `tsc --noEmit`; updated specs pass and assert deduction
  happens exactly once per item, from exactly one call site.
- Manual: send a round to the kitchen — confirm `GET
  /inventory/:itemId/movements` shows the `sale_out`/recipe deduction
  immediately (before settlement). Void one of those items — confirm a
  reversing movement appears and `Inventory.currentStock` returns to its
  pre-deduction value.
