**Date:** 2026-07-08
**Prompt:** Update database name from restaurant_erp_dev to restaurant_erp to match user's connection string `postgresql://primesysindia@localhost:5432/restaurant_erp?schema=public`

## What was done

- Asked user to confirm the intent (update env vs. just note it vs. support URL format)
- Updated `apps/api/.env.development`: changed `DB_NAME=restaurant_erp_dev` → `DB_NAME=restaurant_erp`
- Verified the `restaurant_erp` database exists with all 18 tables and seed data present

## Outcome

Config updated. User needs to restart `pnpm dev` to pick up the change.
