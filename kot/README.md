# KOT Management — Module Index

## Background

This is a NestJS (`apps/api`) + React/TanStack Router (`apps/restaurant-ui`)
restaurant ERP monorepo. Confirmed by reading the actual KOT code path
(`apps/api/src/kot/`, `apps/restaurant-ui/src/modules/kot/`,
`apps/restaurant-ui/src/modules/pos/`):

- **`apps/api/src/kot/entities/kot.entity.ts`** — `Kot` (kotNumber, orderId,
  `seatIds: string[] | null`, status, station, notes, prepared/started/
  completed/served timestamps) + `KotItem` (itemId, itemName, quantity,
  instructions, per-item status). `KotService.updateItemStatus()`
  auto-rolls the parent KOT's status up from its items (`ready` once all
  items are `ready`/`served`, `preparing` once any item has started) —
  this part is solid.
- **A real field-naming bug exists today, not a hypothetical one.**
  `apps/api/src/seating/` already went through a `Seat` → `Table` rename
  (confirmed: `table.entity.ts`, `tables.service.ts`, `TablesService` all
  exist; no `seats.service.ts` remains). But `Kot.seatIds` /
  `Invoice.seatIds` were never renamed to match (tracked as still-pending
  in `../floorplan/sales-kot-rename.md`). On top of that, the **frontend
  KOT read path uses a third, different name**:
  `apps/restaurant-ui/src/modules/kot/api/kot.api.ts` declares
  `Kot.tableNumbers: string[] | null`, and
  `apps/restaurant-ui/src/modules/kot/pages/KotDisplayPage.tsx:90` reads
  `kot.tableNumbers`. The backend response actually contains `seatIds`
  (soon `tableIds`), never `tableNumbers` — so **the table/seat label on
  the KOT board is silently always blank today**. Confirmed further:
  `apps/api/src/kot/services/kot.service.spec.ts` (lines 111, 131) also
  uses `tableNumbers` in its mock DTO and asserts `repo.create` was
  called with `tableNumbers: [...]`, but `KotService.create()` only ever
  reads `dto.seatIds` (`kot.service.ts:33,42`) — so that assertion is
  checking a field the service never sets. This spec is currently
  asserting against dead code, not verifying real behavior.
- **KOT creation is single-station, no matter what's ordered.** Confirmed
  in `apps/restaurant-ui/src/modules/pos/pages/POSDashboard.tsx:119-131`:
  every checkout creates exactly **one** KOT with `station:
  'main_kitchen'` hardcoded, containing every cart item regardless of
  category — even though `KotStation` already defines `tandoor`,
  `beverages`, `desserts`, `snacks` and the KOT board
  (`KotDisplayPage.tsx`) already has a station filter UI expecting KOTs
  to actually be split across stations. A drinks order and a tandoor
  order for the same table currently land on the same physical kitchen
  ticket.
- **KOT and billing are fused into one action.** `POSDashboard.tsx`'s
  `billMutation` calls `createInvoice()` then immediately `createKot()` in
  the same click — there is no "send this round to the kitchen, keep the
  table open, bill later" flow. This is the KOT side of a bigger gap
  covered separately in **`../order-sessions/`** — that folder owns
  fixing the underlying session model; this folder's
  [`session-linkage_plan.md`](./session-linkage_plan.md) is the thin
  adapter that makes KOT creation follow whatever that model becomes.
- **No KOT-level correction/visibility tools**: no void/cancel for a
  KOT or KOT item once sent (a customer changing their mind mid-prep just
  has no clean path), no reprint, no elapsed-time/SLA indicator on the
  board (`KotDisplayPage.tsx` shows a static list with no aging signal —
  a ticket sitting in `pending` for 25 minutes looks identical to one 30
  seconds old).
- Stock deduction for sold items happens at **invoice creation** time
  (`SalesService.create()` → `RecipesService.deductOnSale`), not at KOT
  "served" time — i.e. today, inventory books a sale before the kitchen
  has even started cooking it (checkout and KOT fire in the same click,
  per the point above). Whether that timing is correct or whether
  deduction should follow kitchen completion instead is a real product
  decision, not a bug — flagged as an open question in
  [`inventory-timing_plan.md`](./inventory-timing_plan.md), not silently
  changed.

## Goal

1. Fix the seat/table field bug so the KOT board actually shows which
   table an order is for. → **[`field-consistency-fix_plan.md`](./field-consistency-fix_plan.md)**
2. Give every item a default kitchen station, and split one order into
   multiple per-station KOTs instead of one monolithic ticket. → **[`station-routing_plan.md`](./station-routing_plan.md)**
