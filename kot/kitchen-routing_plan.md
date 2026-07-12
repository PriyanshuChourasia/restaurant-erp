# Module 3: Kitchen Routing (dynamic station/printer assignment, rerouting)

See [`README.md`](./README.md) for full background/goal. Depends on:
[`station-routing_plan.md`](./station-routing_plan.md) (module 2) — that
module gives every item a **default** station; this module is the
routing *engine* that decides where a KOT actually goes at the moment
it's created, which is more than a static lookup once real kitchens are
involved (a station can be closed, overloaded, or a ticket can need
splitting further than a simple per-item default allows).

## What

Module 2 solves "what station does this item usually go to." This module
solves the harder, still-unaddressed problem: **routing decisions that
change based on real kitchen state**, none of which exist today
(confirmed by grep — `KotStation` is a static enum with no concept of a
station being open/closed, no physical printer/device mapping, no
override mechanism):

1. **Station availability** — if `tandoor` is marked closed/down (e.g.
   end of shift, equipment issue), items normally routed there need a
   fallback (`main_kitchen` as a manual catch-all, or a configured
   substitute station per item) instead of silently creating a ticket at
   a station nobody's watching.
2. **Printer/device mapping** — a `KotStation` is a logical grouping;
   physically, each station usually has its own KOT printer or KDS
   terminal. Nothing today maps `KotStation` → a physical output target,
   so "print this ticket at the tandoor printer" isn't actually possible
   yet, only "filter the shared KOT board by station" (which is what
   `KotDisplayPage.tsx`'s station filter does today — a software filter,
   not a routing decision).
3. **Manual reroute / override** — floor or kitchen management should be
   able to move an already-created KOT to a different station (e.g. the
   tandoor line is slammed, manager reroutes a couple of tickets to
   `main_kitchen` to keep things moving) without voiding and recreating
   it.

## Files

- **New** `apps/api/src/kot/entities/kitchen-station.entity.ts` —
  `KitchenStation` (id, `stationKey: KotStation` unique, `label`,
  `isOpen: boolean`, `printerDeviceId: string | null`,
  `fallbackStationKey: KotStation | null`). This turns `KotStation` from
  a bare enum into a configurable, queryable row per station — the enum
  stays as the stable identifier, this table adds the runtime state
  around it.
- `apps/api/src/kot/services/kot.service.ts` (or a new
  `KitchenRoutingService` if `KotService` is getting large — check its
  line count at implementation time before deciding):
  - `resolveStation(requestedStation: KotStation): Promise<KotStation>` —
    looks up `KitchenStation` for the requested key; if `isOpen: false`,
    follow `fallbackStationKey` (one level — guard against a fallback
    chain that loops back on itself); used by module 2's
    station-grouping logic instead of trusting the item's
    `defaultStation` blindly.
  - `rerouteKot(kotId, newStation, reason)` — updates `Kot.station`,
    stamps a note (reuse the existing `notes` field or add a dedicated
    `rerouteReason`), and — important — does **not** reset any item's
    prep status; a ticket already `preparing` at the wrong station
    physically needs the food moved, this just corrects the system's
    record of where it lives.
- `apps/api/src/kot/controllers/kot.controller.ts` — `GET
  /kitchen-stations`, `PATCH /kitchen-stations/:key` (toggle open/closed,
  set printer/fallback), `PATCH /kots/:id/reroute`.
- `apps/api/src/database/database-seed.service.ts` — seed one
  `KitchenStation` row per existing `KotStation` enum value, `isOpen:
  true`, no fallback by default.
- Frontend: **new** small admin panel (near
  `apps/restaurant-ui/src/modules/settings/pages/SettingsPage.tsx` or a
  dedicated `kitchen-stations` page — check `SettingsPage.tsx`'s existing
  structure before picking) to toggle a station open/closed and set its
  fallback; `KotDisplayPage.tsx` gets a "Reroute" action per KOT card.
- Printer integration itself (actually sending a print job to
  `printerDeviceId`) is explicitly **out of scope** here — this module
  only adds the *mapping*; wiring to real hardware/print spooling is a
  separate, later effort once a specific printer/KDS vendor is chosen.
  Don't build print-driver code speculatively.

## Verification

- `tsc --noEmit` in both apps.
- Close `tandoor` with `fallbackStationKey: main_kitchen` — create an
  order with a tandoor item — confirm the resulting KOT actually lands on
  `main_kitchen`, not a phantom closed station.
- Reroute an in-progress KOT — confirm its items' individual statuses are
  untouched, only `station` changes, and it now appears under the new
  station's filter on `/kot`.
- Configure a self-referential fallback (station A falls back to itself,
  or A→B→A) — confirm `resolveStation` detects and rejects the loop
  instead of recursing forever.
