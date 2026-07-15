**Date:** 2026-07-13
**Prompt:** Integrate FormattedQuantity into the POS billing screen and purchase receipts

## What was done

### POS Dashboard (`POSDashboard.tsx`)
- Added `unitCode` to `CartItem` interface and `addToCart()` passes `item.unit?.code || ''`
- Cart items show quantity with `FormattedQuantity` (e.g., "2 bowl" instead of just "2")
- Price per unit shown as `₹349.00 /bowl` instead of "each"
- Menu item cards display the serving unit code alongside GST rate and HSN code

### Purchase Detail Dialog (`PurchaseDetailDialog.tsx` — new)
- Fetches `GET /purchases/:id` with full item details
- Shows supplier, status, date, item count in info cards
- Items table with: item name+SKU, formatted quantity (via `FormattedQuantity`), unit price, GST rate, line total
- Totals section: subtotal, discount, tax, grand total
- Proper loading/error/empty states

### Purchases Page (`PurchasesPage.tsx`)
- Items column now shows Package icon with count ("3 items") instead of bare number
- "View" button wired to open `PurchaseDetailDialog` (was a dead `<button>` with no `onClick`)
- Added `detailTarget` state for dialog management

### Backend Fix
- `purchases.service.ts` `findById()` now loads `{ items: { item: { unit: true } } }` so the dialog can display item names and unit codes

## Outcome
Users can now see unit-aware quantities throughout the POS cart (e.g., "2 bowl" instead of "2") and the purchase detail dialog shows formatted quantities with full cost breakdown for each line item.
