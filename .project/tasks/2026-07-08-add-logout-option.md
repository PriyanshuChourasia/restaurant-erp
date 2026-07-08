**Date:** 2026-07-08
**Prompt:** Add logout option to the UI

## What was done

- **AppSidebar.tsx** — Added a red-styled "Logout" button with `LogOut` icon in the sidebar footer. Wired to `useAuth().logout()` + navigate to `/login`. Replaced hardcoded "John Doe / Administrator" with real user data from AuthContext (initial, name, role).
- **DashboardHeader.tsx** — Added a user dropdown menu (click user avatar to open) showing user email and a "Logout" action. Replaced hardcoded "John Doe / Admin" with real user data from AuthContext.
- Sidebar still shows logout button even when collapsed (icon only, tooltip shows "Logout").
- **Logout flow**: calls `POST /api/auth/logout` with refresh token, clears localStorage, navigates to `/login`.
- 0 TypeScript errors.

## Outcome

Users can now log out from both the sidebar (persistent button) and the header (dropdown menu). The UI now shows the real logged-in user's name, role, and email instead of the old hardcoded "John Doe" placeholders.
