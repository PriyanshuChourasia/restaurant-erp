# API Module AGENTS.md Documentation

**Date:** 2026-07-17

**Prompt:** Make sure every module in api should have Agent.md having help info with schema defined.

**What was done:**
- Created 27 `AGENTS.md` files across all NestJS modules in `apps/api/src/`
- Each file documents:
  - Module overview and purpose
  - Entity schemas (all columns, types, descriptions)
  - API endpoints (method, path, permissions, description)
  - Key module dependencies
- Modules covered: auth, users, roles, permissions, category, items, sales, orders, kot, inventory, purchases, suppliers, customers, reservations, seating, price-levels, units, recipes, item-suppliers, ledger, vouchers, organization, dashboard, reports, developer, shared, database

**Outcome:** All 27 API modules now have comprehensive AGENTS.md documentation with schema references and endpoint guides.
