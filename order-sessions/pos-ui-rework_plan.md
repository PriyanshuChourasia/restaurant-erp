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
