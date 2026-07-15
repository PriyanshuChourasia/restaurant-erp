# Task Group: Auth & Login Flow

Tasks grouped: `2026-07-08-demo-login-password.md`, `2026-07-08-wire-real-login.md`, `2026-07-08-fix-login-500-and-seed.md`, `2026-07-08-fix-dashboard-auth-flow.md`, `2026-07-08-add-logout-option.md`, `2026-07-08-profile-api.md`

---

## Task: Demo login password

**Date:** 2026-07-08
**Prompt:** "always put a demo login password on sign in"

### What was done

`apps/restaurant-ui/src/modules/auth/pages/LoginPage.tsx` already had a
"Demo Credentials" box showing `admin@restaurant.com`, but the password was
masked as `••••••••`. Replaced the mask with the actual seed password
(`Admin@123456`), matching the `admin@restaurant.com` demo user seeded by
`apps/api/src/database/database-seed.service.ts`.

### Outcome

The login page now shows real, usable demo credentials. Verified against the
seed data in `2026-07-08-seed-backend-data.md` — login with these credentials
succeeds against the real API.

---

## Task: Wire real login

**Date:** 2026-07-08
**Prompt:** "Email: admin@restaurant.com Password: Admin@123456 this credentials
has to be in the text boxes right so i can click right signin and get signed
iin" — i.e. pre-fill the login form with the demo credentials and make sign-in
actually work.

### What was done

The login page (`LoginPage.tsx`) previously had empty fields and a fake
`handleSubmit` (`setTimeout`, no real API call) — so even with credentials
typed in, nothing would actually sign anyone in. Wired it up for real:

- `apps/restaurant-ui/vite.config.ts`: added a dev server proxy
  (`/api` → `http://localhost:3000`) so relative `/api/*` axios calls resolve
  to the backend during `pnpm dev`. This was already assumed by the existing
  `category.api.ts` module (`BASE_URL = '/api/categories'`) but the proxy
  never existed — so category API calls were already silently broken in dev
  before this fix too.
- Added `apps/restaurant-ui/src/modules/auth/api/auth.api.ts` and
  `.../auth/types/auth.types.ts` — a `login()` call matching the existing
  direct-axios pattern used elsewhere in the codebase.
- Added `apps/restaurant-ui/src/lib/session.ts` — minimal token storage
  (`localStorage`) that also sets `axios.defaults.headers.common.Authorization`
  so every subsequent axios call in the app (category API, etc.) is
  authenticated after login. `restoreSession()` is called once in `main.tsx` so
  a session survives a page reload.
- `LoginPage.tsx`: email/password state now defaults to the demo credentials
  (`admin@restaurant.com` / `Admin@123456`); `handleSubmit` calls the real
  login API, stores the token via `setAccessToken`, navigates to `/orders` on
  success, and shows an error banner (new `.login-error` style in
  `global.css`) on failure instead of failing silently.

### Verification

No browser tool was available directly, and this repo has no existing "run"
project skill, so a one-off Playwright script was used (via `npx
playwright-core`, installed ad hoc in the scratchpad dir — not added as a repo
dependency). Started the real API (`NODE_ENV=development`, seeded dev DB) and
a separate UI dev instance on port 5174 (5173 was already occupied by a
pre-existing dev server not started by this session — left untouched).
Screenshots confirmed: fields pre-filled correctly, clicking "Sign in"
authenticates, navigates to `/orders`, and `accessToken` lands in
`localStorage`. One pre-existing unrelated console warning surfaced (Base UI
`nativeButton` prop warning, not caused by this change).

### Outcome

Demo login is now fully functional, not just cosmetic. `tsc --noEmit` and
`eslint` both clean after the change.

**Caller action needed**: the user's own already-running dev server (port
5173) was started before `vite.config.ts` was edited — Vite does not hot-reload
its config file, so that session needs a restart (`pnpm dev` again) to pick up
the new `/api` proxy before login will work there.

Not done (out of scope for this ask, would be separate feature work): no
route-guard/protected-route pattern exists (any route is reachable without
being signed in), and the sidebar's user display (`John Doe / Admin`) is still
static placeholder data, not wired to the actual authenticated user from
`login()`'s response.

---

## Task: Fix login 500 error and seed

**Date:** 2026-07-08
**Prompt:** Fix login 500 error and database seed not working (TypeORM DataTypeNotSupportedError on Supplier.gstin)

### What was done

- **Diagnosed root cause:** API server was crashing on startup with `DataTypeNotSupportedError: Data type "Object" in "Supplier.gstin"` — the same TypeORM `string | null` gotcha documented in knowledge.md. The null TS union type gets erased to `Object` by decorator metadata, and TypeORM can't determine the DB column type without an explicit `type:` in `@Column`.