3. Make station assignment a real routing *decision* — station open/
   closed state, fallback stations, manual reroute — not just a static
   per-item default. → **[`kitchen-routing_plan.md`](./kitchen-routing_plan.md)**
4. Order and prioritize the tickets that land at each station — queue
   position, rush/priority overrides, wait-time estimates, backlog
   visibility. → **[`queue-management_plan.md`](./queue-management_plan.md)**
5. Give kitchen/floor staff real control over a live KOT: void an item,
   reprint, see how long a ticket has been sitting. → **[`kot-lifecycle_plan.md`](./kot-lifecycle_plan.md)**
6. Stop fusing "send to kitchen" and "close the bill" into one action —
   adapt KOT creation to whatever the order-session model becomes. → **[`session-linkage_plan.md`](./session-linkage_plan.md)**
7. Decide (don't silently assume) when stock should actually leave
   inventory relative to KOT lifecycle. → **[`inventory-timing_plan.md`](./inventory-timing_plan.md)**
8. Manage individual `KotItem` lines on a *live* ticket — quantity
   corrections, mid-prep additions, per-item timing — not just whole-KOT
   status. → **[`line-item-management_plan.md`](./line-item-management_plan.md)**
9. Give kitchen terminals a real KDS experience — push updates, sound
   alerts, per-station kiosk screens — instead of a polled admin page. → **[`kds_plan.md`](./kds_plan.md)**
10. Support what a chef actually needs day-to-day once a ticket is in
    front of them: claim it, see the prep method, 86 a sold-out item,
    hold a course until it's time to fire it. → **[`chef-workflow_plan.md`](./chef-workflow_plan.md)**
11. Cancel a KOT or KOT item properly — structured reasons, approval
    gating on already-started work, stock reversal, and an alert to
    whoever's already cooking it — not just a bare status flip. → **[`kot-cancellation_plan.md`](./kot-cancellation_plan.md)**

## Modules

| # | Module file | Depends on | What it does |
|---|---|---|---|
| 1 | [`field-consistency-fix_plan.md`](./field-consistency-fix_plan.md) | — | `seatIds`→`tableIds` rename landed correctly end-to-end (backend + frontend + spec), no more `tableNumbers` ghost field |
| 2 | [`station-routing_plan.md`](./station-routing_plan.md) | 1 | Item→station default mapping; POS checkout splits cart into one KOT per station instead of one hardcoded `main_kitchen` ticket |
| 3 | [`kitchen-routing_plan.md`](./kitchen-routing_plan.md) | 2 | `KitchenStation` runtime state (open/closed, fallback, printer mapping) + manual reroute — turns the static default from module 2 into a real routing decision |
| 4 | [`queue-management_plan.md`](./queue-management_plan.md) | 3 | Per-station queue ordering by priority, queue position, backlog load, wait-time estimates |
| 5 | [`kot-lifecycle_plan.md`](./kot-lifecycle_plan.md) | 1, 2 | Reprint + elapsed-time SLA badges on the KOT board |
| 6 | [`session-linkage_plan.md`](./session-linkage_plan.md) | 2, 3, and [`../order-sessions/`](../order-sessions/README.md) | KOT creation becomes "add a round to an open session" instead of "fires alongside a one-shot invoice" |
| 7 | [`inventory-timing_plan.md`](./inventory-timing_plan.md) | 11 | Decision + implementation for when recipe stock deduction should actually fire relative to KOT status, incl. reversal on cancellation |
| 8 | [`line-item-management_plan.md`](./line-item-management_plan.md) | 6, 11 | Quantity/instruction edits and mid-prep item additions on a still-live KOT, plus per-item elapsed-time |
| 9 | [`kds_plan.md`](./kds_plan.md) | 3, 4, 5 | Real kitchen-terminal experience: WebSocket push, per-station kiosk screens, sound alerts, bump-bar controls |
| 10 | [`chef-workflow_plan.md`](./chef-workflow_plan.md) | 3, 4, 9, and [`../inventory/`](../inventory/README.md) | Ticket claiming, recipe/method visibility, 86 (sold-out) workflow, hold-and-fire course control |
| 11 | [`kot-cancellation_plan.md`](./kot-cancellation_plan.md) | 1 (basic); 7, 9, 10, [`../order-sessions/`](../order-sessions/README.md) (deeper integrations) | Structured cancel reasons, approval gating, stock reversal, KDS/chef alerting, billing exclusion |

Do modules 1–2 first, then **module 11's basic mechanism** can ship
early (right after module 1) since cancellation is needed by so much
else downstream — don't wait until the end of the folder to add it just
because its number is highest. Modules 3–5 are otherwise
self-contained and don't require the order-session work. Module 6 is
where this folder and `../order-sessions/` meet; don't start it before
that folder's `settlement_plan.md` module has landed. Module 7 depends on
module 11's basic mechanism (for the reversal hook) — build 11's basic
cancel first, then 7's timing decision, then wire 7's reversal call back
into 11's cancel path. Module 8 depends on both 6 and 11. Module 9 is a
presentation layer over 3/4/5 — do it once those are stable. Module 10
is the highest-touch module in the folder, reaching into
`../order-sessions/` and `../inventory/` — do it last.

## Pipeline — how the 9 modules connect

A single order's life through this folder's modules, end to end:

1. An order-session round is sent to the kitchen
   (`../order-sessions/add-round_plan.md`) → **module 6** turns that round
   into one or more `Kot` rows, one per resolved station.
2. Resolving *which* station each item goes to is **module 2**'s default
   lookup (`Item.defaultStation`), passed through **module 3**'s
   `resolveStation()` so a closed/overloaded station's ticket falls back
   correctly instead of landing somewhere nobody's watching.
3. Once a `Kot` exists at a station, **module 4** places it in that
   station's queue — ordered by priority and creation time, with a queue
   position and estimated wait time shown on the board.
4. While it's live, **module 5** gives staff reprint/SLA visibility,
   **module 11** lets anyone cancel it (with a reason, approval gating
   past `pending`, and stock/notification side effects), and **module 8**
   gives finer-grained control over individual lines within it (quantity
   fixes, mid-prep additions) without needing to cancel the whole ticket.
5. **Module 9** is the terminal that a real kitchen station actually
   looks at — it renders modules 3/4/5's routing, queue, and lifecycle
   data (and module 11's cancellation alerts) as a push-updated,
   sound-alerting kiosk screen instead of the general polled admin board.
6. **Module 10** is what the chef standing at that terminal actually does
   with a ticket: claim it, check the method, 86 an item that just ran
   out (blocking it further upstream at `../order-sessions/`'s round
   creation), or hold a course until the table's ready for it.
7. **Module 1** is a cross-cutting correctness fix (the table label needs
   to be right at every one of the steps above) and **module 7** is a
   cross-cutting decision about exactly when, in this pipeline, recipe
   stock actually leaves inventory — including the reversal module 11
   needs when something's cancelled after stock already moved.

Everything downstream of module 3 (routing) and module 6 (session
linkage) assumes those are in place — build bottom-up (1 → 2 → 11's basic
mechanism → 3 → 4 → 5, then 6, then 7/8, then 9, then 10 last), not by
picking modules out of order.

## Cross-module verification (after all 11 modules land)

- `apps/api`: `tsc --noEmit`; `kot.service.spec.ts` and
  `sales.service.spec.ts` pass with real field names (no `tableNumbers` in
  any mock), and cover priority ordering, station resolution/fallback,
  and reroute behavior.
- `apps/restaurant-ui`: `tsc --noEmit` for the `Kot`/`CreateKotRequest`
  type changes across `kot`, `pos`, and `order-sessions` modules.
- Manual walkthrough via the dev server, full pipeline:
  1. Open an order-session round (`../order-sessions/`) with a tandoor
     item, a beverage, and a main-kitchen item.
  2. Confirm `/kot` shows **three** separate KOTs (one per station), each
     correctly labeled with the table, each showing a queue position and
     wait estimate.
  3. Close the tandoor station (module 3) and send another round with a
     tandoor item — confirm it reroutes to the configured fallback
     station instead of creating an orphaned ticket.
  4. Mark one ticket high priority (module 4) — confirm it jumps to the
     front of its station's queue.
  5. Cancel one item on an in-progress KOT (module 11) with a structured
     reason — confirm it's removed from the active board, the parent
     KOT's auto-rollup status still computes correctly from the remaining
     items, and (once module 7 is in) its already-deducted stock is
     reversed.
  6. Add an extra item to that same in-progress KOT (module 8) — confirm
     it's visually flagged as an addendum, not silently merged.
  7. Leave a KOT in `pending` past its SLA threshold — confirm the
     elapsed-time indicator changes color on the board.
  8. Reprint a KOT — confirm it doesn't duplicate the ticket in the
     active list, just re-triggers the print.
  9. Open a registered KDS terminal for the tandoor station (module 9) —
     confirm a new tandoor order arrives with a sound/flash within about
     a second, and that non-tandoor orders never appear on that terminal.
  10. Claim a ticket as one chef (module 10) — confirm a second chef's
      claim attempt is rejected; 86 an item mid-service — confirm POS
      immediately blocks ordering it; send a round with an item held —
      confirm no KOT fires for it until explicitly fired later.
