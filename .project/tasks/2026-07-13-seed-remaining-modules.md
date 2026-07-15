# 2026-07-13 — Seed data for all remaining modules

## Ask

User asked: "seed data for every other module" — seed demo data for all pending modules that have entities/tables already created.

## What was done

Two files changed:

### `apps/api/src/database/database-seed.service.ts`
Added **7 new seed methods** called from `onApplicationBootstrap`:
1. `seedSecondStorageUnit()` — Creates **Kitchen Cold Room** (`StorageUnitType.COLD_STORAGE`, code `KITCHEN`)
2. `seedBatches(items)` — Creates **StockBatch** records for items with `shelfLifeDays > 0` (4 items seeded)
3. `seedCustomers()` — Creates **5 demo customers** (Rahul, Priya, Amit, Neha, Vikram)
4. `seedPriceLevels(items)` — Creates **3 price levels** (Standard/Corporate/Premium) with **30 item price mappings** (15 items × 2 non-default levels)
5. `seedRecipes(items)` — Creates **5 recipes** linking menu items to ingredient items (Butter Chicken → Chicken Tikka + Naan, etc.)
6. `seedReservations()` — Creates **5 reservations** with various statuses (confirmed, pending, completed, cancelled)
7. `seedStockCounts(items)` — Creates **1 completed stock count** with 4 lines (2 with deliberate variances)

Added 9 new `@InjectRepository()` constructor injections + entity imports for the above.

### `apps/api/src/database/database.module.ts`
Added 9 missing entity registrations to `TypeOrmModule.forFeature()` — this was a **critical fix** that caused the server to fail on startup with DI errors for `StockBatchRepository`, etc.

### Seed verification (all passed)

| Entity | Count | Status |
|--------|-------|--------|
| storage_units | 2 | ✅ |
| stock_batches | 4 | ✅ |
| customers | 5 | ✅ |
| price_levels | 3 | ✅ |
| item_price_levels | 30 | ✅ |
| recipes | 5 | ✅ |
| recipe_ingredients | 6 | ✅ |
| reservations | 5 | ✅ |
| stock_counts | 1 | ✅ |
| stock_count_lines | 4 | ✅ |
