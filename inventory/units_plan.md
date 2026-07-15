# Module 1: Unit of Measure master + conversions

See [`README.md`](./README.md) for full background/goal and
[`data-model_plan.md`](./data-model_plan.md) for the full schema
(`units`/`unit_conversions` tables, column specs, cardinalities). Depends
on: [`data-model_plan.md`](./data-model_plan.md) (module 0).

## What

Today `Item.unit` (`apps/api/src/items/entities/item.entity.ts:23-37`,
`ItemUnit` enum) is the only unit an item knows about, and recipe
ingredient `unit` fields (`RecipeIngredient.unit`) are trusted as-is with
no conversion or validation. This breaks the moment a purchase unit
differs from a stock unit (chicken bought as "piece"/whole bird, stocked
in kg) or a recipe consumes in a smaller unit than the item is stocked in
(boneless chicken stocked in kg, recipe needs 180 g).

Per [`data-model_plan.md`](./data-model_plan.md)'s design decision, this
module replaces the `ItemUnit` enum with a real `units` reference table —
not just a `UnitConversion` side-table layered on top of the enum. A
hardcoded enum can't carry metadata (unit type, which unit is the
conversion anchor) and can't be joined/queried; a table can, and lets new
units be added without a code deploy. This is a superset of the original
enum-based design, seeded 1:1 from the existing `ItemUnit` values so no
data is renamed — only its storage changes (FK vs. enum column).

## Files

- **New** `apps/api/src/units/entities/unit.entity.ts`:
  ```ts
  export enum UnitType { WEIGHT = 'weight', VOLUME = 'volume', COUNT = 'count' }

  @Entity('units')
  @Index('idx_unit_code', ['code'], { unique: true })
  @Index('idx_unit_type', ['unitType'])
  export class Unit {
    id!: string;
    code!: string;        // stable code, 1:1 with today's ItemUnit values: 'kg', 'gram', 'piece', 'litre', 'ml', 'dozen', 'plate', 'bowl', 'cup', 'glass', 'bottle', 'box', 'packet'
    name!: string;         // "Kilogram"
    unitType!: UnitType;   // groups units that can convert among each other
    isBaseUnit!: boolean;  // one true per unitType: kg (weight), litre (volume), piece (count) — the anchor global conversions are expressed against
    isActive!: boolean;
    createdAt!: Date;
    updatedAt!: Date;
  }
  ```
- **New** `apps/api/src/units/entities/unit-conversion.entity.ts`:
  ```ts
  @Entity('unit_conversions')
  @Unique(['itemId', 'fromUnitId', 'toUnitId'])
  export class UnitConversion {
    id!: string;
    itemId!: string | null;   // null = global conversion (kg<->gram, litre<->ml, dozen<->piece); set = item-specific (e.g. "Whole Chicken" piece<->kg)
    fromUnitId!: string;      // FK -> units.id
    toUnitId!: string;        // FK -> units.id
    factor!: number;          // qty_in_fromUnit * factor = qty_in_toUnit
  }
  ```
- **New** `apps/api/src/units/repositories/unit.repository.ts` — CRUD +
  `findByCode(code: string)` (used during the enum→table migration to
  resolve legacy string references).
- **New** `apps/api/src/units/services/units.service.ts` — `UnitsService`:
  - `convert(itemId: string | null, quantity: number, fromUnitId: string, toUnitId: string): Promise<number>` —
    if `fromUnitId === toUnitId` return `quantity` unchanged; else look up
    an item-specific `UnitConversion` row first, fall back to a global
    (`itemId: null`) row, throw `BadRequestException` if no conversion
    exists (fail loud, don't silently assume a 1:1 factor).
  - `getConversionsForItem(itemId: string)` — used by the frontend to show
    available units when entering a purchase/recipe line.
- **New** `apps/api/src/units/controllers/units.controller.ts`:
  - `GET /units` — list all active units (for dropdowns).
  - `GET /units/convert?itemId=&quantity=&from=&to=` — `from`/`to` accept
    either a `Unit.id` or a `Unit.code` (resolve code → id internally) for
    frontend preview (e.g. purchase form showing "20 kg = 20 kg" or "2 box
    = 48 piece" live as the user types).
- **New** `apps/api/src/units/units.module.ts` — exports `UnitsService` for
  `purchases`, `recipes`, `inventory` modules to import.
- `apps/api/src/items/entities/item.entity.ts`:
  - Replace `unit: ItemUnit` with `unitId: string` (FK → `units.id`, not
    null) — this is the item's stock/base unit.
  - Add `purchaseUnitId: string | null` (FK → `units.id`, nullable — null
    means same as `unitId`, no conversion needed at goods receipt).
  - Update `create-item.dto.ts`/`update-item.dto.ts` to accept `unitId`/
    `purchaseUnitId` instead of the enum value.
- `apps/api/src/database/database-seed.service.ts`:
  - Seed all 13 `units` rows from the current `ItemUnit` enum values
    **before** any `Item` seed data (items now require a valid `unitId`).
  - Seed global conversions: `kg↔gram` (factor 1000 / 0.001), `litre↔ml`
    (1000 / 0.001), `dozen↔piece` (12 / 0.0833...).
  - Update every seeded `Item` to reference `unitId` by looking up the
    seeded `Unit` row by `code` instead of assigning an enum literal.
  - Seed one item-specific conversion example for chicken if a "Whole
    Chicken" seed item exists (e.g. `piece→kg` factor ≈1.4 average dressed
    weight) — check the seed file for the existing item list before
    inventing a duplicate.
- `apps/api/src/app.module.ts` — register `UnitsModule`.

## Migration note

Because `synchronize: true` applies schema changes automatically but
cannot rename/convert an enum column into a FK column with data intact,
this is a breaking change for any existing dev data in `items` — flag to
the user before running that item rows will need re-seeding once `unit`
(enum) is replaced by `unit_id` (FK). This affects the same
`database-seed.service.ts` re-seed already flagged by
[`data-model_plan.md`](./data-model_plan.md)'s Rollout section for
`storage_units`, so do both in the same dev-data reset rather than two
separate ones.

## Verification

- `tsc --noEmit` in `apps/api`.
- `GET /units` returns all 13 seeded units.
- `GET /units/convert?quantity=2&from=dozen&to=piece` → `24`.
- `GET /units/convert?itemId=<chicken-id>&quantity=3&from=piece&to=kg` →
  item-specific factor applied, not the global one.
- Missing conversion (e.g. `kg→piece` with no item-specific row) returns a
  clear 400, not a silent wrong number.
- Every seeded `Item` has a valid `unitId` FK (no orphaned/null required
  FK) after the seed script runs.
