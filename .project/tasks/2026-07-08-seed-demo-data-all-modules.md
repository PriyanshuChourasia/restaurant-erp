**Date:** 2026-07-08
**Prompt:** Seed some demo data in every terminal

## What was done

Extended the `DatabaseSeedService` to seed demo data for ALL transactional modules:

### DatabaseModule (`apps/api/src/database/database.module.ts`)
- Added imports + TypeOrmModule.forFeature for: StockMovement, LedgerEntry, Invoice, InvoiceItem, Kot, KotItem, Purchase, PurchaseItem

### DatabaseSeedService (`apps/api/src/database/database-seed.service.ts`)
- **Stock movements**: Opening balance of 50 for each of the 15 seeded items
- **Purchases**: 3 purchase orders (2 received, 1 ordered) from different suppliers with line items
- **Invoices**: 6 invoices (5 completed, 1 confirmed) with GST-calculated line items, CGST/SGST breakdown, customer names, tables, and payment methods
- **KOTs**: 3 kitchen order tickets (main kitchen preparing, tandoor preparing, beverages pending) with item-level instructions
- **Ledger entries**: Double-entry style — debit cash/credit sales revenue/credit GST payable for each invoice; debit purchase account/debit GST input credit for each purchase

### Key design decisions
- All seeding is idempotent (checks row counts before inserting)
- GST calculated as CGST (rate/2) + SGST (rate/2) per item
- Invoice and KOT items reference seeded menu items by index (matching DEMO_ITEMS order)
- Legacy seed methods unchanged (permissions, roles, users, categories, suppliers, items, inventory, ledger accounts)

### Fixed
- One TS6133 type error in auth.service.spec.ts (`mockResolvedValue(null)` cast)

## Outcome
All backend modules now have realistic demo data. TypeScript typecheck passes with 0 errors. Run the API server to auto-seed on a fresh database.
