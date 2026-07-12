# Module 4: KOT Queue Management (per-station prep ordering, priority, wait-time)

See [`README.md`](./README.md) for full background/goal. Depends on:
[`kitchen-routing_plan.md`](./kitchen-routing_plan.md) (module 3) — a
queue is scoped to a resolved station, so tickets need to have already
landed at the right one.

## What

Confirmed in `apps/api/src/kot/services/kot.service.ts:83-90`:
`getActiveKots()` already returns pending/preparing KOTs
`ORDER BY kot.createdAt ASC` — i.e. today's "queue" is just strict FIFO by
creation time, with no way to prioritize, no visibility into how backed
up a station is, and no estimate of how long a new ticket will actually
wait. For a real kitchen, plain FIFO breaks down fast — a rush/VIP order,
a table that's been waiting 40 minutes, or a station that's visibly
underwater all need to change queue behavior, and none of that exists
today.

## Files

- `apps/api/src/kot/entities/kot.entity.ts` — add `priority: number`
  (default `0`, higher = more urgent) to `Kot`. Keep it a plain integer
  rather than an enum (`normal`/`rush`/`vip`) so ordering is a simple
  `ORDER BY priority DESC, createdAt ASC` — if named tiers are wanted in
  the UI, map integer ranges to labels client-side rather than
  constraining the column to a fixed enum.
- `apps/api/src/kot/services/kot.service.ts`:
  - `getActiveKots()` — order by `priority DESC, createdAt ASC` instead of
    just `createdAt ASC`, and include each KOT's **position in its
    station's queue** (`ROW_NUMBER()` over the same ordering, partitioned
    by station) in the response, so the board can show "#2 in queue" per
    ticket.
  - New `setPriority(kotId, priority)` — manual override, e.g. floor staff
    flagging a ticket as rush.
  - New `getStationLoad(station)` — count of active (`pending`+
    `preparing`) KOTs and total outstanding items at that station, for a
    "this station has 8 tickets backed up" indicator.
  - New `estimateWaitTime(kotId)` — rough estimate: `(queue position at
    this station) × (average historical prep time for this station over
    the last N completed KOTs, derived from `completedAt - createdAt` on
    recently `READY`/`SERVED` KOTs)`. Explicitly an estimate, not a
    promise — label it as such in the API response and UI so it doesn't
    read as a guaranteed SLA to customers.
- `apps/api/src/kot/controllers/kot.controller.ts` — `PATCH
  :id/priority`, `GET /kitchen-stations/:key/load`, `GET
  :id/estimated-wait`.
- Frontend `apps/restaurant-ui/src/modules/kot/pages/KotDisplayPage.tsx`:
  - Show queue position and estimated wait per card.
  - Show a per-station load summary in the station filter bar (e.g.
    "Tandoor (6 active, ~18 min backlog)" next to the existing filter
    buttons at `KotDisplayPage.tsx:62-71`).
  - "Bump to top" / priority toggle action per card (kitchen or floor
    staff marking a ticket urgent), calling `setPriority`.
  - Manual drag-to-reorder within a station's queue is **not**
    recommended as a first cut — priority + FIFO covers the real cases
    (rush orders, VIP tables) without needing free-form reordering, which
    would make wait-time estimation unreliable (there'd be no stable
    ordering rule left to estimate against). Flag to the user if they
    specifically want free-form manual reordering; don't build it
    speculatively.

## Verification

- `apps/api`: `tsc --noEmit`; extend `kot.service.spec.ts` — priority
  ordering beats creation-time ordering; queue position numbers are
  correct and station-scoped (a KOT at position 1 for `tandoor` doesn't
  affect `beverages`' numbering).
- Manual: create 3 KOTs at the same station in order, mark the 3rd as
  high priority — confirm it now shows queue position 1 and the others
  shift down. Complete a handful of KOTs at a station and confirm
  `estimateWaitTime` for a new ticket reflects the observed historical
  prep time, not a hardcoded constant.
