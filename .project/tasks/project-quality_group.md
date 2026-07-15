# Task Group: Project-wide Error Fixes & Unit Tests

Tasks grouped: `2026-07-08-fix-all-project-errors.md`, `2026-07-08-unit-tests-auth-users-category.md`

---

## Task: Fix all project errors

**Date:** 2026-07-08
**Prompt:** Read `.project/prompt.md` and follow it, then fix all the errors in the
project.

### What was done

Ran typecheck, lint, build, and tests across both apps and fixed everything found:

#### `apps/api`
- Added missing `@types/bcrypt` and `@types/passport-jwt` devDependencies — these
  were the root cause of most `@typescript-eslint/no-unsafe-*` cascading errors.
- Removed unused imports/vars: `UseGuards`/`AuthGuard` in `auth.controller.ts`
  (dead — `JwtAuthGuard` is already applied globally via `APP_GUARD` in
  `app.module.ts`), unused `currentUserId` param + stale comment in
  `users.controller.ts` (the comment implied an authorization check that was
  never implemented — flagging as a possible follow-up, not implementing it here
  since that's a feature, not a lint fix), unused `desserts` seed var.
- Typed `UsersService.excludePassword` properly (`User -> Omit<User,
  'passwordHash'>`) instead of `any`, which resolved most of the unsafe-any
  cascade in `users.service.ts`.
- Fixed `JwtAuthGuard.handleRequest` to be generically typed instead of `any`.
- Replaced `expiresIn: ... as any` in `auth.module.ts` with a cast to
  `JwtSignOptions['expiresIn']`.
- Fixed `FindAllOptions.parentId` to allow `null` (category repository was
  force-casting `null as any` to query root categories; now typed correctly and
  converted to `IsNull()` consistent with the existing pattern elsewhere in the
  file).
- Added `ignoreRestSiblings: true` to the API's eslint config (standard rule for
  the password-exclusion destructuring pattern used across services).
- `main.ts`: `void bootstrap()` to silence the floating-promise warning.

#### `apps/restaurant-ui`
- Fixed missing `BreadcrumbItem` import in `category.api.ts` (used but never
  imported — real compile error).
- Removed several unused imports/vars across category components/pages
  (`FilterOption`, `ArrowUpDown`, `LucideIcon`, `StatusBadge`,
  `useCategoryTree`, `reset`, unused `activateMutation`/`deactivateMutation` on
  the details page — that page never renders an activate/deactivate control,
  unlike the list page).
- Fixed `CategoryTableProps.onActivate`/`onDeactivate` to return `Promise<void>`
  (they were typed `void` but `ActivateToggle` awaits them, and the real
  handlers are async) — real type error, not just cosmetic.
- **Real bug fix**: `CategoryTreePage.handleMove` received `targetParentId` from
  drag-and-drop (the drop target) but discarded it; the move dialog then opened
  pre-filled with the category's *current* parent instead of where it was
  dropped. Added `initialParentId` support to `MoveCategoryDialog` so
  drag-and-drop now pre-selects the actual drop target while still showing the
  true current location.
- Typed `EditCategoryPage.handleSubmit` values as `CategoryFormValues` instead
  of `any` (matches the sibling `CreateCategoryPage` already doing this
  correctly).
- Replaced `catch (err: any)` in `MoveCategoryDialog` with `axios.isAxiosError`
  narrowing.
- Fixed `@types/react`/`@types/react-dom` being pinned to `^19.x` while the
  actual `react`/`react-dom` dependency is `^18.2.0` — aligned types back to
  `^18.3.0` rather than upgrading the runtime (out of scope / much bigger
  change).
- Fixed the `lint` script glob (`src/**/*.ts` → `src/**/*.{ts,tsx}`) — it was
  silently skipping all 62 `.tsx` files, so most of the app was never linted.

#### Repo-level
- Root `package.json` was missing `@repo/eslint-config` as a devDependency even
  though root `.eslintrc.js` extends it — this broke `eslint` for
  `apps/restaurant-ui` (eslint 8, cascading config resolution) whenever it
  walked up to the root config. Added the dependency.
- Removed a stray, untracked root-level `package-lock.json` (npm) that
  coexisted with `pnpm-lock.yaml` even though the project pins
  `packageManager: pnpm@8.15.6` — dead weight, could confuse tooling about which
  package manager to use.

### Outcome

`pnpm build`, `pnpm lint`, and the API's `jest` suite are all green across the
whole monorepo (`@repo/api`, `@repo/restaurant-ui`, `@repo/ui`). No known
remaining errors.

Follow-ups noted but intentionally not done here (would be feature work, not
error fixes): `UsersController.update` has no real self-vs-admin authorization
check despite an old comment implying one; `CategoryDetailsPage` has no
activate/deactivate control even though the list page does.

Three more prompts landed in the same session right after this one — see
`2026-07-08-demo-login-password.md`, `2026-07-08-backend-dev-prod-envs.md`, and
`2026-07-08-seed-backend-data.md` (now consolidated into
`auth-login-flow_group.md` and `backend-env-docker-seed_group.md`).

---

## Task: Unit tests for auth, users, category

**Date:** 2026-07-08
**Prompt:** Write test also for auth, user, category

### What was done

Created 3 Jest unit test files for backend services:

1. **`apps/api/src/auth/services/auth.service.spec.ts`** (17 tests)
   - `login`: valid credentials, user not found, inactive account, wrong password
   - `refresh`: valid rotation, invalid token, expired token, inactive user after refresh
   - `logout` / `logoutAll`: delegates to repository
   - `register`: successful creation, email conflict, no default role configured
   - `getProfile`: found / not found

2. **`apps/api/src/users/services/users.service.spec.ts`** (18 tests)
   - `findAll` / `findOne` / `findByEmail`: password exclusion verified on all returns
   - `create`: success (bcrypt hash called), email conflict error, role not found error
   - `update`: success, not found, email conflict, role not found
   - `remove`: soft-delete success, not found
   - `restore`: success, not found (withDeleted), not-deleted conflict guard

3. **`apps/api/src/category/services/category.service.spec.ts`** (46 tests)
   - `create`: root + child creation, invalid slug, duplicate slug, parent not found, parent deleted, max depth exceeded, duplicate name under parent, negative display order
   - `findOne` / `findBySlug`: found with childrenCount, not found
   - `getTree`: hierarchy building, display order sorting
   - `getBreadcrumb` / `getChildren` / `getDescendants` / `getAncestors`: hierarchy traversal
   - `update`: success, not found, deleted category, duplicate slug, own slug allowed
   - `move`: to new parent (updateDescendantPaths verified), to root, not found, deleted, self-as-parent, circular reference, unchanged parentId
   - `remove`: no children, has children (force=false error), force-delete with descendants cascade
   - `restore`: success (updatedBy set), not found, not deleted error
   - `activate` / `deactivate`: toggle, not found, deleted category guard
   - `getRoots` / `findAll`: paginated results with childrenCount

### Key gotchas documented in memory.md

- `jest.spyOn(bcrypt, ...)` fails → use `jest.mock('bcrypt', ...)`
- uuid v9+ is ESM-only → use `jest.mock('uuid', ...)`
- Standalone `jest.fn()` with `.mockResolvedValueOnce()` is more reliable than chaining on existing mock for variable call counts

### Outcome

All 81 tests pass with `npx jest`. No new dependencies or config changes needed.
