# Module 5: POS UI rework — session-first flow

See [`README.md`](./README.md) for full background/goal. Depends on:
modules 1–4 (all backend pieces must exist first — this module is purely
frontend wiring against them).

## What

Confirmed in `apps/restaurant-ui/src/modules/pos/pages/POSDashboard.tsx`:
today's flow is table-select (`handleSeatToggle`, lines 86-90) → build a
cart → one `billMutation` that does invoice+KOT together and clears the
cart. Rework this into a session-first flow:

1. Selecting a table checks for an existing open session
   (`GET /order-sessions?tableId=`) and resumes it (loads its running
   bill + rounds so far) instead of always starting a blank cart.
2. If no open session exists, selecting a table (or adding the first
   item) opens one.
3. "Send to Kitchen" replaces part of what `billMutation` did — calls
   `POST /order-sessions/:id/rounds` with just the newly-added cart items
   since the last send, clears only the "pending round" part of the cart
   (not the whole session), and refreshes the running bill.
4. A visible running-bill panel (module 3) shows all rounds sent so far
   with a live total, distinct from the "items not yet sent" staging
   cart.
5. "Settle Bill" replaces the rest of `billMutation` — calls
   `POST /order-sessions/:id/settle`, shows the resulting invoice/receipt,
   returns to table selection.
6. **Ready-to-serve alerts + mark served.** Confirmed nowhere in this
   codebase today: nothing ever sets `KotStatus.SERVED`/`Kot.servedAt`
   (`../kot/kot-lifecycle_plan.md`'s elapsed-time badge and
   `../kot/inventory-timing_plan.md`'s "deduct at served" option both
   reference `servedAt`, but no UI action writes it), and
   `KotService.getActiveKots` only returns `pending`/`preparing`
   statuses — the moment a KOT flips to `ready`, it vanishes from
   `/kot`'s board with no screen surfacing "this table's food is ready
   to go out" to whoever's actually running food, and no way to record
   that it was delivered. This is a front-of-house gap, not a kitchen
   one, so it belongs on the session/running-bill panel a waiter is
   already looking at (module 3), not on the kitchen board.
   - The running-bill panel polls (or, once available, subscribes to)
     KOT status for the session's own KOTs and shows a distinct
     "Ready — take to table" badge per round the moment its KOT hits
     `ready`, plus a toast/sound the first time a session the current
     user has open goes ready (session-scoped, so a waiter isn't pinged
     about every table in the restaurant — see Files below).
   - A "Mark Served" action per ready round calls the existing
     `PATCH /kots/:id/status` with `status: 'served'` (already sets
     `servedAt` in `KotService.updateStatus` — no backend change needed
     for the basic case). This does **not** settle the bill or free the
     table — that's still module 4's `settle()`, a separate, later
     action; a table can have food served and still be sitting there
     eating before anyone asks for the check.

## Ready-alert scope note

Only the in-app case above is in scope here. A customer-facing alert
(SMS/a public display) would need an SMS provider or a kiosk-mode public
route, neither of which exists in this codebase today (no provider
config/API keys anywhere in `apps/api`) — that's a separate, later
feature with its own provider-selection decision, not part of this
module.

## Files

- `apps/restaurant-ui/src/modules/order-sessions/api/order-sessions.api.ts`
  (**new** module, mirrors the existing `pos`/`kot` module structure) —
  `getOpenSessionForTable`, `openSession`, `addRound`, `getRunningBill`,
  `settleSession`.
- `apps/restaurant-ui/src/modules/pos/pages/POSDashboard.tsx` — significant
  rework:
  - Table selection (`handleSeatToggle` / whatever the table picker
    becomes once `../floorplan/` table-entity work is in) triggers
    `getOpenSessionForTable` and either resumes or opens a session.
  - Split the current single cart into "staged" (added, not yet sent)
    and "sent" (already in a round, shown via the running bill) — a
    waiter should be able to keep adding items to the staging area across
    multiple trips to the table before hitting "Send to Kitchen".
  - Replace `billMutation` with two separate mutations:
    `sendRoundMutation` (staged cart → `addRound`, clears only staged
    items) and `settleMutation` (→ `settle`, resets the whole screen).
  - Keep the existing GST/subtotal calculation logic
    (`POSDashboard.tsx:92-105`) — it becomes the "staged round preview"
    calculation; the running-bill total (module 3) is a separate,
    session-scoped total shown alongside it.
- `apps/restaurant-ui/src/modules/kot/api/kot.api.ts` /
  `apps/restaurant-ui/src/modules/pos/api/pos.api.ts` — remove
  `createKot` from the POS API surface per
  `../kot/session-linkage_plan.md`.
- **New** `apps/restaurant-ui/src/components/notifications/ToastProvider.tsx` —
  a small global toast context (no new dependency; this repo has zero
  toast libraries installed today — confirmed in
  `apps/restaurant-ui/package.json`). Generalizes the existing
  page-local `modules/settings/components/SuccessToast.tsx` visual
  language (rounded card, icon, fade-in) into a fixed-position stack any
  page can push to via `useToast().show(...)`, since the ready-alert
  needs to fire regardless of which screen is currently open, not just
  from whichever component made the state change. Mount it once at the
  app root/layout.
- Running-bill panel component (module 3's frontend piece) — polls the
  session's KOT status on the same cadence as `KotDisplayPage.tsx`'s
  existing `refetchInterval: 10000`; on a `preparing`→`ready` transition
  it hasn't already alerted on this session, calls
  `useToast().show(...)` and renders the "Ready — take to table" badge
  + "Mark Served" button described above.

## Verification

- `tsc --noEmit` in `apps/restaurant-ui`.
- Manual, full flow: pick a table (no existing session) → add 2 items →
  Send to Kitchen → confirm a KOT appears on `/kot` and the running bill
  panel shows those 2 items → add 3 more items → Send to Kitchen again →
  confirm a second KOT appears and running bill now shows 5 items → hit
  Settle Bill → confirm exactly one invoice is created, receipt shown,
  table returns to available, and reselecting that table starts a fresh
  session rather than resuming the now-billed one.
- Navigate away mid-session (browser refresh) and reselect the same
  table — confirm the open session and its rounds-so-far are correctly
  resumed rather than lost (this is the core reason the session state
  needs to be server-persisted, not just React state).
- Ready-alert/mark-served: from `/kot`, mark a session's KOT ready (or
  "Mark All Ready"). Within one poll cycle (~10s), confirm the
  running-bill panel shows the "Ready — take to table" badge and a
  toast fires — even if the POS screen showing that panel isn't the one
  that changed the KOT's status. Click "Mark Served" — confirm
  `Kot.servedAt` is set (check via `GET /kots/:id`) and the table is
  **not** freed and the session is **not** closed (that only happens at
  `settle()`).
