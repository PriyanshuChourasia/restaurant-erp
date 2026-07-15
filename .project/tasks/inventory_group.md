# Task Group: Inventory Module

Tasks grouped: `2026-07-09-inventory-module-functional-spec.md`, `2026-07-09-fix-inventory-actions.md`

---

## Task: Inventory module functional spec

**Date:** 2026-07-09
**Prompt:** Design and document a complete Inventory Management Module for a single
restaurant, as a pure business/functional specification (no tech stack, no code) — covering
Units, Categories, Items, Suppliers, Purchases, Goods Receipt, Stock Adjustments, Stock
Consumption, Stock Transfer, Waste Management, Stock Count, and Inventory Reports, each with
business purpose, functional requirements, user stories, workflows, business rules,
validation rules, lifecycle, fields, relationships, search/filter/sort, bulk ops,
import/export, audit, permissions, error scenarios, edge cases, and future extensibility —
plus a data dictionary, ER overview, state diagrams, permission matrix, and implementation
recommendations.

### What was done

- Reviewed existing domain model for grounding (not for prescribing tech): `item.entity.ts`,
  `inventory.entity.ts`, `supplier.entity.ts`, `purchase.entity.ts`, and the seeded roles
  (admin, manager, chef, cashier, waiter, staff) already used by `database-seed.service.ts`,
  so the spec's permission matrix and terminology align with what's already live in this
  project rather than being invented in a vacuum.
- Wrote the full specification to
  `.project/docs/inventory-management-module-spec.md` (~17 sections): module overview,
  guiding assumptions, master data hierarchy, all 12 sub-module specs in full template
  detail, end-to-end workflow, cross-module integration map, global business rules (GR-1
  through GR-8 — transaction-sourced stock, purchases-aren't-stock, configurable negative
  stock, immutability, traceability, referential protection, valuation consistency,
  value-based approval), data dictionary, ER overview, consolidated state diagrams,
  permission matrix, audit/logging standards, cross-cutting error/edge-case catalogue,
  future roadmap, implementation recommendations, assumptions, and glossary.
- Recommended (not implemented) a new **Storekeeper/Inventory** role, since none of the
  existing seeded roles cleanly own day-to-day receiving/adjustments/counts today; spec
  defaults that role's permissions to Manager until introduced.

### Outcome

- Deliverable is a standalone functional spec document, no code changes. Intended to be
  handed to engineering as the source of truth for building out the real inventory
  sub-modules (only a partial `inventory`/`items`/`purchases`/`suppliers` implementation
  exists in the codebase today — this spec is considerably broader, e.g. no Goods Receipt,
  Stock Transfer, Waste Management, or Stock Count exist yet).
- Follow-up (not started): actually implementing any of the 12 sub-modules; introducing the
  recommended Storekeeper role and its permissions; deciding the negative-stock and
  over-receipt-tolerance policies called out as "explicit decisions needed early" in the
  spec's Implementation Recommendations (§15).

---

## Task: Fix inventory actions

**Date:** 2026-07-09
**Prompt:** "inventory fix it"

### What was done

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

### Outcome

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
