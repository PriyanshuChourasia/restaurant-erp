# Module 9: Item Master Completeness — vendor linkage, tax classification, compound-unit display

See [`README.md`](./README.md) for full background/goal. Depends on:
[`data-model_plan.md`](./data-model_plan.md) (module 0),
[`units_plan.md`](./units_plan.md) (module 1) — this module extends the
`Unit`/`UnitConversion` tables module 1 already built rather than adding a
parallel unit system. Touches
[`../purchases/`](../apps/api/src/purchases) (vendor auto-suggest) and
[`../reports/`](../reports/README.md) (GST return report needs to switch
from grouping by raw `gstRate` to the new tax classification — flagged
below, not implemented here).

## What

Three gaps in the current `Item` model (confirmed by reading
`apps/api/src/items/entities/item.entity.ts` after module 1 landed),
raised together because a real restaurant/retail "stock item master"
(the screen Tally Prime and Zoho Inventory both build around) needs all
three, and they're all edits to the same entity:

1. **No vendor on the item itself.** `apps/api/src/suppliers/entities/supplier.entity.ts`
   and `Purchase.supplierId` already exist (module-1-adjacent work, already
   shipped) — a purchase order picks a vendor. But `Item` has no
   relationship to `Supplier` at all. There's no "who do we normally buy
   flour from" answer available when creating a PO — staff have to
   remember or look it up separately every time, and there's no per-vendor
   last-price history to compare against ("did the price go up since last
   time"), which both Tally and Zoho track per stock item.
2. **No explicit taxability flag — `gstRate` conflates two different
   things.** `GstRate.NIL = 0` (`item.entity.ts:16-22`) means "0% GST
   rate," but Indian GST law distinguishes **four** different cases that
   all show up in different tables on a GSTR-1 return: taxable (any
   nonzero rate), nil-rated (0%, but still a GST supply), exempt (GST
   doesn't apply by notification), and non-GST supply (outside GST
   entirely — alcohol for human consumption, petroleum). Today's model
   can only express "taxable at some rate" — it cannot tell a nil-rated
   item apart from a genuinely non-GST one, so `reports.service.ts`'s
   `getGstReturn` (confirmed: groups purely by `ii.gstRate`, no other
   dimension) currently could not produce a correct GSTR-1 nil/exempt/
   non-GST summary table even if asked to — the input data doesn't carry
   the distinction.
3. **No compound/display-unit formatting anywhere.** Module 1 already
   gives every item a base `unitId` (e.g. "gram" for flour) and a global
   `UnitConversion` row (gram→kg, factor 0.001) — the conversion *math*
   exists. But nothing renders it for a human: confirmed by grep, every
   page that shows `currentStock` today
   (`StockStatusPage.tsx:185`, `ItemListPage.tsx`) prints the raw base-unit
   number next to the raw unit code — `4000 gram`, not `4 kg`; `3400
   gram`, not `3.4 kg` or `3 kg 400 g`. A restaurant stocking flour in
   grams (for recipe-level precision) still wants to glance at a report
   and see "4 kg," not do the division in their head, and a partially-used
   sack like cucumber's 3.4 kg should be able to show as a whole-number
   compound ("3 kg 400 g") the way a kitchen scale would read it.

## Files

### Vendor linkage

- **New** `apps/api/src/items/entities/item-supplier.entity.ts`:
  ```ts
  @Entity('item_suppliers')
  @Unique(['itemId', 'supplierId'])
  export class ItemSupplier {
    id!: string;
    itemId!: string;                    // FK -> items.id
    supplierId!: string;                // FK -> suppliers.id
    isPreferred!: boolean;               // default false; exactly one true per item enforced in service, not DB constraint
    lastPurchasePrice!: number | null;   // decimalTransformer, updated by purchases (see below)
    lastPurchasedAt!: Date | null;
    createdAt!: Date;
  }
  ```
  A join table, not a single `Item.preferredSupplierId` column, because a
  real kitchen buys the same raw item from more than one vendor (a backup
  supplier when the usual one is out) and Tally/Zoho both model "vendors
  used for this stock item" as a list, not a single FK — one row is
  flagged preferred/default for auto-suggestion, the rest are just
  known-good alternates.
- `apps/api/src/items/services/items.service.ts` — `setPreferredSupplier(itemId, supplierId)`
  (flips `isPreferred` on the target row, clears it on any other row for
  the same item — enforce "exactly one preferred" here since a DB
  partial-unique-index isn't available with TypeORM's default sync
  tooling in this repo), `addSupplierToItem(itemId, supplierId)`,
  `removeSupplierFromItem(itemId, supplierId)`.
- `apps/api/src/purchases/services/purchases.service.ts` — when a
  `PurchaseItem` is saved as part of receiving a purchase (wherever
  `purchase-receiving_plan.md`'s module 4 posts the goods-receipt), upsert
  the corresponding `ItemSupplier.lastPurchasePrice`/`lastPurchasedAt` for
  that `(itemId, supplierId)` pair — this is what makes "did the price go
  up" comparisons possible without a separate report query every time.
- `apps/api/src/items/controllers/items.controller.ts` — `GET
  /items/:id/suppliers`, `POST /items/:id/suppliers` (`{ supplierId,
  isPreferred? }`), `DELETE /items/:id/suppliers/:supplierId`, `PATCH
  /items/:id/suppliers/:supplierId/preferred`.
- Frontend: `apps/restaurant-ui/src/modules/items/pages/EditItemPage.tsx` /
  `CreateItemPage.tsx` — a "Suppliers" section listing linked vendors
  (name, last price, last purchased date), add/remove, a "preferred"
  radio/star. `apps/restaurant-ui/src/modules/purchases/` (the PO create
  form) — when a line item is picked, auto-fill the vendor field from that
  item's preferred supplier if the PO doesn't already have a vendor
  selected, and show the item's `lastPurchasePrice` as a hint next to the
  price input (not auto-filled — staff should see and confirm the price,
  not silently trust a stale number).

### Tax classification

- `apps/api/src/items/entities/item.entity.ts`:
  ```ts
  export enum TaxCategory {
    TAXABLE = 'taxable',       // gstRate applies as today
    NIL_RATED = 'nil_rated',   // a GST supply, rate is 0%, distinct GSTR-1 table
    EXEMPT = 'exempt',         // GST-exempt by notification
    NON_GST = 'non_gst',       // entirely outside GST (e.g. alcohol, petroleum)
  }
  ```
  Add `taxCategory: TaxCategory` (default `TAXABLE`) — keep `gstRate`
  as-is (still needed for the `TAXABLE` case's actual percentage), but it
  is only meaningful when `taxCategory === TAXABLE`; the other three
  categories ignore whatever `gstRate` holds (validate this at the DTO
  level — reject a `gstRate` other than `NIL` when `taxCategory` isn't
  `TAXABLE`, so the two fields can't silently disagree).
- `apps/api/src/items/dto/create-item.dto.ts` /
  `update-item.dto.ts` — add `taxCategory` (`@IsEnum(TaxCategory)`,
  optional, defaults server-side), with the cross-field validation above.
- **Flag to the user, don't silently change**: `apps/api/src/sales/entities/sales.entity.ts`'s
  `InvoiceItem` currently stores `gstRate`/`taxableValue`/`cgstAmount`/
  `sgstAmount` per line at sale time — once `Item.taxCategory` exists,
  decide whether `InvoiceItem` should snapshot the category too (so a
  historical invoice for a since-reclassified item still reports
  correctly), the same "snapshot vs. live lookup" question
  `order-sessions/order-session-entity_plan.md` already raised for prices.
  Recommend snapshotting, for the same reason.
- `apps/api/src/reports/services/reports.service.ts` — `getGstReturn`
  should eventually group nil-rated/exempt/non-GST turnover into their own
  GSTR-1-shaped buckets instead of lumping everything by `gstRate` alone
  (a `0%` row today could secretly be nil-rated, exempt, or non-GST, and
  the return would misreport which). **Don't change this report as part
  of this module** — cross-reference this requirement into
  `../reports/README.md`'s kitchen/finance report backlog instead, since
  it's a consumer of this data, not part of building it.
- Frontend: `CreateItemPage.tsx`/`EditItemPage.tsx` — a "Tax Category"
  select next to the existing GST rate picker; disable/grey the rate
  picker when a non-`TAXABLE` category is chosen (matches the backend
  validation, not just a UI nicety).

### Compound-unit display formatting

- `apps/api/src/units/entities/unit.entity.ts` — add
  `displayCompoundUnitId: string | null` (self-referencing FK to another
  `Unit`) — e.g. the seeded "gram" row's `displayCompoundUnitId` points at
  "kg". This is deliberately a new, single field rather than reusing the
  generic `UnitConversion` table for this purpose: a unit can have *many*
  valid conversions (gram→kg, gram→quintal) but exactly one **preferred
  display rollup**, and overloading the conversion table with a "is this
  the display one" flag would mean every consumer of `UnitConversion` has
  to filter it back out.
- `apps/api/src/units/services/units.service.ts` — new
  `formatQuantity(quantity: number, unitId: string): Promise<{ value: number; unitCode: string; compound?: { major: number; majorUnitCode: string; minor: number; minorUnitCode: string } }>`:
  - If the unit has no `displayCompoundUnitId`, return `{ value: quantity, unitCode: unit.code }` unchanged (e.g. "piece" items just show as-is — there's nothing to roll up).
  - Otherwise, convert via the existing global `UnitConversion` (module 1)
    between the base unit and `displayCompoundUnitId`. If the quantity
    converts to a whole number in the bigger unit (4000 g → exactly 4 kg),
    return the simple form `{ value: 4, unitCode: 'kg' }`. If there's a
    remainder (3400 g → 3 kg + 400 g), return the compound form: `{
    value: 3.4, unitCode: 'kg', compound: { major: 3, majorUnitCode: 'kg',
    minor: 400, minorUnitCode: 'gram' } }` — callers pick whichever shape
    fits their layout (a single "3.4 kg" figure in a table cell, or "3 kg
    400 g" in a detail view).
  - Below one full compound unit (e.g. 400 g with no whole kg part),
    return the plain base-unit form — there's nothing to roll up yet.
- `apps/api/src/items/controllers/items.controller.ts` /
  `apps/api/src/inventory/controllers/inventory.controller.ts` — existing
  stock-read endpoints (`GET /inventory/:itemId`, `GET
  /reports/inventory/stock-status`) include the formatted shape alongside
  the raw `currentStock`/`unitId` — additive, not a breaking response
  change.
- Frontend: **new** `apps/restaurant-ui/src/lib/formatQuantity.ts` (or
  colocated under `modules/items/utils/` if this repo prefers per-module
  utils — check existing convention before picking a location) — a
  shared helper so every page rendering a stock quantity uses the same
  formatting, instead of each page hand-rolling
  `{item.currentStock} {item.unit}` the way `StockStatusPage.tsx:185` and
  `ItemListPage.tsx` currently do independently. Update both of those call
  sites to use it once it exists — this is exactly the "flour 4000 g
  displays as 4 kg, cucumber's 3400 g displays as 3.4 kg / 3 kg 400 g"
  behavior asked for.
- `apps/api/src/database/database-seed.service.ts` — set
  `displayCompoundUnitId` on the seeded "gram"→"kg" and "ml"→"litre" unit
  rows (module 1 already seeds these units and their conversion factors;
  this just adds the display-rollup pointer on top).

## Verification

- `apps/api`: `tsc --noEmit`; extend `items.service.spec.ts` for
  `setPreferredSupplier` (exactly one preferred survives after setting a
  second one), and a new `units.service.spec.ts` case for `formatQuantity`
  covering: no compound unit configured (passthrough), exact multiple
  (4000 g → `{value: 4, unitCode: 'kg'}` with no `compound` field), and a
  remainder (3400 g → compound form with `major: 3, minor: 400`).
- Manual: on an item stocked in grams with `displayCompoundUnitId` → kg
  seeded, confirm `GET /inventory/:itemId` (or wherever the formatted
  shape is exposed) shows "4 kg" for a 4000 g balance and "3 kg 400 g" /
  "3.4 kg" for 3400 g, and that `StockStatusPage.tsx` renders the same
  instead of the raw gram figure. Link a second vendor to an item, mark
  it preferred, then start a new purchase order for that item — confirm
  the vendor auto-fills and the last purchase price shows as a hint.
  Create an item with `taxCategory: non_gst` — confirm the GST rate picker
  disables/greys in the item form and the backend rejects a nonzero
  `gstRate` submitted alongside a non-`taxable` category.
