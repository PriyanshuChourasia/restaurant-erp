# Task Group: Company/Organization Settings

Tasks grouped: `2026-07-11-company-settings.md`, `2026-07-11-settings-page-solid.md`

---

## Task: Company settings feature

**Date:** 2026-07-11
**Prompt:** "work on company details for this software"

### What Was Done

Built a full company/organization settings module with backend API and frontend UI.

#### Backend (`apps/api/src/organization/`)

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

#### Frontend (`apps/restaurant-ui/src/modules/settings/`)

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

### Files Changed

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

---

## Task: Settings page SOLID redesign

**Date:** 2026-07-11
**Prompt:** "design the Settings Page and follow SOLID principles"

### What Was Done

Refactored the monolithic `SettingsPage.tsx` into a clean SOLID-compliant
component architecture.

### Architecture

```
modules/settings/
  components/
    FormField.tsx       # Text/email/tel input with label + icon + error
    NumberField.tsx     # Number input with min/max/step
    TextAreaField.tsx   # Textarea with configurable rows
    FieldWrapper        # Internal: label + error wrapper (shared by fields)
    SectionHeader.tsx   # Card header bar with icon + title
    SettingsSection.tsx # Card shell (Open/Closed via children)
    PageHeader.tsx      # Top header with title + save button
    SuccessToast.tsx    # Green success notification
    LoadingState.tsx    # Centered loading spinner
    ErrorState.tsx      # Centered error message
  hooks/
    useOrganizationSettings.ts  # Form state + save lifecycle
  pages/
    SettingsPage.tsx    # Pure composition layer (no logic, no API)
```

### SOLID Application

| Principle | How it's applied |
|---|---|
| **S**ingle Responsibility | Each file has exactly one concern: form fields, section layout, page header, success toast, loading state, error state, form state hook, page composition |
| **O**pen/Closed | New sections added via new `<SettingsSection>` blocks; new field types via new components following `BaseFieldProps` — no existing code modified |
| **L**iskov Substitution | `FormField`, `NumberField`, `TextAreaField` all implement `{ label, value, onChange, placeholder, error }` — interchangeable |
| **I**nterface Segregation | Each component has minimal focused props — `NumberField` has `min/max/step` that `FormField` doesn't; `TextAreaField` has `rows` |
| **D**ependency Inversion | `SettingsPage` knows nothing about APIs or mutations — all data injected via `useOrganizationSettings()` hook; UI components receive plain props |

### Files Changed

- Created `modules/settings/components/` with 8 new component files
- Created `modules/settings/hooks/useOrganizationSettings.ts`
- Rewritten `modules/settings/pages/SettingsPage.tsx` (pure composition, 50 lines)
- Deleted unused `inputClass` variable and unused icon imports
