**Date:** 2026-07-08
**Prompt:** "Email: admin@restaurant.com Password: Admin@123456 this credentials
has to be in the text boxes right so i can click right signin and get signed
iin" — i.e. pre-fill the login form with the demo credentials and make sign-in
actually work.

## What was done

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

## Verification

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

## Outcome

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
