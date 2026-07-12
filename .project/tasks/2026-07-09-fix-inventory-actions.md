**Date:** 2026-07-09
**Prompt:** "inventory fix it"

## What was done

Drove `/inventory` in a real browser (same headless-Chromium approach as the POS
fix earlier today) to find the actual problem rather than guess. The list view
itself loaded fine, but all three action buttons were dead: **Add Item**,
**Adjust**, and **History** rendered as plain `<button>` elements with no
`onClick` at all — clicking them did nothing (no dialog, no error, no network
call). The backend API, the frontend `inventory.api.ts` client, and the
`useInventoryQueries.ts` React Query hooks (`useSetOpeningBalance`,
`useAdjustStock`, `useStockMovements`) already existed and worked — only the UI
to invoke them was missing.

Built the missing UI:
- `apps/restaurant-ui/src/modules/inventory/components/InventoryModal.tsx` — a
  small reusable centered modal (backdrop, `role="dialog"`, `aria-modal`,
  Escape-to-close), following the same dialog conventions already used by
  `OrdersPage.tsx`'s slide-out drawer.
- `apps/restaurant-ui/src/modules/inventory/dialogs/AdjustStockDialog.tsx` —
  form for adjustment_in/out, wastage, transfer_in/out with quantity,
  reference, notes; calls `useAdjustStock`.
- `apps/restaurant-ui/src/modules/inventory/dialogs/StockHistoryDialog.tsx` —
  lists stock movements (type, timestamp, reference/notes, before→after
  balance) via `useStockMovements`.
- `apps/restaurant-ui/src/modules/inventory/dialogs/AddInventoryItemDialog.tsx` —
  search-and-pick from the Items module (`getItems`), then set opening
  quantity + unit cost via `useSetOpeningBalance` (this endpoint upserts, so it
  doubles as both "start tracking a new item" and "re-set" an existing one).
- Wired all three into `InventoryPage.tsx`: added `itemId` to the row shape
  (the table only had the inventory record's own `id`, not the underlying
  item id the mutations need), added dialog-open state, and gave the
  previously-inert buttons real `onClick` handlers.

Verified end-to-end in the browser: Adjust Stock on "Butter Chicken" (+5,
+5 across two runs) updated the stock column live (50 → 55 → 60); Stock
History on the same row showed the adjustment with its reference and type;
Add Item search found "Chicken Tikka" and opened the opening-balance form.
Zero console/network errors across all three flows. `tsc --noEmit` clean on
both apps, `pnpm build` succeeds.

## Outcome

Inventory's core write actions (add/track item, adjust stock, view movement
history) work. Not done / found but out of scope for this task:
- The **Filters** button next to the search box is also unwired — but search
  and the Active/Discontinued/All status pills already cover the filtering
  that exists server-side, so this button doesn't block a real workflow the
  way the other three did.
- There's no way to set/edit `minStockLevel` from the UI — the backend only
  sets it to `0` on creation via `setOpeningBalance`; no endpoint updates it
  after the fact. Matches the open question already flagged in
  `.project/docs/inventory-management-module-spec.md` about negative-stock/
  threshold policy needing a real product decision.