- **Fixed 8 nullable string columns** across 4 entity files that had `length:` but no `type:` in their `@Column` decorator:
  - `Supplier.gstin`, `Supplier.contactPerson`
  - `Invoice.customerName`, `Invoice.customerPhone`, `Invoice.customerGstin`, `Invoice.tableNumber`
  - `LedgerAccount.financialYear`
  - `Kot.tableNumber`

- **Verified zero remaining vulnerabilities** — grep of all 43 `@Column` with `nullable: true` across all 12 entity files confirmed every one now has an explicit `type:`.

- **Verified the fix:** Started the API server (`node dist/main.js`), all 13 modules initialized without error, all 90+ routes mapped. Login endpoint returned 200 with valid JWT access token + refresh token + user profile.

### Outcome

Login works end-to-end. API server starts clean with all modules registered. Seed data persisted (already seeded from prior session).

---

## Task: Fix dashboard auth flow

**Date:** 2026-07-08
**Prompt:** Fix auth flow — after login, land on dashboard (not orders). Move login to /login route, put dashboard at /.

### What was done

- **Created `routes/login.tsx`** — new route at `/login` showing LoginPage (moved from root)
- **Created `modules/dashboard/pages/DashboardPage.tsx`** — proper dashboard overview with KPI cards (revenue, orders, avg value, occupancy), revenue trend chart, popular items list, recent orders table, quick action buttons
- **Updated `routes/index.tsx`** — now imports DashboardPage instead of LoginPage at `/`
- **Updated `LoginPage.tsx`** — redirects to `/` (dashboard) instead of `/orders` after successful login
- **Updated `AppLayout.tsx`** — `/login` gets no layout (standalone), `/` gets DashboardLayout with sidebar
- Fixed unused `useQuery` import in DashboardPage
- 0 TypeScript errors

### Outcome

Auth flow: `/login` → login → `/` (dashboard with sidebar). The sidebar's "Dashboard" link already pointed to `/`, so it works correctly.

---

## Task: Add logout option

**Date:** 2026-07-08
**Prompt:** Add logout option to the UI

### What was done

- **AppSidebar.tsx** — Added a red-styled "Logout" button with `LogOut` icon in the sidebar footer. Wired to `useAuth().logout()` + navigate to `/login`. Replaced hardcoded "John Doe / Administrator" with real user data from AuthContext (initial, name, role).
- **DashboardHeader.tsx** — Added a user dropdown menu (click user avatar to open) showing user email and a "Logout" action. Replaced hardcoded "John Doe / Admin" with real user data from AuthContext.
- Sidebar still shows logout button even when collapsed (icon only, tooltip shows "Logout").
- **Logout flow**: calls `POST /api/auth/logout` with refresh token, clears localStorage, navigates to `/login`.
- 0 TypeScript errors.

### Outcome

Users can now log out from both the sidebar (persistent button) and the header (dropdown menu). The UI now shows the real logged-in user's name, role, and email instead of the old hardcoded "John Doe" placeholders.

---

## Task: Profile API

**Date:** 2026-07-08
**Prompt:** Create a profile API that loads after login or when the dashboard loads

### What was done

#### Frontend changes

1. **`apps/restaurant-ui/src/modules/auth/types/auth.types.ts`**
   - Extended `AuthUser` interface: added `phone`, `roleName`, `isActive`, `createdAt`, `updatedAt`
   - Added `ProfileResponse` interface matching the backend's `GET /api/auth/profile` response shape

2. **`apps/restaurant-ui/src/lib/auth-context.tsx`**
   - Added `fetchProfile()` method to `AuthContext` — calls `GET /api/auth/profile`, maps response to `AuthUser`, merges permissions from localStorage, falls back to stored user on network error
   - **On mount**: replaces the old `localStorage`-only restore with a real backend profile fetch (with localStorage fallback)
   - **After login**: after setting user from login response, fetches fresh profile from backend for the most up-to-date data
   - Exposed `fetchProfile` in context value for consumer components
   - Removed unused `useRef` import

3. **`apps/restaurant-ui/src/modules/user/pages/ProfilePage.tsx`**
   - Wired to `useAuth()` for real user data instead of hardcoded defaults
   - Shows loading spinner when user data isn't available yet
   - Added quick info card displaying user avatar initial, name, email, role badge, and phone
   - Calls `fetchProfile()` after profile update to refresh displayed data

#### Backend
- No changes needed — `GET /api/auth/profile` already existed and returns the correct user data (minus permissions)

### Outcome

Profile data now loads from the backend on every app mount and after login, ensuring fresh data rather than stale localStorage values. The ProfilePage shows real user info instead of hardcoded placeholder text. TypeScript typecheck passes with 0 errors. All 81 existing unit tests pass.
