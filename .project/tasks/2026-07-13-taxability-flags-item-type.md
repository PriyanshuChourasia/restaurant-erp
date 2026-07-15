**Date:** 2026-07-13
**Prompt:** Add taxability flags (cess, reverse charge) and item type (goods/service) to the Item entity

## What was done

### Backend
- **`item.entity.ts`** — Added `ItemType` enum (`goods`/`service`); added `itemType`, `isTaxable`, `cessPercent`, `reverseCharge` columns. Fixed duplicate `GstRate` enum (was defined twice).
- **`create-item.dto.ts`** — Added `@IsEnum(ItemType)`, `@IsBoolean()` for `isTaxable`/`reverseCharge`, `@IsNumber() @Min(0) @Max(100)` for `cessPercent`. Added missing `@Max` import.
- **`item-response.dto.ts`** — Exposed `itemType`, `isTaxable`, `cessPercent`, `reverseCharge` with `@Expose()`.
- **`database-seed.service.ts`** — `DemoItemDef` interface accepts `ItemType` enum; `seedItems` method propagates all new fields with defaults.

### Frontend
- **`items.api.ts`** — Added `itemType`, `isTaxable`, `cessPercent`, `reverseCharge` to both `Item` and `CreateItemRequest` interfaces.
- **`EditItemPage.tsx`** — Already had `itemType` select and form state; added Taxability Settings section with `isTaxable` toggle, `reverseCharge` checkbox, `cessPercent` input, and GST-exempt warning.
- **`CreateItemPage.tsx`** — Added `itemType` select dropdown (Goods/Service) + full Taxability Settings section.

### Validation
- `tsc --noEmit` passes clean for both apps (0 errors from new code; pre-existing errors in `items.service.spec.ts` and `SalesSummaryPage.tsx` remain unchanged).

## Outcome

Items now support taxability configuration: `itemType` (goods/service), `isTaxable` toggle, `cessPercent` (0-100%), `reverseCharge` flag. These fields appear in both create and edit forms with sensible defaults (taxable goods, 0% cess, no reverse charge).
