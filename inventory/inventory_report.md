# Inventory Report — Why You Can't Record "5 kg Peas Bought"

**Question asked:** where do I enter how much peas / flour I bought — why
isn't this in the software?

**Short answer: it's not you missing a button — the button is genuinely
broken.** There is a "New Purchase" button on the Purchases page, but it
does nothing when clicked. Even if it worked, the form it should open
would need to let you pick a supplier, and the supplier-management page,
while fully built, isn't wired to any URL — it's unreachable. This report
traces the exact break in the chain, evidenced against the live code, and
lists what needs to change.

Verified against the live code on 2026-07-13.

## The workflow that should exist

Recording a raw-material purchase like peas or flour is meant to go
through three steps, all of which already have real backend support:

1. **Items** — create "Peas" as a raw-material item (once).
2. **Purchases** — create a Purchase Order: pick a supplier, add line
   items (Peas, quantity, unit price), save.
3. **Receive** — mark the PO received, which posts real stock (weighted-
   average cost), a `StockMovement`, and ledger entries.

Step 3 works correctly — confirmed in the report-readiness review
(`reports/feeback.md`): `purchases.service.ts`'s `receive()` calls
`InventoryService.postPurchaseReceipt()`, which updates weighted-average
cost and posts to the ledger. **The break is entirely in steps 1–2's UI.**

## What's actually broken

### 1. The "New Purchase" button has no click handler

`apps/restaurant-ui/src/modules/purchases/pages/PurchasesPage.tsx:150-153`:

```tsx
<button className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-sm font-medium text-white transition-all hover:bg-primary/90">
  <Plus size={15} />
  New Purchase
</button>
```

No `onClick`. Nothing happens when it's clicked — no dialog, no navigation,
no network call. Confirmed by reading the entire file: there is no
create-purchase form or dialog anywhere in the `purchases/` module.
`PurchaseDetailDialog.tsx` (the only other component in the module) is
**view-only** — it renders an existing purchase's line items, it has no
inputs.

This is the same failure mode as the "dead buttons" bug fixed on the
Inventory page in an earlier task (`.project/tasks/inventory_group.md` —
Add Item/Adjust/History all had no `onClick` at the time). That fix never
extended to the Purchases page, and a "New Purchase" create form was never
built here in the first place — it's not a regression, it's a gap that was
never closed.

### 2. The backend endpoint exists but has no validation contract

`apps/api/src/purchases/controllers/purchases.controller.ts:19-22`:

```ts
@Post()
create(@Body() dto: any) {
  return this.service.create(dto);
}
```

