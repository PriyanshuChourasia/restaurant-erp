# Module 12: KOT Merge (combine multiple KOTs into one ticket)

See [`README.md`](./README.md) for full background/goal. Depends on:
[`line-item-management_plan.md`](./line-item-management_plan.md) (module 8)
for the shared item-status rollup helper (see below). Interacts with
[`kot-cancellation_plan.md`](./kot-cancellation_plan.md) (module 11) — a
merged-away source KOT ends up in the same "no longer active" bucket as a
cancelled one; module 11's lock-point checks need to account for the
`MERGED` status this module introduces (cross-referenced there).

## Background

A table often orders in rounds — each "Charge"-free order placed from
POS creates its own `Kot` record (`apps/api/src/kot/entities/kot.entity.ts`),
so a table that orders at 7:00 and again at 7:15 ends up with two separate
kitchen tickets for the kitchen to juggle, even though it's the same
table. This feature lets staff combine multiple still-active KOTs for the
same table into a single consolidated ticket.

This depends on module 8's rollup helper: `updateItemStatus`'s existing
"auto-update KOT status based on items" block
(`apps/api/src/kot/services/kot.service.ts:74-78`) needs to already be
extracted into a shared private method (module 8 calls this out for its
own `addItemToKot`/quantity-edit call sites) — merge just reuses that same
helper rather than re-deriving the rollup rule a third time. If module 8
hasn't landed yet, do the extraction here instead; don't duplicate it.

**Kitchen-ticket-only, consistent with modules 8 and 11:** merging does
not touch invoices or `../order-sessions/`. Each source KOT's `orderId` is
dropped along with the rest of that record once merged; if the merged
table hasn't been billed yet, staff bill however they normally would.
Flag it if that's wrong for this feature specifically.

## What "merge" means here

Pick one **target** KOT and one or more **source** KOTs. All of that
source KOT's items get moved onto the target KOT (so the kitchen sees one
ticket with everything), and the source KOT is closed out with a pointer
to where its items went. Nothing is deleted — source KOTs stay in the
database as a `MERGED` record for audit/history, just off the active
kitchen board.

### Merge rules
- Target and all sources must currently be **active**
  (`status IN (pending, preparing, ready)`) — can't merge a KOT that's
  already `served`, `cancelled`, or `merged`.
- Target and all sources must share the **same `station`** — merging
  across kitchen stations (e.g. Main Kitchen + Beverages) doesn't make
  sense as one physical ticket.
- Target and all sources must share **at least one common table id** —
  this is meant for "same table, multiple rounds," not merging unrelated
  tables.
- A KOT can't be merged into itself; at least one source id is required.
- Item-level status is untouched by the merge — an item already
  `preparing` in a source KOT stays `preparing` after moving to the
  target (merge just regroups the ticket, it doesn't reset progress the
  way module 11's cancel does).

## Backend (`apps/api/src`)

### Entity changes — `kot/entities/kot.entity.ts`
- `KotStatus`: add `MERGED = 'merged'`.
- `Kot`: add `mergedIntoKotId: string | null` — set on a source KOT once
  merged, pointing at the target.
- `KotItem`: add `mergedFromKotNumber: string | null` — set on an item
  when it's moved from a source KOT, so the target ticket can show "from
  KOT-00005" provenance instead of just silently absorbing it. (This is a
  different signal than module 8's `isAddendum` "added after fire" flag —
  don't conflate the two; an item can be merged-in without being a brand
  new item the kitchen hasn't seen yet. A single item could in principle
  carry both flags — e.g. an addendum item on a source KOT that then gets
  merged — the board should be able to show both badges on one row rather
  than one clobbering the other.)

### Service — `kot/services/kot.service.ts`
Add `mergeKots(targetKotId: string, sourceKotIds: string[]): Promise<Kot>`:
1. Load the target and every source KOT (with items); 404 if any is
   missing.
2. Validate the merge rules above; throw `BadRequestException` with a
   specific message for whichever rule fails (different station, no
   shared table, inactive KOT, empty/self source list) — don't collapse
   these into one generic error, staff need to know *why* the merge
   button didn't work.
3. For each source KOT, for each of its items: set `item.kotId =
   targetKotId`, `item.mergedFromKotNumber = source.kotNumber`, save.
4. For each source KOT: set `status: MERGED`, `mergedIntoKotId:
   targetKotId`, save (items array is now empty on the source since they
   were reassigned).
5. Call the shared `recomputeStatus(target)` helper (see Background) —
   pulling in items from a source that's further behind should be
   reflected in the target's overall status.
6. Return the reloaded target KOT with its full merged item list.

### DTO — `kot/dto/merge-kots.dto.ts`
`sourceKotIds: string[]` — `@IsArray()`, `@ArrayMinSize(1)`,
`@IsUUID('4', { each: true })`.

### Controller — `kot/controllers/kot.controller.ts`
`POST /kots/:targetId/merge` → `mergeKots(@Param('targetId') targetId, @Body() dto: MergeKotsDto)`.

## Frontend (`apps/restaurant-ui/src`)

### `modules/kot/api/kot.api.ts`
Add `mergeKots(targetKotId: string, sourceKotIds: string[])` calling the
new endpoint.

### `modules/kot/pages/KotDisplayPage.tsx`
- Add a lightweight selection mode: a checkbox on each active KOT card.
  Don't try to pre-filter by table/station client-side — let staff select
  freely and surface the backend's specific validation error in a toast
  if the combination is invalid (simpler than re-deriving the merge rules
  in the UI, and keeps the rules defined in one place).
- When 2+ cards are selected, show a "Merge Selected (n)" bar/button.
  Default the **target** to whichever selected KOT has the earliest
  `createdAt` (i.e. the original round); the rest become sources. Call
  `mergeKots(targetId, otherIds)` on confirm.
- On success: invalidate `['kots']` — the merged-away source cards drop
  off the board (they're no longer `pending`/`preparing`, matching
  `getActiveKots`' existing status filter), and the target card now shows
  the combined item list.
- On each item row in a KOT card, if `item.mergedFromKotNumber` is set,
  render a small caption under it ("from KOT-00005") — visually distinct
  from module 8's addendum badge (this is provenance, not a change
  notice); render both if an item happens to carry both flags rather than
  picking one to show.

## Verification
- `apps/api`: `tsc --noEmit`; extend `kot.service.spec.ts` with cases for
  a valid merge, and rejections for: different station, no shared table,
  merging an already-`served`/`cancelled`/`merged` KOT, and an empty
  source list.
- Manual: place two orders for the same table from `/pos` (two separate
  KOTs). Open `/kot`, select both, merge — confirm one card now shows all
  items with provenance captions on the merged-in ones, and the other
  card is gone from the active board. Try merging a Main Kitchen KOT with
  a Beverages KOT for the same table — confirm it's rejected with a
  clear "different station" error.
