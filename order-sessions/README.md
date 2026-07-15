# Order Session Management — Module Index

## Background

This is a NestJS (`apps/api`) + React/TanStack Router (`apps/restaurant-ui`)
restaurant ERP monorepo. Confirmed by reading the actual checkout code
path (`apps/api/src/sales/`, `apps/api/src/kot/`,
`apps/restaurant-ui/src/modules/pos/pages/POSDashboard.tsx`):

- **There is no "open running order" concept.** `Invoice.status`
  (`apps/api/src/sales/entities/sales.entity.ts:8-13`) defines a `DRAFT`
  state, but `SalesService.create()` (`sales.service.ts:157`) always
  hardcodes `status: InvoiceStatus.CONFIRMED` on creation — `DRAFT` is
  dead code, never actually reached. Every checkout is one atomic,
  immediately-finalized invoice.
- **Checkout and "send to kitchen" are the same click.** Confirmed in
  `POSDashboard.tsx`'s `billMutation` (lines 107-142): it calls
  `createInvoice()` then `createKot()` back-to-back for the whole cart.
  There is no way to send a starters round to the kitchen, let the table
  keep ordering, then send a mains round later, and bill once at the
  end — which is how table service actually works in any sit-down
  restaurant. Today, doing that would require creating a **second
  separate invoice** for the same table mid-meal, which fragments the
  bill and the GST reporting for what was really one dining visit.
  Alternatively staff just wait until everything's known before hitting
  checkout once — which means KOTs can't go to the kitchen until the
  whole order for the whole table is decided, killing the actual reason
  a KOT system exists (fire courses as they're ordered, not all at once
  at the end).
- **A table's "occupied" state carries no order content.**
  `apps/api/src/seating/entities/table.entity.ts` — `Table.status`
  (`available`/`booked`/`occupied`) is just a flag flipped by
  `TablesService.bulkUpdateStatus()` when an invoice is created
  (`sales.service.ts:172-173`) and released when
  `SalesService.clearSeats()` runs. There's no entity representing "what
  this table has ordered so far, across however many rounds, not yet
  billed" — occupancy and order content are two different concerns
  today, conflated into one boolean-ish status field.
- **No live running-bill preview.** A waiter/manager has no way to see
  "what does table 7 owe so far" before the final checkout screen — the
  POS cart is ephemeral client state that resets on `billMutation`
  success (`setCart([])` at `POSDashboard.tsx:138`), not a persisted,
  queryable session.
- No DB migration tooling exists in this repo (confirmed: no
  `migrations/` folder, `synchronize: true` outside production in
  `apps/api/src/app.module.ts`) — schema changes below apply
  automatically on next dev server start; flag to the user that existing
  dev `invoices`/`tables` data may need attention once `Table.status`
  gains a session dimension.

## Goal

Introduce a real **`OrderSession`**: an open, running order tied to one
or more tables, accumulating items across multiple "rounds" sent to the
kitchen over time, previewable as a live running bill, and only becoming
an actual `Invoice` (today's model, unchanged) at final settlement.

1. Model the open running order itself. → **[`order-session-entity_plan.md`](./order-session-entity_plan.md)**
2. Let staff add a round (send new items to the kitchen) without
   finalizing the bill. → **[`add-round_plan.md`](./add-round_plan.md)**
3. Show a live running bill, and support merging/splitting tables into
   one session. → **[`running-bill_plan.md`](./running-bill_plan.md)**
4. Finalize a session into the real `Invoice` at checkout time. → **[`settlement_plan.md`](./settlement_plan.md)**
5. Rework the POS UI around "open a session" / "send a round" / "settle"
   instead of one atomic checkout button, and give front-of-house staff
   a ready-to-serve alert + a way to record that food actually reached
   the table. → **[`pos-ui-rework_plan.md`](./pos-ui-rework_plan.md)**

This folder is a prerequisite for
[`../kot/session-linkage_plan.md`](../kot/session-linkage_plan.md) — that
module adapts KOT creation to whatever lands here. Don't start that KOT
module before [`settlement_plan.md`](./settlement_plan.md) (module 4
here) is done.

## Modules

| # | Module file | Depends on | What it does |
|---|---|---|---|
| 1 | [`order-session-entity_plan.md`](./order-session-entity_plan.md) | — | New `OrderSession`/`OrderSessionItem` entities, session lifecycle (`open`→`billed`/`voided`) |
| 2 | [`add-round_plan.md`](./add-round_plan.md) | 1 | "Send to kitchen" appends a round to an open session and creates KOTs for just the new items, without billing |
| 3 | [`running-bill_plan.md`](./running-bill_plan.md) | 1, 2 | Live running-bill preview; merge/split tables within a session |
| 4 | [`settlement_plan.md`](./settlement_plan.md) | 1, 2, 3 | Finalize an open session into a real `Invoice`, close the session, free the table(s) |
| 5 | [`pos-ui-rework_plan.md`](./pos-ui-rework_plan.md) | 1–4 | POS screen rework: table pick opens/resumes a session; distinct "Send to Kitchen" vs "Settle Bill" actions replace the single `billMutation`; running-bill panel alerts staff when a round's KOT goes `ready` and lets them mark it `served` |

## Worked example (referenced from every module)

1. Table 7 seated. Waiter opens an order session for Table 7 (module 1) —
   `OrderSession { status: open, tableIds: ['table-7'] }` created, table
   flips to `occupied`.
2. Starters ordered → "Send to Kitchen" (module 2): 2 `OrderSessionItem`
   rows added, one KOT created (station-routed per
   `../kot/station-routing_plan.md`) for just those 2 items. No invoice
   exists yet.
3. 15 minutes later, mains ordered → another "Send to Kitchen": 3 more
   `OrderSessionItem` rows added (round 2), a second KOT created for just
   those. Running bill (module 3) now shows all 5 items' running total.
4. Table asks for the bill → "Settle" (module 4): all 5
   `OrderSessionItem` rows are priced (reusing the existing price-level
   resolution from `SalesService.create()`) and turned into **one**
   `Invoice` with 5 line items, exactly like a single checkout would
   produce today. Session closes, table frees up.

## Cross-module verification (after all modules land)

- `apps/api`: `tsc --noEmit`; new/updated specs for `OrderSessionService`
  and the adjusted `SalesService`/`KotService` call sites.
- `apps/restaurant-ui`: `tsc --noEmit` for the reworked POS flow.
- Manual walkthrough via the dev server, following the worked example
  above end-to-end: open a session, send two separate rounds at least a
  minute apart, confirm the KOT board shows two separate tickets as they
  go out (not one combined ticket), confirm the running bill updates
  after each round, settle, confirm exactly one invoice with all 5 items
  and correct totals, confirm the table returns to `available`.
