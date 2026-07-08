**Date:** 2026-07-08
**Prompt:** Fix auth flow — after login, land on dashboard (not orders). Move login to /login route, put dashboard at /.

## What was done

- **Created `routes/login.tsx`** — new route at `/login` showing LoginPage (moved from root)
- **Created `modules/dashboard/pages/DashboardPage.tsx`** — proper dashboard overview with KPI cards (revenue, orders, avg value, occupancy), revenue trend chart, popular items list, recent orders table, quick action buttons
- **Updated `routes/index.tsx`** — now imports DashboardPage instead of LoginPage at `/`
- **Updated `LoginPage.tsx`** — redirects to `/` (dashboard) instead of `/orders` after successful login
- **Updated `AppLayout.tsx`** — `/login` gets no layout (standalone), `/` gets DashboardLayout with sidebar
- Fixed unused `useQuery` import in DashboardPage
- 0 TypeScript errors

## Outcome

Auth flow: `/login` → login → `/` (dashboard with sidebar). The sidebar's "Dashboard" link already pointed to `/`, so it works correctly.
