**Date:** 2026-07-15
**Prompt:** "fix charge in pos on charge it should generate an invoice, also check if there is any invoice architecture like voucher, journal entry if this account setup we have in our system or not"

## What was done

- **Investigated Charge flow:** `SalesService.create()` (`apps/api/src/sales/services/sales.service.ts`) already persisted an `Invoice` row on every Charge — the backend was fine. The gap was entirely frontend: `POSDashboard.tsx` only flashed a 4s toast ("Invoice created & KOT sent to kitchen!") with no visible/printable receipt.
- **Built `ReceiptDialog`** (`apps/restaurant-ui/src/modules/pos/components/ReceiptDialog.tsx`): fetches the invoice via new `getInvoice()` (`pos.api.ts`) plus org settings (`useOrganization`), renders a receipt (restaurant header, invoice #, items, CGST/SGST, grand total, footer) with a Print button and a "Clear tables" action (moved in from the old toast). Opens automatically after `ChargeModal` confirms payment. Added print CSS scoping via `#receipt-print-area` in `global.css` (`@media print` hides everything else).
- **Found and fixed a real backend bug that 500'd every Charge:** both `SalesService.create()`'s direct-deduction path and `RecipesService.deductOnSale()`'s recipe-deduction path inserted `StockMovement` rows without `storageUnitId`, which is a NOT NULL column since inventory became storage-unit-scoped. Fixed by passing `storageUnitId: inv.storageUnitId` in both places (`sales.service.ts`, `recipes/services/recipes.service.ts`). Without this fix the new receipt dialog would never have anything to show — `POST /sales` was failing outright.
- **Verified end-to-end** with a throwaway Playwright script (login → `/pos` → add item → Charge → `ChargeModal` → confirm UPI → `ReceiptDialog` opens with correct invoice #, GST breakdown, grand total → Print fires `window.print()` cleanly, no console/network errors).
- **Architecture audit (as requested):** confirmed there is **no Voucher and no Journal Entry** anywhere in the codebase. There is a `LedgerAccount`/`LedgerEntry` module (`apps/api/src/ledger`), but it's a flat single-balance ledger — entries are only ever posted from inventory stock movements (`InventoryService.postLedgerForMovement`), **never from Sales/POS**. Charging an invoice does not touch the ledger.

## Outcome

POS Charge now works end-to-end and produces a visible/printable invoice receipt; previously it was silently broken (500 on every charge with recipe-linked or direct-inventory items). Ledger/accounting posting for sales remains unimplemented — flagged to the user, not built, since it wasn't asked for yet.

Mid-turn the user additionally asked to (1) handle order cancellation before payment and (2) build a "voucher management system for payment" — both raised scoping questions before implementation; see next task file for that thread.
