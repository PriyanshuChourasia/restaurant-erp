**Date:** 2026-07-15
**Prompt:** (mid-turn follow-up to the POS charge fix) "if order is cancelled before payment and build the voucher management system for payment" — scoped via AskUserQuestion to: (1) a Cancel action on an already-created invoice that reverses stock/tables/KOT/accounting, and (2) a full double-entry voucher suite (Payment/Receipt/Journal vouchers backed by a real Chart of Accounts and Journal Entries), not just a sketch.

## What was done

Planned via EnterPlanMode/ExitPlanMode (plan at `~/.claude/plans/swift-sniffing-pizza.md`) after two parallel Explore agents mapped the cancellation-reversal building blocks and the ledger/module scaffolding. Implemented in 10 tracked steps:

### Accounting core (`apps/api/src/ledger/`)
- **Chart of Accounts:** `LedgerAccount` gained `accountType` (asset/liability/equity/revenue/expense, not nullable) and `code`. This fixes the exact bug flagged in the earlier audit — `LedgerService.addEntry()`'s balance formula previously always did `+amount` for CREDIT / `-amount` for DEBIT regardless of account type; it's now `accountType`-aware (debit-normal vs credit-normal), and `addEntry` accepts an optional transactional `EntityManager`.
- **New `JournalEntry` header table** (`journal_entries`) + nullable `journalEntryId` on `LedgerEntry`. New `JournalService.post()` validates `sum(debit) === sum(credit)`, wraps the whole posting in one DB transaction (previously `InventoryService.postLedgerForMovement` did 2-4 unguarded sequential `addEntry` calls with no atomicity), and `JournalService.reverse()` posts a mirror-image reversing entry.
- `InventoryService.postLedgerForMovement` refactored to build a lines array and call `journalService.post()` once — same postings as before, now atomic and linked.

### Voucher module (new `apps/api/src/vouchers/`)
- `Voucher` entity (Payment/Receipt/Journal types, POSTED/CANCELLED status, `journalEntryId`, `referenceInvoiceId`). `VouchersService.createPaymentVoucher/createReceiptVoucher/createJournalVoucher` each build balanced lines and post through `JournalService`; `cancelVoucher` reverses the linked journal entry. `POST /vouchers/{payment,receipt,journal}`, `GET /vouchers`, `POST /vouchers/:id/cancel`, all permission-gated (`vouchers.*`, added to `PermissionModule` enum + seed's `MODULES`/`EXTRA_PERMISSIONS`/cashier role).

### POS Charge now posts real accounting (closes the gap from the earlier audit)
- `SalesService.create()`: cash/card/upi/online → auto-creates a Receipt Voucher (Debit Cash/Bank, Credit Sales Revenue + GST Payable). `credit` → posts a bare Journal Entry (Debit Accounts Receivable, Credit Sales Revenue + GST Payable), no voucher yet since nothing was received. `Invoice` gained `journalEntryId`/`voucherId` columns.

### Invoice cancellation (`SalesService.cancel()`, new `POST /sales/:id/cancel`)
- Reverses stock (new `RecipesService.reverseOnSale`, mirrors `deductOnSale`; falls back to `InventoryService.adjustStock(..., ADJUSTMENT_IN, ...)` for non-recipe items), releases tables, cancels linked KOTs (new `KotService.findByOrderId`), and reverses accounting (`VouchersService.cancelVoucher` or `JournalService.reverse`). Guards against cancelling an already-cancelled/completed invoice. `PATCH /sales/:id/status` now delegates to `cancel()` when status is `cancelled` so the reversal can't be bypassed.

### Frontend
- New `apps/restaurant-ui/src/modules/vouchers/` module (types, api, `VouchersPage` list + type-picker, `PaymentVoucherForm`/`ReceiptVoucherForm`/`JournalVoucherForm` dialogs with live balance validation on the journal form). New `/vouchers` route + sidebar entry under Finance.
- `SalesPage.tsx`: wired the previously-dead "View" button to the `ReceiptDialog` built earlier this session (reused, not rebuilt), added a "Cancel" button (`PurchasesPage`-style mutation + `window.confirm`, hidden once cancelled/completed).

### Live DB migration
- `synchronize: true` crashed the running API on the first save after adding `accountType` (NOT NULL, no default) to the already-seeded 13-row `ledger_accounts` table — Postgres refuses that ALTER on non-empty tables. Fixed by hand via `psql`: created the enum type, backfilled `account_type` for all 13 existing accounts by name, inserted the new `Accounts Receivable` account, then set the column `NOT NULL`. Restarted the API — `synchronize` then cleanly created `journal_entries`/`vouchers` (new empty tables) and the nullable `invoices.journalEntryId`/`voucherId` columns with no further intervention.

### Verification
- Both apps typecheck clean (only the two pre-existing stale spec-file errors noted in the prior task file remain, unaffected by this work).
- `curl`-driven backend test: charging a cash invoice moved Cash Account (asset) +366 on DEBIT, Sales Revenue (revenue) +348.55 and GST Payable (liability) +17.45 on CREDIT — concrete proof the `accountType`-aware balance formula is correct. Cancelling that invoice reversed all three balances exactly back to baseline; a second cancel attempt correctly 400'd.
- Playwright-driven frontend test: created a Payment Voucher and a Journal Voucher through the UI (balanced-lines validation visible live), then on `/sales` used View (opens the shared `ReceiptDialog`) and Cancel (row flips to "cancelled", Cancel button disappears, daily GST total updates) — zero console/network errors.

## Outcome

POS charging, invoice cancellation, and a real double-entry voucher system are all live and verified end-to-end. Known deliberate scope limits, not bugs: Payment/Receipt vouchers support one line per side in the current UI (backend supports multi-line `debitLines`/`creditLines` arrays already, form just doesn't expose it yet); Sales/Purchase vouchers were not built as separate documents since `Invoice`/`Purchase` already serve that role and now post their own journal entries. `ReportsService`'s balance-sheet/ledger-statement/profit-loss methods were left untouched — they read `LedgerEntry` directly and keep working unchanged since the new `journalEntryId` column is additive/nullable.
