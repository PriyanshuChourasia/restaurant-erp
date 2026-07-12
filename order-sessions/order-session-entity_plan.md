# Module 1: `OrderSession` / `OrderSessionItem` entities

See [`README.md`](./README.md) for full background/goal. Depends on: —

## What

Add the entity that represents "this table's open, unbilled order right
now" — something that today simply doesn't exist (a table is either
`occupied` or not, with no queryable content). Model it as its own
aggregate rather than bolting fields onto `Table` or `Invoice`, since a
session outlives any single KOT round and precedes the eventual invoice.

## Files

- **New** `apps/api/src/order-sessions/entities/order-session.entity.ts`:
  ```ts
  export enum OrderSessionStatus {
    OPEN = 'open',
    SETTLING = 'settling',   // between "settle" click and invoice creation succeeding — see settlement_plan.md
    BILLED = 'billed',
    VOIDED = 'voided',
  }

  @Entity('order_sessions')
  @Index('idx_order_session_status', ['status'])
  export class OrderSession {
    id: string;
    tableIds: string[] | null;      // simple-json, mirrors the existing Invoice/Kot pattern
    customerId: string | null;
    openedBy: string | null;        // user id
    status: OrderSessionStatus;
    invoiceId: string | null;       // set once settled (module 4)
    notes: string | null;
    openedAt: Date;
    closedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }

  @Entity('order_session_items')
  export class OrderSessionItem {
    id: string;
    orderSessionId: string;         // FK, CASCADE
    round: number;                  // 1, 2, 3... which "send to kitchen" batch this belongs to
    itemId: string;
    itemName: string;
    quantity: number;
    instructions: string | null;
    status: 'ordered' | 'served' | 'cancelled';
    addedAt: Date;
  }
  ```
  Deliberately does **not** store price/GST here — that's resolved once,
  at settlement time (module 4), the same way `SalesService.create()`
  resolves it today. Storing a price at order time and re-resolving a
  different one at settlement (if a price-level or menu price changed
  mid-session) would silently produce a bill that doesn't match what was
  quoted — an open question worth flagging to the user: should the price
  be locked in at the moment an item is added to a round, or resolved
  fresh at settlement? Recommend locking it in at add-time (what the
  customer was quoted when they ordered it), which means adding
  `unitPriceSnapshot`/`gstRateSnapshot` columns after all — flag this
  explicitly before implementing module 4 rather than picking silently.
- **New** `apps/api/src/order-sessions/order-sessions.module.ts`,
  **new** `apps/api/src/order-sessions/services/order-sessions.service.ts`
  with just the lifecycle basics for this module:
  - `open(tableIds, customerId?, userId?)` — reject if any table already
    has an `OPEN`/`SETTLING` session (one active session per table at a
    time — merging tables is module 3's concern, not silently allowed
    here).
  - `findOpenByTable(tableId)` — used by the POS table picker (module 5)
    to resume an existing session instead of always creating a new one.
  - `void(id, reason)` — for an abandoned/mistaken session with no
    committed rounds yet (walked-out table, opened by accident).
- `apps/api/src/app.module.ts` — register `OrderSessionsModule`.
- `apps/api/src/seating/entities/table.entity.ts` — no schema change
  needed; `Table.status` continues to just mean occupied/available,
  session content lives entirely in the new entity, looked up by
  `tableIds` overlap rather than a FK on `Table` (a table doesn't "belong"
  to a session in a way that needs a foreign key — a session references
  tables, not the reverse, since multiple tables can share one session
  once module 3's merge exists).

## Verification

- `tsc --noEmit` in `apps/api`.
- `open()` rejects a second concurrent open session on the same table;
  `findOpenByTable()` returns the right session or null.
- New `order-sessions.service.spec.ts` covering the above.
