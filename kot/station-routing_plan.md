# Module 2: Item→station routing + split KOTs per station

See [`README.md`](./README.md) for full background/goal. Depends on:
[`field-consistency-fix_plan.md`](./field-consistency-fix_plan.md)
(module 1).

## What

Confirmed in `apps/restaurant-ui/src/modules/pos/pages/POSDashboard.tsx:119-131`:
every checkout creates exactly one `Kot` with `station: 'main_kitchen'`
hardcoded, holding every cart item regardless of what it actually is. The
`KotStation` enum (`main_kitchen`, `tandoor`, `beverages`, `desserts`,
`snacks`) and the KOT board's station filter
(`KotDisplayPage.tsx:6`, `STATIONS` array) already assume tickets are
split by station — they just never actually are. A drinks order and a
tandoor order for the same table land on one physical kitchen printout
today, which isn't how a real kitchen works (the bar doesn't want to see
tandoor items, and vice versa).

Add a station mapping on the item side, and have checkout group cart
items by resolved station into separate KOTs.

## Files

- `apps/api/src/items/entities/item.entity.ts` — add
  `@Column({ type: 'enum', enum: KotStation, name: 'default_station', nullable: true })
  defaultStation!: KotStation | null;` (import `KotStation` from the kot
  module — or, to avoid a cross-module import into `items`, define the
  station enum in a shared location and have both `items` and `kot`
  import from there; check whether `apps/api/src/shared/` already holds
  cross-cutting enums before picking). Nullable = falls back to
  `main_kitchen` if unset, so existing items don't need a bulk migration
  before this ships.
- `apps/api/src/items/dto/create-item.dto.ts` /
  `update-item.dto.ts` — accept `defaultStation`.
- `apps/restaurant-ui/src/modules/items/pages/CreateItemPage.tsx` /
  `EditItemPage.tsx` — add a station select next to the existing
  category/unit fields.
- `apps/restaurant-ui/src/modules/pos/pages/POSDashboard.tsx`:
  - `billMutation` currently builds one `createKot()` call with the full
    cart. Replace with: group `cart` by each item's resolved station
    (need item station data available in the cart — either fetch it with
    the menu item list already loaded for POS, or have the checkout step
    look it up), then call `createKot()` once per non-empty station
    group, each with only that group's items and the correct `station`
    value, all sharing the same `orderId`.
  - If any items in the cart have no `defaultStation`, group them under
    `main_kitchen` (the existing default) rather than erroring — this
    keeps existing/unconfigured items working exactly as they do today.
- `apps/api/src/kot/services/kot.service.ts` — no change needed if the
  frontend does the grouping; if preferred, move the grouping server-side
  instead (single `POST /kots/bulk` accepting the full cart + resolving
  stations itself) so the frontend doesn't need per-item station data at
  all. Recommend the server-side approach — it keeps the POS frontend
  dumb and makes the station mapping a single source of truth. If chosen:
  new `KotService.createSplitByStation(dto: { orderId, tableIds, items: {itemId, itemName, quantity, instructions}[] })`
  that looks up each item's `defaultStation` via the `Item` repo and
  creates one `Kot` per resulting group.

## Verification

- `tsc --noEmit` in both apps.
- Update `kot.service.spec.ts` (if server-side grouping is chosen) with a
  test: cart of 3 items across 2 stations → `create` is called twice
  (or the bulk method produces 2 `Kot` rows), each with only its own
  items.
- Manual: configure one item as `tandoor` and one as `beverages`, order
  both plus a default (`main_kitchen`) item in one POS checkout — confirm
  `/kot` shows three separate KOT cards, correctly split, all referencing
  the same `orderId`.
