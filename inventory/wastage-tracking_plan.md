# Module 5: Reasoned wastage + auto-posted production shrinkage

See [`README.md`](./README.md) for full background/goal. Depends on:
[`ledger-integration_plan.md`](./ledger-integration_plan.md) (module 3) —
wastage needs to hit the Wastage & Spoilage account; and
[`batch-tracking_plan.md`](./batch-tracking_plan.md) (module 4) — expiry
sweep needs a `wastage` reason to post with.

## What

Two related gaps:

1. `wastage` is currently just a `MovementType` with a free-text `notes`
   field — no structured reason, so "why is food cost % high this month"
   can't be answered by cause.
2. **Trim/prep loss silently vanishes.** Confirmed in
   `RecipesService.createProductionEntry`
   (`apps/api/src/recipes/services/recipes.service.ts:163-235`): it posts
   a `PRODUCTION_CONSUMPTION` movement for the raw quantity consumed and a
   `PRODUCTION_YIELD` movement for the quantity produced — the difference
   (e.g. 20 kg whole chicken in, 14 kg boneless out — 6 kg of bone/skin/
   trim) is never recorded anywhere. It's not in stock, not in the
   wastage ledger, not in any report. Fix: auto-post the shrinkage as a
   `wastage` movement so it's visible instead of disappearing between two
   rows.

## Files

- `apps/api/src/inventory/entities/inventory.entity.ts` — add
  `export enum WastageReason { SPOILAGE = 'spoilage', TRIM_LOSS = 'trim_loss', OVER_PRODUCTION = 'over_production', DROPPED = 'dropped', EXPIRED = 'expired', OTHER = 'other' }`
  and a nullable `wastageReason: WastageReason | null` column on
  `StockMovement` (only meaningful when `type === WASTAGE`).
- `apps/api/src/inventory/services/inventory.service.ts` —
  `adjustStock()` accepts an optional `wastageReason` param, validated to
  only be set when `type === MovementType.WASTAGE` (`BadRequestException`
  otherwise — don't let a reason silently attach to a non-wastage row).
- `apps/api/src/inventory/controllers/inventory.controller.ts` — the
  existing `POST :itemId/adjust` route accepts the new optional
  `wastageReason` body field.
- `apps/api/src/recipes/services/recipes.service.ts` —
  `createProductionEntry()`: after posting the consumption and yield
  movements, compute the value-based shrinkage
  (`consumedValue - yieldedValueAtCarriedCost`) and, if the *quantity*
  shrinkage is non-zero (i.e. `recipe.yieldQuantity` implies a yield
  ratio below the raw quantity consumed), post a `wastage` movement with
  `wastageReason: TRIM_LOSS` for the difference. Precisely: for each
  ingredient, `expectedFullYield = requiredQty` (mass in) vs. what
  actually became the output — since this repo's recipe model already
  expresses yield as `recipe.yieldQuantity` output per ingredient set, the
  shrinkage is `Σ(ingredient requiredQty converted to output's unit) -
  recipe.yieldQuantity`. Post that as wastage on the **output item** if
  it's tracked as its own inventory row, or on the primary raw ingredient
  if the loss is conceptually "raw material that never became stock" —
  pick whichever matches how the existing seed data models chicken
  (check `database-seed.service.ts` for whether "Whole Chicken" and
  "Boneless Chicken" are seeded as separate items before deciding).
- `apps/api/src/inventory/services/expiry-sweep.service.ts` (module 4) —
  writes off expired batches with `wastageReason: EXPIRED`.
- Frontend: `apps/restaurant-ui/src/modules/inventory/pages/InventoryPage.tsx`
  — wherever a manual "adjust stock" / wastage entry form exists, add the
  reason dropdown (check the current adjust-stock modal/form in this file
  before assuming its shape).

## Verification

- `tsc --noEmit` in both apps.
- Log a production entry with a known yield ratio below 100% — confirm a
  `wastage`/`trim_loss` movement posts automatically for the shrinkage
  and the Wastage & Spoilage ledger account (module 3) moves by the
  correct cost.
- Manual wastage entry via `POST /inventory/:itemId/adjust` with
  `type: wastage, wastageReason: dropped` — confirm it's stored and
  rejecting a `wastageReason` on a non-wastage movement type.
- Expired-batch sweep (module 4) posts with `wastageReason: expired`.
