**Date:** 2026-07-09
**Prompt:** "fix pos first"

## What was done

Drove the actual running app (API on :3001, Vite on :5173, both already up) with a
headless-Chromium/Playwright script to find the real bug rather than guessing —
logged in as `admin@restaurant.com`, opened `/pos`, and found two independent bugs:

1. **POS Terminal crashed on load** — `TypeError: item.price.toFixed is not a
   function`, caught by the route's error boundary ("Something went wrong!").
   Root cause: `pg`/TypeORM returns `decimal`/`numeric` columns as JS **strings**
   at runtime, but every entity typed them as `number` with no transformer, so
   `Item.price`/`costPrice` (and the same pattern in Sales, Purchases, Ledger,
   Inventory, KOT) were silently strings despite the TS type. Fixed by adding
   `apps/api/src/shared/transformers/decimal.transformer.ts` (a TypeORM
   `ValueTransformer` doing `parseFloat` on read) and applying it to every
   `@Column({ type: 'decimal', ... })` across `item.entity.ts`, `sales.entity.ts`,
   `purchase.entity.ts`, `ledger.entity.ts`, `inventory.entity.ts`, `kot.entity.ts`.
   Verified via `GET /api/sales` that invoice totals now come back as real JSON
   numbers, not strings.
2. **Category filter pills silently empty, `/api/categories` always 401** —
   `apps/restaurant-ui/src/modules/category/api/category.api.ts` imported the raw
   `axios` package instead of the app's configured `apiClient` (from
   `src/lib/axios-client.ts`), so it never got the `Authorization: Bearer` header
   the auth interceptor attaches. Every other module's `*.api.ts` already used
   `apiClient` — this one file was the odd one out. Fixed by switching the import
   and base URL (`apiClient`'s `baseURL` already includes `/api`, so `BASE_URL`
   dropped the `/api` prefix) and swapping all `axios.*` calls to `apiClient.*`.

Verified end-to-end in a real browser after both fixes: login → `/pos` → category
pills load → add 3 items to cart → GST breakdown computes correctly → select
Table 3 + UPI → Charge → "Invoice created & KOT sent to kitchen!" with zero
console/network errors. `apps/api` full test suite (145 tests) still passes.

## Outcome

POS Terminal (billing + KOT generation) works end-to-end again. Not done / found
but out of scope for this task:
- `apps/api` `tsc --noEmit` has 4 pre-existing type errors in `items.service.spec.ts`,
  `kot.service.spec.ts`, `sales.service.spec.ts` — the latter two still reference a
  `tableNumber` (singular) field that was renamed to `tableNumbers` (array) at some
  earlier point; tests still pass because `jest`/`ts-jest` here doesn't hard-fail on
  type errors, but the spec files are stale and should be updated to match the
  current `tableNumbers` API.
- No route guard for unauthenticated access still applies (pre-existing, noted in
  earlier session).
