# 2026-07-11 — Fixed 500 on Customer Save & Recipes Module Build Errors

## Prompt

Customer save not working in POS — "Request failed with status code 500".

## What Was Done

### Root Cause 1: TypeORM union-type bug on Customer entity

- `Customer.entity.ts` had `@Column({ length: 255, nullable: true }) email!: string | null;`
  without `type: 'varchar'`. TypeORM cannot infer column type from union
  types (`string | null`), defaults to `Object`, which PostgreSQL rejects with
  `DataTypeNotSupportedError`.
- Same issue on `gstin` column.
- **Fix**: Added `type: 'varchar'` to both `@Column` decorators. This is the
  same class of bug as documented in `.project/knowledge.md` (nullable-column
  gotcha + decimal transformer gotcha).

### Root Cause 2: Recipes module build errors (pre-existing)

Discovered when the build cache was invalidated by the Customer entity change.
Seven build errors existed:

1. **Bad import paths in `recipes.module.ts`**: Used `../entities/recipe.entity`
   instead of `./entities/recipe.entity` (same for services, controllers,
   repositories — all 5 imports wrong).
2. **Missing `production-entry.entity.ts`**: The `ProductionEntry` entity was
   defined inside `recipe.entity.ts` but imported as a separate file by the
   module, repository, service, and interface.
3. **Interface mismatch**: `IProductionEntryRepository.findByItem` return type
   was missing `page` and `limit` which the implementation returns.

**Fixes**:
- Corrected all import paths in `recipes.module.ts` (relative → `./`)
- Extracted `ProductionEntry` into its own file at
  `recipes/entities/production-entry.entity.ts`
- Updated `IProductionEntryRepository.findByItem` return type to include
  `page` and `limit`
- Updated `ProductionEntryRepository.findByItem` return type to match

## Outcome

- `npx nest build` passes clean (only pre-existing test spec errors remain)
- The 500 error on customer creation in POS should be resolved
- The recipes module now compiles and can be used

## Files Changed

- `apps/api/src/customers/entities/customer.entity.ts` — added `type: 'varchar'`
- `apps/api/src/recipes/entities/production-entry.entity.ts` — **created**
- `apps/api/src/recipes/entities/recipe.entity.ts` — removed `ProductionEntry`
- `apps/api/src/recipes/recipes.module.ts` — fixed import paths
- `apps/api/src/recipes/interfaces/recipe-repository.interface.ts` — fixed return type
- `apps/api/src/recipes/repositories/recipe.repository.ts` — fixed return type
