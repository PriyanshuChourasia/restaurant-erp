**Date:** 2026-07-13
**Prompt:** Create a backend API endpoint that returns formatted quantity strings so reports can use them too

## What was done

### Backend
- **`shared/utils/format-quantity.ts`** — Pure utility with `formatQuantity()`, `compactQuantity()`, `toLargerUnit()`. Mirrors the frontend's `lib/format-quantity.ts`. 5 unit hierarchies: gram↔kg (×1000), ml↔L (×1000), piece↔dozen (×12), packet↔carton (×50), bottle↔case (×12). No DB dependency — uses hardcoded hierarchy (same as frontend).
- **`units/dto/format-quantity.dto.ts`** — Three classes: `FormatQuantityDto` (single), `FormatQuantityItemDto` (batch item), `FormatQuantityBatchDto` (batch wrapper with `@ValidateNested({ each: true })`).
- **`units/services/units.service.ts`** — Added 4 methods: `formatQuantity()`, `compactQuantity()`, `toLargerUnit()`, `formatQuantityBatch()`.
- **`units/controllers/units.controller.ts`** — `GET /units/format` (single quantity, accepts `variant` param: full/compact/numeric) + `POST /units/format-batch` (bulk formatting).

### Frontend
- **`modules/units/api/units.api.ts`** — Added `formatQuantityApi()` and `formatQuantityBatchApi()` with `FormatQuantityResponse` and `FormatQuantityBatchResponse` types.

## Outcome
Any module (reports, inventory, purchases) can now call `GET /units/format?quantity=3400&unit=gram` to get `{ formatted: "3 kg 400 g", compact: "3.4 kg", numeric: { value: 3.4, unit: "kg" } }`, or `POST /units/format-batch` with `{ items: [...] }` for bulk formatting.
