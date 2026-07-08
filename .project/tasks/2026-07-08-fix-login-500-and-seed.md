**Date:** 2026-07-08
**Prompt:** Fix login 500 error and database seed not working (TypeORM DataTypeNotSupportedError on Supplier.gstin)

## What was done

- **Diagnosed root cause:** API server was crashing on startup with `DataTypeNotSupportedError: Data type "Object" in "Supplier.gstin"` — the same TypeORM `string | null` gotcha documented in knowledge.md. The null TS union type gets erased to `Object` by decorator metadata, and TypeORM can't determine the DB column type without an explicit `type:` in `@Column`.

- **Fixed 8 nullable string columns** across 4 entity files that had `length:` but no `type:` in their `@Column` decorator:
  - `Supplier.gstin`, `Supplier.contactPerson`
  - `Invoice.customerName`, `Invoice.customerPhone`, `Invoice.customerGstin`, `Invoice.tableNumber`
  - `LedgerAccount.financialYear`
  - `Kot.tableNumber`

- **Verified zero remaining vulnerabilities** — grep of all 43 `@Column` with `nullable: true` across all 12 entity files confirmed every one now has an explicit `type:`.

- **Verified the fix:** Started the API server (`node dist/main.js`), all 13 modules initialized without error, all 90+ routes mapped. Login endpoint returned 200 with valid JWT access token + refresh token + user profile.

## Outcome

Login works end-to-end. API server starts clean with all modules registered. Seed data persisted (already seeded from prior session).