`POST /purchases` is real and reachable — but unlike every other module in
this codebase (Items, Customers, Reservations, ...), there is no
`create-purchase.dto.ts` with `class-validator` decorators. The whole
`purchases/` module has no `dto/` folder at all. This isn't why the button
is broken, but it means once a create form is built, malformed line items
(missing `itemId`, negative `quantity`, a `unitPrice` that's a string) will
reach the database instead of being rejected with a clean 400.

### 3. Supplier management is fully built but completely unreachable

`apps/restaurant-ui/src/modules/suppliers/pages/SuppliersPage.tsx` has a
real, working "Add Supplier" form (name, GSTIN, contact — toggled by a
button with a real `onClick`, not a dead one). But:

- There is **no route file** for it — `apps/restaurant-ui/src/routes/`
  has no `suppliers.tsx`, confirmed by grep and by `routeTree.gen.ts`
  having zero entries for a `SuppliersPage` import.
- There is **no sidebar link** — `AppSidebar.tsx` mentions "Suppliers"
  exactly once, and it points at `/reports/procurement-supplier-performance`
  (a report), not at supplier management.

So even after the New Purchase button is fixed, a create-purchase form
that includes a supplier picker has nowhere to send a user to create a
new supplier — that page exists in the bundle but no URL in the app leads
to it today.

### 4. Creating the raw-material `Item` itself works, but has a UX wrinkle

`apps/restaurant-ui/src/modules/items/pages/CreateItemPage.tsx` is fully
functional — `productType: 'raw'` is a real option, `unitId` (kg, gram,
...) is a real dropdown fed by the units module. **This part works.**

The friction: `price` (labeled "Selling Price (₹) *") is a required field
on every item, including raw materials that are never sold on a menu and
have no selling price — confirmed at `CreateItemPage.tsx:84-85`
(`required`). A user creating "Peas" has to type `0` into a field labeled
"Selling Price" for an ingredient that isn't sold, which reads as wrong
even though it's technically harmless.

## Why the two "workarounds" that do exist are the wrong tool

A user determined to get peas into stock today has two working dialogs on
the **Inventory** page, and both are the wrong tool for "I bought more
peas":

- **"Add Item" (`AddInventoryItemDialog.tsx`)** — this is opening-stock
  declaration, and by design (module 3, `opening-stock_plan.md`) it's
  **one-time only**. The first time, it works. Try it again for the same
  item and it correctly refuses, showing "Opening Stock Already Declared"
  and pointing at Adjust Stock instead. It was never meant to record
  ongoing purchases, and correctly won't let you misuse it that way.
- **"Adjust Stock" → `adjustment_in`** — this *will* silently let a user
  bump Peas' stock up. But it has no supplier field, no PO number, doesn't
  compute a real weighted-average purchase cost, and posts to the **Stock
  Adjustment** ledger account instead of **Purchase Payable**/COGS. Every
  procurement report (`reports/procurement-reports.md`, RPT-P01–P07) and
  the balance sheet's Purchase Payable figure would be wrong if this
  becomes the de-facto way purchases get logged, because none of the
  transactions look like purchases to the reporting layer.

Neither is a real substitute for a purchase order. There currently is no
correct way to record "I bought peas" in the UI.

## How to improve the inventory plan

This isn't a new module to design from scratch — `purchase-receiving_plan.md`
(module 4) already exists and its backend half is genuinely built and
working. What's missing is purely the **create-side UI** that was never
implemented alongside it. Two options, in order of recommendation:

### Recommended: close the gap as a UI-only fix, no new plan module needed

1. **Wire `/suppliers`** — add a route file
   (`apps/restaurant-ui/src/routes/suppliers.tsx`) importing the existing
   `SuppliersPage`, and add a real sidebar link (distinct from the
   supplier-performance *report* link that already exists). The page and
   form are done; this is route + nav wiring only.
2. **Build the "New Purchase" form** — a dialog or page: supplier picker
   (from the now-reachable `/suppliers`), a repeatable line-item row
   (item search + quantity + unit price, mirroring the item-search pattern
   already used in `AddInventoryItemDialog.tsx`), computed subtotal/GST/
   total, submit to the real `POST /purchases`. Wire it to the dead button
   at `PurchasesPage.tsx:150-153`.
3. **Add `create-purchase.dto.ts`** with `class-validator` decorators
   (`supplierId: IsUUID`, `items: ValidateNested({each:true})` with
   `itemId`/`quantity`/`unitPrice` validated per line) so the
   already-live `POST /purchases` endpoint rejects bad data instead of
   accepting `any`.
4. **Make raw-material item creation friction-free**: when
   `productType === 'raw'`, don't require `price` in the create form (default
   it to `0` and relabel/hide the field, or rename the label to "Selling
   Price (leave 0 for raw materials)") — a one-line UX fix in
   `CreateItemPage.tsx`.

None of this needs a new entry in `inventory/README.md`'s module table —
it's a completion fix to module 4 (`purchase-receiving_plan.md`), which
should have included the create-purchase UI in its original scope. Treat
it as a bug/gap fix task per `inventory/AGENTS.md`'s workflow (one task
file, update memory, no new module number needed) rather than a new plan
module.

### If a faster "just log what I bought" path is also wanted

Beyond fixing the real PO flow, a lightweight "Quick Purchase Entry" (item
search or inline-create + qty + cost + supplier, single screen, skips the
multi-line PO ceremony) would reduce friction for small day-to-day
grocery-style buys like "2 kg peas, 5 kg flour" without needing a full
purchase order workflow each time. This is a genuinely new, small addition
— worth a short module file (e.g. `quick-purchase-entry_plan.md`) if the
user confirms it's wanted, since it's a real UX decision (does a quick
entry still create a full `Purchase`/`PurchaseItem` record for audit
trail, or a simpler direct stock-in movement?) rather than something to
assume and build silently.

## Summary

| What | Status |
|---|---|
| Create a raw-material `Item` (e.g. "Peas") | ✅ Works (minor UX friction: "Selling Price" required) |
| Create a `Supplier` | ✅ Form works, ❌ but the page is unreachable — no route, no nav link |
| Create a Purchase Order (item + quantity + supplier) | ❌ **Broken — "New Purchase" button has no handler, no form exists** |
| Receive a Purchase Order (post stock + cost + ledger) | ✅ Fully works once a PO exists |

The purchase-receiving backend (module 4) genuinely works. The reason you
can't enter "5 kg peas bought" is that nobody ever built the screen to
create the purchase order in the first place — the button that should open
it is a placeholder that was never wired up.
