**Date:** 2026-07-08
**Prompt:** Write test also for auth, user, category

## What was done

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

## Key gotchas documented in memory.md

- `jest.spyOn(bcrypt, ...)` fails → use `jest.mock('bcrypt', ...)`
- uuid v9+ is ESM-only → use `jest.mock('uuid', ...)`
- Standalone `jest.fn()` with `.mockResolvedValueOnce()` is more reliable than chaining on existing mock for variable call counts

## Outcome

All 81 tests pass with `npx jest`. No new dependencies or config changes needed.
