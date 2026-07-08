**Date:** 2026-07-08
**Prompt:** Build complete restaurant POS billing system with GST (India), KOT, purchase, sales, inventory, ledger, reports. Keep NestJS/React stack.

## What was done

### Backend (NestJS) — New Modules
- **Auth upgrade** — Refresh token entity, repository, token rotation (access + refresh tokens), logout/logoutAll endpoints
- **Items module** — Entity with GST rates, HSN codes, units, veg/non-veg. Full CRUD + search + pagination
- **Inventory module** — Opening balance, stock movements (IN/OUT/adjustment/wastage), low stock alerts, stock adjustments
- **Purchases module** — Purchase orders with supplier tracking, GST calculation on purchases, status workflow (draft→ordered→received→cancelled)
- **Suppliers module** — Supplier CRUD with GSTIN, contact info, search
- **Sales module** — Invoice generation with full GST breakdown (CGST/SGST/IGST), payment methods (cash/card/UPI/online), daily sales, sales reports, GST reports
- **KOT module** — Kitchen Order Tickets with station assignment (main kitchen, tandoor, beverages, desserts, snacks), item-level status (pending→preparing→ready→served), auto-KOT status updates
- **Ledger module** — Financial accounts with opening balance, credit/debit entries, balance sheet, entry categories
- **app.module.ts** — Updated with all 7 new modules registered

### Frontend (React) — New/Updated Pages
- **Auth upgrade** — AuthContext with login/logout/refresh, AxiosClient with interceptor for auto-token-refresh with request queuing
- **Dependencies** — Upgraded React 18→19, added TanStack Table, TanStack Form
- **Items pages** — List with search/pagination, create with GST preview, GST rate filter pills
- **POS Terminal** — Complete rewrite: real items from API, GST billing (CGST/SGST breakdown), invoice creation + KOT generation, payment method selection, table assignment
- **KOT Board** — Kitchen display with station filtering, item-level status controls, auto-refresh every 10s, print support
- **Sales page** — Invoice list, daily sales summary, GST amounts visible
- **Purchases page** — Purchase list with status filters, supplier details
- **Ledger page** — Balance sheet (credits/debits/net), accounts list, transaction entries per account
- **Sidebar** — Completely reorganized with POS, KOT, Items, Categories, Inventory, Purchases, Sales, Ledger, Reports sections
- **All TypeScript errors fixed** — Both backend and frontend compile clean

### Key Architecture Decisions
- Items store GST-inclusive prices; taxable value calculated as price / (1 + rate/100)
- GST split equally: 50% CGST + 50% SGST (intra-state Indian GST model)
- KOT auto-ups from item status: any started → PREPARING, all done → READY
- Refresh token rotation: old token revoked on each refresh (security best practice)
- Token refresh with request queuing prevents race conditions on concurrent 401s

## Outcome
Zero TypeScript errors in both apps. Full restaurant management system with GST billing, KOT, inventory with opening balance, financial ledger, and comprehensive reporting. The structure stays true to the existing NestJS + React monorepo architecture.
