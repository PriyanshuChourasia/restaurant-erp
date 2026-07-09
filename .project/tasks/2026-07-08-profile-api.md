**Date:** 2026-07-08
**Prompt:** Create a profile API that loads after login or when the dashboard loads

## What was done

### Frontend changes

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

### Backend
- No changes needed — `GET /api/auth/profile` already existed and returns the correct user data (minus permissions)

## Outcome

Profile data now loads from the backend on every app mount and after login, ensuring fresh data rather than stale localStorage values. The ProfilePage shows real user info instead of hardcoded placeholder text. TypeScript typecheck passes with 0 errors. All 81 existing unit tests pass.
