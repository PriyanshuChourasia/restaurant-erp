**Date:** 2026-07-08
**Prompt:** "always put a demo login password on sign in"

## What was done

`apps/restaurant-ui/src/modules/auth/pages/LoginPage.tsx` already had a
"Demo Credentials" box showing `admin@restaurant.com`, but the password was
masked as `••••••••`. Replaced the mask with the actual seed password
(`Admin@123456`), matching the `admin@restaurant.com` demo user seeded by
`apps/api/src/database/database-seed.service.ts`.

## Outcome

The login page now shows real, usable demo credentials. Verified against the
seed data in `2026-07-08-seed-backend-data.md` — login with these credentials
succeeds against the real API.
