# Rule: Ledger Data Is Append-Only

Ledger data (`apps/api/src/ledger/entities/ledger.entity.ts` — `LedgerEntry`, and by
extension `LedgerAccount` balances derived from it) must never be modified or
deleted after creation. The only permitted operation is **create**.

## The rule

- No `UPDATE` on a `LedgerEntry` row, ever. Not via TypeORM `.save()` on a
  fetched entry, not via `.update()`, not via a raw query.
- No `DELETE` on a `LedgerEntry` row, ever. Not a hard delete, not a soft
  delete.
- To correct a mistake, write a new, opposite (reversing) entry that offsets
  the original. The original stays in the table, untouched, forever.
- Entries are strictly ordered by `entryDate` / `createdAt`. Never backdate an
  entry to slot it "before" something that already happened — sequence
  reflects when the entry was actually recorded.
- Every entry carries the `balanceAfter` it produced at the time it was
  written. Because entries are never edited, replaying them in order always
  reconstructs the exact historical state of an account at any point in time.

## Why

A ledger is only trustworthy if it's an audit trail. The moment a past entry
can be silently rewritten, the balance history stops proving anything — you
can no longer answer "what did this account look like on date X" with
certainty. Append-only + reversal-only-correction is what makes the ledger
auditable instead of just a mutable balance cache.

## What this means for the API (`apps/api/src/ledger`)

- `ledger.controller.ts` must never gain a `PATCH`/`PUT`/`DELETE` route for
  `entries/:id`. Only `POST entries` (create) and `GET` (read) are valid.
- `ledger.service.ts`'s `addEntry()` is the only way entries come into
  existence. Do not add an `updateEntry()` or `deleteEntry()` method — if a
  correction is needed, callers create a new entry with the inverse `type`
  (DEBIT ↔ CREDIT) and a `reference`/`description` pointing back at the entry
  it's correcting.
- `setOpeningBalance()` mutates `LedgerAccount.openingBalance` /
  `currentBalance` directly — this is account *configuration* (a starting
  point), not a rewrite of ledger history, so it's not a violation of this
  rule. It must still never be used to "fix" an account's balance after
  entries exist against it; use a reversing entry instead.

## Enforcement checklist for reviewers

When reviewing a PR that touches `apps/api/src/ledger/**`:
- [ ] No new endpoint or service method calls `entryRepo.update(...)`,
      `entryRepo.delete(...)`, `entryRepo.remove(...)`, or re-`save()`s an
      entry object that was fetched from the DB rather than newly `create()`d.
- [ ] Any "fix a mistake" feature is implemented as a new offsetting entry,
      not an edit.
- [ ] Timestamps/sequencing on new entries are not backdated ahead of
      already-existing entries.
