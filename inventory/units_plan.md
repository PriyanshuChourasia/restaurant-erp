# Module 1: Unit of Measure master + conversions

See [`README.md`](./README.md) for full background/goal. Depends on: —

## What

Today `Item.unit` (`apps/api/src/items/entities/item.entity.ts:23-37`,
`ItemUnit` enum) is the only unit an item knows about, and recipe
ingredient `unit` fields (`RecipeIngredient.unit`) are trusted as-is with
no conversion or validation. This breaks the moment a purchase unit
differs from a stock unit (chicken bought as "piece"/whole bird, stocked
in kg) or a recipe consumes in a smaller unit than the item is stocked in
(boneless chicken stocked in kg, recipe needs 180 g).

Add an explicit, queryable conversion table and a second per-item unit
field for the purchase side, while keeping `ItemUnit` as the canonical
**base/stock unit** — this is additive, not a breaking rename.

## Files

- **New** `apps/api/src/units/entities/unit-conversion.entity.ts`:
  ```ts
  @Entity('unit_conversions')
  @Unique(['itemId', 'fromUnit', 'toUnit'])
  export class UnitConversion {
    id: string;
    itemId: string | null;   // null = global conversion (kg<->g, litre<->ml, dozen<->piece)
    fromUnit: ItemUnit;
    toUnit: ItemUnit;
    factor: number;          // qty_in_fromUnit * factor = qty_in_toUnit
  }
  ```
- **New** `apps/api/src/units/services/units.service.ts` — `UnitsService`:
  - `convert(itemId: string | null, quantity: number, fromUnit: ItemUnit, toUnit: ItemUnit): Promise<number>` —
    if `fromUnit === toUnit` return `quantity` unchanged; else look up an
    item-specific row first, fall back to a global (`itemId: null`) row,
    throw `BadRequestException` if no conversion exists (fail loud, don't
    silently assume a 1:1 factor).
  - `getConversionsForItem(itemId: string)` — used by the frontend to show
    available units when entering a purchase/recipe line.
- **New** `apps/api/src/units/controllers/units.controller.ts` —
  `GET /units/convert?itemId=&quantity=&from=&to=` for frontend preview
  (e.g. purchase form showing "20 kg = 20 kg" or "2 box = 48 piece" live as
  the user types).
- **New** `apps/api/src/units/units.module.ts` — exports `UnitsService` for
  `purchases`, `recipes`, `inventory` modules to import.
- `apps/api/src/items/entities/item.entity.ts` — add
  `@Column({ name: 'purchase_unit', type: 'enum', enum: ItemUnit, nullable: true })
  purchaseUnit!: ItemUnit | null;` (null = same as `unit`, no conversion
  needed). Update `create-item.dto.ts`/`update-item.dto.ts` to accept it.
- `apps/api/src/database/database-seed.service.ts` — seed global
  conversions: `kg↔gram` (factor 1000 / 0.001), `litre↔ml` (1000 / 0.001),
  `dozen↔piece` (12 / 0.0833...). Seed one item-specific example for
  chicken if a "Whole Chicken" seed item exists (e.g. `piece→kg` factor
  ≈1.4 average dressed weight) — check the seed file for the existing
  item list before inventing a duplicate.
- `apps/api/src/app.module.ts` — register `UnitsModule`.

## Verification

- `tsc --noEmit` in `apps/api`.
- `GET /units/convert?quantity=2&from=dozen&to=piece` → `24`.
- `GET /units/convert?itemId=<chicken-id>&quantity=3&from=piece&to=kg` →
  item-specific factor applied, not the global one.
- Missing conversion (e.g. `kg→piece` with no item-specific row) returns a
  clear 400, not a silent wrong number.
