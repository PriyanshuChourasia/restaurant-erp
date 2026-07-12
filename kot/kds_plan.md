# Module 9: Kitchen Display System (KDS) — real terminal experience

See [`README.md`](./README.md) for full background/goal. Depends on:
[`kitchen-routing_plan.md`](./kitchen-routing_plan.md) (module 3),
[`queue-management_plan.md`](./queue-management_plan.md) (module 4),
[`kot-lifecycle_plan.md`](./kot-lifecycle_plan.md) (module 5) — this
module is the presentation layer over data those three already produce
(resolved station, queue position/wait time, SLA elapsed-time); it
doesn't introduce new domain data itself, it makes that data usable on an
actual kitchen terminal instead of an admin-style web page.

## What

`KotDisplayPage.tsx` today is a general admin page — a browser tab with a
mouse-driven grid, a manual station filter, and `refetchInterval: 10000`
polling (`KotDisplayPage.tsx:32`). That's workable for a manager glancing
at a monitor, but it isn't a real KDS: no per-station dedicated terminal
identity, no push updates (up to a 10-second delay before a new ticket
appears), no audible/visual "new ticket" alert, no touch-first bump-bar
controls, and no way to run it fullscreen/kiosk-mode on a mounted kitchen
screen without someone driving a mouse. Confirmed by grep: no websocket/
SSE dependency exists anywhere in `apps/api` (`socket.io`,
`@nestjs/websockets`, `EventEmitter2` — none present) — today's "live"
board is 100% polling.

## Files

- **New** `apps/api/src/kot/entities/kds-terminal.entity.ts` —
  `KdsTerminal` (id, `stationKey: KotStation`, `label` e.g. "Tandoor
  Screen 1", `lastSeenAt: Date | null`, `isActive`). This is the display
  analog of `kitchen-routing_plan.md`'s `printerDeviceId` — a physical
  screen registered against a station, so "this terminal only shows
  tandoor tickets" is a real, queryable assignment instead of a manual
  dropdown a kitchen staffer might forget to set correctly every shift.
- `apps/api/src/kot/kot.module.ts` — add
  `@nestjs/event-emitter` (or the project's chosen realtime approach —
  confirm none is already a dependency elsewhere in the monorepo before
  introducing a new one) so `KotService.create()`/station-split creation
  emits a `kot.created` event, and `updateItemStatus()`/`updateStatus()`
  emit `kot.updated`.
- **New** `apps/api/src/kot/gateways/kds.gateway.ts` — a WebSocket
  gateway (`@nestjs/websockets` + `socket.io`) that:
  - Lets a client join a room keyed by station (`socket.join(station)`
    after authenticating which `KdsTerminal` it is).
  - Relays `kot.created`/`kot.updated` events (scoped to the affected
    station's room) so a terminal gets pushed the new/changed ticket
    instantly instead of waiting for its next poll.
  - Keep the existing `GET /kots/active` REST endpoint as the initial
    load / fallback — the gateway is additive for low-latency updates,
    not a full replacement, so a terminal that briefly disconnects can
    still recover via a normal refetch.
- `apps/api/src/kot/controllers/kot.controller.ts` — `POST
  /kds-terminals/register` (a terminal announces itself + its station on
  startup), `PATCH /kds-terminals/:id/heartbeat` (updates `lastSeenAt`,
  used for a "this screen went offline" alert elsewhere, e.g. the
  kitchen-routing admin panel from module 3).
- **New** `apps/restaurant-ui/src/modules/kds/pages/KdsTerminalPage.tsx` —
  a distinct, fullscreen-first route from the existing
  `KotDisplayPage.tsx` (that page stays as the general/admin multi-station
  view; this is the single-station kiosk view meant to run on a mounted
  screen):
  - Locks to one station (set at terminal registration, not user-picked
    per session, so a kitchen screen can't accidentally start showing the
    wrong station after a browser refresh).
  - Subscribes to the WebSocket gateway for instant ticket updates,
    falling back to the existing polling if the socket disconnects.
  - Large, touch-first bump controls (start/ready per item, plus
    quantity/void actions from modules 8 and 11, sized for a kitchen
    environment, not a mouse-driven admin table).
  - Audible alert (a short chime) + brief visual flash on a genuinely new
    ticket arriving, distinct from a status update on an existing one.
  - A "fullscreen/kiosk" toggle (`requestFullscreen()`), since this page
    is meant to run unattended on a mounted display, not in a browser tab
    with visible chrome.
- `apps/restaurant-ui/src/components/layout/AppSidebar.tsx` — the new
  `/kds` route is deliberately **not** added to the main sidebar nav (it's
  meant to be opened directly on a dedicated kitchen terminal via a fixed
  URL/QR code, not navigated to from the admin shell) — confirm this
  choice with the user before wiring it into the general nav, since it
  changes how kitchen staff are expected to reach it.

## Verification

- `apps/api`: `tsc --noEmit`; a lightweight gateway test asserting a
  `kot.created` event for a tandoor KOT reaches only clients in the
  `tandoor` room, not `beverages`.
- Manual: register a terminal for `tandoor`, open `/kds` on a second
  browser/device pointed at that terminal, create a tandoor order from
  POS — confirm the ticket appears on the KDS terminal within roughly a
  second (not up to 10s), with a sound/flash, and that a non-tandoor
  order does **not** appear there.
- Disconnect network briefly on the KDS terminal, reconnect — confirm it
  recovers via the REST fallback rather than staying stuck showing stale
  data.
- Confirm the existing `/kot` admin page (`KotDisplayPage.tsx`) still
  works exactly as before — this module adds a new terminal experience,
  it doesn't replace the existing admin board.
