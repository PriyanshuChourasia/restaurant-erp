# 2026-07-11 — Company Settings Feature

## Prompt

"work on company details for this software"

## What Was Done

Built a full company/organization settings module with backend API and frontend UI.

### Backend (`apps/api/src/organization/`)

- **Entity** (`entities/organization.entity.ts`): `Organization` with fields for
  restaurant name, tagline, address (city/state/pincode), phone/email/website,
  GSTIN, FSSAI license, currency/symbol, timezone, tax label, tax rates,
  service charge, business hours (JSON), invoice footer.
- **DTO** (`dto/update-organization.dto.ts`): Full validation with class-validator.
- **Service** (`organization.service.ts`): Singleton pattern — creates default
  org on startup if none exists, caches in memory, updates clear cache.
- **Controller** (`organization.controller.ts`): `GET /api/organization`,
  `PUT /api/organization` (requires `settings.update` permission).
- **Module** (`organization.module.ts`): Standard NestJS module, registered in
  `app.module.ts`.

### Frontend (`apps/restaurant-ui/src/modules/settings/`)

- **Types** (`types/organization.types.ts`): Interfaces matching backend entity.
- **API** (`api/organization.api.ts`): `getOrganization()` and `updateOrganization()`.
- **Hooks** (`hooks/useOrganizationQueries.ts`): React Query hooks with key factory.
- **Page** (`pages/SettingsPage.tsx`): Fully rewritten — loads org settings from
  API, editable form with sections (Restaurant Info, Tax & License, Currency &
  Regional, Invoice Settings), loading/error/success states, save mutation.

### Gotchas Applied

- All nullable string columns use `type: 'varchar'` to avoid TypeORM's
  `DataTypeNotSupportedError` from union types.
- Decimal columns (`defaultTaxRate`, `serviceChargePercent`) use
  `transformer: decimalTransformer` to handle pg string→number conversion.

## Files Changed

- `apps/api/src/organization/entities/organization.entity.ts` — created
- `apps/api/src/organization/dto/update-organization.dto.ts` — created
- `apps/api/src/organization/organization.service.ts` — created
- `apps/api/src/organization/organization.controller.ts` — created
- `apps/api/src/organization/organization.module.ts` — created
- `apps/api/src/app.module.ts` — registered OrganizationModule
- `apps/restaurant-ui/src/modules/settings/types/organization.types.ts` — created
- `apps/restaurant-ui/src/modules/settings/api/organization.api.ts` — created
- `apps/restaurant-ui/src/modules/settings/hooks/useOrganizationQueries.ts` — created
- `apps/restaurant-ui/src/modules/settings/pages/SettingsPage.tsx` — rewritten
