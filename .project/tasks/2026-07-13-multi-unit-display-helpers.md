**Date:** 2026-07-13
**Prompt:** Create multi-unit display helpers that show quantity in human-readable format like '3 kg 400 g' instead of '3400'

## What was done

### Core utility: `lib/format-quantity.ts`
- `formatQuantity(qty, unit)` — Splits raw quantity into hierarchy parts. E.g., `formatQuantity(3400, 'gram')` → `"3 kg 400 g"`
- `compactQuantity(qty, unit)` — Shows in larger unit with decimals. E.g., `compactQuantity(3400, 'gram')` → `"3.4 kg"`
- `toLargerUnit(qty, unit)` — Returns `{ value, unit }` for numeric display
- Supports 3 unit hierarchies: gram↔kg (×1000), ml↔L (×1000), piece↔dozen (×12)
- Non-hierarchy units (bowl, plate, cup, glass, etc.) display as raw `"{qty} {unit}"`

### React component: `components/ui/FormattedQuantity.tsx`
- `<FormattedQuantity quantity={3400} unit="gram" variant="full" />` → renders "3 kg 400 g"
- Three variants: `full` (split), `compact` (rounded larger unit), `numeric` (value only)
- `<QuantityRange current={3400} max={5000} unit="gram" />` → "3 kg 400 g / 5 kg"

### Integration across 5 pages
- **InventoryPage** — Stock column and Min Level column use `FormattedQuantity`
- **BatchesPage** — Batch remaining quantities, expiring alert sections, and item header totals
- **ViewBatchesDialog** — Batch quantity display and summary line
- **StockStatusPage** — Opening, current, and min stock columns
- **LowStockPage** — Current stock, min level, and deficit columns

### Validation
- Typecheck passes clean (0 new errors; pre-existing `SalesSummaryPage.tsx` unused imports unchanged)

## Outcome
Users now see quantities like "3 kg 400 g" instead of "3400 g" for weight/volume/count items stored in base units. Raw number display is preserved for non-hierarchy units. The formatter is data-driven and extensible — new hierarchies (e.g., packet↔carton) can be added by extending `UNIT_HIERARCHY`.
